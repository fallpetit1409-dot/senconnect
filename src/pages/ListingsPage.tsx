import { useEffect, useMemo, useState, useCallback } from 'react';
import { Search, SlidersHorizontal, X, MapPin, Package, Loader2, ArrowRight, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useRoute, parsePath } from '../lib/router';
import type { Listing, AccountType, ListingType } from '../lib/types';
import { SECTORS, SECTOR_LABEL, REGIONS_SENEGAL, LISTING_TYPES } from '../lib/constants';
import { formatPrice, formatNumber, timeAgo } from '../lib/format';
import { AccountBadge, VerifiedBadge } from '../components/Badges';
import { SectorIcon } from '../components/SectorIcon';

interface Filters {
  q: string;
  sector: string;
  listingType: ListingType | '';
  accountType: AccountType | '';
  region: string;
}

const EMPTY: Filters = { q: '', sector: '', listingType: '', accountType: '', region: '' };

export function ListingsPage() {
  const [path, navigate] = useRoute();
  const { query } = parsePath(path);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    ...EMPTY,
    sector: query.get('secteur') ?? '',
    listingType: (query.get('type') as ListingType | null) ?? '',
    accountType: (query.get('profil') as AccountType | null) ?? '',
    region: query.get('region') ?? '',
  });
  const [showFilters, setShowFilters] = useState(false);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    let q = supabase
      .from('listings')
      .select(
        `id, author_id, listing_type, title, description, quantity, unit, price,
         sector, region, city, status, created_at, updated_at,
         author:profiles!listings_author_id_fkey(id, full_name, account_type, company_name, is_verified, city, region)`,
      )
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (filters.sector) q = q.eq('sector', filters.sector);
    if (filters.listingType) q = q.eq('listing_type', filters.listingType);
    if (filters.region) q = q.eq('region', filters.region);
    if (filters.accountType) q = q.eq('author.account_type', filters.accountType);
    if (filters.q.trim()) {
      q = q.or(`title.ilike.%${filters.q.trim()}%,description.ilike.%${filters.q.trim()}%`);
    }

    const { data, error: fetchError } = await q.limit(60);
    if (fetchError) {
      setError('Impossible de charger les annonces. Veuillez réessayer.');
      setListings([]);
    } else {
      setListings((data as unknown as Listing[]) ?? []);
    }
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Sync sector filter to URL hash so deep-links from home/footer work.
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.sector) params.set('secteur', filters.sector);
    if (filters.listingType) params.set('type', filters.listingType);
    if (filters.accountType) params.set('profil', filters.accountType);
    if (filters.region) params.set('region', filters.region);
    const qs = params.toString();
    const target = qs ? `/annonces?${qs}` : '/annonces';
    if (`#${path.split('?')[0]}` !== `#${target.split('?')[0]}` || path.split('?')[1] !== qs) {
      window.history.replaceState(null, '', `#${target}`);
    }
  }, [filters, path]);

  const activeCount = useMemo(
    () => Object.values(filters).filter((v) => v !== '').length,
    [filters],
  );

  return (
    <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Page header */}
      <div className="pb-6 border-b border-ink-200/70">
        <p className="font-mono-label text-[11px] text-accent-600">Annuaire commercial</p>
        <h1 className="mt-2 font-serif text-3xl sm:text-4xl font-semibold text-ink-700">
          Annonces du registre
        </h1>
        <p className="mt-2 text-ink-500 max-w-2xl">
          Parcourez les offres de vente et les besoins d'achat publiés par les
          producteurs et PME du Sénégal. Filtrez par secteur, type de profil ou région.
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        {/* Filters sidebar (desktop) */}
        <aside className="lg:col-span-3 hidden lg:block">
          <FilterPanel filters={filters} setFilters={setFilters} activeCount={activeCount} onReset={() => setFilters(EMPTY)} />
        </aside>

        {/* Results */}
        <div className="lg:col-span-9">
          {/* Search + mobile filter toggle */}
          <div className="flex gap-3 items-stretch mb-4">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-300" />
              <input
                className="field-input pl-9"
                placeholder="Rechercher un titre, un produit…"
                value={filters.q}
                onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
              />
            </div>
            <button
              onClick={() => setShowFilters((v) => !v)}
              className="btn-outline lg:hidden relative"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filtres
              {activeCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-accent-500 text-[10px] font-semibold text-ink-900 flex items-center justify-center">
                  {activeCount}
                </span>
              )}
            </button>
          </div>

          {/* Mobile filter drawer */}
          {showFilters && (
            <div className="lg:hidden mb-4 card p-4">
              <FilterPanel filters={filters} setFilters={setFilters} activeCount={activeCount} onReset={() => setFilters(EMPTY)} />
            </div>
          )}

          {/* Active filter chips */}
          {activeCount > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="font-mono-label text-[10px] text-ink-400">Filtres actifs :</span>
              {filters.sector && (
                <Chip onClear={() => setFilters((f) => ({ ...f, sector: '' }))}>
                  {SECTOR_LABEL[filters.sector]}
                </Chip>
              )}
              {filters.listingType && (
                <Chip onClear={() => setFilters((f) => ({ ...f, listingType: '' }))}>
                  {LISTING_TYPES.find((t) => t.value === filters.listingType)?.label}
                </Chip>
              )}
              {filters.accountType && (
                <Chip onClear={() => setFilters((f) => ({ ...f, accountType: '' }))}>
                  {filters.accountType === 'producteur' ? 'Producteur' : filters.accountType === 'pme' ? 'PME' : 'Client'}
                </Chip>
              )}
              {filters.region && (
                <Chip onClear={() => setFilters((f) => ({ ...f, region: '' }))}>{filters.region}</Chip>
              )}
              <button onClick={() => setFilters(EMPTY)} className="text-xs text-ink-400 hover:text-danger-500 underline">
                Tout effacer
              </button>
            </div>
          )}

          {/* Results header */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-ink-500">
              {loading ? (
                <span className="inline-flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Chargement…</span>
              ) : (
                <>
                  <span className="font-medium text-ink-700">{listings.length}</span> annonce{listings.length !== 1 ? 's' : ''}
                </>
              )}
            </p>
          </div>

          {/* Results grid */}
          {error ? (
            <ErrorState message={error} onRetry={fetchListings} />
          ) : loading ? (
            <SkeletonGrid />
          ) : listings.length === 0 ? (
            <EmptyResults onReset={() => setFilters(EMPTY)} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {listings.map((l) => (
                <ListingCard key={l.id} listing={l} onOpen={() => navigate(`/annonces/${l.id}`)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterPanel({
  filters, setFilters, activeCount, onReset,
}: {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  activeCount: number;
  onReset: () => void;
}) {
  return (
    <div className="card p-5 sticky top-20">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-lg font-semibold text-ink-700 inline-flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-ink-400" /> Filtres
        </h2>
        {activeCount > 0 && (
          <button onClick={onReset} className="text-xs text-ink-400 hover:text-danger-500">Effacer</button>
        )}
      </div>

      <FilterGroup label="Type d'annonce">
        <PillRow
          options={LISTING_TYPES.map((t) => ({ value: t.value, label: t.label }))}
          value={filters.listingType}
          onChange={(v) => setFilters((f) => ({ ...f, listingType: v as ListingType | '' }))}
        />
      </FilterGroup>

      <FilterGroup label="Secteur">
        <div className="space-y-1.5">
          <FilterRadio
            label="Tous les secteurs"
            checked={filters.sector === ''}
            onChange={() => setFilters((f) => ({ ...f, sector: '' }))}
          />
          {SECTORS.map((s) => (
            <button
              key={s.value}
              onClick={() => setFilters((f) => ({ ...f, sector: s.value }))}
              className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition ${
                filters.sector === s.value
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-ink-600 hover:bg-paper-200'
              }`}
            >
              <SectorIcon sector={s.value} className="h-4 w-4 shrink-0" />
              {s.label}
            </button>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup label="Type de profil">
        <PillRow
          options={[
            { value: 'producteur', label: 'Producteur' },
            { value: 'pme', label: 'PME' },
          ]}
          value={filters.accountType}
          onChange={(v) => setFilters((f) => ({ ...f, accountType: v as AccountType | '' }))}
        />
      </FilterGroup>

      <FilterGroup label="Région">
        <select
          className="field-input"
          value={filters.region}
          onChange={(e) => setFilters((f) => ({ ...f, region: e.target.value }))}
        >
          <option value="">Toutes les régions</option>
          {REGIONS_SENEGAL.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </FilterGroup>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-5 last:mb-0">
      <p className="font-mono-label text-[10px] text-ink-400 mb-2">{label}</p>
      {children}
    </div>
  );
}

function FilterRadio({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-ink-600 hover:bg-paper-200 transition">
      <span className={`h-3.5 w-3.5 rounded-full border-2 flex items-center justify-center ${checked ? 'border-primary-600' : 'border-ink-300'}`}>
        {checked && <span className="h-1.5 w-1.5 rounded-full bg-primary-600" />}
      </span>
      {label}
    </button>
  );
}

function PillRow({
  options, value, onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        onClick={() => onChange('')}
        className={`rounded-full px-3 py-1 text-xs font-medium transition ${
          value === '' ? 'bg-primary-700 text-paper-100' : 'bg-paper-200 text-ink-600 hover:bg-paper-300'
        }`}
      >
        Tous
      </button>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition ${
            value === o.value ? 'bg-primary-700 text-paper-100' : 'bg-paper-200 text-ink-600 hover:bg-paper-300'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Chip({ children, onClear }: { children: React.ReactNode; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700">
      {children}
      <button onClick={onClear} className="hover:text-primary-900">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

function ListingCard({ listing, onOpen }: { listing: Listing; onOpen: () => void }) {
  const isVente = listing.listing_type === 'vente';
  const author = listing.author;
  return (
    <button
      onClick={onOpen}
      className="card p-5 text-left hover:border-primary-300 hover:shadow-ledger-md transition group flex flex-col"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <span
          className={`inline-flex items-center gap-1 rounded font-mono-label text-[10px] font-semibold px-2 py-0.5 ring-1 ${
            isVente
              ? 'bg-teal-50 text-teal-700 ring-teal-200'
              : 'bg-primary-50 text-primary-700 ring-primary-200'
          }`}
        >
          {isVente ? 'VTE' : 'ACH'}
          <span className="hidden sm:inline font-sans normal-case tracking-normal font-normal opacity-70">
            {isVente ? 'Vente' : 'Achat'}
          </span>
        </span>
        <span className="inline-flex items-center gap-1.5 text-ink-400 text-xs">
          <SectorIcon sector={listing.sector} className="h-3.5 w-3.5" />
          {SECTOR_LABEL[listing.sector] ?? listing.sector}
        </span>
      </div>

      <h3 className="font-serif text-lg font-semibold text-ink-700 leading-snug group-hover:text-primary-800 transition">
        {listing.title}
      </h3>
      {listing.description && (
        <p className="mt-1.5 text-sm text-ink-500 line-clamp-2 leading-relaxed">{listing.description}</p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 pb-4 border-b border-ink-200/70">
        <div>
          <dt className="font-mono-label text-[9px] text-ink-400">Quantité</dt>
          <dd className="text-sm text-ink-700 font-medium mt-0.5">
            {formatNumber(listing.quantity)} {listing.unit}
          </dd>
        </div>
        <div>
          <dt className="font-mono-label text-[9px] text-ink-400">Prix indicatif</dt>
          <dd className="text-sm text-ink-700 font-medium mt-0.5">{formatPrice(listing.price)}</dd>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="min-w-0 flex items-center gap-2">
          {author && <AccountBadge type={author.account_type} size="xs" />}
          <span className="text-xs text-ink-500 truncate">
            {author?.company_name ?? author?.full_name ?? '—'}
          </span>
          {author?.is_verified && <VerifiedBadge verified size="xs" />}
        </div>
        <span className="font-mono-label text-[9px] text-ink-400 shrink-0">{timeAgo(listing.created_at)}</span>
      </div>

      {(listing.city || listing.region) && (
        <div className="mt-1.5">
          <span className="inline-flex items-center gap-1 text-ink-400 text-xs">
            <MapPin className="h-3 w-3" />
            {[listing.city, listing.region].filter(Boolean).join(' · ')}
          </span>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-ink-200/70 flex items-center justify-between">
        <span className="font-mono-label text-[9px] text-ink-400">
          {isVente ? 'À vendre' : 'Recherche'}
        </span>
        <span className="inline-flex items-center gap-1 text-sm font-medium text-primary-700 group-hover:text-primary-800">
          Détails <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition" />
        </span>
      </div>
    </button>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="card p-5 animate-pulse">
          <div className="flex justify-between mb-3">
            <div className="h-5 w-14 rounded bg-paper-300" />
            <div className="h-4 w-24 rounded bg-paper-300" />
          </div>
          <div className="h-5 w-3/4 rounded bg-paper-300 mb-2" />
          <div className="h-3 w-full rounded bg-paper-200 mb-1" />
          <div className="h-3 w-2/3 rounded bg-paper-200" />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="h-8 rounded bg-paper-200" />
            <div className="h-8 rounded bg-paper-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyResults({ onReset }: { onReset: () => void }) {
  return (
    <div className="card p-12 text-center">
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-lg bg-paper-200 text-ink-400">
        <FileText className="h-7 w-7" />
      </span>
      <h3 className="mt-4 font-serif text-xl font-semibold text-ink-700">Aucune annonce trouvée</h3>
      <p className="mt-2 text-sm text-ink-400 max-w-sm mx-auto">
        Aucune annonce ne correspond à vos critères. Élargissez votre recherche ou réinitialisez les filtres.
      </p>
      <button onClick={onReset} className="btn-outline mt-5">
        Réinitialiser les filtres
      </button>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="card p-12 text-center border-danger-200">
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-lg bg-danger-50 text-danger-500">
        <Package className="h-7 w-7" />
      </span>
      <h3 className="mt-4 font-serif text-xl font-semibold text-ink-700">Erreur de chargement</h3>
      <p className="mt-2 text-sm text-ink-400 max-w-sm mx-auto">{message}</p>
      <button onClick={onRetry} className="btn-outline mt-5">
        Réessayer
      </button>
    </div>
  );
}
