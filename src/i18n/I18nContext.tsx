import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useProfile } from '../ProfileContext';
import { isUILang, translate, type UILang } from './translations';

interface I18nContextValue {
  lang: UILang;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const { profile } = useProfile();
  const lang: UILang = isUILang(profile?.uiLanguage) ? profile.uiLanguage : 'es';

  const value = useMemo<I18nContextValue>(
    () => ({
      lang,
      t: (key, vars) => translate(lang, key, vars),
    }),
    [lang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useT must be used within I18nProvider');
  return ctx;
}
