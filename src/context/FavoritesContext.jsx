import { createContext, useContext, useState, useCallback } from 'react';

const STORAGE_KEY = 'pac-favorites';
const FavoritesContext = createContext(null);

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

// `favorites` is an ordered list of theme keys — the order IS the priority.
export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState(load);

  const persist = useCallback((next) => {
    setFavorites(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const toggleFavorite = useCallback((key) => {
    setFavorites((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const move = useCallback((key, dir) => {
    setFavorites((prev) => {
      const i = prev.indexOf(key);
      if (i < 0) return prev;
      const j = dir === 'up' ? i - 1 : i + 1;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isFavorite = useCallback((key) => favorites.includes(key), [favorites]);

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, move, isFavorite, setFavorites: persist }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
}
