import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, TextField, InputAdornment, IconButton, Tooltip, Alert, Snackbar, Chip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { avaliacoesApi } from '../../api/avaliacoes';
import { formatDate } from '@psicopedagogia/shared-utils';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusChip from '../../components/common/StatusChip';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useAuth } from '../../contexts/AuthContext';

const AvaliacoesListPage = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canEdit = user?.role !== 'VIEWER';
  const isAdmin = user?.role === 'ADMIN';

  const { data, isLoading } = useQuery({
    queryKey: ['avaliacoes', page, rowsPerPage, search],
    queryFn: () => avaliacoesApi.list({ page: page + 1, limit: rowsPerPage, search }).then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => avaliacoesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avaliacoes'] });
      setDeleteId(null);
      setSnack({ open: true, message: 'Avaliação excluída', severity: 'success' });
    },
    onError: (err) => setSnack({ open: true, message: err.response?.data?.message || 'Erro ao excluir', severity: 'error' }),
  });

  const columns = [
    { id: 'name', label: 'Nome' },
    { id: 'category', label: 'Categoria', render: (row) => row.category ? <Chip label={row.category} size="small" variant="outlined" /> : '—' },
    { id: 'version', label: 'Versão', render: (row) => `v${row.version}` },
    { id: '_count', label: 'Perguntas', align: 'center', render: (row) => row._count?.questions || 0 },
    { id: 'status', label: 'Status', render: (row) => <StatusChip status={row.status} /> },
    { id: 'createdAt', label: 'Criada em', render: (row) => formatDate(row.createdAt) },
    {
      id: 'actions', label: 'Ações', align: 'center', width: 120,
      render: (row) => (
        <Box display="flex" justifyContent="center" gap={0.5}>
          <Tooltip title="Visualizar">
            <IconButton size="small" onClick={() => navigate(`/avaliacoes/${row.id}`)}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {canEdit && (
            <Tooltip title="Editar">
              <IconButton size="small" onClick={() => navigate(`/avaliacoes/${row.id}/editar`)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {isAdmin && (
            <Tooltip title="Excluir">
              <IconButton size="small" color="error" onClick={() => setDeleteId(row.id)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Avaliações"
        subtitle="Formulários de avaliação psicopedagógica"
        action={canEdit ? () => navigate('/avaliacoes/nova') : undefined}
        actionLabel="Nova Avaliação"
      />
      <Box mb={2}>
        <TextField
          size="small"
          placeholder="Buscar avaliações..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
          sx={{ width: 360 }}
        />
      </Box>
      <DataTable
        columns={columns}
        rows={data?.data || []}
        total={data?.meta?.total || 0}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={(_, p) => setPage(p)}
        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
        loading={isLoading}
        emptyMessage="Nenhuma avaliação encontrada"
      />
      <ConfirmDialog
        open={!!deleteId}
        title="Excluir Avaliação"
        message="Tem certeza que deseja excluir esta avaliação?"
        onConfirm={() => deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <Alert severity={snack.severity}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default AvaliacoesListPage;
