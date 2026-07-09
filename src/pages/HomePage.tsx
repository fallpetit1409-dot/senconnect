import { ArrowRight, ShieldCheck, MessageSquare, BarChart3, Users } from 'lucide-react';
import { useRoute } from '../lib/router';
import { useAuth } from '../lib/auth';
import { SECTORS, ACCOUNT_TYPES } from '../lib/constants';
import { AccountBadge } from '../components/Badges';
import { SectorIcon } from '../components/SectorIcon';

export function HomePage() {
  const [, navigate] = useRoute();
  const { user } = useAuth();

  return (
    <div>
      <Hero onNavigate={navigate} loggedIn={!!user} />
      <ValueChain onNavigate={navigate} />
      <Sectors onNavigate={navigate} />
      <Features />
      <CtaBand onNavigate={navigate} loggedIn={!!user} />
    </div>
  );
}

function Hero({ onNavigate, loggedIn }: { onNavigate: (t: string) => void; loggedIn: boolean }) {
  return (
    <section className="relative overflow-hidden bg-primary-900 text-paper-100">
      {/* Ledger lines background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, transparent 0, transparent 31px, rgba(246,243,236,0.8) 31px, rgba(246,243,236,0.8) 32px)',
        }}
      />
      <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-accent-500/10 blur-3xl" />
      <div className="absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-teal-400/10 blur-3xl" />

      <div className="relative mx-auto max-w-8xl px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full bg-paper-100/10 px-3 py-1 ring-1 ring-paper-100/15">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
              <span className="font-mono-label text-[10px] text-paper-200/80">
                Registre commercial · République du Sénégal
              </span>
            </div>

            <h1 className="mt-6 font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.05] text-paper-100">
              La chaîne de valeur sénégalaise,
              <span className="block text-accent-400">connectée et tracée.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-paper-200/80">
              Senconnect relie les producteurs, les PME et les clients particuliers
              à travers tout le territoire. Publiez vos productions et vos besoins,
              négociez directement, suivez vos échanges — de la récolte au point de vente.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <button onClick={() => onNavigate(loggedIn ? '/annonces' : '/inscription')} className="btn-accent">
                {loggedIn ? 'Parcourir les annonces' : 'Rejoindre le registre'}
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => onNavigate('/annonces')}
                className="btn border border-paper-100/20 text-paper-100 hover:bg-paper-100/10 focus:ring-paper-100/30"
              >
                Voir les annonces
              </button>
            </div>

            <dl className="mt-12 grid grid-cols-3 gap-6 max-w-md">
              {[
                { n: '3', l: 'Profils d\'acteurs' },
                { n: '6', l: 'Secteurs couverts' },
                { n: '14', l: 'Régions du Sénégal' },
              ].map((s) => (
                <div key={s.l}>
                  <dt className="font-serif text-3xl font-semibold text-accent-400">{s.n}</dt>
                  <dd className="font-mono-label text-[10px] mt-1 text-paper-200/60">{s.l}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="lg:col-span-5">
            <RegistryCard />
          </div>
        </div>
      </div>
    </section>
  );
}

function RegistryCard() {
  // A stylized "page de registre" card previewing the product aesthetic.
  return (
    <div className="relative">
      <div className="absolute -inset-4 rounded-xl bg-accent-500/10 blur-2xl" />
      <div className="relative rounded-lg border border-paper-100/15 bg-paper-100 shadow-ledger-lg overflow-hidden">
        <div className="flex items-center justify-between border-b border-ink-200/70 bg-primary-900 px-4 py-3 text-paper-100">
          <span className="font-mono-label text-[10px] tracking-wider">Registre n° SC-2024-0481</span>
          <span className="font-mono-label text-[10px] text-accent-400">EN LIGNE</span>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-mono-label text-[10px] text-ink-400">Annonce · Vente</div>
              <h3 className="font-serif text-xl font-semibold text-ink-700 mt-1">
                Niébé de Thiaroye — récolte 2024
              </h3>
            </div>
            <AccountBadge type="producteur" />
          </div>
          <div className="ledger-rule" />
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <RegRow label="Quantité" value="1 200 sacs" />
            <RegRow label="Prix indicatif" value="12 500 F / sac" />
            <RegRow label="Secteur" value="Agriculture" />
            <RegRow label="Localisation" value="Dakar · Thiaroye" />
          </dl>
          <div className="ledger-rule" />
          <div className="flex items-center justify-between">
            <span className="font-mono-label text-[10px] text-teal-600">PROFIL VÉRIFIÉ</span>
            <span className="font-mono-label text-[10px] text-ink-400">il y a 2 jours</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function RegRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono-label text-[9px] text-ink-400">{label}</dt>
      <dd className="text-ink-700 font-medium mt-0.5">{value}</dd>
    </div>
  );
}

function ValueChain({ onNavigate }: { onNavigate: (t: string) => void }) {
  return (
    <section className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8 py-20">
      <SectionHeading
        kicker="Trois acteurs, une chaîne"
        title="Du producteur au client, la valeur circule"
        subtitle="Chaque profil joue un rôle précis dans l'économie réelle. Senconnect structure ces relations commerciales avec transparence."
      />

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {ACCOUNT_TYPES.map((t, i) => (
          <div key={t.value} className="card p-6 relative">
            <span className="absolute top-5 right-5 font-mono-label text-[11px] text-ink-300">
              0{i + 1}
            </span>
            <AccountBadge type={t.value} />
            <h3 className="mt-4 font-serif text-2xl font-semibold text-ink-700">{t.label}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-500">{t.description}</p>
            <div className="mt-5 pt-4 border-t border-ink-200/70">
              <button
                onClick={() => onNavigate(`/inscription?type=${t.value}`)}
                className="inline-flex items-center gap-1 text-sm font-medium text-primary-700 hover:text-primary-800"
              >
                S'inscrire comme {t.short}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-center gap-2 text-ink-400 text-sm">
        <span className="font-mono-label text-[10px]">Producteur</span>
        <ArrowRight className="h-4 w-4 text-accent-500" />
        <span className="font-mono-label text-[10px]">PME</span>
        <ArrowRight className="h-4 w-4 text-accent-500" />
        <span className="font-mono-label text-[10px]">PME / Client</span>
      </div>
    </section>
  );
}

function Sectors({ onNavigate }: { onNavigate: (t: string) => void }) {
  return (
    <section className="bg-paper-200/50 border-y border-ink-200/70">
      <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8 py-20">
        <SectionHeading
          kicker="Secteurs couverts"
          title="Toute l'économie réelle sénégalaise"
          subtitle="Six secteurs structurants, des champs du Bassin arachidier aux marchés de Dakar."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SECTORS.map((s) => {
            return (
              <button
                key={s.value}
                onClick={() => onNavigate(`/annonces?secteur=${s.value}`)}
                className="group card p-5 text-left hover:border-accent-400 hover:shadow-ledger-md transition"
              >
                <div className="flex items-start gap-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-md bg-primary-900 text-accent-400 ring-1 ring-primary-900 group-hover:bg-primary-800 transition">
                    <SectorIcon sector={s.value} className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-serif text-lg font-semibold text-ink-700">{s.label}</h3>
                    <p className="mt-1 text-sm text-ink-400">
                      Annonces de vente et d'achat
                    </p>
                  </div>
                  <ArrowRight className="ml-auto h-4 w-4 text-ink-300 group-hover:text-accent-500 group-hover:translate-x-0.5 transition" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    {
      icon: ShieldCheck,
      title: 'Profils vérifiés',
      body: 'Chaque acteur dispose d\'un badge de vérification. La confiance se construit sur l\'identité, pas sur l\'anonymat.',
    },
    {
      icon: MessageSquare,
      title: 'Négociation directe',
      body: 'Contactez l\'auteur d\'une annonce, échangez en messagerie privée et concluez vos accords sans intermédiaire.',
    },
    {
      icon: BarChart3,
      title: 'Tableau de bord par profil',
      body: 'Le producteur suit ses offres, la PME ses achats et ventes, le client son historique. Chacun sa vue, sa clarté.',
    },
    {
      icon: Users,
      title: 'Annuaire sectoriel',
      body: 'Filtrez par secteur et par type de profil pour trouver exactement le bon partenaire commercial, dans la bonne région.',
    },
  ];
  return (
    <section className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8 py-20">
      <SectionHeading
        kicker="Comment ça marche"
        title="Un registre vivant, pas une vitrine statique"
        subtitle="Senconnect est conçu comme un livre de comptes partagé : sobre, structuré, digne de confiance."
      />
      <div className="mt-12 grid gap-px bg-ink-200/70 rounded-lg overflow-hidden border border-ink-200/70 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <div key={it.title} className="bg-paper-50 p-6">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-accent-50 text-accent-700 ring-1 ring-accent-200">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-serif text-lg font-semibold text-ink-700">{it.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">{it.body}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function CtaBand({ onNavigate, loggedIn }: { onNavigate: (t: string) => void; loggedIn: boolean }) {
  return (
    <section className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8 pb-4">
      <div className="relative overflow-hidden rounded-xl bg-primary-800 px-8 py-14 sm:px-12 sm:py-16">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(to bottom, transparent 0, transparent 31px, rgba(246,243,236,0.8) 31px, rgba(246,243,236,0.8) 32px)',
          }}
        />
        <div className="relative max-w-2xl">
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-paper-100 leading-tight">
            Inscrivez votre activité au registre Senconnect.
          </h2>
          <p className="mt-4 text-paper-200/80 text-lg">
            Rejoignez les producteurs, PME et clients qui structurent leurs échanges
            commerciaux sur toute la chaîne de valeur du Sénégal.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={() => onNavigate(loggedIn ? '/annonces/publier' : '/inscription')} className="btn-accent">
              {loggedIn ? 'Publier une annonce' : 'Créer mon compte'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SectionHeading({
  kicker, title, subtitle, center = true,
}: {
  kicker: string; title: string; subtitle?: string; center?: boolean;
}) {
  return (
    <div className={center ? 'text-center max-w-2xl mx-auto' : 'max-w-2xl'}>
      <p className="font-mono-label text-[11px] text-accent-600">{kicker}</p>
      <h2 className="mt-3 font-serif text-3xl sm:text-4xl font-semibold text-ink-700 leading-tight">{title}</h2>
      {subtitle && <p className="mt-4 text-ink-500 text-lg leading-relaxed">{subtitle}</p>}
    </div>
  );
}
