import { createContext, useContext, useState, useCallback, useMemo } from 'react';

const FilterContext = createContext(null);

const EMPTY = { area: '', manager: '', role: '', month: '' };

// Filtros globais dos dashboards: diretoria/área, gestor, cargo e período (mês).
// Ficam em memória (não persistem) para não "grudar" um recorte entre sessões.
export function FilterProvider({ children }) {
  const [filters, setFilters] = useState(EMPTY);

  const setFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => setFilters(EMPTY), []);

  const activeCount = Object.values(filters).filter(Boolean).length;

  const value = useMemo(() => ({ filters, setFilter, clearFilters, activeCount }), [filters, setFilter, clearFilters, activeCount]);
  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useFilters() {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilters must be used within FilterProvider');
  return ctx;
}
