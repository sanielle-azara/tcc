import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AplicacaoDetailPage from '../src/pages/aplicacoes/AplicacaoDetailPage';
import { aplicacoesApi } from '../src/api/aplicacoes';

vi.mock('../src/api/aplicacoes', () => ({
  aplicacoesApi: { findById: vi.fn(), saveAnswers: vi.fn(), finalize: vi.fn() },
}));

const renderPage = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/aplicacoes/apl-001']}>
        <Routes>
          <Route path="/aplicacoes/:id" element={<AplicacaoDetailPage />} />
          <Route path="/relatorios/aplicacao/:aplicacaoId" element={<div>Criar relatório da aplicação</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

const questions = [
  { id: 'q1', text: 'Observações iniciais', type: 'TEXT', required: true, order: 1 },
  { id: 'q2', text: 'Lê textos simples?', type: 'YES_NO', required: true, order: 2 },
  { id: 'q3', text: 'Dificuldades', type: 'MULTI_SELECT', required: false, order: 3, options: '["Inversão","Omissão","Troca"]' },
  { id: 'q4', text: 'Nível de leitura', type: 'SCALE', required: true, order: 4, scaleMin: 1, scaleMax: 5 },
];

// Respostas como a API devolve: valor encapsulado em { v }
const respostas = [
  { questionId: 'q1', valor: { v: 'Atenta e colaborativa' } },
  { questionId: 'q2', valor: { v: false } },
  { questionId: 'q3', valor: { v: ['Inversão', 'Troca'] } },
  { questionId: 'q4', valor: { v: 4 } },
];

const makeAplicacao = (status) => ({
  id: 'apl-001', status, dataAplicacao: null,
  aprendente: { name: 'João Pedro' }, aplicador: { name: 'Ana Lima' },
  avaliacao: { name: 'Leitura', questions },
  respostas,
});

describe('AplicacaoDetailPage – respostas salvas', () => {
  beforeEach(() => vi.clearAllMocks());

  it('exibe as respostas salvas em uma aplicação finalizada', async () => {
    aplicacoesApi.findById.mockResolvedValue({ data: { data: makeAplicacao('COMPLETED') } });
    renderPage();

    expect(await screen.findByText('Atenta e colaborativa')).toBeInTheDocument();
    expect(screen.getByText('false')).toBeInTheDocument();
    expect(screen.getByText('Inversão, Troca')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.queryByText('Sem resposta')).not.toBeInTheDocument();
  });

  it('recarrega as respostas nos campos ao reabrir um rascunho', async () => {
    aplicacoesApi.findById.mockResolvedValue({ data: { data: makeAplicacao('DRAFT') } });
    renderPage();

    expect(await screen.findByDisplayValue('Atenta e colaborativa')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Não' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Sim' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Inversão' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Omissão' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Troca' })).toBeChecked();
    expect(screen.getByRole('slider')).toHaveValue('4');
  });

  it('ao salvar de novo, envia as respostas anteriores junto com a alterada', async () => {
    aplicacoesApi.findById.mockResolvedValue({ data: { data: makeAplicacao('DRAFT') } });
    aplicacoesApi.saveAnswers.mockResolvedValue({ data: { data: {} } });
    renderPage();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('checkbox', { name: 'Omissão' }));
    await user.click(screen.getByRole('button', { name: /salvar rascunho/i }));

    await waitFor(() => expect(aplicacoesApi.saveAnswers).toHaveBeenCalled());
    const [id, payload] = aplicacoesApi.saveAnswers.mock.calls[0];
    expect(id).toBe('apl-001');
    expect(payload.isDraft).toBe(true);
    expect(payload.answers).toEqual(expect.arrayContaining([
      { questionId: 'q1', value: 'Atenta e colaborativa' },
      { questionId: 'q2', value: false },
      { questionId: 'q3', value: ['Inversão', 'Troca', 'Omissão'] },
      { questionId: 'q4', value: 4 },
    ]));
  });

  it('mostra "Sem resposta" apenas para perguntas não respondidas', async () => {
    const aplicacao = makeAplicacao('COMPLETED');
    aplicacao.respostas = respostas.filter((r) => r.questionId !== 'q3');
    aplicacoesApi.findById.mockResolvedValue({ data: { data: aplicacao } });
    renderPage();

    expect(await screen.findByText('Atenta e colaborativa')).toBeInTheDocument();
    expect(screen.getAllByText('Sem resposta')).toHaveLength(1);
  });
});

describe('AplicacaoDetailPage – finalizar', () => {
  beforeEach(() => vi.clearAllMocks());

  const aplicacaoSemRespostas = () => {
    const aplicacao = makeAplicacao('IN_PROGRESS');
    aplicacao.avaliacao = { name: 'Leitura', questions: [questions[0]] };
    aplicacao.respostas = [];
    return aplicacao;
  };

  it('salva as respostas digitadas antes de finalizar', async () => {
    aplicacoesApi.findById.mockResolvedValue({ data: { data: aplicacaoSemRespostas() } });
    aplicacoesApi.saveAnswers.mockResolvedValue({ data: { data: {} } });
    aplicacoesApi.finalize.mockResolvedValue({ data: { data: {} } });
    renderPage();
    const user = userEvent.setup();

    await user.type(await screen.findByRole('textbox'), 'Digitado sem salvar');
    await user.click(screen.getByRole('button', { name: /finalizar/i }));

    await waitFor(() => expect(aplicacoesApi.finalize).toHaveBeenCalledWith('apl-001', {}));
    expect(aplicacoesApi.saveAnswers).toHaveBeenCalledWith('apl-001', {
      answers: [{ questionId: 'q1', value: 'Digitado sem salvar' }],
      isDraft: false,
    });
    expect(aplicacoesApi.saveAnswers.mock.invocationCallOrder[0])
      .toBeLessThan(aplicacoesApi.finalize.mock.invocationCallOrder[0]);
  });

  it('leva à elaboração do relatório depois de finalizar', async () => {
    aplicacoesApi.findById.mockResolvedValue({ data: { data: aplicacaoSemRespostas() } });
    aplicacoesApi.saveAnswers.mockResolvedValue({ data: { data: {} } });
    aplicacoesApi.finalize.mockResolvedValue({ data: { data: {} } });
    renderPage();
    const user = userEvent.setup();

    await user.type(await screen.findByRole('textbox'), 'Resposta');
    await user.click(screen.getByRole('button', { name: /finalizar/i }));

    expect(await screen.findByText('Criar relatório da aplicação')).toBeInTheDocument();
  });

  it('permanece na aplicação quando a finalização é recusada', async () => {
    aplicacoesApi.findById.mockResolvedValue({ data: { data: aplicacaoSemRespostas() } });
    aplicacoesApi.finalize.mockRejectedValue({ response: { data: { message: 'Perguntas obrigatórias sem resposta: Observações iniciais' } } });
    renderPage();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: /finalizar/i }));

    expect(await screen.findByText(/perguntas obrigatórias sem resposta/i)).toBeInTheDocument();
    expect(screen.queryByText('Criar relatório da aplicação')).not.toBeInTheDocument();
  });

  it('mantém as respostas salvas e exibe o motivo quando a finalização é recusada', async () => {
    aplicacoesApi.findById.mockResolvedValue({ data: { data: aplicacaoSemRespostas() } });
    aplicacoesApi.saveAnswers.mockResolvedValue({ data: { data: {} } });
    aplicacoesApi.finalize.mockRejectedValue({ response: { data: { message: 'Perguntas obrigatórias sem resposta: Observações iniciais' } } });
    renderPage();
    const user = userEvent.setup();

    await user.type(await screen.findByRole('textbox'), 'Parcial');
    await user.click(screen.getByRole('button', { name: /finalizar/i }));

    expect(await screen.findByText(/perguntas obrigatórias sem resposta/i)).toBeInTheDocument();
    expect(aplicacoesApi.saveAnswers).toHaveBeenCalledTimes(1);
  });

  it('finaliza sem salvar quando não há respostas na tela', async () => {
    aplicacoesApi.findById.mockResolvedValue({ data: { data: aplicacaoSemRespostas() } });
    aplicacoesApi.finalize.mockRejectedValue({ response: { data: { message: 'Perguntas obrigatórias sem resposta: Observações iniciais' } } });
    renderPage();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: /finalizar/i }));

    await waitFor(() => expect(aplicacoesApi.finalize).toHaveBeenCalled());
    expect(aplicacoesApi.saveAnswers).not.toHaveBeenCalled();
  });
});
