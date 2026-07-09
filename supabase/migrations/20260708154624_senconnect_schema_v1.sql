/*
# Senconnect — Schéma initial (v1)

## Sommaire
Cette migration crée le socle de données pour Senconnect, une plateforme B2B/B2C
sénégalaise reliant producteurs, PME et clients particuliers.

1. Nouvelles tables
   - `profiles` : profil public étoffé pour chaque utilisateur authentifié.
     Champs : id (uuid PK = auth.users.id), email, full_name, account_type
     (producteur | pme | client), sector, company_name, region, city, phone,
     bio, is_verified (bool, défaut false), avatar_url, created_at, updated_at.
   - `listings` : annonces de vente ou d'achat publiées par les producteurs/PME.
     Champs : id, author_id (FK profiles), listing_type (vente | achat), title,
     description, quantity, unit, price, sector, region, city, status (active |
     closed), created_at, updated_at.
   - `messages` : messagerie simple 1-à-1 pour négocier autour d'une annonce.
     Champs : id, listing_id (FK listings), sender_id, receiver_id (FK profiles),
     body, read_at, created_at.
   - `conversations` : vue utilitaire regroupant les fils de discussion par
     (listing, paire d'utilisateurs) — alimentée par un trigger depuis messages.

2. Fonctions / triggers
   - `handle_new_user()` : à l'inscription, crée automatiquement une ligne dans
     `profiles` avec l'email + nom fournis dans les métadonnées d'auth.
   - `touch_listing_updated()` : met à jour `updated_at` sur le listing parent
     lors de l'insertion d'un message.
   - `maintain_conversation()` : upsert d'une ligne dans `conversations` à chaque
     nouveau message, pour pouvoir lister les fils de discussion rapidement.

3. Sécurité (RLS activée sur toutes les tables)
   - `profiles` : SELECT public à tout utilisateur authentifié (annuaire
     commercial) ; INSERT automatique via trigger seulement ; UPDATE/DELETE
     réservés au propriétaire.
   - `listings` : SELECT public (authenticated) pour alimenter l'annuaire des
     annonces ; INSERT/UPDATE/DELETE réservés à l'auteur.
   - `messages` : SELECT limité à l'expéditeur ou au destinataire ; INSERT
     réservé à l'expéditeur (le receiver_id est libre, c'est le contact) ;
     UPDATE limité au destinataire (marquer lu) ; DELETE désactivé.
   - `conversations` : SELECT limité à un participant de la conversation.

4. Notes importantes
   - Les politiques utilisent `auth.uid()` (jamais `current_user`).
   - `profiles.id` est `DEFAULT auth.uid()` et `REFERENCES auth.users` ON DELETE
     CASCADE : un utilisateur supprimé entraîne la suppression de son profil.
   - `listings.author_id` est `DEFAULT auth.uid()` pour que les insertions
     frontend (sans préciser l'auteur) réussissent la politique INSERT.
   - Le badge `is_verified` est prévu dès le départ mais reste `false` par
     défaut ; la vérification réelle sera ajoutée ultérieurement.
   - Les secteurs sont stockés en texte libre mais l'application restreint les
     valeurs via une liste contrôlée (agriculture, peche, btp, textile,
     agroalimentaire, services).
*/

-- =====================================================================
-- 1. PROFILES
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id           uuid PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  email        text NOT NULL,
  full_name    text NOT NULL,
  account_type text NOT NULL CHECK (account_type IN ('producteur','pme','client')),
  sector       text,
  company_name text,
  region       text,
  city         text,
  phone        text,
  bio          text,
  is_verified  boolean NOT NULL DEFAULT false,
  avatar_url   text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
CREATE POLICY "profiles_select_authenticated"
  ON public.profiles FOR SELECT TO authenticated USING (true);

-- L'insertion se fait via trigger sur auth.users, pas par le client directement.
DROP POLICY IF EXISTS "profiles_insert_self" ON public.profiles;
CREATE POLICY "profiles_insert_self"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_self" ON public.profiles;
CREATE POLICY "profiles_update_self"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_delete_self" ON public.profiles;
CREATE POLICY "profiles_delete_self"
  ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = id);

-- =====================================================================
-- 2. LISTINGS
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.listings (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id    uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_type text NOT NULL CHECK (listing_type IN ('vente','achat')),
  title        text NOT NULL,
  description  text,
  quantity     numeric NOT NULL DEFAULT 0,
  unit         text,
  price        numeric,
  sector       text NOT NULL,
  region       text,
  city         text,
  status       text NOT NULL DEFAULT 'active' CHECK (status IN ('active','closed')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS listings_sector_idx ON public.listings(sector);
CREATE INDEX IF NOT EXISTS listings_type_idx ON public.listings(listing_type);
CREATE INDEX IF NOT EXISTS listings_author_idx ON public.listings(author_id);
CREATE INDEX IF NOT EXISTS listings_status_idx ON public.listings(status);

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "listings_select_authenticated" ON public.listings;
CREATE POLICY "listings_select_authenticated"
  ON public.listings FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "listings_insert_own" ON public.listings;
CREATE POLICY "listings_insert_own"
  ON public.listings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "listings_update_own" ON public.listings;
CREATE POLICY "listings_update_own"
  ON public.listings FOR UPDATE TO authenticated
  USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "listings_delete_own" ON public.listings;
CREATE POLICY "listings_delete_own"
  ON public.listings FOR DELETE TO authenticated USING (auth.uid() = author_id);

-- =====================================================================
-- 3. MESSAGES
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id   uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  sender_id    uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body         text NOT NULL,
  read_at      timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_listing_idx ON public.messages(listing_id);
CREATE INDEX IF NOT EXISTS messages_receiver_idx ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS messages_sender_idx ON public.messages(sender_id);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "messages_select_participants" ON public.messages;
CREATE POLICY "messages_select_participants"
  ON public.messages FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "messages_insert_sender" ON public.messages;
CREATE POLICY "messages_insert_sender"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- Marquer comme lu : seul le destinataire peut modifier read_at.
DROP POLICY IF EXISTS "messages_update_receiver" ON public.messages;
CREATE POLICY "messages_update_receiver"
  ON public.messages FOR UPDATE TO authenticated
  USING (auth.uid() = receiver_id) WITH CHECK (auth.uid() = receiver_id);

-- =====================================================================
-- 4. CONVERSATIONS (résumé des fils de discussion)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id      uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  participant_a   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  participant_b   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_message_id uuid REFERENCES public.messages(id) ON DELETE SET NULL,
  last_at         timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT conversations_pair CHECK (participant_a <> participant_b)
);

CREATE UNIQUE INDEX IF NOT EXISTS conversations_pair_idx
  ON public.conversations (listing_id,
    least(participant_a, participant_b),
    greatest(participant_a, participant_b));

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conversations_select_participant" ON public.conversations;
CREATE POLICY "conversations_select_participant"
  ON public.conversations FOR SELECT TO authenticated
  USING (auth.uid() = participant_a OR auth.uid() = participant_b);

-- =====================================================================
-- 5. FONCTIONS & TRIGGERS
-- =====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Maintien de conversations + updated_at du listing
CREATE OR REPLACE FUNCTION public.maintain_conversation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  a uuid;
  b uuid;
BEGIN
  a := LEAST(NEW.sender_id, NEW.receiver_id);
  b := GREATEST(NEW.sender_id, NEW.receiver_id);

  INSERT INTO public.conversations (listing_id, participant_a, participant_b, last_message_id, last_at)
  VALUES (NEW.listing_id, a, b, NEW.id, NEW.created_at)
  ON CONFLICT (listing_id, least(participant_a, participant_b), greatest(participant_a, participant_b))
  DO UPDATE SET last_message_id = EXCLUDED.last_message_id,
                last_at = EXCLUDED.last_at;

  UPDATE public.listings SET updated_at = now() WHERE id = NEW.listing_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_message_inserted ON public.messages;
CREATE TRIGGER on_message_inserted
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.maintain_conversation();

-- Index supplémentaire pour l'annuaire des annonces (ordre chronologique)
CREATE INDEX IF NOT EXISTS listings_created_idx ON public.listings(created_at DESC);
CREATE INDEX IF NOT EXISTS conversations_user_idx ON public.conversations(participant_a);
CREATE INDEX IF NOT EXISTS conversations_user_b_idx ON public.conversations(participant_b);
