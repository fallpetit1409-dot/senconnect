import { useState, useEffect } from 'react';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useRoute } from '../lib/router';
import { Logo } from '../components/Logo';

export function LoginPage() {
  const { signIn, loading } = useAuth();
  const [, navigate] = useRoute();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
  }, [email, password]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const { error: signInError } = await signIn(email.trim(), password);
    if (signInError) {
      setError(signInError);
    } else {
      navigate('/tableau-de-bord');
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 sm:px-6 py-16">
      <div className="text-center mb-8">
        <button onClick={() => navigate('/')} className="inline-flex">
          <Logo />
        </button>
      </div>

      <div className="card p-8">
        <div className="text-center mb-6">
          <h1 className="font-serif text-2xl font-semibold text-ink-700">Connexion</h1>
          <p className="font-mono-label text-[10px] text-ink-400 mt-1">Accès au registre</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="font-mono-label text-[10px] text-ink-400">E-mail</span>
            <div className="relative mt-1.5">
              <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-300" />
              <input
                type="email"
                className="field-input pl-9"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@exemple.sn"
                required
                autoFocus
              />
            </div>
          </label>

          <label className="block">
            <span className="font-mono-label text-[10px] text-ink-400">Mot de passe</span>
            <div className="relative mt-1.5">
              <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-300" />
              <input
                type="password"
                className="field-input pl-9"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Votre mot de passe"
                required
              />
            </div>
          </label>

          {error && (
            <div className="rounded-md border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-500">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Se connecter
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-ink-400">
          Pas encore de compte ?{' '}
          <button onClick={() => navigate('/inscription')} className="text-primary-700 font-medium hover:underline">
            Créer un compte
          </button>
        </div>
      </div>
    </div>
  );
}
