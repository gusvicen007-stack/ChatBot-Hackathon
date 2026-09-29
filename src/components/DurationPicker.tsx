import { Timer } from 'lucide-react';
import { DURATION_OPTIONS } from '../data/lessonDuration';
import { useT } from '../i18n/I18nContext';

interface Props {
  value: number;
  onChange: (minutes: number) => void;
  /** 'onColor': dentro de una tarjeta de color (mapa). 'light': sobre fondo blanco. */
  variant?: 'onColor' | 'light';
  /** Color del texto de la opción elegida en la variante 'onColor'. */
  color?: string;
}

/** Tiempo de práctica de una lección o simulación: 5/10/15/20 min o libre. */
export default function DurationPicker({ value, onChange, variant = 'light', color }: Props) {
  const { t } = useT();
  const onColor = variant === 'onColor';
  return (
    <div>
      <p
        className={`flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider ${
          onColor ? 'text-white/85' : 'text-ink-500'
        }`}
      >
        <Timer size={13} />
        {t('timer.choose')}
      </p>
      <div className="mt-1.5 grid grid-cols-5 gap-1.5" role="radiogroup" aria-label={t('timer.choose')}>
        {DURATION_OPTIONS.map((option) => {
          const active = option === value;
          const look = onColor
            ? active
              ? 'bg-white shadow-sm'
              : 'bg-white/20 text-white hover:bg-white/30'
            : active
              ? 'border-2 border-brand-500 bg-brand-100 text-brand-700'
              : 'border-2 border-ink-100 text-ink-500 hover:border-ink-300';
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(option)}
              className={`rounded-lg py-1.5 text-xs font-extrabold transition ${look}`}
              style={onColor && active ? { color } : undefined}
            >
              {option === 0 ? t('timer.free') : t('timer.minutes', { n: option })}
            </button>
          );
        })}
      </div>
    </div>
  );
}
