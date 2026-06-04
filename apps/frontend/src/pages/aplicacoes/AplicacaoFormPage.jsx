import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, Button, Card, CardContent, Grid, TextField, MenuItem, Typography, Alert, CircularProgress } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { aplicacoesApi } from '../../api/aplicacoes';
import { aprendentesApi } from '../../api/aprendentes';
import { avaliacoesApi } from '../../api/avaliacoes';
import { createAplicacaoSchema } from '@psicopedagogia/shared-validation';
import PageHeader from '../../components/common/PageHeader';

const AplicacaoFormPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: aprendentes } = useQuery({
    queryKey: ['aprendentes-select'],
    queryFn: () => aprendentesApi.list({ limit: 100 }).then((r) => r.data.data),
  });

  const { data: avaliacoes } = useQuery({
    queryKey: ['avaliacoes-select'],
    queryFn: () => avaliacoesApi.list({ limit: 100, status: 'ACTIVE' }).then((r) => r.data.data),
  });

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(createAplicacaoSchema),
  });

  const mutation = useMutation({
    mutationFn: (data) => aplicacoesApi.create(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['aplicacoes'] });
      navigate(`/aplicacoes/${res.data.data.id}`);
    },
  });

  return (
    <Box>
      <PageHeader title="Nova Aplicação" />
      {mutation.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {mutation.error?.response?.data?.message || 'Erro ao criar aplicação'}
        </Alert>
      )}
      <Card>
        <CardContent>
          <Box component="form" onSubmit={handleSubmit((d) => mutation.mutate(d))} noValidate>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  {...register('aprendentId')}
                  label="Aprendente *"
                  select
                  fullWidth
                  defaultValue=""
                  error={!!errors.aprendentId}
                  helperText={errors.aprendentId?.message}
                >
                  {(aprendentes || []).map((a) => (
                    <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  {...register('avaliacaoId')}
                  label="Avaliação *"
                  select
                  fullWidth
                  defaultValue=""
                  error={!!errors.avaliacaoId}
                  helperText={errors.avaliacaoId?.message}
                >
                  {(avaliacoes || []).map((a) => (
                    <MenuItem key={a.id} value={a.id}>{a.name} {a.category ? `(${a.category})` : ''}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  {...register('dataAplicacao')}
                  label="Data da Aplicação"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  {...register('observacoes')}
                  label="Observações"
                  fullWidth
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
            <Box display="flex" gap={2} mt={3} justifyContent="flex-end">
              <Button variant="outlined" onClick={() => navigate('/aplicacoes')}>Cancelar</Button>
              <Button type="submit" variant="contained" disabled={isSubmitting}
                startIcon={isSubmitting ? <CircularProgress size={18} /> : null}>
                {isSubmitting ? 'Criando...' : 'Criar Aplicação'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AplicacaoFormPage;
