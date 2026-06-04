import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Card, CardContent, Grid, Typography, Chip, Button, CircularProgress,
  Alert, Divider, TextField, List, ListItem, ListItemText, Tab, Tabs,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { aprendentesApi } from '../../api/aprendentes';
import { formatDate, calculateAge } from '@psicopedagogia/shared-utils';
import PageHeader from '../../components/common/PageHeader';
import { useAuth } from '../../contexts/AuthContext';

const InfoField = ({ label, value }) => (
  <Box mb={1.5}>
    <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
    <Typography variant="body1">{value || '—'}</Typography>
  </Box>
);

const AprendenteDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canEdit = user?.role !== 'VIEWER';
  const [tab, setTab] = useState(0);
  const [novaObs, setNovaObs] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['aprendente', id],
    queryFn: () => aprendentesApi.findById(id).then((r) => r.data.data),
  });

  const addHistoricoMutation = useMutation({
    mutationFn: (descricao) => aprendentesApi.addHistorico(id, descricao),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aprendente', id] });
      setNovaObs('');
    },
  });

  if (isLoading) return <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">Erro ao carregar aprendente</Alert>;

  const a = data;

  return (
    <Box>
      <PageHeader
        title={a.name}
        subtitle={`${calculateAge(a.birthDate)} anos • ${a.escolaSerie || 'Série não informada'}`}
        action={canEdit ? () => navigate(`/aprendentes/${id}/editar`) : undefined}
        actionLabel="Editar"
        actionIcon={<EditIcon />}
      />

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Dados Cadastrais" />
        <Tab label="Histórico de Acompanhamento" />
      </Tabs>

      {tab === 0 && (
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} mb={2}>Dados Pessoais</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}><InfoField label="Nome" value={a.name} /></Grid>
                  <Grid item xs={6}><InfoField label="Data de Nascimento" value={`${formatDate(a.birthDate)} (${calculateAge(a.birthDate)} anos)`} /></Grid>
                  <Grid item xs={6}><InfoField label="Sexo" value={a.sexo} /></Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} mb={2}>Responsável</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}><InfoField label="Nome" value={a.responsavelNome} /></Grid>
                  <Grid item xs={6}><InfoField label="Relação" value={a.responsavelRelacao} /></Grid>
                  <Grid item xs={6}><InfoField label="Contato Principal" value={a.contatoPrincipal} /></Grid>
                  <Grid item xs={6}><InfoField label="Contato Secundário" value={a.contatoSecundario} /></Grid>
                  <Grid item xs={12}><InfoField label="Email" value={a.email} /></Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} mb={2}>Escola</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}><InfoField label="Nome da Escola" value={a.escolaNome} /></Grid>
                  <Grid item xs={6}><InfoField label="Série/Ano" value={a.escolaSerie} /></Grid>
                  <Grid item xs={6}><InfoField label="Turno" value={a.escolaTurno} /></Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {a.observacoes && (
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={600} mb={2}>Observações</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{a.observacoes}</Typography>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      {tab === 1 && (
        <Box>
          {canEdit && (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} mb={1}>Registrar Acompanhamento</Typography>
                <TextField
                  multiline rows={3} fullWidth
                  placeholder="Descreva a observação ou evolução do aprendente..."
                  value={novaObs}
                  onChange={(e) => setNovaObs(e.target.value)}
                />
                <Box mt={1} display="flex" justifyContent="flex-end">
                  <Button
                    variant="contained" startIcon={<AddIcon />}
                    onClick={() => addHistoricoMutation.mutate(novaObs)}
                    disabled={!novaObs.trim() || addHistoricoMutation.isPending}
                  >
                    Registrar
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} mb={2}>Histórico</Typography>
              {(a.historico || []).length === 0 ? (
                <Typography color="text.secondary">Nenhum registro de acompanhamento</Typography>
              ) : (
                <List disablePadding>
                  {a.historico.map((h, i) => (
                    <Box key={h.id}>
                      <ListItem disablePadding sx={{ py: 1.5 }}>
                        <ListItemText
                          primary={h.descricao}
                          secondary={formatDate(h.data)}
                          primaryTypographyProps={{ style: { whiteSpace: 'pre-wrap' } }}
                        />
                      </ListItem>
                      {i < a.historico.length - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default AprendenteDetailPage;
