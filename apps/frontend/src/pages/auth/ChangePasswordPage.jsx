import { useState } from 'react';
import { Box, Button, Card, CardContent, TextField, Typography, Alert, CircularProgress } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { authApi } from '../../api/auth';
import { changePasswordSchema } from '@psicopedagogia/shared-validation';
import PageHeader from '../../components/common/PageHeader';

const ChangePasswordPage = () => {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data) => {
    setError('');
    setSuccess(false);
    try {
      await authApi.changePassword(data);
      setSuccess(true);
      reset();
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao alterar senha');
    }
  };

  return (
    <Box maxWidth={500}>
      <PageHeader title="Alterar Senha" />
      <Card>
        <CardContent sx={{ p: 3 }}>
          {success && <Alert severity="success" sx={{ mb: 2 }}>Senha alterada com sucesso!</Alert>}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <TextField
              {...register('currentPassword')}
              label="Senha Atual"
              type="password"
              fullWidth
              margin="normal"
              error={!!errors.currentPassword}
              helperText={errors.currentPassword?.message}
            />
            <TextField
              {...register('newPassword')}
              label="Nova Senha"
              type="password"
              fullWidth
              margin="normal"
              error={!!errors.newPassword}
              helperText={errors.newPassword?.message}
            />
            <TextField
              {...register('confirmPassword')}
              label="Confirmar Nova Senha"
              type="password"
              fullWidth
              margin="normal"
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
            />
            <Button
              type="submit" variant="contained" sx={{ mt: 2 }}
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={18} /> : null}
            >
              {isSubmitting ? 'Salvando...' : 'Alterar Senha'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ChangePasswordPage;
