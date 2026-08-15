import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { UI, NAV_EN, INDICATORS_EN } from './translations.js';

const LanguageContext = createContext(null);

function getInitialLang() {
  if (typeof window === 'undefined') return 'pt';
  return window.localStorage.getItem('pac-lang') || 'pt';
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(getInitialLang);

  useEffect(() => {
    document.documentElement.lang = lang === 'en' ? 'en' : 'pt-BR';
    window.localStorage.setItem('pac-lang', lang);
  }, [lang]);

  const value = useMemo(() => ({
    lang,
    setLang,
    // Traduz uma string de UI pela chave; em PT/EN usa o dicionário, senão devolve a chave.
    t: (key) => {
      const entry = UI[key];
      if (!entry) return key;
      return entry[lang] ?? entry.pt ?? key;
    },
    // Traduz um label de navegação pela rota; em PT mantém o label original do componente.
    tNav: (to, ptFallback) => (lang === 'en' ? (NAV_EN[to] ?? ptFallback) : ptFallback),
    // Traduz um indicador (KPI) pela sua key; em PT mantém o label original.
    tIndicator: (key, ptFallback) => (lang === 'en' ? (INDICATORS_EN[key] ?? ptFallback) : ptFallback),
  }), [lang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used within LanguageProvider');
  return ctx;
}
