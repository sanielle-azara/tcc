import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AvaliacaoDetailPage from '../src/pages/avaliacoes/AvaliacaoDetailPage';
import { avaliacoesApi } from '../src/api/avaliacoes';
import { AuthContext } from '../src/contexts/AuthContext';

vi.mock('../src/api/avaliacoes', () => ({
  avaliacoesApi: { findById: vi.fn() },
}));

const renderDetail = (path = '/avaliacoes/av-002') => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/avaliacoes/:id" element={<AvaliacaoDetailPage />} />
          <Route path="/avaliacoes/:id/editar" element={<div>Formulário de edição</div>} />
          <Route path="/avaliacoes" element={<div>Lista de avaliações</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

const makeAvaliacao = (overrides = {}) => ({
  id: 'av-002', name: 'Avaliação de Leitura', description: 'Habilidades de leitura.', category: 'Linguagem',
  status: 'ACTIVE', version: 2, parentId: 'av-001', createdAt: '2026-03-10T12:00:00.000Z',
  parent: { id: 'av-001', version: 1, status: 'ARCHIVED' },
  versions: [],
  _count: { aplicacoes: 4 },
  questions: [
    { id: 'q1', text: 'Lê textos simples?', type: 'YES_NO', required: true, order: 1, options: null, helpText: 'Observar fluência' },
    { id: 'q2', text: 'Dificuldades observadas', type: 'MULTI_SELECT', required: false, order: 2, options: '["Inversão","Omissão"]' },
    { id: 'q3', text: 'Nível de leitura', type: 'SCALE', required: true, order: 3, scaleMin: 1, scaleMax: 5, scaleMinLabel: 'Baixo', scaleMaxLabel: 'Alto' },
  ],
  ...overrides,
});

describe('AvaliacaoDetailPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('exibe as informações do instrumento', async () => {
    avaliacoesApi.findById.mockResolvedValue({ data: { data: makeAvaliacao() } });
    renderDetail();

    expect(await screen.findByText('Avaliação de Leitura')).toBeInTheDocument();
    expect(screen.getByText('Habilidades de leitura.')).toBeInTheDocument();
    expect(screen.getByText('Ativo')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(avaliacoesApi.findById).toHaveBeenCalledWith('av-002');
  });

  it('não oferece a edição ao administrador', async () => {
    avaliacoesApi.findById.mockResolvedValue({ data: { data: makeAvaliacao() } });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <AuthContext.Provider value={{ user: { id: 'a1', role: 'ADMIN' }, loading: false, isAdmin: true }}>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/avaliacoes/av-002']}>
            <Routes><Route path="/avaliacoes/:id" element={<AvaliacaoDetailPage />} /></Routes>
          </MemoryRouter>
        </QueryClientProvider>
      </AuthContext.Provider>
    );

    expect(await screen.findByText('Avaliação de Leitura')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /editar/i })).not.toBeInTheDocument();
  });

  it('exibe as perguntas com tipo, obrigatoriedade, ajuda, opções e escala', async () => {
    avaliacoesApi.findById.mockResolvedValue({ data: { data: makeAvaliacao() } });
    renderDetail();

    expect(await screen.findByText('Perguntas (3)')).toBeInTheDocument();
    expect(screen.getByText('Lê textos simples?')).toBeInTheDocument();
    expect(screen.getByText('Sim/Não')).toBeInTheDocument();
    expect(screen.getByText('Observar fluência')).toBeInTheDocument();
    expect(screen.getByText('Seleção múltipla')).toBeInTheDocument();
    expect(screen.getByText('Opcional')).toBeInTheDocument();
    expect(screen.getByText('Inversão')).toBeInTheDocument();
    expect(screen.getByText('Omissão')).toBeInTheDocument();
    expect(screen.getByText(/1 \(Baixo\) até 5 \(Alto\)/)).toBeInTheDocument();
  });

  it('mostra o histórico de versões e navega para a versão de origem', async () => {
    avaliacoesApi.findById.mockImplementation((id) => Promise.resolve({
      data: { data: id === 'av-001'
        ? makeAvaliacao({ id: 'av-001', name: 'Leitura original', version: 1, status: 'ARCHIVED', parent: null, parentId: null, versions: [{ id: 'av-002', version: 2, status: 'ACTIVE' }] })
        : makeAvaliacao() },
    }));
    renderDetail();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'v1' }));

    expect(await screen.findByText('Leitura original')).toBeInTheDocument();
    expect(screen.getByText('Versão original')).toBeInTheDocument();
    expect(screen.getByText(/esta versão está arquivada e foi substituída/i)).toBeInTheDocument();
    expect(avaliacoesApi.findById).toHaveBeenCalledWith('av-001');
  });

  it('leva ao formulário de edição', async () => {
    avaliacoesApi.findById.mockResolvedValue({ data: { data: makeAvaliacao() } });
    renderDetail();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: /editar/i }));

    expect(await screen.findByText('Formulário de edição')).toBeInTheDocument();
  });

  it('exibe mensagem quando o instrumento não é encontrado', async () => {
    avaliacoesApi.findById.mockRejectedValue({ response: { status: 404, data: { message: 'Avaliação não encontrada' } } });
    renderDetail('/avaliacoes/av-outro');

    expect(await screen.findByText('Avaliação não encontrada')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /voltar para avaliações/i })).toBeInTheDocument();
  });
});
