import type { AccountType, ListingType } from './types';

export const SECTORS: { value: string; label: string; icon: string }[] = [
  { value: 'agriculture', label: 'Agriculture & récolte', icon: 'wheat' },
  { value: 'peche', label: 'Pêche & produits de mer', icon: 'fish' },
  { value: 'btp', label: 'BTP & construction', icon: 'hard-hat' },
  { value: 'textile', label: 'Textile & artisanat', icon: 'scissors' },
  { value: 'agroalimentaire', label: 'Agroalimentaire', icon: 'package' },
  { value: 'services', label: 'Services professionnels', icon: 'briefcase' },
];

export const SECTOR_LABEL: Record<string, string> = Object.fromEntries(
  SECTORS.map((s) => [s.value, s.label]),
);

export const ACCOUNT_TYPES: { value: AccountType; label: string; short: string; description: string }[] = [
  {
    value: 'producteur',
    label: 'Producteur',
    short: 'Producteur',
    description: 'Agriculteurs, pêcheurs, éleveurs — vendent leur production aux PME et au marché.',
  },
  {
    value: 'pme',
    label: 'PME',
    short: 'PME',
    description: 'Achètent aux producteurs et à d\'autres PME, transforment et revendent aux clients.',
  },
  {
    value: 'client',
    label: 'Client particulier',
    short: 'Client',
    description: 'Particuliers qui achètent directement auprès des PME de la plateforme.',
  },
];

export const ACCOUNT_LABEL: Record<AccountType, string> = {
  producteur: 'Producteur',
  pme: 'PME',
  client: 'Client particulier',
};

export const LISTING_TYPES: { value: ListingType; label: string; verb: string }[] = [
  { value: 'vente', label: 'Vente', verb: 'Vend' },
  { value: 'achat', label: "Besoin d'achat", verb: 'Recherche' },
];

export const REGIONS_SENEGAL: string[] = [
  'Dakar',
  'Thiès',
  'Diourbel',
  'Fatick',
  'Kaffrine',
  'Kaolack',
  'Kédougou',
  'Kolda',
  'Louga',
  'Matam',
  'Saint-Louis',
  'Sédhiou',
  'Tambacounda',
  'Ziguinchor',
];

export const UNITS: string[] = [
  'kg',
  'tonne',
  'sac 50 kg',
  'sac 25 kg',
  'caisse',
  'carton',
  'pièce',
  'lot',
  'litre',
  'bidon',
  'mètre',
  'm²',
  'm³',
  'service',
];

export function sectorLabel(value: string | null | undefined): string {
  if (!value) return '—';
  return SECTOR_LABEL[value] ?? value;
}
