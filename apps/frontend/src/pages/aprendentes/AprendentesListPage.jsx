import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, TextField, InputAdornment, IconButton, Tooltip, Alert, Snackbar } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { aprendentesApi } from '../../api/aprendentes';
import { formatDate, calculateAge } from '@psicopedagogia/shared-utils';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useAuth } from '../../contexts/AuthContext';

const AprendentesListPage = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canEdit = user?.role !== 'VIEWER';

  const { data, isLoading } = useQuery({
    queryKey: ['aprendentes', page, rowsPerPage, search],
    queryFn: () => aprendentesApi.list({ page: page + 1, limit: rowsPerPage, search }).then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => aprendentesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aprendentes'] });
      setDeleteId(null);
      setSnack({ open: true, message: 'Aprendente excluído com sucesso', severity: 'success' });
    },
    onError: (err) => {
      setSnack({ open: true, message: err.response?.data?.message || 'Erro ao excluir', severity: 'error' });
    },
  });

  const columns = [
    { id: 'name', label: 'Nome' },
    { id: 'age', label: 'Idade', render: (row) => `${calculateAge(row.birthDate)} anos` },
    { id: 'birthDate', label: 'Nascimento', render: (row) => formatDate(row.birthDate) },
    { id: 'responsavelNome', label: 'Responsável' },
    { id: 'escolaNome', label: 'Escola' },
    { id: 'escolaSerie', label: 'Série' },
    {
      id: 'actions', label: 'Ações', align: 'center', width: 120,
      render: (row) => (
        <Box display="flex" justifyContent="center" gap={0.5}>
          <Tooltip title="Visualizar">
            <IconButton size="small" onClick={() => navigate(`/aprendentes/${row.id}`)}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {canEdit && (
            <Tooltip title="Editar">
              <IconButton size="small" onClick={() => navigate(`/aprendentes/${row.id}/editar`)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {canEdit && (
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
        title="Aprendentes"
        subtitle="Gerenciamento de estudantes"
        action={canEdit ? () => navigate('/aprendentes/novo') : undefined}
        actionLabel="Novo Aprendente"
      />

      <Box mb={2}>
        <TextField
          size="small"
          placeholder="Buscar por nome, responsável ou escola..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
          }}
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
        emptyMessage="Nenhum aprendente encontrado"
      />

      <ConfirmDialog
        open={!!deleteId}
        title="Excluir Aprendente"
        message="Tem certeza que deseja excluir este aprendente? Esta ação não pode ser desfeita."
        onConfirm={() => deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <Alert severity={snack.severity}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default AprendentesListPage;
