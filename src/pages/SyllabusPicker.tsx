import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { useProfile } from '../ProfileContext';
import { getTopics } from '../data/syllabus';
import { useT } from '../i18n/I18nContext';
import WizardMascot from '../components/WizardMascot';

export default function SyllabusPicker() {
  const { courseId = '' } = useParams();
  const navigate = useNavigate();
  const { courses } = useProfile();
  const { t } = useT();
  const course = courses.find((c) => c.id === courseId);

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

  const levelCode = course.level.split(' ')[0];
  const topics = getTopics(courseId, levelCode);

  const startClass = (topicTitle: string) => {
    navigate(`/class/${courseId}`, { state: { topic: topicTitle } });
  };

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="flex items-center gap-3 border-b border-ink-100 bg-white px-6 py-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex h-9 w-9 items-center justify-center rounded-full text-ink-500 transition hover:bg-ink-50 hover:text-ink-900"
          aria-label={t('syllabusPicker.backToDashboard')}
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{course.flag}</span>
          <div>
            <h1 className="text-sm font-bold text-ink-950">
              {t('syllabusPicker.heading', { language: course.language })}
            </h1>
            <p className="text-xs text-ink-500">{course.level}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-8">
        <div className="mb-6 flex items-center gap-3 rounded-3xl bg-white p-5">
          <WizardMascot size={68} className="shrink-0" />
          <p className="text-sm font-semibold text-ink-900">{t('syllabusPicker.intro')}</p>
        </div>

        <div className="flex flex-col gap-3">
          {topics.map((topic, i) => (
            <button
              key={topic.id}
              onClick={() => startClass(topic.title)}
              className="flex items-center gap-4 rounded-2xl border border-ink-100 bg-white p-4 text-left transition hover:border-brand-400 hover:shadow-md hover:shadow-ink-950/5"
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-white"
                style={{ background: course.color }}
              >
                {i + 1}
              </span>
              <span className="flex-1">
                <span className="block text-sm font-bold text-ink-950">{topic.title}</span>
                <span className="block text-xs text-ink-500">{topic.description}</span>
              </span>
              <ChevronRight size={18} className="shrink-0 text-ink-300" />
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
