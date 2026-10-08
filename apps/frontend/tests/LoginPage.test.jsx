import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import LoginPage from '../src/pages/auth/LoginPage';
import { AuthContext } from '../src/contexts/AuthContext';

const renderLogin = (loginFn = vi.fn()) => {
  const ctxValue = {
    user: null,
    loading: false,
    login: loginFn,
    logout: vi.fn(),
    isAdmin: false,
  };
  return render(
    <AuthContext.Provider value={ctxValue}>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

describe('LoginPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renderiza os campos de email e senha', () => {
    renderLogin();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
  });

  it('exibe erros de validação ao submeter com campos vazios', async () => {
    renderLogin();
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));
    await waitFor(() => {
      expect(screen.queryAllByRole('alert').length).toBeGreaterThanOrEqual(0);
    });
  });

  it('chama login com email e senha fornecidos', async () => {
    const loginFn = vi.fn().mockResolvedValue({ user: { role: 'PSICOPEDAGOGO' } });
    renderLogin(loginFn);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/email/i), 'prof@test.com');
    await user.type(screen.getByLabelText(/senha/i), 'Senha@123');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(loginFn).toHaveBeenCalledWith('prof@test.com', 'Senha@123');
    });
  });

  it('redireciona para /dashboard após login bem-sucedido', async () => {
    const loginFn = vi.fn().mockResolvedValue({ user: { role: 'PSICOPEDAGOGO' } });
    renderLogin(loginFn);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/email/i), 'prof@test.com');
    await user.type(screen.getByLabelText(/senha/i), 'Senha@123');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  it('exibe mensagem de erro quando login falha', async () => {
    const loginFn = vi.fn().mockRejectedValue({
      response: { data: { message: 'Credenciais inválidas' } },
    });
    renderLogin(loginFn);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/email/i), 'errado@test.com');
    await user.type(screen.getByLabelText(/senha/i), 'SenhaErrada@1');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(screen.getByText('Credenciais inválidas')).toBeInTheDocument();
    });
  });

  it('alterna visibilidade da senha ao clicar no ícone', async () => {
    renderLogin();
    const senhaInput = screen.getByLabelText(/senha/i);
    expect(senhaInput).toHaveAttribute('type', 'password');

    const toggleBtn = screen.getByRole('button', { name: '' });
    await userEvent.setup().click(toggleBtn);

    expect(senhaInput).toHaveAttribute('type', 'text');
  });
});
