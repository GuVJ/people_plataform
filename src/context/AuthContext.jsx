import { createContext, useContext, useState } from 'react';

// Mock authentication/role context — mirrors where Clerk (publicMetadata.role) plugs in on Fluxo.
// Swap this provider for a Clerk-backed one when wiring real auth; the `role` shape stays the same.
export const ROLES = [
  { id: 'rh', label: 'RH', description: 'Visão operacional completa de todos os indicadores' },
  { id: 'gestor', label: 'Gestor', description: 'Visão focada no time e área sob gestão' },
  { id: 'diretor', label: 'Diretor', description: 'Visão executiva com foco em custo e risco' },
  { id: 'ceo', label: 'CEO', description: 'Visão estratégica e resumida para o board' },
];

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [roleId, setRoleId] = useState('rh');
  const user = {
    name: 'Camila Rezende',
    initials: 'CR',
    email: 'camila.rezende@empresa.com.br',
    role: ROLES.find((r) => r.id === roleId),
  };

  return (
    <AuthContext.Provider value={{ user, roleId, setRoleId, roles: ROLES }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
