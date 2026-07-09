import { useState } from 'react';
import {
  ArrowRight, ArrowLeft, Loader2, Check, MapPin, Tag, Package,
  type LucideIcon,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useRoute } from '../lib/router';
import { SECTORS, REGIONS_SENEGAL, UNITS, LISTING_TYPES } from '../lib/constants';
import type { ListingType } from '../lib/types';
import { SectorIcon } from '../components/SectorIcon';

interface FormState {
  listingType: ListingType;
  title: string;
  description: string;
  sector: string;
  quantity: string;
  unit: string;
  price: string;
  region: string;
  city: string;
}

const INITIAL: FormState = {
  listingType: 'vente',
  title: '',
  description: '',
  sector: '',
  quantity: '',
  unit: 'kg',
  price: '',
  region: '',
  city: '',
};

export function PublishListingPage() {
  const { user, profile } = useAuth();
  const [, navigate] = useRoute();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="font-mono-label text-[11px] text-accent-600">Connexion requise</p>
        <h1 className="mt-2 font-serif text-3xl font-semibold text-ink-700">Publier une annonce</h1>
        <p className="mt-3 text-ink-500">
          Vous devez être connecté pour publier une annonce sur le registre.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={() => navigate('/connexion')} className="btn-primary">
            Connexion <ArrowRight className="h-4 w-4" />
          </button>
          <button onClick={() => navigate('/inscription')} className="btn-outline">
            Créer un compte
          </button>
        </div>
      </div>
    );
  }

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setError(null);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.title.trim()) {
      setError('Le titre de l\'annonce est requis.');
      return;
    }
    if (!form.sector) {
      setError('Veuillez sélectionner un secteur d\'activité.');
      return;
    }
    const qty = parseFloat(form.quantity);
    if (!form.quantity || isNaN(qty) || qty <= 0) {
      setError('La quantité doit être un nombre supérieur à zéro.');
      return;
    }
    const priceVal = form.price.trim() ? parseFloat(form.price) : null;
    if (priceVal !== null && (isNaN(priceVal) || priceVal < 0)) {
      setError('Le prix indicatif doit être un nombre positif ou laissé vide.');
      return;
    }

    setSubmitting(true);
    const { error: insertError } = await supabase.from('listings').insert({
      listing_type: form.listingType,
      title: form.title.trim(),
      description: form.description.trim() || null,
      sector: form.sector,
      quantity: qty,
      unit: form.unit || null,
      price: priceVal,
      region: form.region || null,
      city: form.city.trim() || null,
      status: 'active',
    });

    if (insertError) {
      setError(insertError.message || 'Erreur lors de la publication de l\'annonce.');
      setSubmitting(false);
      return;
    }

    setSuccess(true);
    setSubmitting(false);
  }

  if (success) {
    return (
      <div className="mx-auto max-w-lg px-4 sm:px-6 py-16">
        <div className="card p-10 text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-lg bg-success-50 text-success-600 ring-1 ring-success-200">
            <Check className="h-7 w-7" />
          </span>
          <p className="mt-5 font-mono-label text-[11px] text-success-600">Annonce publiée</p>
          <h1 className="mt-2 font-serif text-3xl font-semibold text-ink-700">
            Votre annonce est en ligne
          </h1>
          <p className="mt-3 text-ink-500 leading-relaxed">
            « {form.title.trim()} » est désormais visible dans l'annuaire des annonces.
            Les autres membres peuvent vous contacter pour négocier.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
            <button onClick={() => navigate('/annonces')} className="btn-primary">
              Voir les annonces <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                setForm(INITIAL);
                setSuccess(false);
              }}
              className="btn-outline"
            >
              Publier une autre annonce
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      <button
        onClick={() => navigate('/annonces')}
        className="inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-600 transition mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Retour aux annonces
      </button>

      <div className="pb-6 border-b border-ink-200/70">
        <p className="font-mono-label text-[11px] text-accent-600">Nouvelle entrée</p>
        <h1 className="mt-2 font-serif text-3xl sm:text-4xl font-semibold text-ink-700">
          Publier une annonce
        </h1>
        <p className="mt-2 text-ink-500 max-w-2xl">
          Renseignez les détails de votre offre de vente ou de votre besoin d'achat.
          Une fois publiée, votre annonce apparaîtra dans l'annuaire des annonces.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 card p-6 sm:p-8">
        {/* Listing type selector */}
        <FormField label="Type d'annonce" required>
          <div className="grid grid-cols-2 gap-3">
            {LISTING_TYPES.map((t) => {
              const selected = form.listingType === t.value;
              const Icon: LucideIcon = t.value === 'vente' ? Tag : Package;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => update('listingType', t.value)}
                  className={`flex items-center gap-3 rounded-lg border p-4 text-left transition ${
                    selected
                      ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500/15'
                      : 'border-ink-200 bg-paper-50 hover:border-primary-300'
                  }`}
                >
                  <span
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-md ${
                      selected
                        ? t.value === 'vente'
                          ? 'bg-teal-100 text-teal-700'
                          : 'bg-primary-100 text-primary-700'
                        : 'bg-paper-200 text-ink-400'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block font-serif text-base font-semibold text-ink-700">
                      {t.label}
                    </span>
                    <span className="block text-xs text-ink-400 mt-0.5">
                      {t.value === 'vente'
                        ? 'Vous proposez un bien ou un service à la vente'
                        : 'Vous recherchez un produit ou un service à acheter'}
                    </span>
                  </span>
                  {selected && <Check className="h-4 w-4 text-primary-600 ml-auto shrink-0" />}
                </button>
              );
            })}
          </div>
        </FormField>

        {/* Title */}
        <FormField label="Titre de l'annonce" required>
          <input
            className="field-input"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder={form.listingType === 'vente' ? 'Ex. Sacs de mil local, 50 kg' : 'Ex. Recherche 2 tonnes d\'arachide'}
            maxLength={120}
            required
          />
        </FormField>

        {/* Description */}
        <FormField label="Description">
          <textarea
            className="field-input min-h-[100px] resize-y"
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder="Détaillez la qualité, les conditions, les délais de livraison…"
            maxLength={1000}
          />
          <p className="mt-1 text-[11px] text-ink-300">{form.description.length}/1000 caractères</p>
        </FormField>

        {/* Sector */}
        <FormField label="Secteur d'activité" required>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SECTORS.map((s) => {
              const selected = form.sector === s.value;
              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => update('sector', s.value)}
                  className={`flex items-center gap-2 rounded-md border px-3 py-2.5 text-sm transition ${
                    selected
                      ? 'border-primary-500 bg-primary-50 text-primary-700 ring-1 ring-primary-500/15'
                      : 'border-ink-200 bg-paper-50 text-ink-600 hover:border-primary-300'
                  }`}
                >
                  <SectorIcon sector={s.value} className="h-4 w-4 shrink-0" />
                  <span className="truncate text-left">{s.label}</span>
                </button>
              );
            })}
          </div>
        </FormField>

        {/* Quantity + Unit */}
        <div className="grid sm:grid-cols-2 gap-4">
          <FormField label="Quantité" required>
            <input
              type="number"
              min="0"
              step="any"
              className="field-input"
              value={form.quantity}
              onChange={(e) => update('quantity', e.target.value)}
              placeholder="Ex. 500"
              required
            />
          </FormField>
          <FormField label="Unité">
            <select
              className="field-input"
              value={form.unit}
              onChange={(e) => update('unit', e.target.value)}
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </FormField>
        </div>

        {/* Price */}
        <FormField label="Prix indicatif (FCFA)">
          <div className="relative">
            <input
              type="number"
              min="0"
              step="any"
              className="field-input pr-16"
              value={form.price}
              onChange={(e) => update('price', e.target.value)}
              placeholder="Laisser vide si prix à négocier"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-mono-label text-[10px] text-ink-300 pointer-events-none">
              FCFA
            </span>
          </div>
          <p className="mt-1 text-[11px] text-ink-300">Optionnel — laissez vide pour « prix à négocier »</p>
        </FormField>

        {/* Region + City */}
        <div className="grid sm:grid-cols-2 gap-4">
          <FormField label="Région">
            <select
              className="field-input"
              value={form.region}
              onChange={(e) => update('region', e.target.value)}
            >
              <option value="">Sélectionner…</option>
              {REGIONS_SENEGAL.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Ville / Localité">
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-300" />
              <input
                className="field-input pl-9"
                value={form.city}
                onChange={(e) => update('city', e.target.value)}
                placeholder="Ex. Thiaroye"
              />
            </div>
          </FormField>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-5 rounded-md border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-500">
            {error}
          </div>
        )}

        {/* Author context */}
        {profile && (
          <div className="mt-6 rounded-md bg-paper-100 border border-ink-200/70 px-4 py-3 text-xs text-ink-400">
            Cette annonce sera publiée sous le profil :{' '}
            <span className="font-medium text-ink-600">
              {profile.company_name ?? profile.full_name}
            </span>
            .
          </div>
        )}

        {/* Submit */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={() => navigate('/annonces')}
            className="btn-outline sm:order-1"
          >
            Annuler
          </button>
          <button type="submit" disabled={submitting} className="btn-primary sm:btn-accent">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Publier l'annonce
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5 last:mb-0">
      <label className="block">
        <span className="font-mono-label text-[10px] text-ink-400">
          {label} {required && <span className="text-accent-600">*</span>}
        </span>
        <div className="mt-1.5">{children}</div>
      </label>
    </div>
  );
}
