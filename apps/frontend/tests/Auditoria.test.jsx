import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AuditoriaPage from '../src/pages/auditoria/AuditoriaPage';
import AprendenteDetailPage from '../src/pages/aprendentes/AprendenteDetailPage';
import { auditoriaApi } from '../src/api/auditoria';
import { aprendentesApi } from '../src/api/aprendentes';

vi.mock('../src/api/auditoria', () => ({ auditoriaApi: { list: vi.fn() } }));
vi.mock('../src/api/aprendentes', () => ({ aprendentesApi: { findById: vi.fn(), addHistorico: vi.fn() } }));

const renderAt = (path, routePath, element) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes><Route path={routePath} element={element} /></Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

const logs = [
  {
    id: 'l1', timestamp: '2026-11-13T13:00:00.000Z', userId: 'admin-1', userRole: 'ADMIN', action: 'READ',
    entity: 'Aprendente', entityId: 'ap-001', aprendenteId: 'ap-001', ip: '10.0.0.1', diff: null,
    user: { id: 'admin-1', name: 'Administrador' },
  },
  {
    id: 'l2', timestamp: '2026-11-13T12:00:00.000Z', userId: 'user-001', userRole: 'PSICOPEDAGOGO', action: 'UPDATE',
    entity: 'Aprendente', entityId: 'ap-001', aprendenteId: 'ap-001', ip: '10.0.0.2',
    diff: { escolaSerie: { de: '3º ano', para: '4º ano' } },
    user: { id: 'user-001', name: 'Ana Lima' },
  },
];

describe('AuditoriaPage (ADMIN)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auditoriaApi.list.mockResolvedValue({ data: { data: logs, meta: { total: 2 } } });
  });

  it('lista os registros com usuário, perfil, ação e registro afetado', async () => {
    renderAt('/auditoria', '/auditoria', <AuditoriaPage />);

    expect(await screen.findByText('Administrador')).toBeInTheDocument();
    expect(screen.getByText('Ana Lima')).toBeInTheDocument();
    expect(screen.getByText('Consulta')).toBeInTheDocument();
    expect(screen.getByText('Alteração')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(auditoriaApi.list).toHaveBeenCalledWith({ page: 1, limit: 10 });
  });

  it('mostra os valores anteriores e novos de uma alteração não clínica', async () => {
    // Valores de registros clínicos não chegam ao ADMIN; os de instrumentos, sim
    auditoriaApi.list.mockResolvedValue({ data: { data: [{
      id: 'l4', timestamp: '2026-11-13T12:00:00.000Z', userId: 'user-001', userRole: 'PSICOPEDAGOGO', action: 'UPDATE',
      entity: 'Avaliacao', entityId: 'av-1', aprendenteId: null, ip: '10.0.0.2',
      diff: { name: { de: 'Leitura', para: 'Leitura e Escrita' } },
      user: { id: 'user-001', name: 'Ana Lima' },
    }], meta: { total: 1 } } });
    renderAt('/auditoria', '/auditoria', <AuditoriaPage />);
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Ver detalhes' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/"de": "Leitura"/)).toBeInTheDocument();
    expect(within(dialog).getByText(/"para": "Leitura e Escrita"/)).toBeInTheDocument();
  });

  it('explica a omissão dos valores clínicos e lista os campos alterados', async () => {
    auditoriaApi.list.mockResolvedValue({ data: { data: [{
      id: 'l3', timestamp: '2026-11-13T12:00:00.000Z', userId: 'user-001', userRole: 'PSICOPEDAGOGO', action: 'UPDATE',
      entity: 'Relatorio', entityId: 'rel-1', aprendenteId: 'ap-001', ip: '10.0.0.2',
      diff: { omitido: true, campos: ['conclusao', 'observacoesProfissional'] },
      user: { id: 'user-001', name: 'Ana Lima' },
    }], meta: { total: 1 } } });
    renderAt('/auditoria', '/auditoria', <AuditoriaPage />);
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Ver detalhes' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/não são exibidos ao administrador/)).toBeInTheDocument();
    expect(within(dialog).getByText(/conclusao, observacoesProfissional/)).toBeInTheDocument();
    expect(within(dialog).queryByText(/"omitido"/)).not.toBeInTheDocument();
  });

  it('filtra por ação', async () => {
    renderAt('/auditoria', '/auditoria', <AuditoriaPage />);
    const user = userEvent.setup();
    await screen.findByText('Administrador');

    await user.click(screen.getAllByRole('combobox')[1]);
    await user.click(await screen.findByRole('option', { name: 'Consulta' }));

    await waitFor(() => expect(auditoriaApi.list).toHaveBeenLastCalledWith({ action: 'READ', page: 1, limit: 10 }));
  });
});

describe('AprendenteDetailPage – registro de acessos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    aprendentesApi.findById.mockResolvedValue({ data: { data: {
      id: 'ap-001', name: 'João Pedro', birthDate: '2015-03-12T00:00:00.000Z', sexo: 'MASCULINO',
      responsavelNome: 'Maria', contatoPrincipal: '31999990000', historico: [], _count: { aplicacoes: 0 },
    } } });
    auditoriaApi.list.mockResolvedValue({ data: { data: logs, meta: { total: 2 } } });
  });

  it('exibe os acessos ao aprendente, incluindo os do administrador', async () => {
    renderAt('/aprendentes/ap-001', '/aprendentes/:id', <AprendenteDetailPage />);
    const user = userEvent.setup();

    await user.click(await screen.findByRole('tab', { name: /registro de acessos/i }));

    expect(await screen.findByText('Administrador')).toBeInTheDocument();
    expect(auditoriaApi.list).toHaveBeenCalledWith({ aprendenteId: 'ap-001', page: 1, limit: 10 });
  });

  it('exibe a mensagem de erro da API', async () => {
    auditoriaApi.list.mockRejectedValue({ response: { data: { message: 'Aprendente não encontrado' } } });
    renderAt('/aprendentes/ap-001', '/aprendentes/:id', <AprendenteDetailPage />);
    const user = userEvent.setup();

    await user.click(await screen.findByRole('tab', { name: /registro de acessos/i }));

    expect(await screen.findByText('Aprendente não encontrado')).toBeInTheDocument();
  });
});
