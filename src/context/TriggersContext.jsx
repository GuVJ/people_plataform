import { createContext, useContext, useState, useCallback } from 'react';

const STORAGE_KEY = 'pac-triggers';
const SUBS_KEY = 'pac-exec-subscriptions';
const TriggersContext = createContext(null);

function loadKey(key, fallback) {
  try {
    const raw = JSON.parse(localStorage.getItem(key) || 'null');
    return Array.isArray(raw) ? raw : fallback;
  } catch {
    return fallback;
  }
}

// Lista de envio inicial do Resumo Executivo (exemplos editáveis pelo usuário).
const DEFAULT_SUBS = [
  { id: 'sub_ceo', name: 'CEO', email: 'ceo@empresa.com', audience: 'lideranca' },
  { id: 'sub_dir', name: 'Diretoria', email: 'diretoria@empresa.com', audience: 'lideranca' },
  { id: 'sub_gestor', name: 'Gestores', email: 'gestor@empresa.com', audience: 'gestor' },
];

let idSeed = 1;
function nextId(prefix = 'trg') {
  return `${prefix}_${Date.now().toString(36)}_${idSeed++}`;
}

// Each trigger: { id, themeKey, condition: 'above'|'below'|'change', threshold, email, enabled }
// Each subscription: { id, name, email, audience: 'lideranca'|'gestor' }
export function TriggersProvider({ children }) {
  const [triggers, setTriggers] = useState(() => loadKey(STORAGE_KEY, []));
  const [subscriptions, setSubscriptions] = useState(() => loadKey(SUBS_KEY, DEFAULT_SUBS));

  const addSubscription = useCallback((sub) => {
    setSubscriptions((prev) => {
      const next = [...prev, { ...sub, id: nextId('sub') }];
      localStorage.setItem(SUBS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const removeSubscription = useCallback((id) => {
    setSubscriptions((prev) => {
      const next = prev.filter((s) => s.id !== id);
      localStorage.setItem(SUBS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

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
    <TriggersContext.Provider value={{
      triggers, addTrigger, removeTrigger, toggleTrigger, setTriggers: save,
      subscriptions, addSubscription, removeSubscription,
    }}>
      {children}
    </TriggersContext.Provider>
  );
}

export function useTriggers() {
  const ctx = useContext(TriggersContext);
  if (!ctx) throw new Error('useTriggers must be used within TriggersProvider');
  return ctx;
}
