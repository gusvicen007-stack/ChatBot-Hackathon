import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useProfile } from '../ProfileContext';
import { useT } from '../i18n/I18nContext';
import WizardMascot from '../components/WizardMascot';
import EarthGlobe from '../components/EarthGlobe';

export default function Login() {
  const { login } = useAuth();
  const { hasProfile } = useProfile();
  const { t } = useT();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      login();
      navigate(hasProfile ? '/dashboard' : '/onboarding');
    }, 500);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-[#0a1030] via-[#0e1f4d] to-[#123a6b] px-4 py-10">
      <div className="starfield pointer-events-none absolute inset-0" />
      <EarthGlobe
        size={640}
        className="animate-spin-slow pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 opacity-90 sm:-top-16"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0a1030]" />

      <div className="relative w-full max-w-sm">
        <div className="mb-5 flex flex-col items-center text-center">
          <WizardMascot size={136} className="drop-shadow-2xl" />
          <span className="mt-1 text-xl font-extrabold tracking-tight text-white">Fluenta</span>
          <p className="mt-1 text-sm text-white/80">{t('login.tagline')}</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-3xl bg-white p-6 sm:p-8 shadow-2xl">
          <h2 className="text-center text-2xl font-extrabold text-ink-950 mb-1">
            {t('login.welcomeBack')}
          </h2>
          <p className="text-center text-ink-500 text-sm mb-6">{t('login.subheading')}</p>

          <label className="block text-sm font-bold text-ink-700 mb-1.5" htmlFor="email">
            {t('login.emailLabel')}
          </label>
          <div className="relative mb-4">
            <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" />
            <input
              id="email"
              type="email"
              required
              placeholder={t('login.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border-2 border-ink-100 bg-white py-3 pl-10 pr-4 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-400/20"
            />
          </div>

          <label className="block text-sm font-bold text-ink-700 mb-1.5" htmlFor="password">
            {t('login.passwordLabel')}
          </label>
          <div className="relative mb-2">
            <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" />
            <input
              id="password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border-2 border-ink-100 bg-white py-3 pl-10 pr-4 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-400/20"
            />
          </div>

          <div className="flex justify-end mb-6">
            <a href="#" className="text-sm text-brand-600 font-bold hover:text-brand-700">
              {t('login.forgotPassword')}
            </a>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="duo-btn w-full flex items-center justify-center gap-2 rounded-2xl bg-brand-600 py-3.5 text-sm font-extrabold uppercase tracking-wide text-white transition hover:bg-brand-600/90 disabled:opacity-60"
          >
            {isSubmitting ? t('login.signingIn') : t('login.signIn')}
            {!isSubmitting && <ArrowRight size={16} />}
          </button>

          <p className="text-center text-sm text-ink-500 mt-6">
            {t('login.noAccount')}{' '}
            <Link to="/onboarding" className="text-brand-600 font-bold hover:text-brand-700">
              {t('login.signUpFree')}
            </Link>
          </p>

          <p className="text-center text-xs text-ink-300 mt-6">{t('login.demoNotice')}</p>
        </form>

        <p className="relative mt-6 flex items-center justify-center gap-4 text-xs text-white/60">
          <span>{t('login.statLanguages')}</span>
          <span className="h-1 w-1 rounded-full bg-white/40" />
          <span>{t('login.statAvailability')}</span>
          <span className="h-1 w-1 rounded-full bg-white/40" />
          <span>{t('login.statFeedback')}</span>
        </p>
      </div>
    </div>
  );
}
