import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Send, Mic, MicOff, Loader2, Languages, Flag, Flame, Zap, Clock, Layers, AlertCircle, Timer, Pause, Play, Plus, Check, Target } from 'lucide-react';
import { getTutorReplies } from '../i18n/translations';
import { useT } from '../i18n/I18nContext';
import { useProfile } from '../ProfileContext';
import { useProgress } from '../ProgressContext';
import type { ChatMessage } from '../types';
import WizardMascot from '../components/WizardMascot';
import Flashcards from '../components/Flashcards';
import LiveCardView from '../components/LiveCard';
import { useLiveCoach } from '../voice/liveCoach';
import { formatClock, useLessonTimer } from '../hooks/useLessonTimer';
import { loadPreferredMinutes } from '../data/lessonDuration';
import { getScenario, SCENARIO_BASE_XP, SCENARIO_GOAL_XP } from '../data/scenarios';
import { gloss } from '../data/flashcards';
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
  const { progress, completeLesson, completePractice } = useProgress();
  const lessonState = location.state as
    | { topic?: string; topicId?: string; levelCode?: string; minutes?: number; scenarioId?: string }
    | null;
  // Simulación: Sabio actúa un papel y el alumno cumple una misión.
  const scenario = getScenario(lessonState?.scenarioId);
  const topic = scenario ? gloss(scenario.title, lang) : (lessonState?.topic ?? course?.nextTopic);
  // Las simulaciones no marcan temas del mapa.
  const topicId = scenario ? null : (lessonState?.topicId ?? course?.nextTopicId ?? null);
  const tutorReplies = getTutorReplies(lang);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'tutor',
      text: scenario
        ? t('sim.welcome', { title: gloss(scenario.title, lang), description: gloss(scenario.description, lang) })
        : t('classRoom.welcomeMessage', {
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
  // Tiempo de práctica elegido en el mapa (0 = libre). Si se entra directo, el último usado.
  const [chosenMinutes] = useState(() => lessonState?.minutes ?? loadPreferredMinutes());
  const timer = useLessonTimer(chosenMinutes > 0 ? chosenMinutes : null);
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

  // Correcciones y vocabulario en vivo: aparecen como tarjetas dentro del chat.
  const [goalPrompts] = useState(() => scenario?.goals.map((g) => g.prompt));
  const coach = useLiveCoach({ targetLang, nativeLang, level: levelCode, goals: goalPrompts });
  const missionDone = !!scenario && scenario.goals.every((_, i) => coach.goalsDone.includes(i));

  const voice = useVoiceAgent({
    targetLang,
    nativeLang,
    level: levelCode,
    topic,
    scenario,
    onTranscript: ({ role, text }) => {
      const id = crypto.randomUUID();
      const who = role === 'tutor' ? 'tutor' : 'student';
      setMessages((prev) => [...prev, { id, role: who, text, timestamp: now() }]);
      coach.addTurn({ id, role: who, text }, lang);
    },
  });

  const voiceOn = voice.state !== 'idle' && voice.state !== 'error';

  // Se acabó el tiempo elegido: se cuelga la voz (no gasta créditos) y se
  // pregunta si terminar o seguir 5 minutos más.
  const { stop: stopVoice, start: startVoice } = voice;
  // El reloj arranca cuando el alumno empieza a practicar (voz conectada), no al abrir la página.
  const { start: startTimer } = timer;
  useEffect(() => {
    if (voice.state === 'listening' || voice.state === 'speaking') startTimer();
  }, [voice.state, startTimer]);

  /** ¿Sabio estaba hablando cuando se acabó el tiempo? Para reconectarlo con "5 minutos más". */
  const voiceAtTimeUp = useRef(false);
  useEffect(() => {
    if (timer.timeUp && voiceOn) {
      voiceAtTimeUp.current = true;
      stopVoice();
    }
  }, [timer.timeUp, voiceOn, stopVoice]);

  const addFiveMinutes = () => {
    timer.addMinutes(5);
    if (voiceAtTimeUp.current) {
      voiceAtTimeUp.current = false;
      void startVoice(); // desde el clic: retoma la charla donde iba
    }
  };

  // Cada sesión de voz dura máximo 5 min (límite del servidor). En una lección
  // con tiempo elegido, si aún queda tiempo, se reconecta sola y sigue donde iba.
  useEffect(() => {
    if (voice.ended && timer.limitMs !== null && timer.running) void startVoice();
  }, [voice.ended, timer.limitMs, timer.running, startVoice]);

  const togglePause = () => {
    if (!timer.started) {
      timer.start();
    } else if (timer.paused) {
      timer.resume();
    } else {
      timer.pause();
      if (voiceOn) voice.stop(); // en pausa no se habla con Sabio (ni se gastan créditos)
    }
  };

  const lastMinute = timer.remainingMs !== null && timer.remainingMs > 0 && timer.remainingMs <= 60_000;

  const headerState =
    voice.state === 'thinking' || isTyping
      ? 'thinking'
      : voice.state === 'speaking' || celebrating
        ? 'celebrate'
        : 'idle';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, coach.cards.length]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;

    const id = crypto.randomUUID();
    setMessages((prev) => [...prev, { id, role: 'student', text, timestamp: now() }]);
    setInput('');
    timer.start();
    // Lo escrito también se corrige (con o sin voz).
    coach.addTurn({ id, role: 'student', text }, lang);

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
    const minutes = Math.max(1, Math.round(timer.elapsedMs / 60000));
    const xp = scenario
      ? completePractice({ minutes, xp: SCENARIO_BASE_XP + SCENARIO_GOAL_XP * coach.goalsDone.length })
      : topicId
        ? completeLesson({ topicId, minutes })
        : 0;
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
                {scenario
                  ? `${scenario.emoji} ${gloss(scenario.title, lang)}`
                  : `${t('classRoom.headerTitle', { language: course.language })} ${course.flag}`}
              </h1>
              <p className="text-xs text-ink-500">{course.level}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={togglePause}
            title={timer.paused ? t('timer.resume') : t('timer.pause')}
            aria-label={`${t('timer.choose')}: ${formatClock(timer.remainingMs ?? timer.elapsedMs)}. ${
              timer.paused ? t('timer.resume') : t('timer.pause')
            }`}
            className={`flex items-center gap-1.5 rounded-xl border-2 px-3 py-1.5 text-xs font-extrabold tabular-nums transition ${
              timer.paused
                ? 'border-amber-500 bg-amber-500/10 text-ink-700'
                : lastMinute
                  ? 'border-coral-500 bg-coral-500/10 text-coral-500'
                  : 'border-ink-100 text-ink-700 hover:border-ink-300'
            }`}
          >
            {timer.paused || !timer.started ? <Play size={14} /> : <Timer size={14} />}
            {formatClock(timer.remainingMs ?? timer.elapsedMs)}
            {!timer.paused && <Pause size={12} className="hidden text-ink-300 sm:block" />}
          </button>
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
            {coach.cards.length > 0 && (
              <span className="rounded-full bg-coral-500 px-1.5 py-0.5 text-[10px] leading-none text-white">
                {coach.cards.length}
              </span>
            )}
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
      {timer.limitMs !== null && (
        <div className="h-1 w-full bg-ink-100">
          <div
            className={`h-full transition-[width] duration-300 ${lastMinute ? 'bg-coral-500' : 'bg-mint-500'}`}
            style={{ width: `${(timer.elapsedMs / timer.limitMs) * 100}%` }}
          />
        </div>
      )}

      {timer.timeUp && !result && (
        <TimeUp
          minutes={Math.round(timer.elapsedMs / 60000)}
          onFinish={finishLesson}
          onMore={addFiveMinutes}
        />
      )}

      {result && (
        <LessonComplete
          title={scenario ? t('sim.complete') : undefined}
          xp={result.xp}
          minutes={result.minutes}
          streakDays={progress.streakDays}
          onContinue={() => navigate(`/class/${course.id}/syllabus`)}
        />
      )}

      <div className="flex min-h-0 flex-1">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-hidden px-4">
        <div className="flex-1 overflow-y-auto py-6">
          {scenario ? (
            <div className="sticky top-0 z-10 mb-6 rounded-2xl border-2 border-violet-500/30 bg-white/95 p-4 shadow-sm backdrop-blur">
              <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-violet-500">
                <Target size={13} />
                {t('sim.mission')} · {coach.goalsDone.length}/{scenario.goals.length}
              </p>
              <ul className="mt-2 flex flex-col gap-1.5">
                {scenario.goals.map((goal, i) => {
                  const done = coach.goalsDone.includes(i);
                  return (
                    <li key={goal.prompt}>
                      <button
                        type="button"
                        onClick={() => coach.toggleGoal(i)}
                        aria-pressed={done}
                        className="flex w-full items-center gap-2 text-left text-sm"
                      >
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                            done ? 'bg-mint-500 text-white' : 'border-2 border-ink-300'
                          }`}
                        >
                          {done && <Check size={12} strokeWidth={3} />}
                        </span>
                        <span className={done ? 'text-ink-500 line-through' : 'font-semibold text-ink-900'}>
                          {gloss(goal.label, lang)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              {missionDone && (
                <p className="mt-3 rounded-xl bg-mint-500/10 px-3 py-2 text-xs font-bold text-mint-500">
                  {t('sim.missionDone')}
                </p>
              )}
            </div>
          ) : (
            <div className="mb-6 flex items-center justify-center">
              <span className="rounded-full bg-ink-100 px-3 py-1 text-xs font-medium text-ink-500">
                {t('classRoom.todaysTopic', { topic: topic ?? '' })}
              </span>
            </div>
          )}

          <div className="flex flex-col gap-4">
            {messages.map((m, i) => (
              <div key={m.id} className="flex flex-col gap-2">
                <ChatBubble message={m} celebrate={celebrating && i === messages.length - 1} />
                {coach.cards
                  .filter((c) => c.afterId === m.id)
                  .map((c) => (
                    <LiveCardView key={c.id} card={c} languageId={targetLang} />
                  ))}
              </div>
            ))}
            {isTyping && <TypingBubble />}
          </div>
          <div ref={bottomRef} />
        </div>

        {(lastMinute || timer.paused) && !voice.error && (
          <p
            role="status"
            className="mb-2 flex items-center gap-2 rounded-xl bg-amber-500/10 px-3 py-2 text-xs font-semibold text-ink-700"
          >
            <Timer size={14} className="shrink-0 text-amber-500" />
            {timer.paused ? t('timer.pausedNotice') : t('timer.oneMinute')}
          </p>
        )}

        {(voice.error || (voice.ended && timer.limitMs === null)) && (
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
            liveCards={coach.cards}
            theme={scenario?.theme}
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
  title,
  xp,
  minutes,
  streakDays,
  onContinue,
}: {
  title?: string;
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
        <h2 className="mt-4 text-2xl font-extrabold text-amber-500">{title ?? t('classRoom.lessonComplete')}</h2>

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

function TimeUp({ minutes, onFinish, onMore }: { minutes: number; onFinish: () => void; onMore: () => void }) {
  const { t } = useT();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/40 px-6">
      <div role="dialog" aria-modal="true" className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
        <WizardMascot size={110} state="celebrate" className="mx-auto" />
        <h2 className="mt-2 text-xl font-extrabold text-ink-950">{t('timer.timeUp')}</h2>
        <p className="mt-1 text-sm text-ink-500">{t('timer.practiced', { minutes: Math.max(1, minutes) })}</p>
        <button
          type="button"
          onClick={onFinish}
          style={{ ['--duo-shadow' as string]: 'color-mix(in srgb, var(--color-mint-500) 72%, black)' }}
          className="duo-btn mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-mint-500 py-3 text-sm font-extrabold uppercase tracking-wide text-white"
        >
          <Flag size={15} />
          {t('timer.finish')}
        </button>
        <button
          type="button"
          onClick={onMore}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-2xl py-2.5 text-sm font-extrabold text-brand-600 transition hover:bg-brand-100"
        >
          <Plus size={15} />
          {t('timer.more')}
        </button>
      </div>
    </div>
  );
}
