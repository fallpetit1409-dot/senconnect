import { AuthProvider } from './lib/auth';
import { useRoute, parsePath } from './lib/router';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { SignUpPage } from './pages/SignUpPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ListingsPage } from './pages/ListingsPage';
import { PublishListingPage } from './pages/PublishListingPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { ListingDetailPage } from './pages/ListingDetailPage';

function Router() {
  const [path, navigate] = useRoute();
  const { segments } = parsePath(path);
  const root = `/${segments[0] ?? ''}`;

  // Full path for routes that need more than the first segment.
  const full = segments.length > 1 ? `/${segments.slice(0, 2).join('/')}` : root;

  let page: React.ReactNode;
  switch (full) {
    case '/annonces/publier':
      page = <PublishListingPage />;
      break;
    default:
      if (root === '/annonces' && segments.length > 1) {
      page = <ListingDetailPage />;
    } else
    switch (root) {
        case '/':
          page = <HomePage />;
          break;
        case '/inscription':
          page = <SignUpPage />;
          break;
        case '/connexion':
          page = <LoginPage />;
          break;
        case '/tableau-de-bord':
          page = <DashboardPage />;
          break;
        case '/annonces':
          page = <ListingsPage />;
          break;
        case '/messagerie':
        case '/profil':
          page = <PlaceholderPage routeKey={root} />;
          break;
        default:
          page = <NotFound onHome={() => navigate('/')} />;
      }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{page}</main>
      <Footer />
    </div>
  );
}

function NotFound({ onHome }: { onHome: () => void }) {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="font-mono-label text-[11px] text-accent-600">Erreur 404</p>
      <h1 className="mt-2 font-serif text-3xl font-semibold text-ink-700">Page introuvable</h1>
      <p className="mt-3 text-ink-500">Cette entrée du registre n'existe pas.</p>
      <button onClick={onHome} className="btn-outline mt-6">Retour à l'accueil</button>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}
