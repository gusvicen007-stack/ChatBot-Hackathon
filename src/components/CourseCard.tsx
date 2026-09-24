import { useNavigate } from 'react-router-dom';
import { Play } from 'lucide-react';
import type { Course } from '../types';
import { useT } from '../i18n/I18nContext';

export default function CourseCard({ course }: { course: Course }) {
  const navigate = useNavigate();
  const { t } = useT();

  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-5 transition hover:shadow-lg hover:shadow-ink-950/5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{course.flag}</span>
          <div>
            <h3 className="font-bold text-ink-950">{course.language}</h3>
            <p className="text-xs text-ink-500">{course.level}</p>
          </div>
        </div>
        <span className="text-sm font-bold" style={{ color: course.color }}>
          {course.progress}%
        </span>
      </div>

      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-ink-50">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${course.progress}%`, background: course.color }}
        />
      </div>

      <p className="mt-2 text-xs text-ink-500">
        {t('courseCard.lessonsProgress', { done: course.lessonsDone, total: course.lessonsTotal })}
      </p>

      <p className="mt-3 line-clamp-1 text-sm text-ink-700">
        <span className="text-ink-500">{t('courseCard.next')} </span>
        {course.nextTopic}
      </p>

      <button
        onClick={() => navigate(`/class/${course.id}/syllabus`)}
        className="duo-btn mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 py-2.5 text-sm font-extrabold text-white transition hover:bg-brand-600/90"
      >
        <Play size={14} fill="currentColor" />
        {t('courseCard.startClass')}
      </button>
    </div>
  );
}
