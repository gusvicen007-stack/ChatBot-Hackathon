import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, Loader2, Mic, MicOff, PencilLine } from 'lucide-react';
import WizardMascot from './WizardMascot';
import { getLanguage, uiLanguageOptions } from '../data/languages';
import { getLanguageName } from '../i18n/languageCatalog';
import { getInterestLabel, type UILang } from '../i18n/translations';
import { canSpeak, onboardingPrompt } from '../voice/agentConfig';
import {
  extractAnswer,
  isEmptyUpdate,
  mergeKnown,
  type OnboardingKnown,
  type ProfileUpdate,
} from '../voice/onboarding';
import { useVoiceAgent, type VoiceTranscript } from '../voice/useVoiceAgent';

/** La app (y Sabio) arrancan en inglés hasta que el usuario elige otro idioma. */
const DEFAULT_VOICE = 'en';

/** Voz con la que Sabio habla un idioma de app. El japonés no tiene voz: usa inglés. */
const voiceFor = (appLang: string | null) => (appLang && canSpeak(appLang) ? appLang : DEFAULT_VOICE);

interface Props {
  t: (key: string, vars?: Record<string, string | number>) => string;
  lang: UILang;
  uiLanguage: UILang | null;
  name: string;
  interests: string[];
  interestsAnswered: boolean;
  languageIds: string[];
  levels: Record<string, string>;
  complete: boolean;
  finishing: boolean;
  onUpdate: (u: ProfileUpdate) => void;
  onFinish: () => void;
  onManual: () => void;
}

export default function VoiceSignup(props: Props) {
  const { t, lang, complete, finishing, onUpdate, onFinish, onManual } = props;
  const [messages, setMessages] = useState<VoiceTranscript[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  const voiceLang = voiceFor(props.uiLanguage);
  /** Último idioma de voz pedido: evita reconectar dos veces mientras la primera aún conecta. */
  const requestedLang = useRef(voiceLang);

  // Lo ya capturado sale del formulario (fuente única): incluye lo que el
  // alumno haya editado a mano antes de volver a la voz.
  const known: OnboardingKnown = {
    uiLanguage: props.uiLanguage,
    name: props.name.trim() || null,
    interests: props.interests,
    interestsAnswered: props.interestsAnswered,
    languages: props.languageIds.map((id) => ({ id, level: props.levels[id] ?? null })),
  };
  // Copia que los tools leen y actualizan al instante (el estado del
  // formulario tarda un render en reflejar el cambio).
  const knownRef = useRef(known);
  useEffect(() => {
    knownRef.current = known;
  });

  /**
   * Aplica un cambio al perfil y se lo cuenta a Sabio. Si cambió el idioma de
   * la app y Sabio habla con otra voz, abre una sesión con la voz nueva (que
   * saluda en ese idioma y hace la siguiente pregunta).
   */
  const applyUpdate = (update: ProfileUpdate) => {
    const merged = mergeKnown(knownRef.current, update);
    knownRef.current = merged;
    onUpdate(update);

    const v = voiceRef.current;
    if (v.state === 'idle' || v.state === 'error') return;
    const target = voiceFor(merged.uiLanguage ?? null);
    if (update.uiLanguage && target !== requestedLang.current) {
      requestedLang.current = target;
      void v.reconnect(target, merged, true);
      return;
    }
    // Mismo idioma: se actualiza el prompt en vivo con lo guardado y lo que falta.
    v.updatePrompt(
      onboardingPrompt({ mode: 'onboarding', known: merged, targetLang: target, nativeLang: target, level: 'A1' }),
    );
  };

  /** El usuario habló: la app entiende su respuesta con reglas fijas (sin depender del modelo). */
  const handleUserTurn = (text: string) => {
    const update = extractAnswer(text, knownRef.current);
    if (!isEmptyUpdate(update)) applyUpdate(update);
  };

  /** El usuario tocó un idioma en pantalla (no por voz). */
  const chooseLanguage = (code: string) => applyUpdate({ uiLanguage: code });

  const voice = useVoiceAgent({
    mode: 'onboarding',
    known,
    targetLang: voiceLang,
    nativeLang: voiceLang,
    level: 'A1',
    onTranscript: (turn) => {
      setMessages((prev) => [...prev, turn]);
      if (turn.role === 'student') handleUserTurn(turn.text);
    },
  });
  const voiceRef = useRef(voice);
  useEffect(() => {
    voiceRef.current = voice;
  });

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const voiceOn = voice.state !== 'idle' && voice.state !== 'error';
  const started = messages.length > 0 || voiceOn;
  const lastTutor = [...messages].reverse().find((m) => m.role === 'tutor')?.text;

  const mascotState = finishing || complete
    ? 'celebrate'
    : voice.state === 'thinking'
      ? 'thinking'
      : 'idle';

  const statusText =
    voice.state === 'connecting'
      ? t('voice.connecting')
      : voice.state === 'listening'
        ? t('voice.listening')
        : voice.state === 'thinking'
          ? t('voice.thinking')
          : voice.state === 'speaking'
            ? t('voice.speaking')
            : null;

  const toggleVoice = () => {
    if (voiceOn) {
      voice.stop();
    } else {
      requestedLang.current = voiceLang;
      void voice.start();
    }
  };

  const finish = () => {
    if (voiceOn) voice.stop();
    onFinish();
  };

  const goManual = () => {
    if (voiceOn) voice.stop();
    onManual();
  };

  return (
    <div>
      <div className="mb-5 flex items-start gap-3">
        <WizardMascot size={76} className="shrink-0" state={mascotState} />
        <div className="mt-1 rounded-2xl rounded-tl-sm bg-ink-50 px-4 py-2.5 text-sm font-semibold text-ink-900">
          {finishing
            ? t('onboarding.finishingMessage', { name: props.name.trim() })
            : (lastTutor ?? t('onboarding.voiceIntro'))}
        </div>
      </div>

      {started && (
        <div
          ref={logRef}
          className="mb-5 flex max-h-48 flex-col gap-2 overflow-y-auto rounded-2xl border-2 border-ink-100 p-3"
        >
          {messages.map((m, i) => (
            <p
              key={i}
              className={`max-w-[85%] rounded-2xl px-3 py-1.5 text-xs leading-relaxed ${
                m.role === 'tutor'
                  ? 'self-start rounded-bl-sm bg-ink-50 text-ink-900'
                  : 'self-end rounded-br-sm bg-brand-600 text-white'
              }`}
            >
              {m.text}
            </p>
          ))}
          {messages.length === 0 && <p className="text-center text-xs text-ink-300">{t('voice.connecting')}</p>}
        </div>
      )}

      <div className="mb-4">
        <p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-ink-500">
          {t('onboarding.fieldAppLanguage')}
        </p>
        <div className="flex flex-wrap gap-2">
          {uiLanguageOptions.map((option) => {
            const active = props.uiLanguage === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => chooseLanguage(option.id)}
                className={`flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-bold transition ${
                  active
                    ? 'border-brand-500 bg-brand-100 text-brand-700'
                    : 'border-ink-100 bg-white text-ink-500 hover:border-ink-300'
                }`}
              >
                <span className="text-base">{option.flag}</span>
                {option.selfName}
              </button>
            );
          })}
        </div>
      </div>

      <ProfileChecklist {...props} lang={lang} />

      {voice.error && (
        <p className="mt-3 rounded-xl bg-coral-500/10 px-3 py-2 text-xs font-semibold text-coral-500">
          {voice.error}
        </p>
      )}

      <div className="mt-6 flex flex-col items-center gap-3">
        {complete ? (
          <button
            type="button"
            disabled={finishing}
            onClick={finish}
            style={{ ['--duo-shadow' as string]: 'color-mix(in srgb, var(--color-mint-500) 72%, black)' }}
            className="duo-btn flex w-full items-center justify-center gap-2 rounded-2xl bg-mint-500 py-3.5 text-sm font-extrabold uppercase tracking-wide text-white disabled:opacity-60"
          >
            {finishing ? t('onboarding.preparing') : t('onboarding.startAdventure')}
            <ArrowRight size={16} />
          </button>
        ) : (
          <button
            type="button"
            onClick={toggleVoice}
            disabled={voice.state === 'connecting'}
            style={{
              ['--duo-shadow' as string]: voiceOn
                ? 'color-mix(in srgb, var(--color-coral-500) 72%, black)'
                : 'var(--color-brand-700)',
            }}
            className={`duo-btn flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-extrabold uppercase tracking-wide text-white disabled:opacity-60 ${
              voiceOn ? 'bg-coral-500' : 'bg-brand-600'
            }`}
          >
            {voice.state === 'connecting' ? (
              <Loader2 size={18} className="animate-spin" />
            ) : voiceOn ? (
              <MicOff size={18} />
            ) : (
              <Mic size={18} />
            )}
            {voiceOn ? t('onboarding.voicePause') : started ? t('onboarding.voiceResume') : t('onboarding.voiceStart')}
          </button>
        )}

        {statusText && (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-mint-500">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-mint-500" />
            {statusText}
          </span>
        )}

        <button
          type="button"
          onClick={goManual}
          className="flex items-center gap-1.5 text-sm font-bold text-ink-500 transition hover:text-ink-900"
        >
          <PencilLine size={15} />
          {started ? t('onboarding.editManually') : t('onboarding.manualOption')}
        </button>
      </div>
    </div>
  );
}

/** La ficha del perfil que se va llenando mientras el alumno habla con Sabio. */
function ProfileChecklist({ t, lang, uiLanguage, name, interests, interestsAnswered, languageIds, levels }: Props) {
  const ui = uiLanguage ? getLanguage(uiLanguage) : null;
  const rows: { label: string; value: string | null }[] = [
    { label: t('onboarding.fieldAppLanguage'), value: ui ? `${ui.flag} ${ui.selfName}` : null },
    { label: t('onboarding.fieldName'), value: name.trim() || null },
    {
      label: t('onboarding.fieldInterests'),
      value: interestsAnswered
        ? interests.length
          ? interests.map((i) => getInterestLabel(lang, i)).join(', ')
          : t('onboarding.none')
        : null,
    },
    {
      label: t('onboarding.fieldLanguages'),
      value: languageIds.length
        ? languageIds
            .map((id) => `${getLanguage(id)?.flag ?? ''} ${getLanguageName(id, lang)}${levels[id] ? ` · ${levels[id]}` : ' · ?'}`)
            .join(', ')
        : null,
    },
  ];

  return (
    <div className="rounded-2xl bg-ink-50 p-4">
      <p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-ink-500">
        {t('onboarding.summaryTitle')}
      </p>
      <ul className="flex flex-col gap-2">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center gap-3 text-sm">
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                row.value ? 'bg-mint-500 text-white' : 'border-2 border-ink-300'
              }`}
            >
              {row.value && <Check size={12} strokeWidth={3} />}
            </span>
            <span className="w-32 shrink-0 font-bold text-ink-700">{row.label}</span>
            <span className={row.value ? 'font-semibold text-ink-950' : 'text-ink-300'}>
              {row.value ?? t('onboarding.pending')}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
