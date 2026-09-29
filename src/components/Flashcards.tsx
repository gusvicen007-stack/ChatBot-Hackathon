import { useMemo, useState } from 'react';
import { Lightbulb, MessageCircle, RotateCcw, Volume2, X } from 'lucide-react';
import { getDeck, gloss, THEMES, themeForTopic, type Flashcard, type Theme } from '../data/flashcards';
import { speak } from '../voice/speak';
import type { LiveCard } from '../voice/liveCoach';
import { useT } from '../i18n/I18nContext';

interface Props {
  languageId: string;
  topic?: string;
  levelCode: string;
  onClose: () => void;
  /** Si el tutor de voz está activo: le pide practicar esta expresión. */
  onPractice?: (term: string) => void;
  /** Tarjetas que salieron en esta clase (correcciones y vocabulario del tutor). */
  liveCards?: LiveCard[];
  /** Mazo inicial fijo (simulaciones); si no, se deduce del tema de la clase. */
  theme?: Theme;
}

/** Las tarjetas de la clase, en el formato del mazo para repasarlas volteándolas. */
function toFlashcard(card: LiveCard): Flashcard {
  if (card.kind === 'correction') {
    const why = { es: card.explanation, en: card.explanation };
    return { term: card.better, meaning: why, example: '', wrong: card.said };
  }
  return {
    term: card.term,
    reading: card.reading,
    meaning: { es: card.meaning, en: card.meaning },
    example: card.example ?? '',
    tip: card.note ? { es: card.note, en: card.note } : undefined,
  };
}

export default function Flashcards({ languageId, topic, levelCode, onClose, onPractice, liveCards = [], theme: fixedTheme }: Props) {
  const { t, lang } = useT();
  const deck = getDeck(languageId);
  const [tab, setTab] = useState<'live' | 'vocab' | 'tips'>(liveCards.length ? 'live' : 'vocab');
  const classDeck = useMemo(() => liveCards.map(toFlashcard), [liveCards]);
  const [theme, setTheme] = useState<Theme>(() => fixedTheme ?? themeForTopic(topic, levelCode));

  return (
    <aside className="flex h-full w-full flex-col bg-white">
      <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
        <h2 className="text-sm font-extrabold text-ink-950">{t('flashcards.title')}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('flashcards.close')}
          className="flex h-8 w-8 items-center justify-center rounded-full text-ink-500 transition hover:bg-ink-50 hover:text-ink-900"
        >
          <X size={18} />
        </button>
      </div>

      {!deck ? (
        <p className="p-6 text-center text-sm text-ink-500">{t('flashcards.unavailable')}</p>
      ) : (
        <>
          <div className="flex gap-1 border-b border-ink-100 px-4 pt-2">
            {(['live', 'vocab', 'tips'] as const).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`-mb-px border-b-2 px-3 py-2 text-xs font-extrabold uppercase tracking-wide transition ${
                  tab === id ? 'border-brand-600 text-brand-600' : 'border-transparent text-ink-500 hover:text-ink-900'
                }`}
              >
                {t(`flashcards.${id}`)}
                {id === 'live' && liveCards.length > 0 && (
                  <span className="ml-1.5 rounded-full bg-coral-500 px-1.5 py-0.5 text-[10px] text-white">
                    {liveCards.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {tab === 'live' ? (
            classDeck.length === 0 ? (
              <p className="p-6 text-center text-sm leading-relaxed text-ink-500">{t('flashcards.liveEmpty')}</p>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col pt-3">
                {/* key: si llegan tarjetas nuevas, el mazo se rehace con todas */}
                <CardDeck key={classDeck.length} cards={classDeck} languageId={languageId} uiLang={lang} onPractice={onPractice} />
              </div>
            )
          ) : tab === 'vocab' ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex gap-2 overflow-x-auto px-4 py-3">
                {THEMES.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTheme(id)}
                    className={`shrink-0 rounded-full border-2 px-3 py-1 text-xs font-bold transition ${
                      theme === id
                        ? 'border-brand-500 bg-brand-100 text-brand-700'
                        : 'border-ink-100 text-ink-500 hover:border-ink-300'
                    }`}
                  >
                    {t(`flashcards.theme.${id}`)}
                  </button>
                ))}
              </div>
              {/* key: al cambiar de tema el mazo arranca de cero */}
              <CardDeck
                key={theme}
                cards={deck.cards[theme]}
                languageId={languageId}
                uiLang={lang}
                onPractice={onPractice}
              />
            </div>
          ) : (
            <ul className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
              {deck.tips.map((tip) => (
                <li key={tip.title.en} className="rounded-2xl border-2 border-ink-100 p-4">
                  <p className="flex items-center gap-2 text-sm font-extrabold text-ink-950">
                    <Lightbulb size={16} className="shrink-0 text-amber-500" />
                    {gloss(tip.title, lang)}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-700">{gloss(tip.body, lang)}</p>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </aside>
  );
}

interface DeckProps {
  cards: Flashcard[];
  languageId: string;
  uiLang: string;
  onPractice?: (term: string) => void;
}

function CardDeck({ cards, languageId, uiLang, onPractice }: DeckProps) {
  const { t } = useT();
  const initialQueue = useMemo(() => cards.map((_, i) => i), [cards]);
  const [queue, setQueue] = useState(initialQueue);
  const [known, setKnown] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const restart = () => {
    setQueue(initialQueue);
    setKnown(0);
    setFlipped(false);
  };

  if (queue.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-3xl">🎉</p>
        <p className="text-base font-extrabold text-ink-950">{t('flashcards.done')}</p>
        <p className="text-sm text-ink-500">{t('flashcards.score', { known, total: cards.length })}</p>
        <button
          type="button"
          onClick={restart}
          className="duo-btn mt-2 flex items-center gap-2 rounded-2xl bg-brand-600 px-5 py-2.5 text-sm font-extrabold text-white"
        >
          <RotateCcw size={15} />
          {t('flashcards.restart')}
        </button>
      </div>
    );
  }

  const current = cards[queue[0]];
  const answered = cards.length - queue.length;

  const next = (knewIt: boolean) => {
    setFlipped(false);
    if (knewIt) setKnown((k) => k + 1);
    // "Otra vez" manda la tarjeta al final del mazo para repasarla.
    setQueue(([head, ...rest]) => (knewIt ? rest : [...rest, head]));
  };

  return (
    <div className="flex flex-1 flex-col px-4 pb-4">
      <div className="mb-3 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-50">
          <div
            className="h-full rounded-full bg-mint-500 transition-all"
            style={{ width: `${(answered / cards.length) * 100}%` }}
          />
        </div>
        <span className="text-xs font-bold text-ink-500">
          {answered}/{cards.length}
        </span>
      </div>

      <div className="relative min-h-64 flex-1" style={{ perspective: 1000 }}>
        <button
          type="button"
          onClick={() => setFlipped((f) => !f)}
          className="absolute inset-0 w-full text-left transition-transform duration-500"
          style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'none' }}
        >
          {/* Frente: la palabra */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl border-2 border-ink-100 bg-white p-5 text-center shadow-sm"
            style={{ backfaceVisibility: 'hidden' }}
          >
            {current.wrong && (
              <p className="mb-2 text-sm text-coral-500 line-through decoration-2">{current.wrong}</p>
            )}
            <p className="text-2xl font-extrabold text-ink-950">{current.term}</p>
            {current.reading && <p className="mt-1 text-sm font-semibold text-ink-500">{current.reading}</p>}
            <p className="absolute bottom-4 text-xs text-ink-300">{t('flashcards.tapToFlip')}</p>
          </div>

          {/* Reverso: significado, ejemplo y tip */}
          <div
            className="absolute inset-0 flex flex-col justify-center gap-3 overflow-y-auto rounded-3xl border-2 border-brand-400 bg-brand-100/40 p-5"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <p className="text-center text-lg font-extrabold text-ink-950">{gloss(current.meaning, uiLang)}</p>
            {current.example && (
              <div className="rounded-2xl bg-white p-3">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-ink-500">
                  {t('flashcards.example')}
                </p>
                <p className="mt-1 text-sm italic text-ink-900">{current.example}</p>
              </div>
            )}
            {current.tip && (
              <div className="flex gap-2 rounded-2xl bg-amber-500/10 p-3 text-sm text-ink-900">
                <Lightbulb size={16} className="mt-0.5 shrink-0 text-amber-500" />
                <span>{gloss(current.tip, uiLang)}</span>
              </div>
            )}
          </div>
        </button>
      </div>

      <div className="mt-3 flex justify-center gap-2">
        <button
          type="button"
          onClick={() => speak(flipped && current.example ? current.example : current.term, languageId)}
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-ink-500 transition hover:bg-ink-50 hover:text-ink-900"
        >
          <Volume2 size={15} />
          {t('flashcards.listen')}
        </button>
        {onPractice && (
          <button
            type="button"
            onClick={() => onPractice(current.term)}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-brand-600 transition hover:bg-brand-100"
          >
            <MessageCircle size={15} />
            {t('flashcards.practice')}
          </button>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => next(false)}
          style={{ ['--duo-shadow' as string]: 'var(--color-ink-100)' }}
          className="duo-btn rounded-2xl border-2 border-ink-100 bg-white py-3 text-sm font-extrabold text-coral-500"
        >
          {t('flashcards.again')}
        </button>
        <button
          type="button"
          onClick={() => next(true)}
          style={{ ['--duo-shadow' as string]: 'color-mix(in srgb, var(--color-mint-500) 72%, black)' }}
          className="duo-btn rounded-2xl bg-mint-500 py-3 text-sm font-extrabold text-white"
        >
          {t('flashcards.know')}
        </button>
      </div>
    </div>
  );
}
