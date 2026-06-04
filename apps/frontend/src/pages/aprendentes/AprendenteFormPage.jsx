import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Button, Card, CardContent, Grid, TextField, MenuItem, Typography,
  Alert, CircularProgress, Divider,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { aprendentesApi } from '../../api/aprendentes';
import { createAprendentSchema, updateAprendentSchema } from '@psicopedagogia/shared-validation';
import PageHeader from '../../components/common/PageHeader';

const AprendenteFormPage = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: aprendente, isLoading: loadingData } = useQuery({
    queryKey: ['aprendente', id],
    queryFn: () => aprendentesApi.findById(id).then((r) => r.data.data),
    enabled: isEdit,
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(isEdit ? updateAprendentSchema : createAprendentSchema),
  });

  useEffect(() => {
    if (aprendente) {
      reset({
        ...aprendente,
        birthDate: aprendente.birthDate ? new Date(aprendente.birthDate).toISOString().split('T')[0] : '',
      });
    }
  }, [aprendente, reset]);

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? aprendentesApi.update(id, data) : aprendentesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aprendentes'] });
      navigate('/aprendentes');
    },
  });

  if (isEdit && loadingData) return <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>;

  return (
    <Box>
      <PageHeader title={isEdit ? 'Editar Aprendente' : 'Novo Aprendente'} />

      {mutation.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {mutation.error?.response?.data?.message || 'Erro ao salvar'}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box component="form" onSubmit={handleSubmit((d) => mutation.mutate(d))} noValidate>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>Dados do Aprendente</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField {...register('name')} label="Nome Completo *" fullWidth error={!!errors.name} helperText={errors.name?.message} />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField {...register('birthDate')} label="Data de Nascimento *" type="date" fullWidth InputLabelProps={{ shrink: true }} error={!!errors.birthDate} helperText={errors.birthDate?.message} />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField {...register('sexo')} label="Sexo *" select fullWidth error={!!errors.sexo} helperText={errors.sexo?.message} defaultValue="">
                  <MenuItem value="MASCULINO">Masculino</MenuItem>
                  <MenuItem value="FEMININO">Feminino</MenuItem>
                  <MenuItem value="OUTRO">Outro</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle1" fontWeight={600} mb={2}>Responsável</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={5}>
                <TextField {...register('responsavelNome')} label="Nome do Responsável *" fullWidth error={!!errors.responsavelNome} helperText={errors.responsavelNome?.message} />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField {...register('responsavelRelacao')} label="Relação" fullWidth error={!!errors.responsavelRelacao} helperText={errors.responsavelRelacao?.message} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField {...register('email')} label="Email" type="email" fullWidth error={!!errors.email} helperText={errors.email?.message} />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField {...register('contatoPrincipal')} label="Contato Principal *" fullWidth error={!!errors.contatoPrincipal} helperText={errors.contatoPrincipal?.message} />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField {...register('contatoSecundario')} label="Contato Secundário" fullWidth error={!!errors.contatoSecundario} helperText={errors.contatoSecundario?.message} />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle1" fontWeight={600} mb={2}>Dados Escolares</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={5}>
                <TextField {...register('escolaNome')} label="Nome da Escola" fullWidth error={!!errors.escolaNome} helperText={errors.escolaNome?.message} />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField {...register('escolaSerie')} label="Série/Ano" fullWidth error={!!errors.escolaSerie} helperText={errors.escolaSerie?.message} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField {...register('escolaTurno')} label="Turno" fullWidth error={!!errors.escolaTurno} helperText={errors.escolaTurno?.message} />
              </Grid>
              <Grid item xs={12}>
                <TextField {...register('observacoes')} label="Observações" fullWidth multiline rows={3} error={!!errors.observacoes} helperText={errors.observacoes?.message} />
              </Grid>
            </Grid>

            <Box display="flex" gap={2} mt={3} justifyContent="flex-end">
              <Button variant="outlined" onClick={() => navigate('/aprendentes')}>Cancelar</Button>
              <Button type="submit" variant="contained" disabled={isSubmitting}
                startIcon={isSubmitting ? <CircularProgress size={18} /> : null}>
                {isSubmitting ? 'Salvando...' : 'Salvar'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AprendenteFormPage;
