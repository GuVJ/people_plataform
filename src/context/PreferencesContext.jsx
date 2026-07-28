import { createContext, useContext, useEffect, useState } from 'react';

const PreferencesContext = createContext(null);

function getInitialTheme() {
  if (typeof window === 'undefined') return 'light';
  const stored = window.localStorage.getItem('pac-theme');
  if (stored) return stored;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function PreferencesProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);
  const [privacyMode, setPrivacyMode] = useState(false);

  // No mobile a interface é sempre clara (branca), independente do tema do sistema/preferência.
  // No desktop segue o tema escolhido. `data-theme` é o único controlador do tema (não há
  // media query prefers-color-scheme no CSS), então basta forçar "light" quando for mobile.
  useEffect(() => {
    const mobileMq = window.matchMedia('(max-width: 720px)');
    const applyTheme = () => {
      document.documentElement.setAttribute('data-theme', mobileMq.matches ? 'light' : theme);
    };
    applyTheme();
    mobileMq.addEventListener('change', applyTheme);
    window.localStorage.setItem('pac-theme', theme);
    return () => mobileMq.removeEventListener('change', applyTheme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  const togglePrivacy = () => setPrivacyMode((p) => !p);

  return (
    <PreferencesContext.Provider value={{ theme, toggleTheme, privacyMode, togglePrivacy }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences must be used within PreferencesProvider');
  return ctx;
}
