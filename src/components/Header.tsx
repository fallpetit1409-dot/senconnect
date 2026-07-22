import { LogOut, LayoutDashboard, Plus, MessageSquare, ChevronDown, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useRoute } from '../lib/router';
import { Logo } from './Logo';
import { Avatar, AccountBadge } from './Badges';

export function Header() {
  const { user, profile, signOut } = useAuth();
  const [path, navigate] = useRoute();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (prefix: string) => path === prefix || path.startsWith(prefix + '/');

  const navLink = (to: string, label: string) => (
    <button
      key={to}
      onClick={() => {
        navigate(to);
        setMenuOpen(false);
      }}
      className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
        isActive(to)
          ? 'bg-primary-50 text-primary-700'
          : 'text-ink-500 hover:text-primary-700 hover:bg-paper-200'
      }`}
    >
      {label}
    </button>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-ink-200/70 bg-paper-100/95 backdrop-blur supports-[backdrop-filter]:bg-paper-100/80">
      <div className="mx-auto flex h-16 max-w-8xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <button onClick={() => navigate('/')} className="flex items-center" aria-label="Accueil Sentoile">
          <Logo />
        </button>

        <nav className="hidden md:flex items-center gap-1">
          {navLink('/annonces', 'Annonces')}
          {user && profile && profile.account_type !== 'client' && navLink('/annonces/publier', 'Publier')}
          {user && navLink('/messagerie', 'Messagerie')}
          {user && navLink('/tableau-de-bord', 'Tableau de bord')}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <UserMenu profile={profile} onSignOut={signOut} navigate={navigate} path={path} />
          ) : (
            <>
              <button onClick={() => navigate('/connexion')} className="btn-ghost">
                Connexion
              </button>
              <button onClick={() => navigate('/inscription')} className="btn-primary">
                Créer un compte
              </button>
            </>
          )}
        </div>

        <button
          className="md:hidden p-2 rounded-md text-ink-600 hover:bg-paper-200"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Menu"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-ink-200/70 bg-paper-100 px-4 py-3 space-y-1">
          <MobileLink to="/annonces" label="Annonces" path={path} navigate={navigate} close={() => setMenuOpen(false)} />
          {user && profile && profile.account_type !== 'client' && (
            <MobileLink to="/annonces/publier" label="Publier une annonce" path={path} navigate={navigate} close={() => setMenuOpen(false)} icon={<Plus className="h-4 w-4" />} />
          )}
          {user && (
            <MobileLink to="/messagerie" label="Messagerie" path={path} navigate={navigate} close={() => setMenuOpen(false)} icon={<MessageSquare className="h-4 w-4" />} />
          )}
          {user && (
            <MobileLink to="/tableau-de-bord" label="Tableau de bord" path={path} navigate={navigate} close={() => setMenuOpen(false)} icon={<LayoutDashboard className="h-4 w-4" />} />
          )}
          <div className="pt-2 mt-2 border-t border-ink-200/70 flex gap-2">
            {user ? (
              <button
                onClick={() => {
                  signOut();
                  setMenuOpen(false);
                  navigate('/');
                }}
                className="btn-outline w-full"
              >
                <LogOut className="h-4 w-4" /> Déconnexion
              </button>
            ) : (
              <>
                <button onClick={() => { navigate('/connexion'); setMenuOpen(false); }} className="btn-outline flex-1">
                  Connexion
                </button>
                <button onClick={() => { navigate('/inscription'); setMenuOpen(false); }} className="btn-primary flex-1">
                  Créer un compte
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function MobileLink({
  to, label, path, navigate, close, icon,
}: {
  to: string; label: string; path: string; navigate: (t: string) => void; close: () => void; icon?: React.ReactNode;
}) {
  const active = path === to || path.startsWith(to + '/');
  return (
    <button
      onClick={() => { navigate(to); close(); }}
      className={`flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm font-medium ${
        active ? 'bg-primary-50 text-primary-700' : 'text-ink-600 hover:bg-paper-200'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function UserMenu({
  profile, onSignOut, navigate, path,
}: {
  profile: ReturnType<typeof useAuth>['profile'];
  onSignOut: () => Promise<void>;
  navigate: (t: string) => void;
  path: string;
}) {
  const [open, setOpen] = useState(false);
  if (!profile) return null;
  const initial = profile.full_name;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 hover:bg-paper-200 transition"
      >
        <Avatar name={initial} type={profile.account_type} size={32} />
        <span className="hidden lg:flex flex-col items-start leading-none">
          <span className="text-sm font-medium text-ink-700 max-w-[10rem] truncate">{profile.full_name}</span>
          <span className="font-mono-label text-[9px] text-ink-400">{profile.account_type}</span>
        </span>
        <ChevronDown className="h-4 w-4 text-ink-400" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-64 z-20 card overflow-hidden">
            <div className="p-3 border-b border-ink-200/70 bg-paper-100">
              <div className="flex items-center gap-2">
                <Avatar name={profile.full_name} type={profile.account_type} size={36} />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-ink-700 truncate">{profile.full_name}</div>
                  <div className="mt-0.5"><AccountBadge type={profile.account_type} size="xs" /></div>
                </div>
              </div>
              <div className="font-mono-label text-[9px] text-ink-400 mt-2 truncate">{profile.email}</div>
            </div>
            <div className="p-1">
              <MenuItem label="Tableau de bord" onClick={() => { navigate('/tableau-de-bord'); setOpen(false); }} active={path.startsWith('/tableau-de-bord')} />
              <MenuItem label="Mon profil" onClick={() => { navigate(`/profil/${profile.id}`); setOpen(false); }} active={path.startsWith('/profil/')} />
              <MenuItem label="Messagerie" onClick={() => { navigate('/messagerie'); setOpen(false); }} active={path.startsWith('/messagerie')} />
              <div className="my-1 ledger-rule" />
              <MenuItem label="Déconnexion" onClick={() => { onSignOut(); setOpen(false); navigate('/'); }} danger />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MenuItem({
  label, onClick, active, danger,
}: {
  label: string; onClick: () => void; active?: boolean; danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded-md text-sm transition ${
        danger
          ? 'text-danger-500 hover:bg-danger-50'
          : active
            ? 'bg-primary-50 text-primary-700'
            : 'text-ink-600 hover:bg-paper-200'
      }`}
    >
      {label}
    </button>
  );
}
