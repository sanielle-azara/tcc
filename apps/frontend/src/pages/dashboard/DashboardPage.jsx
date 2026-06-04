import { useQuery } from '@tanstack/react-query';
import { Box, Grid, Card, CardContent, Typography, CircularProgress, Alert, List, ListItem, ListItemText, Divider } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import { dashboardApi } from '../../api/dashboard';
import { formatDateTime } from '@psicopedagogia/shared-utils';
import StatusChip from '../../components/common/StatusChip';

const StatCard = ({ title, value, icon, color = 'primary.main' }) => (
  <Card>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography variant="body2" color="text.secondary">{title}</Typography>
          <Typography variant="h4" fontWeight={700} mt={0.5}>{value}</Typography>
        </Box>
        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${color}20`, color }}>{icon}</Box>
      </Box>
    </CardContent>
  </Card>
);

const DashboardPage = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardApi.getStats().then((r) => r.data.data),
  });

  if (isLoading) return <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">Erro ao carregar dashboard</Alert>;

  return (
    <Box>
      <Typography variant="h5" mb={3}>Dashboard</Typography>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total de Aprendentes" value={data.totalAprendentes} icon={<PeopleIcon />} color="primary.main" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Avaliações Ativas" value={data.totalAvaliacoes} icon={<AssignmentIcon />} color="secondary.main" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total de Aplicações" value={data.totalAplicacoes} icon={<PlaylistAddCheckIcon />} color="success.main" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Pendentes" value={data.aplicacoesPendentes} icon={<PendingActionsIcon />} color="warning.main" />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>Últimas Aplicações</Typography>
              {data.ultimasAplicacoes.length === 0 ? (
                <Typography color="text.secondary">Nenhuma aplicação registrada</Typography>
              ) : (
                <List disablePadding>
                  {data.ultimasAplicacoes.map((ap, i) => (
                    <Box key={ap.id}>
                      <ListItem disablePadding sx={{ py: 1 }}>
                        <ListItemText
                          primary={ap.aprendente?.name}
                          secondary={`${ap.avaliacao?.name} • ${ap.aplicador?.name} • ${formatDateTime(ap.createdAt)}`}
                        />
                        <StatusChip status={ap.status} />
                      </ListItem>
                      {i < data.ultimasAplicacoes.length - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>Status das Aplicações</Typography>
              {[
                { label: 'Em Andamento', value: data.aplicacoesEmAndamento, color: 'info' },
                { label: 'Rascunho', value: data.aplicacoesRascunho, color: 'warning' },
                { label: 'Finalizadas', value: data.aplicacoesFinalizadas, color: 'success' },
                { label: 'Pendentes', value: data.aplicacoesPendentes, color: 'default' },
              ].map(({ label, value, color }) => (
                <Box key={label} display="flex" justifyContent="space-between" mb={1.5}>
                  <Typography variant="body2">{label}</Typography>
                  <Typography variant="body2" fontWeight={600}>{value}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;
