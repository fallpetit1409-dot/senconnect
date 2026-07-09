export type AccountType = 'producteur' | 'pme' | 'client';
export type ListingType = 'vente' | 'achat';
export type ListingStatus = 'active' | 'closed';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  account_type: AccountType;
  sector: string | null;
  company_name: string | null;
  region: string | null;
  city: string | null;
  phone: string | null;
  bio: string | null;
  is_verified: boolean;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Listing {
  id: string;
  author_id: string;
  listing_type: ListingType;
  title: string;
  description: string | null;
  quantity: number;
  unit: string | null;
  price: number | null;
  sector: string;
  region: string | null;
  city: string | null;
  status: ListingStatus;
  created_at: string;
  updated_at: string;
  // relations
  author?: Pick<Profile, 'id' | 'full_name' | 'account_type' | 'company_name' | 'is_verified' | 'city' | 'region'>;
}

export interface Message {
  id: string;
  listing_id: string;
  sender_id: string;
  receiver_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  listing_id: string;
  participant_a: string;
  participant_b: string;
  last_message_id: string | null;
  last_at: string;
  created_at: string;
  listing?: Pick<Listing, 'id' | 'title' | 'listing_type' | 'sector'>;
  other?: Pick<Profile, 'id' | 'full_name' | 'account_type' | 'company_name' | 'is_verified'>;
  last_message?: Pick<Message, 'id' | 'body' | 'created_at' | 'sender_id'>;
}
