import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import UsersListPage from '../src/pages/users/UsersListPage';
import { usersApi } from '../src/api/users';

vi.mock('../src/api/users', () => ({
  usersApi: { list: vi.fn(), remove: vi.fn(), transferirAprendentes: vi.fn() },
}));

const ana = { id: 'u-ana', name: 'Ana Lima', email: 'ana@x.com', role: 'PSICOPEDAGOGO', status: 'ACTIVE', createdAt: '2026-11-01T12:00:00.000Z', _count: { aprendentes: 3 } };
const bia = { id: 'u-bia', name: 'Bia Souza', email: 'bia@x.com', role: 'PSICOPEDAGOGO', status: 'ACTIVE', createdAt: '2026-11-02T12:00:00.000Z', _count: { aprendentes: 0 } };

const renderPage = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter><UsersListPage /></MemoryRouter>
    </QueryClientProvider>
  );
};

describe('UsersListPage – transferência de aprendentes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usersApi.list.mockResolvedValue({ data: { data: [ana, bia], meta: { total: 2 } } });
  });

  it('oferece a transferência só para quem tem aprendentes', async () => {
    renderPage();

    await screen.findByText('Ana Lima');
    expect(screen.getAllByRole('button', { name: 'Transferir aprendentes' })).toHaveLength(1);
  });

  it('transfere para o psicopedagogo escolhido, sem listar as crianças', async () => {
    usersApi.transferirAprendentes.mockResolvedValue({ data: { data: { aprendentes: 3, avaliacoes: 2 } } });
    renderPage();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Transferir aprendentes' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/Os 3 aprendentes/)).toBeInTheDocument();

    await user.click(within(dialog).getByRole('combobox'));
    // A origem não aparece entre os destinos possíveis
    expect(screen.queryByRole('option', { name: /ana@x.com/ })).not.toBeInTheDocument();
    await user.click(await screen.findByRole('option', { name: /Bia Souza/ }));
    await user.click(within(dialog).getByRole('button', { name: 'Transferir' }));

    await waitFor(() => expect(usersApi.transferirAprendentes).toHaveBeenCalledWith('u-ana', 'u-bia'));
    expect(await screen.findByText('3 aprendente(s) e 2 instrumento(s) transferidos')).toBeInTheDocument();
  });
});
