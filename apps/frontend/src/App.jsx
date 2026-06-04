import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import theme from './theme';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';

import LoginPage from './pages/auth/LoginPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import ChangePasswordPage from './pages/auth/ChangePasswordPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import AprendentesListPage from './pages/aprendentes/AprendentesListPage';
import AprendenteFormPage from './pages/aprendentes/AprendenteFormPage';
import AprendenteDetailPage from './pages/aprendentes/AprendenteDetailPage';
import AvaliacoesListPage from './pages/avaliacoes/AvaliacoesListPage';
import AvaliacaoFormPage from './pages/avaliacoes/AvaliacaoFormPage';
import AplicacoesListPage from './pages/aplicacoes/AplicacoesListPage';
import AplicacaoFormPage from './pages/aplicacoes/AplicacaoFormPage';
import AplicacaoDetailPage from './pages/aplicacoes/AplicacaoDetailPage';
import RelatoriosListPage from './pages/relatorios/RelatoriosListPage';
import RelatorioDetailPage from './pages/relatorios/RelatorioDetailPage';
import UsersListPage from './pages/users/UsersListPage';
import UserFormPage from './pages/users/UserFormPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />

                <Route path="/aprendentes" element={<AprendentesListPage />} />
                <Route path="/aprendentes/novo" element={<AprendenteFormPage />} />
                <Route path="/aprendentes/:id" element={<AprendenteDetailPage />} />
                <Route path="/aprendentes/:id/editar" element={<AprendenteFormPage />} />

                <Route path="/avaliacoes" element={<AvaliacoesListPage />} />
                <Route path="/avaliacoes/nova" element={<AvaliacaoFormPage />} />
                <Route path="/avaliacoes/:id" element={<AvaliacoesListPage />} />
                <Route path="/avaliacoes/:id/editar" element={<AvaliacaoFormPage />} />

                <Route path="/aplicacoes" element={<AplicacoesListPage />} />
                <Route path="/aplicacoes/nova" element={<AplicacaoFormPage />} />
                <Route path="/aplicacoes/:id" element={<AplicacaoDetailPage />} />

                <Route path="/relatorios" element={<RelatoriosListPage />} />
                <Route path="/relatorios/:id" element={<RelatorioDetailPage />} />
                <Route path="/relatorios/aplicacao/:aplicacaoId" element={<RelatorioDetailPage />} />

                <Route path="/perfil/senha" element={<ChangePasswordPage />} />

                <Route
                  path="/users"
                  element={<ProtectedRoute roles={['ADMIN']}><UsersListPage /></ProtectedRoute>}
                />
                <Route
                  path="/users/novo"
                  element={<ProtectedRoute roles={['ADMIN']}><UserFormPage /></ProtectedRoute>}
                />
                <Route
                  path="/users/:id/editar"
                  element={<ProtectedRoute roles={['ADMIN']}><UserFormPage /></ProtectedRoute>}
                />
              </Route>

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
