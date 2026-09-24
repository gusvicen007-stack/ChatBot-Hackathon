import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useProfile } from '../ProfileContext';
import { interestOptions, languageOptions, uiLanguageOptions } from '../data/languages';
import { getLanguageName, getLocalizedLevels } from '../i18n/languageCatalog';
import { getInterestLabel, translate, type UILang } from '../i18n/translations';
import WizardMascot from '../components/WizardMascot';

const TOTAL_STEPS = 4;

export default function Onboarding() {
  const { login } = useAuth();
  const { saveProfile } = useProfile();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [uiLanguage, setUiLanguage] = useState<UILang | null>(null);
  const [name, setName] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [languageIds, setLanguageIds] = useState<string[]>([]);
  const [levels, setLevels] = useState<Record<string, string>>({});
  const [finishing, setFinishing] = useState(false);

  // Todavía no hay perfil guardado durante el registro, así que este `t` local
  // traduce con el idioma recién elegido en el paso 1 (no con useT(), que lee
  // del perfil y por eso mostraría español hasta terminar el registro).
  const activeLang: UILang = uiLanguage ?? 'es';
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(activeLang, key, vars);

  const stepMessages: Record<number, string> = {
    1: t('onboarding.langStepMessage'),
    2: t('onboarding.step2Message'),
    3: t('onboarding.step3Message'),
    4: t('onboarding.step4Message'),
  };

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest],
    );
  };

  const toggleLanguage = (id: string) => {
    setLanguageIds((prev) => (prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]));
  };

  const setLevel = (languageId: string, code: string) => {
    setLevels((prev) => ({ ...prev, [languageId]: code }));
  };

  const canContinueStep1 = uiLanguage !== null;
  const canContinueStep2 = name.trim().length > 0;
  const canContinueStep3 = languageIds.length > 0;
  const canFinish = languageIds.every((id) => !!levels[id]);

  const stepGuards: Record<number, boolean> = {
    1: canContinueStep1,
    2: canContinueStep2,
    3: canContinueStep3,
  };

  const handleFinish = () => {
    saveProfile({
      name: name.trim(),
      uiLanguage: activeLang,
      interests,
      languages: languageIds.map((languageId) => ({ languageId, levelCode: levels[languageId] })),
    });
    login();
    setFinishing(true);
    setTimeout(() => navigate('/dashboard'), 900);
  };

  return (
    <div className="min-h-screen bg-brand-100 flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-8 h-2.5 w-full overflow-hidden rounded-full bg-white/60">
          <div
            className="h-full rounded-full bg-brand-600 transition-all duration-300"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>

        <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm">
          <div className="mb-6 flex items-start gap-3">
            <WizardMascot size={76} className="shrink-0" state={finishing ? 'celebrate' : 'idle'} />
            <div className="mt-1 rounded-2xl rounded-tl-sm bg-ink-50 px-4 py-2.5 text-sm font-semibold text-ink-900">
              {finishing ? t('onboarding.finishingMessage', { name: name.trim() }) : stepMessages[step]}
            </div>
          </div>

          {step === 1 && (
            <div className="grid grid-cols-2 gap-3">
              {uiLanguageOptions.map((lang) => {
                const active = uiLanguage === lang.id;
                return (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => setUiLanguage(lang.id as UILang)}
                    className={`relative flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition ${
                      active
                        ? 'border-brand-500 bg-brand-100'
                        : 'border-ink-100 bg-white hover:border-ink-300'
                    }`}
                  >
                    {active && (
                      <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-white">
                        <Check size={12} />
                      </span>
                    )}
                    <span className="text-3xl">{lang.flag}</span>
                    <span className="text-sm font-bold text-ink-900">{lang.selfName}</span>
                  </button>
                );
              })}
            </div>
          )}

          {step === 2 && (
            <div>
              <label className="block text-sm font-bold text-ink-700 mb-1.5" htmlFor="name">
                {t('onboarding.nameLabel')}
              </label>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('onboarding.namePlaceholder')}
                className="w-full rounded-2xl border-2 border-ink-100 bg-white py-3 px-4 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-400/20"
              />

              <p className="mt-6 mb-2 text-sm font-bold text-ink-700">
                {t('onboarding.interestsPrompt')}
              </p>
              <div className="flex flex-wrap gap-2">
                {interestOptions.map((interest) => {
                  const active = interests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className={`rounded-full border-2 px-4 py-2 text-sm font-bold transition ${
                        active
                          ? 'border-brand-500 bg-brand-100 text-brand-700'
                          : 'border-ink-100 bg-white text-ink-500 hover:border-ink-300'
                      }`}
                    >
                      {getInterestLabel(activeLang, interest)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="grid grid-cols-2 gap-3">
              {languageOptions.map((lang) => {
                const active = languageIds.includes(lang.id);
                return (
                  <button
                    key={lang.id}
                    type="button"
                    disabled={lang.comingSoon}
                    onClick={() => toggleLanguage(lang.id)}
                    className={`relative flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition ${
                      lang.comingSoon
                        ? 'cursor-not-allowed border-ink-100 bg-ink-50 opacity-50'
                        : active
                          ? 'border-brand-500 bg-brand-100'
                          : 'border-ink-100 bg-white hover:border-ink-300'
                    }`}
                  >
                    {active && (
                      <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-white">
                        <Check size={12} />
                      </span>
                    )}
                    <span className="text-3xl">{lang.flag}</span>
                    <span className="text-sm font-bold text-ink-900">
                      {getLanguageName(lang.id, activeLang)}
                    </span>
                    {lang.comingSoon && (
                      <span className="text-[10px] text-ink-500">{t('onboarding.comingSoon')}</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col gap-6">
              {languageIds.map((id) => {
                const lang = languageOptions.find((l) => l.id === id)!;
                const localizedLevels = getLocalizedLevels(lang, activeLang);
                return (
                  <div key={id}>
                    <p className="mb-2 flex items-center gap-2 text-sm font-bold text-ink-900">
                      <span className="text-xl">{lang.flag}</span> {getLanguageName(id, activeLang)}
                    </p>
                    <div className="flex flex-col gap-2">
                      {localizedLevels.map((level) => {
                        const active = levels[id] === level.code;
                        return (
                          <button
                            key={level.code}
                            type="button"
                            onClick={() => setLevel(id, level.code)}
                            className={`flex items-center justify-between rounded-2xl border-2 px-4 py-2.5 text-left transition ${
                              active
                                ? 'border-brand-500 bg-brand-100'
                                : 'border-ink-100 bg-white hover:border-ink-300'
                            }`}
                          >
                            <span>
                              <span className="block text-sm font-bold text-ink-900">{level.label}</span>
                              <span className="block text-xs text-ink-500">{level.description}</span>
                            </span>
                            {active && (
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-white">
                                <Check size={12} />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-8 flex items-center justify-between gap-3">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="flex items-center gap-1.5 rounded-2xl px-4 py-3 text-sm font-bold text-ink-500 transition hover:text-ink-900"
              >
                <ArrowLeft size={16} />
                {t('onboarding.back')}
              </button>
            ) : (
              <span />
            )}

            {step < TOTAL_STEPS && (
              <button
                type="button"
                disabled={!stepGuards[step]}
                onClick={() => setStep((s) => s + 1)}
                style={{ ['--duo-shadow' as string]: 'var(--color-brand-700)' }}
                className="duo-btn flex items-center gap-2 rounded-2xl bg-brand-600 px-6 py-3 text-sm font-extrabold uppercase tracking-wide text-white transition disabled:opacity-40"
              >
                {t('onboarding.continue')}
                <ArrowRight size={16} />
              </button>
            )}

            {step === TOTAL_STEPS && (
              <button
                type="button"
                disabled={!canFinish || finishing}
                onClick={handleFinish}
                style={{ ['--duo-shadow' as string]: 'var(--color-brand-700)' }}
                className="duo-btn flex items-center gap-2 rounded-2xl bg-brand-600 px-6 py-3 text-sm font-extrabold uppercase tracking-wide text-white transition disabled:opacity-40"
              >
                {finishing ? t('onboarding.preparing') : t('onboarding.startAdventure')}
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
