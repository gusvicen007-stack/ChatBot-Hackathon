import { useNavigate } from 'react-router-dom';
import { Trophy, Clock, Target, ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import CourseCard from '../components/CourseCard';
import WeeklyActivity from '../components/WeeklyActivity';
import WizardMascot from '../components/WizardMascot';
import { student } from '../data/mockData';
import { useProfile } from '../ProfileContext';
import { useT } from '../i18n/I18nContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile, courses } = useProfile();
  const { t } = useT();
  const goalPct = Math.min(
    Math.round((student.weeklyMinutesDone / student.weeklyGoalMinutes) * 100),
    100,
  );

  return (
    <div className="min-h-screen bg-ink-50">
      <Navbar />

      <main className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="text-2xl font-extrabold text-ink-950">
          {t('dashboard.greeting', { name: profile?.name || student.name })}
        </h1>
        <p className="mt-1 text-sm text-ink-500">{t('dashboard.subtitle')}</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-2xl border border-ink-100 bg-white p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
              <Trophy size={18} />
            </div>
            <div>
              <p className="text-lg font-bold text-ink-950">{student.xp.toLocaleString()} XP</p>
              <p className="text-xs text-ink-500">{t('dashboard.totalPoints')}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-ink-100 bg-white p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint-500/10 text-mint-500">
              <Clock size={18} />
            </div>
            <div>
              <p className="text-lg font-bold text-ink-950">
                {t('dashboard.weeklyMinutes', {
                  done: student.weeklyMinutesDone,
                  goal: student.weeklyGoalMinutes,
                })}
              </p>
              <p className="text-xs text-ink-500">
                {t('dashboard.weeklyGoal', { percent: goalPct })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-ink-100 bg-white p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
              <Target size={18} />
            </div>
            <div>
              <p className="text-lg font-bold text-ink-950">
                {t('dashboard.languagesCount', { count: courses.length })}
              </p>
              <p className="text-xs text-ink-500">{t('dashboard.inProgress')}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col items-start justify-between gap-4 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-400 p-6 text-white sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <WizardMascot size={72} className="-my-2 shrink-0 drop-shadow" />
            <div>
              <h2 className="font-extrabold">{t('dashboard.tutorCalloutTitle')}</h2>
              <p className="text-sm text-white/80">{t('dashboard.tutorCalloutBody')}</p>
            </div>
          </div>
          {courses[0] && (
            <button
              onClick={() => navigate(`/class/${courses[0].id}/syllabus`)}
              style={{ ['--duo-shadow' as string]: 'var(--color-ink-100)' }}
              className="duo-btn flex items-center gap-2 whitespace-nowrap rounded-2xl bg-white px-5 py-2.5 text-sm font-extrabold text-brand-600 transition hover:bg-white/90"
            >
              {t('dashboard.startClassNow')}
              <ArrowRight size={16} />
            </button>
          )}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="mb-3 text-sm font-bold text-ink-950">{t('dashboard.yourCourses')}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-bold text-ink-950">{t('dashboard.statistics')}</h2>
            <WeeklyActivity />
          </div>
        </div>
      </main>
    </div>
  );
}
