import { useEffect, useState } from 'react';
import { Plus, TrendingUp, ShoppingBag, MessageSquare, ArrowRight, Package, FileText, Inbox } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useRoute } from '../lib/router';
import { supabase } from '../lib/supabase';
import type { Listing, Conversation } from '../lib/types';
import { formatPrice, formatDate, timeAgo } from '../lib/format';
import { SECTOR_LABEL, ACCOUNT_LABEL } from '../lib/constants';
import { AccountBadge, Avatar } from '../components/Badges';

export function DashboardPage() {
  const { user, profile, loading } = useAuth();
  const [, navigate] = useRoute();
  const [listings, setListings] = useState<Listing[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const [lRes, cRes] = await Promise.all([
        supabase
          .from('listings')
          .select('*')
          .eq('author_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('conversations')
          .select(`id, listing_id, participant_a, participant_b, last_at, created_at,
                   listing:listings(id, title, listing_type, sector),
                   other:profiles!conversations_participant_b_fkey(id, full_name, account_type, company_name, is_verified),
                   last_message:messages!conversations_last_message_id_fkey(id, body, created_at, sender_id)`)
          .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
          .order('last_at', { ascending: false })
          .limit(5),
      ]);
      if (!active) return;
      if (lRes.data) setListings(lRes.data as unknown as Listing[]);
      if (cRes.data) setConversations((cRes.data as unknown[]).map(normalizeConversation));
      setDataLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [user]);

  if (loading) {
    return <div className="mx-auto max-w-8xl px-4 py-20 text-center text-ink-400">Chargement…</div>;
  }
  if (!user || !profile) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="font-serif text-2xl font-semibold text-ink-700">Accès réservé</h1>
        <p className="mt-2 text-ink-500">Connectez-vous pour accéder à votre tableau de bord.</p>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={() => navigate('/connexion')} className="btn-primary">Connexion</button>
          <button onClick={() => navigate('/inscription')} className="btn-outline">Créer un compte</button>
        </div>
      </div>
    );
  }

  const isClient = profile.account_type === 'client';
  const canPublish = !isClient;

  return (
    <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Header strip */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-ink-200/70">
        <div>
          <p className="font-mono-label text-[11px] text-accent-600">Tableau de bord</p>
          <h1 className="mt-2 font-serif text-3xl font-semibold text-ink-700">
            Bonjour, {profile.full_name.split(' ')[0]}
          </h1>
          <div className="mt-2 flex items-center gap-3">
            <AccountBadge type={profile.account_type} />
            <span className="font-mono-label text-[10px] text-ink-400">
              {profile.company_name ?? ACCOUNT_LABEL[profile.account_type]}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {canPublish && (
            <button onClick={() => navigate('/annonces/publier')} className="btn-accent">
              <Plus className="h-4 w-4" /> Publier une annonce
            </button>
          )}
          <button onClick={() => navigate(`/profil/${profile.id}`)} className="btn-outline">
            Voir mon profil
          </button>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          icon={FileText}
          label={isClient ? 'Commandes' : 'Annonces publiées'}
          value={listings.length}
          accent="primary"
        />
        <StatTile
          icon={MessageSquare}
          label="Conversations"
          value={conversations.length}
          accent="teal"
        />
        <StatTile
          icon={isClient ? ShoppingBag : TrendingUp}
          label={isClient ? 'Achats' : 'Annonces actives'}
          value={listings.filter((l) => l.status === 'active').length}
          accent="accent"
        />
        <StatTile
          icon={Inbox}
          label="Profil"
          value={profile.is_verified ? 'Vérifié' : 'En attente'}
          accent={profile.is_verified ? 'teal' : 'ink'}
        />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-3">
        {/* Listings column */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl font-semibold text-ink-700">
              {isClient ? 'Mes commandes' : 'Mes annonces'}
            </h2>
            {canPublish && (
              <button onClick={() => navigate('/annonces/publier')} className="text-sm font-medium text-primary-700 hover:text-primary-800 inline-flex items-center gap-1">
                <Plus className="h-3.5 w-3.5" /> Nouvelle annonce
              </button>
            )}
          </div>

          {dataLoading ? (
            <div className="card p-8 text-center text-ink-400">Chargement…</div>
          ) : listings.length === 0 ? (
            <EmptyState
              icon={Package}
              title={isClient ? 'Aucune commande pour le moment' : 'Aucune annonce publiée'}
              body={isClient
                ? 'Parcourez les annonces des PME et contactez-les pour passer commande.'
                : 'Publiez votre première annonce pour apparaître dans le registre.'}
              action={isClient ? { label: 'Parcourir les annonces', to: '/annonces' } : { label: 'Publier une annonce', to: '/annonces/publier' }}
              onNavigate={navigate}
            />
          ) : (
            <div className="space-y-3">
              {listings.map((l) => (
                <button
                  key={l.id}
                  onClick={() => navigate(`/annonces/${l.id}`)}
                  className="card p-4 w-full text-left hover:border-primary-300 hover:shadow-ledger-md transition flex items-center gap-4"
                >
                  <span className={`flex h-10 w-10 items-center justify-center rounded-md font-mono-label text-[10px] ${
                    l.listing_type === 'vente' ? 'bg-teal-50 text-teal-700 ring-1 ring-teal-200' : 'bg-primary-50 text-primary-700 ring-1 ring-primary-200'
                  }`}>
                    {l.listing_type === 'vente' ? 'VTE' : 'ACH'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-ink-700 truncate">{l.title}</span>
                      {l.status === 'closed' && (
                        <span className="font-mono-label text-[9px] text-ink-400">Clôturée</span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-ink-400">
                      <span>{SECTOR_LABEL[l.sector] ?? l.sector}</span>
                      <span>·</span>
                      <span>{formatDate(l.created_at)}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-medium text-ink-700">{formatPrice(l.price)}</div>
                    <div className="font-mono-label text-[9px] text-ink-400 mt-0.5">{l.quantity} {l.unit}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Conversations column */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl font-semibold text-ink-700">Messages récents</h2>
            <button onClick={() => navigate('/messagerie')} className="text-sm font-medium text-primary-700 hover:text-primary-800 inline-flex items-center gap-1">
              Tout voir <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          {dataLoading ? (
            <div className="card p-8 text-center text-ink-400">Chargement…</div>
          ) : conversations.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="Aucun message"
              body="Vos négociations apparaîtront ici."
              action={{ label: 'Parcourir les annonces', to: '/annonces' }}
              onNavigate={navigate}
            />
          ) : (
            <div className="space-y-2">
              {conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => navigate(`/messagerie/${c.id}`)}
                  className="card p-3 w-full text-left hover:border-primary-300 transition flex items-center gap-3"
                >
                  {c.other && <Avatar name={c.other.full_name} type={c.other.account_type} size={36} />}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-ink-700 truncate">
                      {c.other?.full_name ?? '—'}
                    </div>
                    <div className="text-xs text-ink-400 truncate">
                      {c.last_message?.body ?? '—'}
                    </div>
                  </div>
                  <span className="font-mono-label text-[9px] text-ink-400 shrink-0">{timeAgo(c.last_at)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function normalizeConversation(row: unknown): Conversation {
  const r = row as Record<string, unknown>;
  return {
    id: r.id as string,
    listing_id: r.listing_id as string,
    participant_a: r.participant_a as string,
    participant_b: r.participant_b as string,
    last_message_id: (r.last_message_id as string) ?? null,
    last_at: r.last_at as string,
    created_at: r.created_at as string,
    listing: r.listing as Conversation['listing'],
    other: r.other as Conversation['other'],
    last_message: r.last_message as Conversation['last_message'],
  };
}

function StatTile({
  icon: Icon, label, value, accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  accent: 'primary' | 'teal' | 'accent' | 'ink';
}) {
  const map = {
    primary: 'bg-primary-50 text-primary-700 ring-primary-200',
    teal: 'bg-teal-50 text-teal-700 ring-teal-200',
    accent: 'bg-accent-50 text-accent-800 ring-accent-200',
    ink: 'bg-paper-200 text-ink-600 ring-ink-200',
  } as const;
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <span className={`inline-flex h-9 w-9 items-center justify-center rounded-md ring-1 ${map[accent]}`}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="font-mono-label text-[9px] text-ink-300">{label}</span>
      </div>
      <div className="mt-3 font-serif text-2xl font-semibold text-ink-700">{value}</div>
    </div>
  );
}

function EmptyState({
  icon: Icon, title, body, action, onNavigate,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  action?: { label: string; to: string };
  onNavigate: (t: string) => void;
}) {
  return (
    <div className="card p-8 text-center">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-md bg-paper-200 text-ink-400">
        <Icon className="h-6 w-6" />
      </span>
      <h3 className="mt-4 font-serif text-lg font-semibold text-ink-700">{title}</h3>
      <p className="mt-2 text-sm text-ink-400 max-w-sm mx-auto">{body}</p>
      {action && (
        <button onClick={() => onNavigate(action.to)} className="btn-outline mt-5">
          {action.label}
        </button>
      )}
    </div>
  );
}
