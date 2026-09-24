import { Flame, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useProfile } from '../ProfileContext';
import { useT } from '../i18n/I18nContext';
import { student } from '../data/mockData';
import WizardMascot from './WizardMascot';

export default function Navbar() {
  const { logout } = useAuth();
  const { profile } = useProfile();
  const { t } = useT();
  const navigate = useNavigate();
  const name = profile?.name || student.name;

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
          <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1.5 text-sm font-semibold text-amber-500">
            <Flame size={15} />
            {t('nav.streak', { days: student.streakDays })}
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
