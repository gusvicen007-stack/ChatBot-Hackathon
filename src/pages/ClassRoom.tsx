import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Send, Mic, MicOff, Loader2, Languages, Flag, Flame, Zap, Clock, Layers, AlertCircle } from 'lucide-react';
import { getTutorReplies } from '../i18n/translations';
import { useT } from '../i18n/I18nContext';
import { useProfile } from '../ProfileContext';
import { useProgress } from '../ProgressContext';
import type { ChatMessage } from '../types';
import WizardMascot from '../components/WizardMascot';
import Flashcards from '../components/Flashcards';
import { useVoiceAgent } from '../voice/useVoiceAgent';
import { canSpeak } from '../voice/agentConfig';

function now() {
  return new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export default function ClassRoom() {
  const { courseId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { courses, profile } = useProfile();
  const { t, lang } = useT();
  const course = courses.find((c) => c.id === courseId) ?? courses[0];
  const { progress, completeLesson } = useProgress();
  const lessonState = location.state as { topic?: string; topicId?: string; levelCode?: string } | null;
  const topic = lessonState?.topic ?? course?.nextTopic;
  const topicId = lessonState?.topicId ?? course?.nextTopicId ?? null;
  const tutorReplies = getTutorReplies(lang);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'tutor',
      text: t('classRoom.welcomeMessage', {
        language: course?.language ?? '',
        topic: topic ?? '',
        languageLower: course?.language.toLowerCase() ?? '',
      }),
      timestamp: now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [startedAt] = useState(() => Date.now());
  const [result, setResult] = useState<{ xp: number; minutes: number } | null>(null);
  const [showCards, setShowCards] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const replyIndex = useRef(0);
  // course.id ES el id del idioma ('en', 'fr', 'de'...). El idioma nativo
  // del alumno es el que eligio como idioma de interfaz al registrarse.
  const targetLang = course?.id ?? 'en';
  const nativeLang = profile?.uiLanguage ?? 'en';
  const levelCode =
    lessonState?.levelCode ??
    course?.levelCode ??
    profile?.languages.find((l) => l.languageId === targetLang)?.levelCode ??
    'A2';
  const speakable = canSpeak(targetLang);
  // "Ayuda" cambia a la voz del idioma del alumno: solo si esa voz existe
  // (el japonés no tiene) y es distinta del idioma de la clase.
  const canRescue = canSpeak(nativeLang) && nativeLang !== targetLang;

  const voice = useVoiceAgent({
    targetLang,
    nativeLang,
    level: levelCode,
    topic,
    onTranscript: ({ role, text }) =>
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: role === 'tutor' ? 'tutor' : 'student', text, timestamp: now() },
      ]),
  });

  const voiceOn = voice.state !== 'idle' && voice.state !== 'error';

  const headerState =
    voice.state === 'thinking' || isTyping
      ? 'thinking'
      : voice.state === 'speaking' || celebrating
        ? 'celebrate'
        : 'idle';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;

    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: 'student', text, timestamp: now() },
    ]);
    setInput('');

    // Con la voz activa, lo escrito va a Sabio de verdad (antes caía en las
    // respuestas de ejemplo aunque el tutor estuviera conectado).
    if (voiceOn && voice.sendText(text)) return;

    setIsTyping(true);

    setTimeout(
      () => {
        const reply = tutorReplies[replyIndex.current % tutorReplies.length];
        replyIndex.current += 1;
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: 'tutor', text: reply, timestamp: now() },
        ]);
        setIsTyping(false);
        setCelebrating(true);
        setTimeout(() => setCelebrating(false), 1400);
      },
      900 + Math.random() * 600,
    );
  };

  /** Desde una flashcard: le pide a Sabio practicar esa expresión. */
  const practiceTerm = (term: string) => {
    const sent = voice.sendText(
      `I want to practice the expression "${term}". Use it in a short example and ask me a question so I have to use it.`,
      { record: false },
    );
    if (!sent) return;
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: 'student', text: t('flashcards.practiceBubble', { term }), timestamp: now() },
    ]);
  };

  const finishLesson = () => {
    if (voiceOn) voice.stop();
    const minutes = Math.max(1, Math.round((Date.now() - startedAt) / 60000));
    const xp = topicId ? completeLesson({ topicId, minutes }) : 0;
    setResult({ xp, minutes });
  };

  if (!course) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50 px-6 text-center">
        <div>
          <p className="text-ink-500">{t('classRoom.courseNotFound')}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 rounded-2xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white"
          >
            {t('classRoom.backToDashboard')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-ink-50">
      <header className="flex items-center justify-between border-b border-ink-100 bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/class/${course.id}/syllabus`)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-500 transition hover:bg-ink-50 hover:text-ink-900"
            aria-label={t('classRoom.backToDashboard')}
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <WizardMascot size={44} state={headerState} />
            <div>
              <h1 className="text-sm font-bold text-ink-950">
                {t('classRoom.headerTitle', { language: course.language })} {course.flag}
              </h1>
              <p className="text-xs text-ink-500">{course.level}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCards((v) => !v)}
            aria-pressed={showCards}
            className={`flex items-center gap-1.5 rounded-xl border-2 px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide transition ${
              showCards
                ? 'border-brand-500 bg-brand-100 text-brand-700'
                : 'border-ink-100 text-ink-500 hover:border-ink-300 hover:text-ink-900'
            }`}
          >
            <Layers size={14} />
            <span className="hidden sm:inline">{t('classRoom.flashcards')}</span>
          </button>
        <div className="hidden items-center gap-1.5 rounded-full bg-mint-500/10 px-3 py-1 text-xs font-semibold text-mint-500 sm:flex">
          <span
            className={`h-1.5 w-1.5 rounded-full bg-mint-500 ${voiceOn ? 'animate-pulse' : ''}`}
          />
          {voice.error
            ? voice.error
            : voice.state === 'listening'
              ? t('voice.listening')
              : voice.state === 'thinking'
                ? t('voice.thinking')
                : voice.state === 'speaking'
                  ? t('voice.speaking')
                  : voice.state === 'connecting'
                    ? t('voice.connecting')
                    : t('classRoom.tutorOnline')}
        </div>
          <button
            type="button"
            onClick={finishLesson}
            style={{ ['--duo-shadow' as string]: 'color-mix(in srgb, var(--color-mint-500) 72%, black)' }}
            className="duo-btn flex items-center gap-1.5 rounded-xl bg-mint-500 px-3 py-2 text-xs font-extrabold uppercase tracking-wide text-white"
          >
            <Flag size={14} />
            {t('classRoom.finish')}
          </button>
        </div>
      </header>

      {result && (
        <LessonComplete
          xp={result.xp}
          minutes={result.minutes}
          streakDays={progress.streakDays}
          onContinue={() => navigate(`/class/${course.id}/syllabus`)}
        />
      )}

      <div className="flex min-h-0 flex-1">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-hidden px-4">
        <div className="flex-1 overflow-y-auto py-6">
          <div className="mb-6 flex items-center justify-center">
            <span className="rounded-full bg-ink-100 px-3 py-1 text-xs font-medium text-ink-500">
              {t('classRoom.todaysTopic', { topic: topic ?? '' })}
            </span>
          </div>

          <div className="flex flex-col gap-4">
            {messages.map((m, i) => (
              <ChatBubble
                key={m.id}
                message={m}
                celebrate={celebrating && i === messages.length - 1}
              />
            ))}
            {isTyping && <TypingBubble />}
          </div>
          <div ref={bottomRef} />
        </div>

        {(voice.error || voice.ended) && (
          <p
            role="status"
            className={`mb-2 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold ${
              voice.error ? 'bg-coral-500/10 text-coral-500' : 'bg-amber-500/10 text-ink-700'
            }`}
          >
            <AlertCircle size={14} className="shrink-0" />
            {voice.error ?? t('classRoom.sessionEnded')}
          </p>
        )}

        <form
          onSubmit={handleSubmit}
          className="mb-6 flex items-center gap-2 rounded-2xl border border-ink-100 bg-white p-2 shadow-sm"
        >
          <button
            type="button"
            onClick={voiceOn ? voice.stop : voice.start}
            disabled={!speakable || voice.state === 'connecting'}
            title={speakable ? undefined : t('classRoom.noVoice')}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition disabled:opacity-40 ${
              voiceOn
                ? 'bg-coral-500 text-white'
                : 'text-ink-500 hover:bg-ink-50'
            }`}
            aria-label={t('classRoom.micLabel')}
          >
            {voice.state === 'connecting' ? (
              <Loader2 size={18} className="animate-spin" />
            ) : voiceOn ? (
              <MicOff size={18} />
            ) : (
              <Mic size={18} />
            )}
          </button>
          {voiceOn && canRescue && (
            <button
              type="button"
              onClick={() => voice.rescue(voice.activeLang !== targetLang)}
              className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold text-ink-500 transition hover:bg-ink-50"
              title={t('classRoom.helpTitle')}
            >
              <Languages size={16} />
              {voice.activeLang !== targetLang ? t('classRoom.helpBack') : t('classRoom.help')}
            </button>
          )}
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('classRoom.inputPlaceholder', {
              languageLower: course.language.toLowerCase(),
            })}
            className="flex-1 bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-300"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="duo-btn flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white transition disabled:opacity-40 disabled:shadow-none"
            aria-label={t('classRoom.sendLabel')}
          >
            <Send size={16} />
          </button>
        </form>
      </div>

      {showCards && (
        // Escritorio: panel a la derecha. Celular: ocupa la pantalla (encima del chat).
        <div className="fixed inset-0 z-40 lg:static lg:z-auto lg:w-96 lg:shrink-0 lg:border-l lg:border-ink-100">
          <Flashcards
            languageId={targetLang}
            topic={topic}
            levelCode={levelCode}
            onClose={() => setShowCards(false)}
            onPractice={voiceOn ? practiceTerm : undefined}
          />
        </div>
      )}
      </div>
    </div>
  );
}

function ChatBubble({ message, celebrate = false }: { message: ChatMessage; celebrate?: boolean }) {
  const isTutor = message.role === 'tutor';
  return (
    <div className={`flex items-end gap-2 ${isTutor ? '' : 'flex-row-reverse'}`}>
      {isTutor && (
        <WizardMascot size={38} className="shrink-0" state={celebrate ? 'celebrate' : 'idle'} />
      )}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isTutor
            ? 'rounded-bl-sm bg-white text-ink-900 border border-ink-100'
            : 'rounded-br-sm bg-brand-600 text-white'
        }`}
      >
        {message.text}
        <div className={`mt-1 text-[10px] ${isTutor ? 'text-ink-300' : 'text-white/60'}`}>
          {message.timestamp}
        </div>
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex items-end gap-2">
      <WizardMascot size={38} className="shrink-0" state="thinking" />
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-ink-100 bg-white px-4 py-3">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-300 [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-300 [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-300" />
      </div>
    </div>
  );
}

function LessonComplete({
  xp,
  minutes,
  streakDays,
  onContinue,
}: {
  xp: number;
  minutes: number;
  streakDays: number;
  onContinue: () => void;
}) {
  const { t } = useT();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white px-6">
      <div className="flex w-full max-w-sm flex-col items-center text-center">
        <WizardMascot size={150} state="celebrate" />
        <h2 className="mt-4 text-2xl font-extrabold text-amber-500">{t('classRoom.lessonComplete')}</h2>

        <div className="mt-6 grid w-full grid-cols-3 gap-3">
          <Stat color="var(--color-brand-600)" icon={<Zap size={18} fill="currentColor" />} label="XP" value={`+${xp}`} />
          <Stat
            color="var(--color-amber-500)"
            icon={<Flame size={18} fill="currentColor" />}
            label={t('classRoom.streakLabel')}
            value={String(streakDays)}
          />
          <Stat color="var(--color-mint-500)" icon={<Clock size={18} />} label={t('classRoom.timeLabel')} value={`${minutes} min`} />
        </div>

        <button
          type="button"
          onClick={onContinue}
          className="duo-btn mt-8 w-full rounded-2xl bg-brand-600 py-3.5 text-sm font-extrabold uppercase tracking-wide text-white"
        >
          {t('classRoom.continue')}
        </button>
      </div>
    </div>
  );
}

function Stat({ color, icon, label, value }: { color: string; icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border-2" style={{ borderColor: color, background: color }}>
      <p className="py-1 text-[11px] font-extrabold uppercase tracking-wide text-white">{label}</p>
      <p className="flex items-center justify-center gap-1 rounded-t-xl bg-white py-2.5 text-base font-extrabold" style={{ color }}>
        {icon}
        {value}
      </p>
    </div>
  );
}
