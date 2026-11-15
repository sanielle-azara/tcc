import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DashboardPage from '../src/pages/dashboard/DashboardPage';
import { dashboardApi } from '../src/api/dashboard';

vi.mock('../src/api/dashboard', () => ({ dashboardApi: { getStats: vi.fn() } }));

const stats = (ultimasAplicacoes) => ({
  totalAprendentes: 4, totalAvaliacoes: 2, totalAplicacoes: 5,
  aplicacoesPendentes: 1, aplicacoesEmAndamento: 1, aplicacoesRascunho: 0, aplicacoesFinalizadas: 3,
  ultimasAplicacoes, avaliacoesAtivas: [],
});

const renderPage = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}><DashboardPage /></QueryClientProvider>);
};

describe('DashboardPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('para o administrador, mostra só os totais e explica a ausência das aplicações', async () => {
    dashboardApi.getStats.mockResolvedValue({ data: { data: stats(null) } });
    renderPage();

    expect(await screen.findByText('Total de Aprendentes')).toBeInTheDocument();
    expect(screen.getByText(/o administrador vê apenas os totais/)).toBeInTheDocument();
  });

  it('para o psicopedagogo, lista as últimas aplicações', async () => {
    dashboardApi.getStats.mockResolvedValue({ data: { data: stats([{
      id: 'apl-1', status: 'COMPLETED', createdAt: '2026-11-13T12:00:00.000Z',
      aprendente: { name: 'João Pedro' }, avaliacao: { name: 'Leitura' }, aplicador: { name: 'Ana Lima' },
    }]) } });
    renderPage();

    expect(await screen.findByText('João Pedro')).toBeInTheDocument();
    expect(screen.queryByText(/o administrador vê apenas os totais/)).not.toBeInTheDocument();
  });
});
