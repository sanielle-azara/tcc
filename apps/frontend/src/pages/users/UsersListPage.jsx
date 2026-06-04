import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, IconButton, Tooltip, Alert, Snackbar, TextField, InputAdornment } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { usersApi } from '../../api/users';
import { formatDate } from '@psicopedagogia/shared-utils';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusChip from '../../components/common/StatusChip';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const UsersListPage = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, rowsPerPage, search],
    queryFn: () => usersApi.list({ page: page + 1, limit: rowsPerPage, search }).then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => usersApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeleteId(null);
      setSnack({ open: true, message: 'Usuário excluído', severity: 'success' });
    },
    onError: (err) => setSnack({ open: true, message: err.response?.data?.message || 'Erro ao excluir', severity: 'error' }),
  });

  const columns = [
    { id: 'name', label: 'Nome' },
    { id: 'email', label: 'Email' },
    { id: 'role', label: 'Perfil', render: (row) => <StatusChip status={row.role} /> },
    { id: 'status', label: 'Status', render: (row) => <StatusChip status={row.status} /> },
    { id: 'createdAt', label: 'Cadastrado em', render: (row) => formatDate(row.createdAt) },
    {
      id: 'actions', label: 'Ações', align: 'center', width: 100,
      render: (row) => (
        <Box display="flex" justifyContent="center" gap={0.5}>
          <Tooltip title="Editar">
            <IconButton size="small" onClick={() => navigate(`/users/${row.id}/editar`)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Excluir">
            <IconButton size="small" color="error" onClick={() => setDeleteId(row.id)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Usuários"
        subtitle="Gerenciamento de usuários do sistema"
        action={() => navigate('/users/novo')}
        actionLabel="Novo Usuário"
      />
      <Box mb={2}>
        <TextField
          size="small"
          placeholder="Buscar usuários..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
          sx={{ width: 320 }}
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
        emptyMessage="Nenhum usuário encontrado"
      />
      <ConfirmDialog
        open={!!deleteId}
        title="Excluir Usuário"
        message="Tem certeza que deseja excluir este usuário?"
        onConfirm={() => deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <Alert severity={snack.severity}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default UsersListPage;
