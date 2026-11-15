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
import { formatDate, formatDateOnly, formatDateTime, calculateAge } from '@psicopedagogia/shared-utils';
import PageHeader from '../../components/common/PageHeader';

const SectionTitle = ({ children }) => (
  <Typography className="print-section-title" variant="subtitle1" fontWeight={700} sx={{ mt: 2, mb: 1, color: 'primary.main' }}>{children}</Typography>
);

// 0 e false são respostas válidas; texto vazio e lista vazia não
const hasAnswer = (valor) =>
  valor !== undefined && valor !== null && valor !== '' && !(Array.isArray(valor) && valor.length === 0);

const formatAnswer = (valor) => {
  if (typeof valor === 'boolean') return valor ? 'Sim' : 'Não';
  if (Array.isArray(valor)) return valor.join(', ');
  return String(valor);
};

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

  const queryFn = id
    ? () => relatoriosApi.findById(id).then((r) => r.data.data)
    : () => relatoriosApi.findByAplicacao(aplicacaoId).then((r) => r.data.data);

  const queryKey = id ? ['relatorio', id] : ['relatorio-aplicacao', aplicacaoId];

  // 404 significa que o relatório ainda não existe: mostra o formulário de criação sem nova tentativa
  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn,
    retry: (failureCount, err) => err?.response?.status !== 404 && failureCount < 1,
  });

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

  const observacoesAtuais = observacoes !== '' ? observacoes : (r.observacoesProfissional || '');
  const conclusaoAtual = conclusao !== '' ? conclusao : (r.conclusao || '');

  return (
    <Box>
      <Box className="no-print">
        <PageHeader
          title="Relatório de Avaliação Psicopedagógica"
          action={handlePrint}
          actionLabel="Imprimir"
          actionIcon={<PrintIcon />}
        />
      </Box>

      <Card className="print-card" sx={{ mb: 2 }}>
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
            <Field label="Nascimento" value={`${formatDateOnly(aprendente?.birthDate)} (${calculateAge(aprendente?.birthDate)} anos)`} />
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
            <Field label="Data de Aplicação" value={ap?.dataAplicacao ? formatDateOnly(ap.dataAplicacao) : formatDate(ap?.finalizadaAt)} />
            <Field label="Profissional" value={r.autor?.name} />
          </Grid>

          <SectionTitle>Respostas</SectionTitle>
          {(avaliacao?.questions || []).map((q, i) => {
            const resposta = ap?.respostas?.find((r) => r.questionId === q.id);
            const valor = resposta?.valor?.v;
            const respondida = hasAnswer(valor);
            return (
              <Box key={q.id} className="print-block" mb={2} pl={1} borderLeft="3px solid" sx={{ borderColor: 'primary.light' }}>
                <Typography variant="body2" fontWeight={500}>
                  {i + 1}. {q.text}
                  {q.required && <Chip className="no-print" label="Obrig." size="small" color="error" sx={{ ml: 1 }} />}
                </Typography>
                <Typography variant="body2" color={respondida ? 'text.primary' : 'text.disabled'} mt={0.5}>
                  {respondida ? formatAnswer(valor) : 'Sem resposta'}
                </Typography>
              </Box>
            );
          })}

          {ap?.observacoes && (
            <Box className="print-block">
              <SectionTitle>Observações da Aplicação</SectionTitle>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{ap.observacoes}</Typography>
            </Box>
          )}

          <SectionTitle>Observações do Profissional</SectionTitle>
          <Box className="no-print">
            <TextField
              fullWidth multiline rows={4}
              value={observacoesAtuais}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Descreva suas observações..."
            />
          </Box>
          {/* Na impressão, o texto completo substitui a caixa de edição, que cortaria o conteúdo */}
          <Typography className="print-only" data-testid="print-observacoes" variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {observacoesAtuais || '—'}
          </Typography>

          <SectionTitle>Conclusão</SectionTitle>
          <Box className="no-print">
            <TextField
              fullWidth multiline rows={6}
              value={conclusaoAtual}
              onChange={(e) => setConclusao(e.target.value)}
              placeholder="Descreva a conclusão do profissional..."
            />
          </Box>
          <Typography className="print-only" data-testid="print-conclusao" variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {conclusaoAtual || '—'}
          </Typography>

          <Box className="print-only print-block" data-testid="print-assinatura" sx={{ mt: 8, textAlign: 'center' }}>
            <Box sx={{ borderTop: '1px solid #000', width: '60%', mx: 'auto', mb: 0.5 }} />
            <Typography variant="body2">{r.autor?.name}</Typography>
            <Typography variant="caption" color="text.secondary">Psicopedagogo(a) responsável</Typography>
          </Box>

          <Box className="no-print" display="flex" gap={2} mt={2} justifyContent="flex-end">
            <Button variant="contained" startIcon={<SaveIcon />}
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}>
              Salvar Relatório
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Snackbar className="no-print" open={snack.open} autoHideDuration={4000} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <Alert severity={snack.severity}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default RelatorioDetailPage;
