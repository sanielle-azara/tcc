import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Box, Button, Card, CardContent, TextField, Typography, Alert, CircularProgress } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { authApi } from '../../api/auth';
import { resetPasswordSchema } from '@psicopedagogia/shared-validation';

const ResetPasswordPage = () => {
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token: token || '' },
  });

  const onSubmit = async (data) => {
    setError('');
    try {
      await authApi.resetPassword(data);
      navigate('/login', { state: { message: 'Senha redefinida com sucesso. Faça login.' } });
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao redefinir senha');
    }
  };

  if (!token) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Alert severity="error">Token inválido. <Link to="/forgot-password">Solicitar novamente</Link></Alert>
      </Box>
    );
  }

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="background.default">
      <Card sx={{ width: '100%', maxWidth: 420 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight={700} mb={3}>Redefinir Senha</Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <input type="hidden" {...register('token')} />
            <TextField
              {...register('password')}
              label="Nova Senha"
              type="password"
              fullWidth
              margin="normal"
              error={!!errors.password}
              helperText={errors.password?.message}
            />
            <Button
              type="submit" fullWidth variant="contained" size="large" sx={{ mt: 2 }}
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={18} /> : null}
            >
              {isSubmitting ? 'Salvando...' : 'Redefinir Senha'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ResetPasswordPage;
