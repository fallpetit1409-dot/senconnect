import { BadgeCheck, MapPin } from 'lucide-react';
import type { AccountType } from '../lib/types';
import { ACCOUNT_LABEL } from '../lib/constants';

const ACCOUNT_STYLES: Record<AccountType, { bg: string; text: string; ring: string }> = {
  producteur: { bg: 'bg-teal-50', text: 'text-teal-700', ring: 'ring-teal-200' },
  pme: { bg: 'bg-primary-50', text: 'text-primary-700', ring: 'ring-primary-200' },
  client: { bg: 'bg-accent-50', text: 'text-accent-800', ring: 'ring-accent-200' },
};

export function AccountBadge({ type, size = 'sm' }: { type: AccountType; size?: 'sm' | 'xs' }) {
  const s = ACCOUNT_STYLES[type];
  const pad = size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]';
  return (
    <span
      className={`inline-flex items-center rounded font-mono-label font-medium ${pad} ${s.bg} ${s.text} ring-1 ${s.ring}`}
    >
      {ACCOUNT_LABEL[type]}
    </span>
  );
}

export function VerifiedBadge({ verified, size = 'sm' }: { verified: boolean; size?: 'sm' | 'xs' }) {
  if (!verified) return null;
  const dim = size === 'xs' ? 'h-3 w-3' : 'h-3.5 w-3.5';
  return (
    <span className="inline-flex items-center gap-0.5 text-accent-600" title="Profil vérifié">
      <BadgeCheck className={dim} strokeWidth={2.5} />
      <span className="font-mono-label text-[10px] font-semibold">Vérifié</span>
    </span>
  );
}

export function LocationTag({ region, city }: { region?: string | null; city?: string | null }) {
  const parts = [city, region].filter(Boolean);
  if (parts.length === 0) return null;
  return (
    <span className="inline-flex items-center gap-1 text-ink-400 text-xs">
      <MapPin className="h-3 w-3" />
      {parts.join(' · ')}
    </span>
  );
}

export function Avatar({
  name,
  type,
  size = 40,
}: {
  name: string;
  type?: AccountType;
  size?: number;
}) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const bg = type ? ACCOUNT_STYLES[type].bg : 'bg-paper-200';
  const txt = type ? ACCOUNT_STYLES[type].text : 'text-ink-600';
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-serif font-semibold ${bg} ${txt}`}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials}
    </span>
  );
}
