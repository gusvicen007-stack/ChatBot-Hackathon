import { BookOpen, Sparkles, Volume2 } from 'lucide-react';
import { useT } from '../i18n/I18nContext';
import type { LiveCard } from '../voice/liveCoach';
import { speak } from '../voice/speak';

/** Tarjeta que aparece dentro del chat: corrección (bajo tu frase) o vocabulario (bajo la de Sabio). */
export default function LiveCardView({ card, languageId }: { card: LiveCard; languageId: string }) {
  const { t } = useT();

  if (card.kind === 'correction') {
    return (
      <div className="animate-card-pop ml-auto w-full max-w-sm rounded-2xl border-2 border-coral-500/30 bg-white p-4 shadow-sm">
        <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-coral-500">
          <Sparkles size={13} />
          {t(`coach.${card.issue}`)}
        </p>
        <p className="mt-2 text-sm text-ink-500">
          {t('coach.said')}: <span className="text-coral-500 line-through decoration-2">{card.said}</span>
        </p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="text-sm font-extrabold text-ink-950">
            {t('coach.better')}: <span className="text-mint-500">{card.better}</span>
          </p>
          <ListenButton text={card.better} languageId={languageId} />
        </div>
        {card.explanation && <p className="mt-2 text-sm leading-relaxed text-ink-700">{card.explanation}</p>}
      </div>
    );
  }

  return (
    <div className="animate-card-pop ml-12 w-full max-w-sm rounded-2xl border-2 border-brand-400/40 bg-white p-4 shadow-sm">
      <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-brand-600">
        <BookOpen size={13} />
        {card.wordKind ? t(`coach.kind.${card.wordKind}`) : t('coach.newWord')}
      </p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <div>
          <p className="text-base font-extrabold text-ink-950">{card.term}</p>
          {card.reading && <p className="text-xs font-semibold text-ink-500">{card.reading}</p>}
        </div>
        <ListenButton text={card.term} languageId={languageId} />
      </div>
      <p className="mt-1 text-sm text-ink-700">{card.meaning}</p>
      {card.example && <p className="mt-2 text-sm italic text-ink-500">{card.example}</p>}
      {card.note && <p className="mt-2 rounded-xl bg-amber-500/10 px-3 py-2 text-xs text-ink-700">{card.note}</p>}
    </div>
  );
}

function ListenButton({ text, languageId }: { text: string; languageId: string }) {
  const { t } = useT();
  return (
    <button
      type="button"
      onClick={() => speak(text, languageId)}
      aria-label={t('flashcards.listen')}
      title={t('flashcards.listen')}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-500 transition hover:bg-ink-50 hover:text-ink-900"
    >
      <Volume2 size={16} />
    </button>
  );
}
