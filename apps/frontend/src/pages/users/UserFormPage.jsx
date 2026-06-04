import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, Button, Card, CardContent, Grid, TextField, MenuItem, Typography, Alert, CircularProgress } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { usersApi } from '../../api/users';
import { createUserSchema, updateUserSchema } from '@psicopedagogia/shared-validation';
import PageHeader from '../../components/common/PageHeader';

const UserFormPage = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => usersApi.findById(id).then((r) => r.data.data),
    enabled: isEdit,
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(isEdit ? updateUserSchema : createUserSchema),
  });

  useEffect(() => { if (user) reset(user); }, [user, reset]);

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? usersApi.update(id, data) : usersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      navigate('/users');
    },
  });

  if (isEdit && isLoading) return <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>;

  return (
    <Box>
      <PageHeader title={isEdit ? 'Editar Usuário' : 'Novo Usuário'} />
      {mutation.isError && <Alert severity="error" sx={{ mb: 2 }}>{mutation.error?.response?.data?.message || 'Erro ao salvar'}</Alert>}
      <Card>
        <CardContent>
          <Box component="form" onSubmit={handleSubmit((d) => mutation.mutate(d))} noValidate>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField {...register('name')} label="Nome *" fullWidth error={!!errors.name} helperText={errors.name?.message} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField {...register('email')} label="Email *" type="email" fullWidth error={!!errors.email} helperText={errors.email?.message} />
              </Grid>
              {!isEdit && (
                <Grid item xs={12} md={6}>
                  <TextField {...register('password')} label="Senha *" type="password" fullWidth error={!!errors.password} helperText={errors.password?.message} />
                </Grid>
              )}
              <Grid item xs={12} md={3}>
                <TextField {...register('role')} label="Perfil" select fullWidth defaultValue="PSICOPEDAGOGO">
                  <MenuItem value="ADMIN">Administrador</MenuItem>
                  <MenuItem value="PSICOPEDAGOGO">Psicopedagogo</MenuItem>
                  <MenuItem value="VIEWER">Visualizador</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField {...register('status')} label="Status" select fullWidth defaultValue="ACTIVE">
                  <MenuItem value="ACTIVE">Ativo</MenuItem>
                  <MenuItem value="INACTIVE">Inativo</MenuItem>
                </TextField>
              </Grid>
            </Grid>
            <Box display="flex" gap={2} mt={3} justifyContent="flex-end">
              <Button variant="outlined" onClick={() => navigate('/users')}>Cancelar</Button>
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

export default UserFormPage;
