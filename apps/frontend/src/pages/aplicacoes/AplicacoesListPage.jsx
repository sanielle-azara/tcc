import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, IconButton, Tooltip, Alert, Snackbar } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import { aplicacoesApi } from '../../api/aplicacoes';
import { formatDate } from '@psicopedagogia/shared-utils';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusChip from '../../components/common/StatusChip';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useAuth } from '../../contexts/AuthContext';

const AplicacoesListPage = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteId, setDeleteId] = useState(null);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canEdit = user?.role !== 'VIEWER';

  const { data, isLoading } = useQuery({
    queryKey: ['aplicacoes', page, rowsPerPage],
    queryFn: () => aplicacoesApi.list({ page: page + 1, limit: rowsPerPage }).then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => aplicacoesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aplicacoes'] });
      setDeleteId(null);
      setSnack({ open: true, message: 'Aplicação excluída', severity: 'success' });
    },
    onError: (err) => setSnack({ open: true, message: err.response?.data?.message || 'Erro ao excluir', severity: 'error' }),
  });

  const columns = [
    { id: 'aprendente', label: 'Aprendente', render: (row) => row.aprendente?.name },
    { id: 'avaliacao', label: 'Avaliação', render: (row) => row.avaliacao?.name },
    { id: 'aplicador', label: 'Aplicador', render: (row) => row.aplicador?.name },
    { id: 'status', label: 'Status', render: (row) => <StatusChip status={row.status} /> },
    { id: 'dataAplicacao', label: 'Data', render: (row) => row.dataAplicacao ? formatDate(row.dataAplicacao) : '—' },
    { id: 'createdAt', label: 'Criada em', render: (row) => formatDate(row.createdAt) },
    {
      id: 'actions', label: 'Ações', align: 'center', width: 100,
      render: (row) => (
        <Box display="flex" justifyContent="center" gap={0.5}>
          <Tooltip title="Visualizar/Responder">
            <IconButton size="small" onClick={() => navigate(`/aplicacoes/${row.id}`)}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {canEdit && row.status !== 'COMPLETED' && (
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
        title="Aplicações"
        subtitle="Aplicação de avaliações aos aprendentes"
        action={canEdit ? () => navigate('/aplicacoes/nova') : undefined}
        actionLabel="Nova Aplicação"
      />
      <DataTable
        columns={columns}
        rows={data?.data || []}
        total={data?.meta?.total || 0}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={(_, p) => setPage(p)}
        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
        loading={isLoading}
        emptyMessage="Nenhuma aplicação encontrada"
      />
      <ConfirmDialog
        open={!!deleteId}
        title="Excluir Aplicação"
        message="Tem certeza que deseja excluir esta aplicação?"
        onConfirm={() => deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <Alert severity={snack.severity}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default AplicacoesListPage;
