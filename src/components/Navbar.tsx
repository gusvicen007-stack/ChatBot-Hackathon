import { Flame, LogOut, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useProfile } from '../ProfileContext';
import { useT } from '../i18n/I18nContext';
import { useProgress } from '../ProgressContext';
import WizardMascot from './WizardMascot';

export default function Navbar() {
  const { logout } = useAuth();
  const { profile } = useProfile();
  const { progress } = useProgress();
  const { t } = useT();
  const navigate = useNavigate();
  const name = profile?.name || '?';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-10 border-b border-ink-100 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <WizardMascot size={40} />
          <span className="text-base font-extrabold tracking-tight text-ink-950">Fluenta</span>
        </div>

        <div className="flex items-center gap-4">
          <div
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${
              progress.streakDays > 0 ? 'bg-amber-500/10 text-amber-500' : 'bg-ink-50 text-ink-300'
            }`}
          >
            <Flame size={15} fill={progress.streakDays > 0 ? 'currentColor' : 'none'} />
            {t('nav.streak', { days: progress.streakDays })}
          </div>
          <div className="hidden items-center gap-1.5 rounded-full bg-brand-100 px-3 py-1.5 text-sm font-semibold text-brand-700 sm:flex">
            <Zap size={15} fill="currentColor" />
            {progress.xp} XP
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-600">
            {name.charAt(0).toUpperCase()}
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm font-medium text-ink-500 transition hover:text-ink-900"
          >
            <LogOut size={15} />
            <span className="hidden sm:inline">{t('nav.logout')}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
