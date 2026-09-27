import { useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Check, Flame, Lock, Star, Trophy, Zap } from 'lucide-react';
import { useProfile } from '../ProfileContext';
import { LESSON_XP, REVIEW_XP, useProgress } from '../ProgressContext';
import { getLanguage } from '../data/languages';
import { buildLearningPath, type PathNode, type PathSection } from '../data/learningPath';
import { getLocalizedLevels } from '../i18n/languageCatalog';
import { useT } from '../i18n/I18nContext';
import WizardMascot from '../components/WizardMascot';

/** Un color por sección, como los mundos de Duolingo. */
const SECTION_COLORS = [
  'var(--color-mint-500)',
  'var(--color-brand-600)',
  'var(--color-violet-500)',
  'var(--color-coral-500)',
  'var(--color-amber-500)',
];

/** Desplazamiento horizontal (px) de cada nodo para dibujar el camino en zigzag. */
const ZIGZAG = [0, 48, 76, 48, 0, -48, -76, -48];

const shade = (color: string) => `color-mix(in srgb, ${color} 72%, black)`;

export default function SyllabusPicker() {
  const { courseId = '' } = useParams();
  const navigate = useNavigate();
  const { courses, profile } = useProfile();
  const { progress, isCompleted } = useProgress();
  const { t, lang } = useT();
  const course = courses.find((c) => c.id === courseId);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const currentRef = useRef<HTMLDivElement>(null);

  const startLevel = profile?.languages.find((l) => l.languageId === courseId)?.levelCode;
  const sections = useMemo(() => {
    const language = getLanguage(courseId);
    if (!language || !startLevel) return [];
    return buildLearningPath(courseId, getLocalizedLevels(language, lang), startLevel, isCompleted);
  }, [courseId, startLevel, lang, isCompleted]);

  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: 'center' });
  }, []);

  if (!course) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50 px-6 text-center">
        <div>
          <p className="text-ink-500">{t('syllabusPicker.courseNotFound')}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 rounded-2xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white"
          >
            {t('syllabusPicker.backToDashboard')}
          </button>
        </div>
      </div>
    );
  }

  const allDone = sections.length > 0 && sections.every((s) => s.nodes.every((n) => n.status === 'completed'));

  const startLesson = (node: PathNode) => {
    navigate(`/class/${courseId}`, {
      state: { topic: node.topic.title, topicId: node.topic.id, levelCode: node.levelCode },
    });
  };

  const closeOnBackground = (e: MouseEvent) => {
    if (!(e.target as HTMLElement).closest('[data-path-node]')) setSelectedId(null);
  };

  return (
    <div className="min-h-screen bg-white" onClick={closeOnBackground}>
      <header className="sticky top-0 z-20 border-b-2 border-ink-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex h-9 w-9 items-center justify-center rounded-full text-ink-500 transition hover:bg-ink-50 hover:text-ink-900"
              aria-label={t('syllabusPicker.backToDashboard')}
            >
              <ArrowLeft size={18} />
            </button>
            <span className="text-2xl">{course.flag}</span>
            <h1 className="text-sm font-extrabold text-ink-950">{course.language}</h1>
          </div>
          <div className="flex items-center gap-4 text-sm font-extrabold">
            <span
              className={`flex items-center gap-1 ${progress.streakDays > 0 ? 'text-amber-500' : 'text-ink-300'}`}
              title={t('nav.streak', { days: progress.streakDays })}
            >
              <Flame size={20} fill="currentColor" />
              {progress.streakDays}
            </span>
            <span className="flex items-center gap-1 text-brand-600" title="XP">
              <Zap size={20} fill="currentColor" />
              {progress.xp}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pb-24 pt-6">
        {sections.map((section, sectionIndex) => (
          <Section
            key={section.levelCode}
            section={section}
            index={sectionIndex}
            color={SECTION_COLORS[sectionIndex % SECTION_COLORS.length]}
            selectedId={selectedId}
            onSelect={(id) => setSelectedId((prev) => (prev === id ? null : id))}
            onStart={startLesson}
            currentRef={currentRef}
          />
        ))}

        {allDone && (
          <div className="mt-10 flex flex-col items-center text-center">
            <WizardMascot size={110} state="celebrate" />
            <p className="mt-2 text-lg font-extrabold text-ink-950">{t('path.allDone')}</p>
          </div>
        )}
      </main>
    </div>
  );
}

interface SectionProps {
  section: PathSection;
  index: number;
  color: string;
  selectedId: string | null;
  onSelect: (topicId: string) => void;
  onStart: (node: PathNode) => void;
  currentRef: React.RefObject<HTMLDivElement | null>;
}

function Section({ section, index, color, selectedId, onSelect, onStart, currentRef }: SectionProps) {
  const { t } = useT();
  const unlocked = section.nodes.some((n) => n.status !== 'locked');
  const bannerColor = unlocked ? color : 'var(--color-ink-300)';

  return (
    <section className="mb-12">
      <div
        className="flex items-center justify-between rounded-2xl px-5 py-4 text-white"
        style={{ background: bannerColor, boxShadow: `0 4px 0 0 ${shade(bannerColor)}` }}
      >
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wider text-white/80">
            {t('path.section', { n: index + 1 })} · {section.levelCode}
          </p>
          <h2 className="text-lg font-extrabold sm:text-xl">{section.levelLabel}</h2>
        </div>
        {unlocked ? <BookOpen size={28} /> : <Lock size={24} />}
      </div>

      <div className="relative mt-10 flex flex-col items-center gap-7">
        {section.nodes.map((node) => (
          <LevelNode
            key={node.topic.id}
            node={node}
            total={section.nodes.length}
            color={color}
            selected={selectedId === node.topic.id}
            onSelect={() => onSelect(node.topic.id)}
            onStart={() => onStart(node)}
            nodeRef={node.status === 'current' ? currentRef : undefined}
          />
        ))}
      </div>
    </section>
  );
}

interface LevelNodeProps {
  node: PathNode;
  total: number;
  color: string;
  selected: boolean;
  onSelect: () => void;
  onStart: () => void;
  nodeRef?: React.RefObject<HTMLDivElement | null>;
}

function LevelNode({ node, total, color, selected, onSelect, onStart, nodeRef }: LevelNodeProps) {
  const { t } = useT();
  const offset = ZIGZAG[node.indexInSection % ZIGZAG.length];
  const isLast = node.indexInSection === total - 1;
  const locked = node.status === 'locked';
  const fill = locked ? 'var(--color-ink-100)' : color;
  const Icon = isLast ? Trophy : node.status === 'completed' ? Check : node.status === 'current' ? Star : Lock;

  const buttonStyle: CSSProperties = {
    background: fill,
    boxShadow: `0 7px 0 0 ${locked ? 'var(--color-ink-300)' : shade(color)}`,
  };

  return (
    <div
      ref={nodeRef}
      data-path-node
      className={`relative flex flex-col items-center ${node.status === 'current' ? 'mt-6' : ''}`}
      style={{ transform: `translateX(${offset}px)`, zIndex: selected ? 30 : undefined }}
    >
      {node.status === 'current' && !selected && (
        <span
          className="animate-float absolute -top-11 z-10 whitespace-nowrap rounded-xl border-2 border-ink-100 bg-white px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide"
          style={{ color }}
        >
          {t('path.start')}
        </span>
      )}

      {node.status === 'current' && (
        <span
          className="pointer-events-none absolute -inset-2.5 rounded-full border-[6px] opacity-60"
          style={{ borderColor: `color-mix(in srgb, ${color} 35%, white)` }}
        />
      )}

      <button
        type="button"
        onClick={onSelect}
        aria-label={node.topic.title}
        style={buttonStyle}
        className="relative flex h-[70px] w-[70px] items-center justify-center rounded-full transition active:translate-y-1 active:!shadow-none"
      >
        <Icon
          size={32}
          strokeWidth={3}
          className={locked ? 'text-ink-300' : 'text-white'}
          fill={node.status === 'current' || (isLast && !locked) ? 'currentColor' : 'none'}
        />
      </button>

      {node.status === 'current' && (
        <div
          className="pointer-events-none absolute top-1/2 hidden -translate-y-1/2 sm:block"
          style={offset >= 0 ? { right: 'calc(100% + 28px)' } : { left: 'calc(100% + 28px)' }}
        >
          <WizardMascot size={96} />
        </div>
      )}

      {selected && (
        <div
          className="absolute top-[calc(100%+14px)] z-30 w-72 rounded-2xl p-4 text-white shadow-lg"
          style={{ background: locked ? 'var(--color-ink-50)' : color }}
        >
          <span
            className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45"
            style={{ background: locked ? 'var(--color-ink-50)' : color }}
          />
          <p className={`text-base font-extrabold ${locked ? 'text-ink-500' : ''}`}>{node.topic.title}</p>
          <p className={`mt-0.5 text-sm ${locked ? 'text-ink-300' : 'text-white/85'}`}>
            {node.topic.description}
          </p>
          <p className={`mt-2 text-xs font-bold ${locked ? 'text-ink-300' : 'text-white/80'}`}>
            {t('path.lessonOf', { n: node.indexInSection + 1, total })}
          </p>

          {locked ? (
            <p className="mt-3 rounded-xl bg-ink-100 px-3 py-2.5 text-center text-xs font-bold text-ink-500">
              {t('path.locked')}
            </p>
          ) : (
            <button
              type="button"
              onClick={onStart}
              style={{ ['--duo-shadow' as string]: 'var(--color-ink-100)', color }}
              className="duo-btn mt-3 w-full rounded-xl bg-white py-2.5 text-sm font-extrabold uppercase tracking-wide"
            >
              {node.status === 'completed'
                ? t('path.review', { xp: REVIEW_XP })
                : t('path.startXp', { xp: LESSON_XP })}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
