import { useState, useEffect } from 'react';
import { ArrowRight, Mail, Lock, User, Building2, MapPin, Phone, Loader2, Check } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useRoute } from '../lib/router';
import { Logo } from '../components/Logo';
import { ACCOUNT_TYPES, SECTORS, REGIONS_SENEGAL } from '../lib/constants';
import type { AccountType } from '../lib/types';

export function SignUpPage() {
  const { signUp, loading } = useAuth();
  const [path, navigate] = useRoute();
  const query = new URLSearchParams(path.split('?')[1] ?? '');
  const presetType = (query.get('type') as AccountType) ?? 'producteur';

  const [accountType, setAccountType] = useState<AccountType>(
    ACCOUNT_TYPES.some((t) => t.value === presetType) ? presetType : 'producteur',
  );
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [sector, setSector] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [region, setRegion] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
  }, [accountType, email, password, confirmPassword]);

  const needsCompany = accountType === 'producteur' || accountType === 'pme';
  const needsSector = accountType !== 'client';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }
    if (needsCompany && !companyName.trim()) {
      setError('Le nom de l\'entreprise / exploitation est requis pour ce profil.');
      return;
    }
    if (needsSector && !sector) {
      setError('Veuillez sélectionner un secteur d\'activité.');
      return;
    }
    const { error: signUpError } = await signUp({
      email: email.trim(),
      password,
      fullName: fullName.trim(),
      accountType,
      sector: needsSector ? sector : undefined,
      companyName: needsCompany ? companyName.trim() : undefined,
      region: region || undefined,
      city: city.trim() || undefined,
      phone: phone.trim() || undefined,
    });
    if (signUpError) {
      setError(signUpError);
    } else {
      navigate('/tableau-de-bord');
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      <div className="grid lg:grid-cols-12 gap-10">
        <aside className="lg:col-span-4">
          <button onClick={() => navigate('/')} className="mb-8">
            <Logo />
          </button>
          <h1 className="font-serif text-3xl font-semibold text-ink-700 leading-tight">
            Inscription au registre
          </h1>
          <p className="mt-3 text-ink-500 text-sm leading-relaxed">
            Choisissez votre profil d'acteur. Ces informations structurent votre
            présence dans la chaîne de valeur et déterminent les fonctionnalités
            accessibles.
          </p>
          <div className="mt-8 space-y-3">
            {ACCOUNT_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setAccountType(t.value)}
                className={`w-full text-left rounded-lg border p-4 transition ${
                  accountType === t.value
                    ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500/15'
                    : 'border-ink-200 bg-paper-50 hover:border-primary-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-serif text-lg font-semibold text-ink-700">{t.label}</span>
                  {accountType === t.value && <Check className="h-4 w-4 text-primary-600" />}
                </div>
                <p className="mt-1 text-xs text-ink-500 leading-relaxed">{t.description}</p>
              </button>
            ))}
          </div>
        </aside>

        <div className="lg:col-span-8">
          <form onSubmit={handleSubmit} className="card p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-serif text-2xl font-semibold text-ink-700">
                  {ACCOUNT_TYPES.find((t) => t.value === accountType)?.label}
                </h2>
                <p className="font-mono-label text-[10px] text-ink-400 mt-1">
                  Formulaire d'enregistrement
                </p>
              </div>
              <span className="font-mono-label text-[10px] text-ink-300">Étape 1/1</span>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Nom complet" required>
                <IconInput icon={User}>
                  <input
                    className="field-input pl-9"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Awa Ndiaye"
                    required
                  />
                </IconInput>
              </Field>

              <Field label="E-mail" required>
                <IconInput icon={Mail}>
                  <input
                    type="email"
                    className="field-input pl-9"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@exemple.sn"
                    required
                  />
                </IconInput>
              </Field>

              {needsCompany && (
                <Field label={accountType === 'producteur' ? 'Nom de l\'exploitation' : 'Nom de l\'entreprise'} required>
                  <IconInput icon={Building2}>
                    <input
                      className="field-input pl-9"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Coopérative de Thiaroye"
                      required
                    />
                  </IconInput>
                </Field>
              )}

              {needsSector && (
                <Field label="Secteur d'activité" required>
                  <select
                    className="field-input"
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    required
                  >
                    <option value="">Sélectionner…</option>
                    {SECTORS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </Field>
              )}

              <Field label="Région">
                <select
                  className="field-input"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                >
                  <option value="">Sélectionner…</option>
                  {REGIONS_SENEGAL.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </Field>

              <Field label="Ville / Localité">
                <IconInput icon={MapPin}>
                  <input
                    className="field-input pl-9"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Thiaroye"
                  />
                </IconInput>
              </Field>

              <Field label="Téléphone">
                <IconInput icon={Phone}>
                  <input
                    className="field-input pl-9"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+221 77 000 00 00"
                  />
                </IconInput>
              </Field>

              <div className="hidden" />

              <Field label="Mot de passe" required>
                <IconInput icon={Lock}>
                  <input
                    type="password"
                    className="field-input pl-9"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="6 caractères minimum"
                    required
                  />
                </IconInput>
              </Field>

              <Field label="Confirmer le mot de passe" required>
                <IconInput icon={Lock}>
                  <input
                    type="password"
                    className="field-input pl-9"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Same as above"
                    required
                  />
                </IconInput>
              </Field>
            </div>

            {error && (
              <div className="mt-5 rounded-md border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-500">
                {error}
              </div>
            )}

            <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <p className="text-xs text-ink-400">
                Déjà inscrit ?{' '}
                <button type="button" onClick={() => navigate('/connexion')} className="text-primary-700 font-medium hover:underline">
                  Connectez-vous
                </button>
              </p>
              <button type="submit" disabled={loading} className="btn-primary sm:btn-accent">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Créer mon compte
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-mono-label text-[10px] text-ink-400">
        {label} {required && <span className="text-accent-600">*</span>}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function IconInput({ icon, children }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  const Icon = icon;
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-300" />
      {children}
    </div>
  );
}
