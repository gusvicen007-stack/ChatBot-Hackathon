import { weekActivityMinutes } from '../data/mockData';
import { getWeekDays } from '../i18n/translations';
import { useT } from '../i18n/I18nContext';

export default function WeeklyActivity() {
  const { t, lang } = useT();
  const days = getWeekDays(lang);
  const max = Math.max(...weekActivityMinutes, 30);

  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-5">
      <h3 className="mb-4 text-sm font-bold text-ink-950">{t('weeklyActivity.heading')}</h3>
      <div className="flex items-stretch justify-between gap-3" style={{ height: 100 }}>
        {weekActivityMinutes.map((minutes, i) => (
          <div key={days[i]} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-full w-full items-end">
              <div
                className={`w-full rounded-md ${minutes > 0 ? 'bg-brand-400' : 'bg-ink-50'}`}
                style={{ height: `${Math.max((minutes / max) * 100, 6)}%` }}
                title={`${minutes} min`}
              />
            </div>
            <span className="text-xs font-medium text-ink-500">{days[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
