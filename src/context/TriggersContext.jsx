import { createContext, useContext, useState, useCallback } from 'react';

const STORAGE_KEY = 'pac-triggers';
const TriggersContext = createContext(null);

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

let idSeed = 1;
function nextId() {
  return `trg_${Date.now().toString(36)}_${idSeed++}`;
}

// Each trigger: { id, themeKey, condition: 'above'|'below'|'change', threshold, email, enabled }
export function TriggersProvider({ children }) {
  const [triggers, setTriggers] = useState(load);

  const save = useCallback((next) => {
    setTriggers(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const addTrigger = useCallback((t) => {
    setTriggers((prev) => {
      const next = [...prev, { ...t, id: nextId(), enabled: true }];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const removeTrigger = useCallback((id) => {
    setTriggers((prev) => {
      const next = prev.filter((t) => t.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const toggleTrigger = useCallback((id) => {
    setTriggers((prev) => {
      const next = prev.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <TriggersContext.Provider value={{ triggers, addTrigger, removeTrigger, toggleTrigger, setTriggers: save }}>
      {children}
    </TriggersContext.Provider>
  );
}

export function useTriggers() {
  const ctx = useContext(TriggersContext);
  if (!ctx) throw new Error('useTriggers must be used within TriggersProvider');
  return ctx;
}
