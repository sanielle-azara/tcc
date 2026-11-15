import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RelatorioDetailPage from '../src/pages/relatorios/RelatorioDetailPage';
import { relatoriosApi } from '../src/api/relatorios';

vi.mock('../src/api/relatorios', () => ({
  relatoriosApi: { findById: vi.fn(), findByAplicacao: vi.fn(), createOrUpdate: vi.fn() },
}));

const renderPage = () => {
  // Sem retry padrão no cliente, para que só a regra da própria página atue
  const queryClient = new QueryClient({ defaultOptions: { queries: { retryDelay: 0 } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/relatorios/aplicacao/apl-001']}>
        <Routes>
          <Route path="/relatorios/aplicacao/:aplicacaoId" element={<RelatorioDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('RelatorioDetailPage – criação a partir da aplicação', () => {
  beforeEach(() => vi.clearAllMocks());

  it('mostra o formulário de criação sem repetir a consulta quando o relatório não existe (404)', async () => {
    relatoriosApi.findByAplicacao.mockRejectedValue({ response: { status: 404, data: { message: 'Relatório não encontrado' } } });
    renderPage();

    expect(await screen.findByText('Criar Relatório')).toBeInTheDocument();
    expect(screen.getByLabelText('Conclusão')).toBeInTheDocument();
    expect(relatoriosApi.findByAplicacao).toHaveBeenCalledTimes(1);
    expect(relatoriosApi.findByAplicacao).toHaveBeenCalledWith('apl-001');
  });

  it('tenta de novo uma vez em erros que não são 404', async () => {
    relatoriosApi.findByAplicacao.mockRejectedValue({ response: { status: 500, data: {} } });
    renderPage();

    await waitFor(() => expect(relatoriosApi.findByAplicacao).toHaveBeenCalledTimes(2));
  });
});

const conclusaoLonga = Array.from({ length: 30 }, (_, i) => `Parágrafo ${i + 1} da conclusão.`).join('\n');

const relatorio = {
  id: 'rel-001', createdAt: '2026-11-13T10:00:00.000Z',
  conclusao: conclusaoLonga, observacoesProfissional: 'Observação do profissional',
  autor: { id: 'u1', name: 'Ana Lima' },
  aplicacao: {
    id: 'apl-001', dataAplicacao: '2026-11-10T00:00:00.000Z', observacoes: null,
    aprendente: { name: 'João Pedro', birthDate: '2015-03-12T00:00:00.000Z', sexo: 'MASCULINO', responsavelNome: 'Maria' },
    avaliacao: {
      name: 'Leitura', category: 'Linguagem', version: 2,
      questions: [
        { id: 'q1', text: 'Lê textos simples?', type: 'YES_NO', required: true },
        { id: 'q2', text: 'Reconhece letras?', type: 'YES_NO', required: true },
        { id: 'q3', text: 'Nota', type: 'NUMERIC', required: false },
        { id: 'q4', text: 'Data da última avaliação escolar', type: 'DATE', required: false },
      ],
    },
    respostas: [
      { questionId: 'q1', valor: { v: false } },
      { questionId: 'q2', valor: { v: true } },
      { questionId: 'q3', valor: { v: 0 } },
      { questionId: 'q4', valor: { v: '2026-08-10' } },
    ],
  },
};

const renderRelatorio = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/relatorios/rel-001']}>
        <Routes>
          <Route path="/relatorios/:id" element={<RelatorioDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('RelatorioDetailPage – impressão', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    relatoriosApi.findById.mockResolvedValue({ data: { data: relatorio } });
  });

  it('imprime conclusão e observações como texto completo, no lugar das caixas de edição', async () => {
    renderRelatorio();

    const conclusao = await screen.findByTestId('print-conclusao');
    expect(conclusao).toHaveClass('print-only');
    expect(conclusao.textContent).toBe(conclusaoLonga);
    expect(screen.getByTestId('print-observacoes')).toHaveTextContent('Observação do profissional');
    screen.getAllByRole('textbox').forEach((campo) => expect(campo.closest('.no-print')).not.toBeNull());
  });

  it('oculta botões e cabeçalho da página na impressão e inclui a assinatura do profissional', async () => {
    renderRelatorio();

    const imprimir = await screen.findByRole('button', { name: /imprimir/i });
    expect(imprimir.closest('.no-print')).not.toBeNull();
    expect(screen.getByRole('button', { name: /salvar relatório/i }).closest('.no-print')).not.toBeNull();
    expect(screen.getAllByText('Obrig.')[0].closest('.no-print')).not.toBeNull();
    expect(screen.getByTestId('print-assinatura')).toHaveTextContent('Ana Lima');
    expect(screen.getByText('RELATÓRIO DE AVALIAÇÃO PSICOPEDAGÓGICA').closest('.no-print')).toBeNull();
  });

  it('mostra respostas Sim/Não por extenso e trata 0 como resposta', async () => {
    renderRelatorio();

    expect(await screen.findByText('Não')).toBeInTheDocument();
    expect(screen.getByText('Sim')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.queryByText('Sem resposta')).not.toBeInTheDocument();
  });

  it('mostra respostas de data no formato dd/mm/aaaa', async () => {
    renderRelatorio();

    expect(await screen.findByText('10/08/2026')).toBeInTheDocument();
    expect(screen.queryByText('2026-08-10')).not.toBeInTheDocument();
  });

  it('o botão Imprimir abre a impressão do navegador', async () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => {});
    renderRelatorio();

    (await screen.findByRole('button', { name: /imprimir/i })).click();

    expect(print).toHaveBeenCalled();
    print.mockRestore();
  });
});
