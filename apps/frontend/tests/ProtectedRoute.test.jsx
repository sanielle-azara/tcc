import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../src/components/layout/ProtectedRoute';
import { AuthContext } from '../src/contexts/AuthContext';

// Exportação nomeada do contexto para uso nos testes
// (o AuthContext já é exportado como named export no arquivo)

const renderWithAuth = (ui, { user = null, loading = false } = {}) => {
  const ctxValue = {
    user,
    loading,
    login: vi.fn(),
    logout: vi.fn(),
    isAdmin: user?.role === 'ADMIN',
  };
  return render(
    <AuthContext.Provider value={ctxValue}>
      <MemoryRouter initialEntries={['/protegida']}>
        <Routes>
          <Route path="/login" element={<div>Página de Login</div>} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
          <Route
            path="/protegida"
            element={<ProtectedRoute>{ui}</ProtectedRoute>}
          />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

describe('ProtectedRoute', () => {
  it('redireciona para /login quando não há usuário autenticado', () => {
    renderWithAuth(<div>Conteúdo protegido</div>, { user: null });
    expect(screen.getByText('Página de Login')).toBeInTheDocument();
    expect(screen.queryByText('Conteúdo protegido')).not.toBeInTheDocument();
  });

  it('exibe spinner enquanto carrega', () => {
    renderWithAuth(<div>Conteúdo protegido</div>, { user: null, loading: true });
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByText('Página de Login')).not.toBeInTheDocument();
  });

  it('exibe o conteúdo quando o usuário está autenticado', () => {
    renderWithAuth(
      <div>Conteúdo protegido</div>,
      { user: { id: 'u1', role: 'PSICOPEDAGOGO' } }
    );
    expect(screen.getByText('Conteúdo protegido')).toBeInTheDocument();
  });

  it('redireciona para /dashboard quando o perfil não tem permissão', () => {
    const routeComRoles = (
      <MemoryRouter initialEntries={['/protegida']}>
        <AuthContext.Provider value={{
          user: { id: 'u1', role: 'VIEWER' }, loading: false,
          login: vi.fn(), logout: vi.fn(), isAdmin: false,
        }}>
          <Routes>
            <Route path="/dashboard" element={<div>Dashboard</div>} />
            <Route
              path="/protegida"
              element={
                <ProtectedRoute roles={['ADMIN', 'PSICOPEDAGOGO']}>
                  <div>Só para admin/prof</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthContext.Provider>
      </MemoryRouter>
    );
    render(routeComRoles);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Só para admin/prof')).not.toBeInTheDocument();
  });

  it('exibe conteúdo quando perfil está na lista de roles permitidas', () => {
    const routeComRoles = (
      <MemoryRouter initialEntries={['/protegida']}>
        <AuthContext.Provider value={{
          user: { id: 'u1', role: 'ADMIN' }, loading: false,
          login: vi.fn(), logout: vi.fn(), isAdmin: true,
        }}>
          <Routes>
            <Route path="/dashboard" element={<div>Dashboard</div>} />
            <Route
              path="/protegida"
              element={
                <ProtectedRoute roles={['ADMIN', 'PSICOPEDAGOGO']}>
                  <div>Área restrita</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthContext.Provider>
      </MemoryRouter>
    );
    render(routeComRoles);
    expect(screen.getByText('Área restrita')).toBeInTheDocument();
  });
});
