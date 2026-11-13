import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AvaliacaoFormPage from '../src/pages/avaliacoes/AvaliacaoFormPage';
import { avaliacoesApi } from '../src/api/avaliacoes';
import { parseOptions, toAvaliacaoPayload } from '../src/pages/avaliacoes/avaliacaoForm';

vi.mock('../src/api/avaliacoes', () => ({
  avaliacoesApi: { findById: vi.fn(), create: vi.fn(), update: vi.fn() },
}));

const renderForm = (path) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/avaliacoes/nova" element={<AvaliacaoFormPage />} />
          <Route path="/avaliacoes/:id/editar" element={<AvaliacaoFormPage />} />
          <Route path="/avaliacoes" element={<div>Lista de avaliações</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

// Instrumento como a API devolve: campos opcionais nulos e opções em JSON
const avaliacaoDoBanco = (aplicacoes = 0) => ({
  id: 'av-001', name: 'Leitura', description: null, category: null, status: 'ACTIVE', version: 1,
  parentId: null, autorId: 'u1', createdAt: '2026-01-01T00:00:00.000Z',
  questions: [
    { id: 'q1', avaliacaoId: 'av-001', text: 'Lê textos simples?', type: 'YES_NO', required: true, order: 1, options: null, helpText: null, scaleMin: null, scaleMax: null, scaleMinLabel: null, scaleMaxLabel: null },
    { id: 'q2', avaliacaoId: 'av-001', text: 'Dificuldades observadas', type: 'MULTI_SELECT', required: false, order: 2, options: '["Inversão","Omissão"]', helpText: null, scaleMin: null, scaleMax: null, scaleMinLabel: null, scaleMaxLabel: null },
    { id: 'q3', avaliacaoId: 'av-001', text: 'Nível de leitura', type: 'SCALE', required: true, order: 3, options: null, helpText: null, scaleMin: 1, scaleMax: 5, scaleMinLabel: 'Baixo', scaleMaxLabel: 'Alto' },
  ],
  _count: { aplicacoes: aplicacoes }, versions: [],
});

const startNewQuestion = async (user, name, questionText) => {
  await user.type(screen.getByLabelText(/nome da avalia/i), name);
  await user.click(screen.getByRole('button', { name: /adicionar primeira pergunta/i }));
  await user.type(screen.getByLabelText(/pergunta \*/i), questionText);
};

const chooseType = async (user, label) => {
  // comboboxes: [0] status, [1] tipo da pergunta, [2] obrigatória
  await user.click(screen.getAllByRole('combobox')[1]);
  await user.click(await screen.findByRole('option', { name: label }));
};

describe('AvaliacaoFormPage – criação', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    avaliacoesApi.create.mockResolvedValue({ data: { data: {} } });
  });

  it('cria instrumento com pergunta de seleção única enviando as opções como lista', async () => {
    renderForm('/avaliacoes/nova');
    const user = userEvent.setup();
    await startNewQuestion(user, 'Instrumento', 'Escolha uma opção');
    await chooseType(user, 'Seleção única');
    await user.type(await screen.findByLabelText(/opções/i), 'A{enter}B{enter}{enter}');
    await user.click(screen.getByRole('button', { name: /salvar avalia/i }));

    await waitFor(() => expect(avaliacoesApi.create).toHaveBeenCalled());
    const [payload] = avaliacoesApi.create.mock.calls[0];
    expect(payload.questions[0]).toMatchObject({ type: 'SINGLE_SELECT', options: ['A', 'B'], order: 1, required: true });
    expect(await screen.findByText('Lista de avaliações')).toBeInTheDocument();
  });

  it('exibe erro e não envia pergunta de seleção sem opções', async () => {
    renderForm('/avaliacoes/nova');
    const user = userEvent.setup();
    await startNewQuestion(user, 'Instrumento', 'Escolha uma opção');
    await chooseType(user, 'Seleção múltipla');
    await user.click(screen.getByRole('button', { name: /salvar avalia/i }));

    expect(await screen.findByText('Informe pelo menos uma opção')).toBeInTheDocument();
    expect(screen.getByText(/revise os campos destacados/i)).toBeInTheDocument();
    expect(avaliacoesApi.create).not.toHaveBeenCalled();
  });

  it('cria pergunta de escala sem limites e rejeita mínimo maior que o máximo', async () => {
    renderForm('/avaliacoes/nova');
    const user = userEvent.setup();
    await startNewQuestion(user, 'Instrumento', 'Nível');
    await chooseType(user, 'Escala');
    await user.type(screen.getByLabelText('Mínimo'), '5');
    await user.type(screen.getByLabelText('Máximo'), '1');
    await user.click(screen.getByRole('button', { name: /salvar avalia/i }));

    expect(await screen.findByText('O máximo deve ser maior que o mínimo')).toBeInTheDocument();
    expect(avaliacoesApi.create).not.toHaveBeenCalled();

    await user.clear(screen.getByLabelText('Mínimo'));
    await user.clear(screen.getByLabelText('Máximo'));
    await user.click(screen.getByRole('button', { name: /salvar avalia/i }));

    await waitFor(() => expect(avaliacoesApi.create).toHaveBeenCalled());
    const [payload] = avaliacoesApi.create.mock.calls[0];
    expect(payload.questions[0].type).toBe('SCALE');
    expect(payload.questions[0].scaleMin).toBeUndefined();
  });
});

describe('AvaliacaoFormPage – edição', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    avaliacoesApi.update.mockResolvedValue({ data: { data: {} } });
  });

  it('salva instrumento vindo do banco com campos nulos ao alterar uma pergunta', async () => {
    avaliacoesApi.findById.mockResolvedValue({ data: { data: avaliacaoDoBanco() } });
    renderForm('/avaliacoes/av-001/editar');
    const user = userEvent.setup();

    const pergunta = await screen.findByDisplayValue('Lê textos simples?');
    await user.clear(pergunta);
    await user.type(pergunta, 'Lê frases simples?');
    await user.click(screen.getByRole('button', { name: /salvar avalia/i }));

    await waitFor(() => expect(avaliacoesApi.update).toHaveBeenCalled());
    const [id, payload] = avaliacoesApi.update.mock.calls[0];
    expect(id).toBe('av-001');
    expect(payload.questions).toHaveLength(3);
    expect(payload.questions[0]).toMatchObject({ text: 'Lê frases simples?', type: 'YES_NO', order: 1 });
    expect(payload.questions[1]).toMatchObject({ type: 'MULTI_SELECT', options: ['Inversão', 'Omissão'], required: false });
    expect(payload.questions[2]).toMatchObject({ type: 'SCALE', scaleMin: 1, scaleMax: 5, scaleMinLabel: 'Baixo' });
    expect(payload).not.toHaveProperty('id');
  });

  it('não reenvia as perguntas quando só os metadados mudam', async () => {
    avaliacoesApi.findById.mockResolvedValue({ data: { data: avaliacaoDoBanco(2) } });
    renderForm('/avaliacoes/av-001/editar');
    const user = userEvent.setup();

    const nome = await screen.findByDisplayValue('Leitura');
    await user.type(nome, ' e Escrita');
    await user.click(screen.getByRole('button', { name: /salvar avalia/i }));

    await waitFor(() => expect(avaliacoesApi.update).toHaveBeenCalled());
    const [, payload] = avaliacoesApi.update.mock.calls[0];
    expect(payload.name).toBe('Leitura e Escrita');
    expect(payload).not.toHaveProperty('questions');
  });

  it('avisa que alterar perguntas de instrumento já aplicado gera nova versão', async () => {
    avaliacoesApi.findById.mockResolvedValue({ data: { data: avaliacaoDoBanco(2) } });
    renderForm('/avaliacoes/av-001/editar');

    expect(await screen.findByText(/será criada a versão v2/i)).toBeInTheDocument();
  });
});

describe('avaliacaoForm – conversões', () => {
  it('parseOptions aceita lista, JSON e valores inválidos', () => {
    expect(parseOptions(['A'])).toEqual(['A']);
    expect(parseOptions('["A","B"]')).toEqual(['A', 'B']);
    expect(parseOptions('texto inválido')).toEqual([]);
    expect(parseOptions(null)).toEqual([]);
  });

  it('toAvaliacaoPayload descarta campos que não se aplicam ao tipo da pergunta', () => {
    const payload = toAvaliacaoPayload({
      name: 'X', questions: [
        { text: 'a', type: 'TEXT', required: 'false', options: 'A\nB', scaleMin: '1', scaleMax: '5' },
      ],
    });
    expect(payload.questions[0]).toMatchObject({ type: 'TEXT', required: false, order: 1 });
    expect(payload.questions[0].options).toBeUndefined();
    expect(payload.questions[0].scaleMin).toBeUndefined();
  });
});
