import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Box, Button, Card, CardContent, TextField, Typography, Alert, CircularProgress } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { authApi } from '../../api/auth';
import { forgotPasswordSchema } from '@psicopedagogia/shared-validation';

const ForgotPasswordPage = () => {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data) => {
    setError('');
    try {
      await authApi.forgotPassword(data.email);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao enviar email');
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="background.default">
      <Card sx={{ width: '100%', maxWidth: 420 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight={700} mb={1}>Recuperar Senha</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Informe seu email para receber as instruções de recuperação.
          </Typography>

          {success ? (
            <Alert severity="success">
              Se o email existir no sistema, você receberá as instruções em breve.
              <Box mt={2}><Link to="/login">Voltar ao login</Link></Box>
            </Alert>
          ) : (
            <>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
                <TextField
                  {...register('email')}
                  label="Email"
                  type="email"
                  fullWidth
                  margin="normal"
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  autoFocus
                />
                <Button
                  type="submit" fullWidth variant="contained" size="large" sx={{ mt: 2 }}
                  disabled={isSubmitting}
                  startIcon={isSubmitting ? <CircularProgress size={18} /> : null}
                >
                  {isSubmitting ? 'Enviando...' : 'Enviar Email'}
                </Button>
                <Box textAlign="center" mt={2}>
                  <Link to="/login" style={{ fontSize: 14, color: '#1976d2' }}>Voltar ao login</Link>
                </Box>
              </Box>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ForgotPasswordPage;
