import { Construction, ArrowRight } from 'lucide-react';
import { useRoute } from '../lib/router';
import { useAuth } from '../lib/auth';

const TITLES: Record<string, { title: string; body: string }> = {
  '/annonces/publier': {
    title: 'Publier une annonce',
    body: 'Le formulaire de publication d\'une annonce (vente ou besoin d\'achat) avec titre, description, quantité, prix et localisation.',
  },
  '/messagerie': {
    title: 'Messagerie',
    body: 'Vos fils de discussion avec les autres membres du registre, pour négocier et conclure vos échanges.',
  },
};

export function PlaceholderPage({ routeKey }: { routeKey: string }) {
  const [, navigate] = useRoute();
  const { user } = useAuth();
  const meta = TITLES[routeKey] ?? {
    title: 'Page en construction',
    body: 'Cette section du registre sera disponible prochainement.',
  };

  const requiresAuth = routeKey === '/annonces/publier' || routeKey === '/messagerie';

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-20">
      <div className="card p-10 text-center">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-lg bg-accent-50 text-accent-700 ring-1 ring-accent-200">
          <Construction className="h-7 w-7" />
        </span>
        <p className="mt-5 font-mono-label text-[11px] text-accent-600">À venir</p>
        <h1 className="mt-2 font-serif text-3xl font-semibold text-ink-700">{meta.title}</h1>
        <p className="mt-3 text-ink-500 leading-relaxed max-w-md mx-auto">{meta.body}</p>

        {requiresAuth && !user ? (
          <div className="mt-8 flex justify-center gap-3">
            <button onClick={() => navigate('/connexion')} className="btn-primary">
              Connexion <ArrowRight className="h-4 w-4" />
            </button>
            <button onClick={() => navigate('/inscription')} className="btn-outline">
              Créer un compte
            </button>
          </div>
        ) : (
          <button onClick={() => navigate('/')} className="btn-outline mt-8">
            Retour à l'accueil
          </button>
        )}
      </div>
    </div>
  );
}
