/*
# Fix: handle_new_user trigger fails on signup ("Database error saving new user")

## Root Cause

The `handle_new_user()` trigger fires AFTER INSERT on `auth.users`.
It was inserting only `id`, `email`, `full_name` into `public.profiles`,
but the `profiles` table has two NOT NULL columns without defaults:

1. `account_type` (text, NOT NULL, CHECK constraint: 'producteur' | 'pme' | 'client')
2. `is_verified` (boolean, NOT NULL — already has DEFAULT false, so OK)

Since `account_type` has no default and the trigger didn't supply it,
the INSERT into `profiles` failed with a NOT NULL violation.
Because the trigger is `AFTER INSERT ... SECURITY DEFINER` on `auth.users`,
the failure rolled back the entire `auth.users` insert — producing the
generic "Database error saving new user" message seen by the frontend.

## Fix

1. Replaced `handle_new_user()` with a version that reads ALL signup form
   fields from `NEW.raw_user_meta_data`:
   - full_name (already read)
   - account_type (producteur / pme / client)
   - sector
   - region
   - city
   - phone
   - company_name

2. Added a `DEFAULT 'client'` on `account_type` so the trigger can never
   fail even if `raw_user_meta_data` is somehow missing the field.
   The CHECK constraint still validates the value.

3. Replaced the existing trigger (dropped + recreated) to point to the
   updated function.

## Security

- No RLS policy changes. Existing policies on `profiles` are unchanged.
- The trigger runs as SECURITY DEFINER (required to write to `profiles`
  during the auth flow before the user has a session).
- `search_path` is locked to `public` (already was).
*/

-- Step 1: Add a safe default to account_type so the column is never NULL
ALTER TABLE public.profiles
  ALTER COLUMN account_type SET DEFAULT 'client';

-- Step 2: Replace the trigger function with one that reads all form fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    account_type,
    sector,
    region,
    city,
    phone,
    company_name
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'account_type', 'client'),
    NULLIF(NEW.raw_user_meta_data->>'sector', ''),
    NULLIF(NEW.raw_user_meta_data->>'region', ''),
    NULLIF(NEW.raw_user_meta_data->>'city', ''),
    NULLIF(NEW.raw_user_meta_data->>'phone', ''),
    NULLIF(NEW.raw_user_meta_data->>'company_name', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name     = EXCLUDED.full_name,
    account_type  = EXCLUDED.account_type,
    sector        = EXCLUDED.sector,
    region        = EXCLUDED.region,
    city          = EXCLUDED.city,
    phone         = EXCLUDED.phone,
    company_name  = EXCLUDED.company_name,
    updated_at    = now();
  RETURN NEW;
END;
$function$;

-- Step 3: Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
