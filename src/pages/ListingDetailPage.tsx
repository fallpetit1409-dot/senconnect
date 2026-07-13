import { useEffect, useState } from 'react';
import { ArrowLeft, MapPin, Loader2, MessageCircle, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useRoute, parsePath } from '../lib/router';
import type { Listing } from '../lib/types';
import { SECTOR_LABEL } from '../lib/constants';
import { formatPrice, formatNumber, timeAgo } from '../lib/format';
import { AccountBadge, VerifiedBadge } from '../components/Badges';
import { SectorIcon } from '../components/SectorIcon';

export function ListingDetailPage() {
  const [path, navigate] = useRoute();
  const { segments } = parsePath(path);
  const listingId = segments[1]; // /annonces/:id
  const { user} = useAuth();

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!listingId) return;
    setLoading(true);
    setError(null);
    supabase
      .from('listings')
      .select(
        `id, author_id, listing_type, title, description, quantity, unit, price,
         sector, region, city, status, created_at, updated_at,
         author:profiles!listings_author_id_fkey(id, full_name, account_type, company_name, is_verified, city, region)`,
      )
      .eq('id', listingId)
      .maybeSingle()
      .then(({ data, error: fetchError }) => {
        if (fetchError || !data) {
          setError("Cette annonce est introuvable ou n'existe plus.");
          setListing(null);
        } else {
          setListing(data as unknown as Listing);
        }
        setLoading(false);
      });
  }, [listingId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center text-ink-400">
        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="font-mono-label text-[11px] text-danger-500">Erreur</p>
        <h1 className="mt-2 font-serif text-3xl font-semibold text-ink-700">Annonce introuvable</h1>
        <p className="mt-3 text-ink-500">{error}</p>
        <button onClick={() => navigate('/annonces')} className="btn-outline mt-6">
          Retour aux annonces
        </button>
      </div>
    );
  }

  const isVente = listing.listing_type === 'vente';
  const author = listing.author;
  const isOwnListing = user?.id === listing.author_id;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <button
        onClick={() => navigate('/annonces')}
        className="inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-600 transition mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Retour aux annonces
      </button>

      <div className="card p-6 sm:p-8">
        <div className="flex items-start justify-between gap-3 mb-4">
          <span
            className={`inline-flex items-center gap-1 rounded font-mono-label text-[10px] font-semibold px-2 py-0.5 ring-1 ${
              isVente
                ? 'bg-teal-50 text-teal-700 ring-teal-200'
                : 'bg-primary-50 text-primary-700 ring-primary-200'
            }`}
          >
            {isVente ? 'VTE' : 'ACH'}
            <span className="font-sans normal-case tracking-normal font-normal opacity-70">
              {isVente ? 'Vente' : 'Achat'}
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-ink-400 text-xs">
            <SectorIcon sector={listing.sector} className="h-3.5 w-3.5" />
            {SECTOR_LABEL[listing.sector] ?? listing.sector}
          </span>
        </div>

        <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-ink-700 leading-snug">
          {listing.title}
        </h1>

        {listing.description && (
          <p className="mt-3 text-ink-600 leading-relaxed">{listing.description}</p>
        )}

        <div className="mt-6 grid grid-cols-2 gap-4 pb-6 border-b border-ink-200/70">
          <div>
            <dt className="font-mono-label text-[10px] text-ink-400">Quantité</dt>
            <dd className="text-base text-ink-700 font-medium mt-0.5">
              {formatNumber(listing.quantity)} {listing.unit}
            </dd>
          </div>
          <div>
            <dt className="font-mono-label text-[10px] text-ink-400">Prix indicatif</dt>
            <dd className="text-base text-ink-700 font-medium mt-0.5">{formatPrice(listing.price)}</dd>
          </div>
        </div>

        {(listing.city || listing.region) && (
          <div className="mt-4">
            <span className="inline-flex items-center gap-1 text-ink-500 text-sm">
              <MapPin className="h-4 w-4" />
              {[listing.city, listing.region].filter(Boolean).join(' · ')}
            </span>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-ink-200/70 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            {author && <AccountBadge type={author.account_type} size="xs" />}
            <span className="text-sm text-ink-700 font-medium">
              {author?.company_name ?? author?.full_name ?? '—'}
            </span>
            {author?.is_verified && <VerifiedBadge verified size="xs" />}
          </div>
          <span className="font-mono-label text-[9px] text-ink-400">
            Publiée {timeAgo(listing.created_at)}
          </span>
        </div>

        {/* Contact action */}
        <div className="mt-8">
          {!user ? (
            <div className="rounded-md bg-paper-100 border border-ink-200/70 px-4 py-4 text-center">
              <p className="text-sm text-ink-500 mb-3">Connectez-vous pour contacter ce membre.</p>
              <button onClick={() => navigate('/connexion')} className="btn-primary">
                Connexion <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : isOwnListing ? (
            <div className="rounded-md bg-paper-100 border border-ink-200/70 px-4 py-3 text-sm text-ink-400 text-center">
              Ceci est votre propre annonce.
            </div>
          ) : (
            <button
              onClick={() => navigate(`/messagerie?listing=${listing.id}&to=${listing.author_id}`)}
              className="btn-accent w-full sm:w-auto"
            >
              <MessageCircle className="h-4 w-4" />
              Contacter {author?.company_name ?? author?.full_name}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}