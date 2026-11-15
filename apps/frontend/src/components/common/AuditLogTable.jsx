import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Chip, Dialog, DialogContent, DialogTitle, DialogActions, Button, IconButton, Tooltip, Typography, Alert,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { formatDateTime } from '@psicopedagogia/shared-utils';
import { auditoriaApi } from '../../api/auditoria';
import DataTable from './DataTable';
import StatusChip from './StatusChip';

export const AUDIT_ACTIONS = {
  CREATE: { label: 'Criação', color: 'success' },
  UPDATE: { label: 'Alteração', color: 'info' },
  DELETE: { label: 'Exclusão', color: 'error' },
  READ: { label: 'Consulta', color: 'default' },
  LIST: { label: 'Listagem', color: 'default' },
  LOGIN: { label: 'Login', color: 'primary' },
  LOGIN_FAILED: { label: 'Login recusado', color: 'warning' },
};

export const AUDIT_ENTITIES = {
  Aprendente: 'Aprendente',
  HistoricoAprendente: 'Histórico',
  Aplicacao: 'Aplicação',
  Resposta: 'Resposta',
  Relatorio: 'Relatório',
  Avaliacao: 'Instrumento',
  Question: 'Pergunta',
  User: 'Usuário',
};

const ActionChip = ({ action }) => {
  const cfg = AUDIT_ACTIONS[action] || { label: action, color: 'default' };
  return <Chip label={cfg.label} color={cfg.color} size="small" variant={cfg.color === 'default' ? 'outlined' : 'filled'} />;
};

// Tabela paginada do registro de auditoria; `params` são os filtros enviados à API
const AuditLogTable = ({ params = {}, showAprendente = false, emptyMessage = 'Nenhum registro encontrado' }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [detail, setDetail] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['auditoria', params, page, rowsPerPage],
    queryFn: () => auditoriaApi.list({ ...params, page: page + 1, limit: rowsPerPage }).then((r) => r.data),
  });

  const columns = [
    { id: 'timestamp', label: 'Data e hora', render: (row) => formatDateTime(row.timestamp) },
    {
      id: 'user', label: 'Usuário',
      render: (row) => (row.user ? row.user.name : <Typography variant="body2" color="text.secondary">—</Typography>),
    },
    { id: 'userRole', label: 'Perfil', render: (row) => (row.userRole ? <StatusChip status={row.userRole} /> : '—') },
    { id: 'action', label: 'Ação', render: (row) => <ActionChip action={row.action} /> },
    { id: 'entity', label: 'Registro', render: (row) => AUDIT_ENTITIES[row.entity] || row.entity },
    ...(showAprendente ? [{ id: 'aprendenteId', label: 'Aprendente (id)', render: (row) => row.aprendenteId || '—' }] : []),
    { id: 'ip', label: 'IP', render: (row) => row.ip || '—' },
    {
      id: 'diff', label: 'Detalhes', align: 'center',
      render: (row) => (row.diff ? (
        <Tooltip title="Ver detalhes">
          <IconButton size="small" onClick={() => setDetail(row)} aria-label="Ver detalhes">
            <InfoOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ) : '—'),
    },
  ];

  if (error) {
    return <Alert severity="error">{error.response?.data?.message || 'Erro ao carregar o registro de auditoria'}</Alert>;
  }

  return (
    <Box>
      <DataTable
        columns={columns}
        rows={data?.data || []}
        total={data?.meta?.total || 0}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={(_, p) => setPage(p)}
        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
        loading={isLoading}
        emptyMessage={emptyMessage}
      />
      <Dialog open={!!detail} onClose={() => setDetail(null)} maxWidth="md" fullWidth>
        <DialogTitle>
          {detail && `${AUDIT_ACTIONS[detail.action]?.label || detail.action} – ${AUDIT_ENTITIES[detail.entity] || detail.entity}`}
        </DialogTitle>
        <DialogContent dividers>
          {detail?.entityId && (
            <Typography variant="caption" color="text.secondary" display="block" mb={1}>
              Registro: {detail.entityId}
            </Typography>
          )}
          {detail?.diff?.omitido ? (
            // A API não envia ao administrador os valores de registros clínicos
            <Alert severity="info">
              Os valores deste registro não são exibidos ao administrador, por se tratar de dados clínicos
              protegidos pelo sigilo profissional.
              {detail.diff.campos?.length > 0 && ` Campos alterados: ${detail.diff.campos.join(', ')}.`}
              {detail.diff.quantidade !== undefined && ` Registros afetados: ${detail.diff.quantidade}.`}
            </Alert>
          ) : (
            <Box component="pre" sx={{ m: 0, fontSize: 13, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {detail && JSON.stringify(detail.diff, null, 2)}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetail(null)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AuditLogTable;
