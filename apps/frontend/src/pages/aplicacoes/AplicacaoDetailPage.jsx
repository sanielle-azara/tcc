import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Button, Card, CardContent, Typography, CircularProgress, Alert,
  TextField, FormControlLabel, Checkbox, Radio, RadioGroup, FormControl,
  FormLabel, Slider, Grid, Divider, Snackbar, Chip,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DescriptionIcon from '@mui/icons-material/Description';
import { aplicacoesApi } from '../../api/aplicacoes';
import { formatDate } from '@psicopedagogia/shared-utils';
import PageHeader from '../../components/common/PageHeader';
import StatusChip from '../../components/common/StatusChip';
import { useAuth } from '../../contexts/AuthContext';

const QuestionInput = ({ question, value, onChange }) => {
  switch (question.type) {
    case 'TEXT':
      return <TextField fullWidth value={value || ''} onChange={(e) => onChange(e.target.value)} />;

    case 'LONG_TEXT':
      return <TextField fullWidth multiline rows={4} value={value || ''} onChange={(e) => onChange(e.target.value)} />;

    case 'NUMERIC':
      return <TextField type="number" value={value || ''} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)} sx={{ width: 200 }} />;

    case 'DATE':
      return <TextField type="date" InputLabelProps={{ shrink: true }} value={value || ''} onChange={(e) => onChange(e.target.value)} />;

    case 'YES_NO':
      return (
        <FormControl>
          <RadioGroup row value={value === true ? 'true' : value === false ? 'false' : ''} onChange={(e) => onChange(e.target.value === 'true')}>
            <FormControlLabel value="true" control={<Radio />} label="Sim" />
            <FormControlLabel value="false" control={<Radio />} label="Não" />
          </RadioGroup>
        </FormControl>
      );

    case 'SINGLE_SELECT': {
      const opts = question.options ? (Array.isArray(question.options) ? question.options : JSON.parse(question.options)) : [];
      return (
        <FormControl>
          <RadioGroup value={value || ''} onChange={(e) => onChange(e.target.value)}>
            {opts.map((opt) => <FormControlLabel key={opt} value={opt} control={<Radio />} label={opt} />)}
          </RadioGroup>
        </FormControl>
      );
    }

    case 'MULTI_SELECT': {
      const opts = question.options ? (Array.isArray(question.options) ? question.options : JSON.parse(question.options)) : [];
      const selected = value || [];
      return (
        <Box>
          {opts.map((opt) => (
            <FormControlLabel
              key={opt}
              control={
                <Checkbox
                  checked={selected.includes(opt)}
                  onChange={(e) => {
                    const next = e.target.checked ? [...selected, opt] : selected.filter((v) => v !== opt);
                    onChange(next);
                  }}
                />
              }
              label={opt}
            />
          ))}
        </Box>
      );
    }

    case 'SCALE':
      return (
        <Box sx={{ width: 300, px: 2 }}>
          <Slider
            value={value ?? question.scaleMin ?? 1}
            min={question.scaleMin ?? 1}
            max={question.scaleMax ?? 5}
            marks
            valueLabelDisplay="auto"
            onChange={(_, v) => onChange(v)}
          />
          <Box display="flex" justifyContent="space-between">
            <Typography variant="caption">{question.scaleMinLabel}</Typography>
            <Typography variant="caption">{question.scaleMaxLabel}</Typography>
          </Box>
        </Box>
      );

    default:
      return null;
  }
};

const AplicacaoDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canEdit = user?.role !== 'VIEWER';
  const [answers, setAnswers] = useState({});
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  const { data, isLoading, error } = useQuery({
    queryKey: ['aplicacao', id],
    queryFn: () => aplicacoesApi.findById(id).then((r) => r.data.data),
    onSuccess: (d) => {
      const initial = {};
      d.respostas?.forEach((r) => {
        initial[r.questionId] = r.valor?.v;
      });
      setAnswers(initial);
    },
  });

  const saveMutation = useMutation({
    mutationFn: ({ isDraft }) => aplicacoesApi.saveAnswers(id, {
      answers: Object.entries(answers).map(([questionId, value]) => ({ questionId, value })),
      isDraft,
    }),
    onSuccess: (_, { isDraft }) => {
      queryClient.invalidateQueries({ queryKey: ['aplicacao', id] });
      setSnack({ open: true, message: isDraft ? 'Rascunho salvo!' : 'Respostas salvas!', severity: 'success' });
    },
    onError: (err) => setSnack({ open: true, message: err.response?.data?.message || 'Erro ao salvar', severity: 'error' }),
  });

  const finalizeMutation = useMutation({
    mutationFn: () => aplicacoesApi.finalize(id, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aplicacao', id] });
      queryClient.invalidateQueries({ queryKey: ['aplicacoes'] });
      navigate('/relatorios');
    },
    onError: (err) => setSnack({ open: true, message: err.response?.data?.message || 'Erro ao finalizar', severity: 'error' }),
  });

  if (isLoading) return <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">Erro ao carregar aplicação</Alert>;

  const ap = data;
  const isCompleted = ap.status === 'COMPLETED';
  const questions = ap.avaliacao?.questions || [];

  return (
    <Box>
      <PageHeader title={`Aplicação: ${ap.avaliacao?.name}`} subtitle={`Aprendente: ${ap.aprendente?.name}`} />

      <Box display="flex" gap={1} mb={3} flexWrap="wrap">
        <StatusChip status={ap.status} />
        <Chip label={`Aplicador: ${ap.aplicador?.name}`} size="small" variant="outlined" />
        {ap.dataAplicacao && <Chip label={`Data: ${formatDate(ap.dataAplicacao)}`} size="small" variant="outlined" />}
      </Box>

      {questions.map((q, idx) => (
        <Card key={q.id} sx={{ mb: 2 }}>
          <CardContent>
            <Box display="flex" gap={1} mb={1}>
              <Typography variant="body2" color="text.secondary">#{idx + 1}</Typography>
              {q.required && <Chip label="Obrigatória" size="small" color="error" variant="outlined" />}
            </Box>
            <Typography variant="body1" fontWeight={500} mb={1}>
              {q.text}
            </Typography>
            {q.helpText && <Typography variant="caption" color="text.secondary" display="block" mb={1}>{q.helpText}</Typography>}
            {!isCompleted && canEdit ? (
              <QuestionInput
                question={q}
                value={answers[q.id]}
                onChange={(val) => setAnswers((prev) => ({ ...prev, [q.id]: val }))}
              />
            ) : (
              <Box bgcolor="grey.50" p={1.5} borderRadius={1}>
                <Typography variant="body2">
                  {answers[q.id] !== undefined && answers[q.id] !== null
                    ? Array.isArray(answers[q.id]) ? answers[q.id].join(', ') : String(answers[q.id])
                    : <em>Sem resposta</em>}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      ))}

      {!isCompleted && canEdit && (
        <Box display="flex" gap={2} justifyContent="flex-end" mt={2}>
          <Button variant="outlined" startIcon={<SaveIcon />}
            onClick={() => saveMutation.mutate({ isDraft: true })}
            disabled={saveMutation.isPending}>
            Salvar Rascunho
          </Button>
          <Button variant="contained" color="primary" startIcon={<SaveIcon />}
            onClick={() => saveMutation.mutate({ isDraft: false })}
            disabled={saveMutation.isPending}>
            Salvar Respostas
          </Button>
          <Button variant="contained" color="success" startIcon={<CheckCircleIcon />}
            onClick={() => finalizeMutation.mutate()}
            disabled={finalizeMutation.isPending}>
            Finalizar Aplicação
          </Button>
        </Box>
      )}

      {isCompleted && (
        <Box display="flex" gap={2} justifyContent="flex-end" mt={2}>
          <Button
            variant="contained" startIcon={<DescriptionIcon />}
            onClick={() => navigate(`/relatorios/aplicacao/${id}`)}
          >
            Ver/Criar Relatório
          </Button>
        </Box>
      )}

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <Alert severity={snack.severity}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default AplicacaoDetailPage;
