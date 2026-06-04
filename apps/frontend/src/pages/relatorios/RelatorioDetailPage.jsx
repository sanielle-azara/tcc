import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Button, Card, CardContent, Grid, Typography, CircularProgress,
  Alert, TextField, Divider, Chip, Snackbar,
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import SaveIcon from '@mui/icons-material/Save';
import { relatoriosApi } from '../../api/relatorios';
import { formatDate, formatDateTime, calculateAge } from '@psicopedagogia/shared-utils';
import PageHeader from '../../components/common/PageHeader';
import { useAuth } from '../../contexts/AuthContext';

const SectionTitle = ({ children }) => (
  <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 2, mb: 1, color: 'primary.main' }}>{children}</Typography>
);

const Field = ({ label, value }) => (
  <Grid item xs={12} sm={6} md={4}>
    <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
    <Typography variant="body2">{value || '—'}</Typography>
  </Grid>
);

const RelatorioDetailPage = () => {
  const { id, aplicacaoId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canEdit = user?.role !== 'VIEWER';

  const queryFn = id
    ? () => relatoriosApi.findById(id).then((r) => r.data.data)
    : () => relatoriosApi.findByAplicacao(aplicacaoId).then((r) => r.data.data);

  const queryKey = id ? ['relatorio', id] : ['relatorio-aplicacao', aplicacaoId];

  const { data, isLoading, error } = useQuery({ queryKey, queryFn });

  const [conclusao, setConclusao] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  const saveMutation = useMutation({
    mutationFn: () => relatoriosApi.createOrUpdate({
      aplicacaoId: data?.aplicacao?.id || aplicacaoId,
      conclusao: conclusao || data?.conclusao,
      observacoesProfissional: observacoes || data?.observacoesProfissional,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setSnack({ open: true, message: 'Relatório salvo!', severity: 'success' });
    },
    onError: (err) => setSnack({ open: true, message: err.response?.data?.message || 'Erro ao salvar', severity: 'error' }),
  });

  if (isLoading) return <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>;
  if (error || !data) {
    if (aplicacaoId) {
      return (
        <Box>
          <PageHeader title="Criar Relatório" />
          <Card>
            <CardContent>
              <TextField
                label="Observações do Profissional"
                fullWidth multiline rows={4} value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)} sx={{ mb: 2 }}
              />
              <TextField
                label="Conclusão"
                fullWidth multiline rows={6} value={conclusao}
                onChange={(e) => setConclusao(e.target.value)} sx={{ mb: 2 }}
              />
              <Button
                variant="contained" startIcon={<SaveIcon />}
                onClick={() => relatoriosApi.createOrUpdate({ aplicacaoId, conclusao, observacoesProfissional: observacoes })
                  .then(() => { queryClient.invalidateQueries(['relatorios']); navigate('/relatorios'); })}
              >
                Salvar Relatório
              </Button>
            </CardContent>
          </Card>
        </Box>
      );
    }
    return <Alert severity="error">Relatório não encontrado</Alert>;
  }

  const r = data;
  const ap = r.aplicacao;
  const aprendente = ap?.aprendente;
  const avaliacao = ap?.avaliacao;

  const handlePrint = () => window.print();

  return (
    <Box>
      <PageHeader
        title="Relatório de Avaliação Psicopedagógica"
        action={handlePrint}
        actionLabel="Imprimir"
        actionIcon={<PrintIcon />}
      />

      <Card sx={{ mb: 2, '@media print': { boxShadow: 'none' } }}>
        <CardContent>
          <Box textAlign="center" mb={2}>
            <Typography variant="h6" fontWeight={700}>RELATÓRIO DE AVALIAÇÃO PSICOPEDAGÓGICA</Typography>
            <Typography variant="body2" color="text.secondary">
              {formatDateTime(r.createdAt)}
            </Typography>
          </Box>

          <Divider />

          <SectionTitle>Dados do Aprendente</SectionTitle>
          <Grid container spacing={1}>
            <Field label="Nome" value={aprendente?.name} />
            <Field label="Nascimento" value={`${formatDate(aprendente?.birthDate)} (${calculateAge(aprendente?.birthDate)} anos)`} />
            <Field label="Sexo" value={aprendente?.sexo} />
            <Field label="Responsável" value={aprendente?.responsavelNome} />
            <Field label="Escola" value={aprendente?.escolaNome} />
            <Field label="Série" value={aprendente?.escolaSerie} />
          </Grid>

          <SectionTitle>Dados da Avaliação</SectionTitle>
          <Grid container spacing={1}>
            <Field label="Nome" value={avaliacao?.name} />
            <Field label="Categoria" value={avaliacao?.category} />
            <Field label="Versão" value={avaliacao ? `v${avaliacao.version}` : ''} />
            <Field label="Data de Aplicação" value={ap?.dataAplicacao ? formatDate(ap.dataAplicacao) : formatDate(ap?.finalizadaAt)} />
            <Field label="Profissional" value={r.autor?.name} />
          </Grid>

          <SectionTitle>Respostas</SectionTitle>
          {(avaliacao?.questions || []).map((q, i) => {
            const resposta = ap?.respostas?.find((r) => r.questionId === q.id);
            const valor = resposta?.valor?.v;
            return (
              <Box key={q.id} mb={2} pl={1} borderLeft="3px solid" sx={{ borderColor: 'primary.light' }}>
                <Typography variant="body2" fontWeight={500}>
                  {i + 1}. {q.text}
                  {q.required && <Chip label="Obrig." size="small" color="error" sx={{ ml: 1 }} />}
                </Typography>
                <Typography variant="body2" color={valor ? 'text.primary' : 'text.disabled'} mt={0.5}>
                  {valor !== undefined && valor !== null
                    ? Array.isArray(valor) ? valor.join(', ') : String(valor)
                    : 'Sem resposta'}
                </Typography>
              </Box>
            );
          })}

          {ap?.observacoes && (
            <>
              <SectionTitle>Observações da Aplicação</SectionTitle>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{ap.observacoes}</Typography>
            </>
          )}

          <SectionTitle>Observações do Profissional</SectionTitle>
          {canEdit ? (
            <TextField
              fullWidth multiline rows={4}
              value={observacoes !== '' ? observacoes : (r.observacoesProfissional || '')}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Descreva suas observações..."
            />
          ) : (
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{r.observacoesProfissional || '—'}</Typography>
          )}

          <SectionTitle>Conclusão</SectionTitle>
          {canEdit ? (
            <TextField
              fullWidth multiline rows={6}
              value={conclusao !== '' ? conclusao : (r.conclusao || '')}
              onChange={(e) => setConclusao(e.target.value)}
              placeholder="Descreva a conclusão do profissional..."
            />
          ) : (
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{r.conclusao || '—'}</Typography>
          )}

          {canEdit && (
            <Box display="flex" gap={2} mt={2} justifyContent="flex-end">
              <Button variant="contained" startIcon={<SaveIcon />}
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}>
                Salvar Relatório
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <Alert severity={snack.severity}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default RelatorioDetailPage;
