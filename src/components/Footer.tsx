import { Logo } from './Logo';
import { useRoute } from '../lib/router';
import { SECTORS } from '../lib/constants';

export function Footer() {
  const [, navigate] = useRoute();
  return (
    <footer className="mt-20 border-t border-ink-200/70 bg-primary-900 text-paper-200">
      <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="[&_span]:!text-paper-100 [&_.text-ink-400]:!text-paper-200/60">
              <Logo />
            </div>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-paper-200/70">
              Senconnect est le registre commercial qui relie producteurs, PME et
              clients particuliers du Sénégal. De la récolte à la vente au détail,
              la chaîne de valeur est tracée, négociée et sécurisée.
            </p>
            <p className="mt-4 font-mono-label text-[10px] text-accent-400/80">
              Registre commercial · République du Sénégal
            </p>
          </div>

          <div>
            <h4 className="font-mono-label text-[11px] text-paper-200/50 mb-3">Naviguer</h4>
            <ul className="space-y-2 text-sm">
              <li><FooterLink onClick={() => navigate('/annonces')}>Annonces</FooterLink></li>
              <li><FooterLink onClick={() => navigate('/inscription')}>Créer un compte</FooterLink></li>
              <li><FooterLink onClick={() => navigate('/connexion')}>Connexion</FooterLink></li>
            </ul>
          </div>

          <div>
            <h4 className="font-mono-label text-[11px] text-paper-200/50 mb-3">Secteurs</h4>
            <ul className="space-y-2 text-sm">
              {SECTORS.slice(0, 6).map((s) => (
                <li key={s.value}>
                  <FooterLink onClick={() => navigate(`/annonces?secteur=${s.value}`)}>{s.label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-paper-200/10 flex flex-col sm:flex-row justify-between gap-3">
          <p className="text-xs text-paper-200/50">
            © {new Date().getFullYear()} Senconnect. Tous droits réservés.
          </p>
          <p className="font-mono-label text-[10px] text-paper-200/40">
            Construit pour la chaîne de valeur sénégalaise
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-paper-200/70 hover:text-accent-400 transition text-left">
      {children}
    </button>
  );
}
