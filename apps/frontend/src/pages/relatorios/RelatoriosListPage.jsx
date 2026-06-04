import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Box, IconButton, Tooltip } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { relatoriosApi } from '../../api/relatorios';
import { formatDate } from '@psicopedagogia/shared-utils';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';

const RelatoriosListPage = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['relatorios', page, rowsPerPage],
    queryFn: () => relatoriosApi.list({ page: page + 1, limit: rowsPerPage }).then((r) => r.data),
  });

  const columns = [
    { id: 'aprendente', label: 'Aprendente', render: (row) => row.aplicacao?.aprendente?.name },
    { id: 'avaliacao', label: 'Avaliação', render: (row) => row.aplicacao?.avaliacao?.name },
    { id: 'autor', label: 'Profissional', render: (row) => row.autor?.name },
    { id: 'createdAt', label: 'Data', render: (row) => formatDate(row.createdAt) },
    {
      id: 'actions', label: 'Ações', align: 'center', width: 80,
      render: (row) => (
        <Tooltip title="Visualizar Relatório">
          <IconButton size="small" onClick={() => navigate(`/relatorios/${row.id}`)}>
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader title="Relatórios" subtitle="Relatórios das avaliações finalizadas" />
      <DataTable
        columns={columns}
        rows={data?.data || []}
        total={data?.meta?.total || 0}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={(_, p) => setPage(p)}
        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
        loading={isLoading}
        emptyMessage="Nenhum relatório encontrado"
      />
    </Box>
  );
};

export default RelatoriosListPage;
