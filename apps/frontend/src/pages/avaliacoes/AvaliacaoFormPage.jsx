import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Button, Card, CardContent, Grid, TextField, MenuItem, Typography,
  Alert, CircularProgress, IconButton, Tooltip, Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { avaliacoesApi } from '../../api/avaliacoes';
import { createAvaliacaoSchema, updateAvaliacaoSchema } from '@psicopedagogia/shared-validation';
import PageHeader from '../../components/common/PageHeader';
import { QUESTION_TYPES, toFormValues, toAvaliacaoPayload, sameQuestions } from './avaliacaoForm';

const QuestionCard = ({ index, register, errors, watch, remove }) => {
  const type = watch(`questions.${index}.type`);
  const hasOptions = ['SINGLE_SELECT', 'MULTI_SELECT'].includes(type);
  const isScale = type === 'SCALE';
  const qErrors = errors?.questions?.[index];

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <DragIndicatorIcon color="disabled" />
          <Chip label={`Pergunta ${index + 1}`} size="small" />
          <Box flexGrow={1} />
          <Tooltip title="Remover pergunta">
            <IconButton size="small" color="error" onClick={() => remove(index)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <TextField
              {...register(`questions.${index}.text`)}
              label="Pergunta *"
              fullWidth
              error={!!qErrors?.text}
              helperText={qErrors?.text?.message}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              {...register(`questions.${index}.type`)}
              label="Tipo *"
              select
              fullWidth
              value={type ?? 'TEXT'}
              error={!!qErrors?.type}
              helperText={qErrors?.type?.message}
            >
              {QUESTION_TYPES.map((t) => (
                <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={8}>
            <TextField
              {...register(`questions.${index}.helpText`)}
              label="Texto de ajuda"
              fullWidth
              size="small"
              error={!!qErrors?.helpText}
              helperText={qErrors?.helpText?.message}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              {...register(`questions.${index}.required`)}
              label="Obrigatória"
              select
              fullWidth
              size="small"
              value={watch(`questions.${index}.required`) ?? true}
            >
              <MenuItem value={true}>Sim</MenuItem>
              <MenuItem value={false}>Não</MenuItem>
            </TextField>
          </Grid>

          {isScale && (
            <>
              <Grid item xs={6} md={3}>
                <TextField
                  {...register(`questions.${index}.scaleMin`)}
                  label="Mínimo" type="number" fullWidth size="small"
                  error={!!qErrors?.scaleMin}
                  helperText={qErrors?.scaleMin?.message}
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField
                  {...register(`questions.${index}.scaleMax`)}
                  label="Máximo" type="number" fullWidth size="small"
                  error={!!qErrors?.scaleMax}
                  helperText={qErrors?.scaleMax?.message}
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField {...register(`questions.${index}.scaleMinLabel`)} label="Rótulo do mínimo" fullWidth size="small" />
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField {...register(`questions.${index}.scaleMaxLabel`)} label="Rótulo do máximo" fullWidth size="small" />
              </Grid>
            </>
          )}

          {hasOptions && (
            <Grid item xs={12}>
              <TextField
                {...register(`questions.${index}.options`)}
                label="Opções (uma por linha) *"
                fullWidth
                multiline
                rows={3}
                size="small"
                error={!!qErrors?.options}
                helperText={qErrors?.options?.message || 'Digite uma opção por linha'}
              />
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
};

const AvaliacaoFormPage = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState('');

  const { data: avaliacao, isLoading: loadingData } = useQuery({
    queryKey: ['avaliacao', id],
    queryFn: () => avaliacoesApi.findById(id).then((r) => r.data.data),
    enabled: isEdit,
  });

  // O Zod valida o payload da API, não os valores crus do formulário
  const schemaResolver = zodResolver(isEdit ? updateAvaliacaoSchema : createAvaliacaoSchema);
  const { register, handleSubmit, reset, watch, control, formState: { errors, isSubmitting } } = useForm({
    resolver: (values, context, options) => schemaResolver(toAvaliacaoPayload(values), context, options),
    defaultValues: { status: 'DRAFT', questions: [] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'questions' });

  useEffect(() => {
    if (avaliacao) reset(toFormValues(avaliacao));
  }, [avaliacao, reset]);

  const mutation = useMutation({
    mutationFn: (payload) => (isEdit ? avaliacoesApi.update(id, payload) : avaliacoesApi.create(payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avaliacoes'] });
      queryClient.invalidateQueries({ queryKey: ['avaliacao', id] });
      navigate('/avaliacoes');
    },
  });

  const onValid = (payload) => {
    setFormError('');
    // Perguntas inalteradas não são reenviadas, para não gerar uma nova versão sem necessidade
    if (isEdit && avaliacao && sameQuestions(payload.questions, avaliacao)) {
      const metadata = { ...payload };
      delete metadata.questions;
      return mutation.mutate(metadata);
    }
    return mutation.mutate(payload);
  };

  const onInvalid = () => setFormError('Há campos com erro. Revise os campos destacados.');

  const addQuestion = () => {
    append({ text: '', type: 'TEXT', required: true, helpText: '', options: '', scaleMin: '', scaleMax: '', scaleMinLabel: '', scaleMaxLabel: '' });
  };

  if (isEdit && loadingData) return <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>;

  const totalAplicacoes = avaliacao?._count?.aplicacoes || 0;
  const questionsError = errors.questions?.root?.message || errors.questions?.message;

  return (
    <Box>
      <PageHeader title={isEdit ? 'Editar Avaliação' : 'Nova Avaliação'} />

      {isEdit && totalAplicacoes > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Este instrumento já foi utilizado em {totalAplicacoes} aplicação(ões). Se as perguntas forem
          alteradas, será criada a versão v{avaliacao.version + 1} e a versão atual será arquivada; as
          aplicações já realizadas continuam ligadas à versão em que foram feitas. Alterações apenas no
          nome, categoria, descrição ou status são aplicadas à versão atual.
        </Alert>
      )}

      {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}

      {mutation.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {mutation.error?.response?.data?.message || 'Erro ao salvar avaliação'}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit(onValid, onInvalid)} noValidate>
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>Informações da Avaliação</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField {...register('name')} label="Nome da Avaliação *" fullWidth error={!!errors.name} helperText={errors.name?.message} />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField {...register('category')} label="Categoria" fullWidth error={!!errors.category} helperText={errors.category?.message} />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField {...register('status')} label="Status" select fullWidth value={watch('status') ?? 'DRAFT'}>
                  <MenuItem value="DRAFT">Rascunho</MenuItem>
                  <MenuItem value="ACTIVE">Ativa</MenuItem>
                  <MenuItem value="ARCHIVED">Arquivada</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField {...register('description')} label="Descrição" fullWidth multiline rows={2} error={!!errors.description} helperText={errors.description?.message} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="subtitle1" fontWeight={600}>
            Perguntas ({fields.length})
          </Typography>
          <Button startIcon={<AddIcon />} variant="outlined" onClick={addQuestion}>
            Adicionar Pergunta
          </Button>
        </Box>

        {questionsError && (
          <Alert severity="error" sx={{ mb: 2 }}>{questionsError}</Alert>
        )}

        {fields.map((field, index) => (
          <QuestionCard
            key={field.id}
            index={index}
            register={register}
            errors={errors}
            watch={watch}
            remove={remove}
          />
        ))}

        {fields.length === 0 && (
          <Box textAlign="center" py={4} bgcolor="grey.50" borderRadius={2}>
            <Typography color="text.secondary">Nenhuma pergunta adicionada ainda.</Typography>
            <Button startIcon={<AddIcon />} onClick={addQuestion} sx={{ mt: 1 }}>
              Adicionar primeira pergunta
            </Button>
          </Box>
        )}

        <Box display="flex" gap={2} mt={3} justifyContent="flex-end">
          <Button variant="outlined" onClick={() => navigate('/avaliacoes')}>Cancelar</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting || mutation.isPending}
            startIcon={isSubmitting || mutation.isPending ? <CircularProgress size={18} /> : null}>
            {isSubmitting || mutation.isPending ? 'Salvando...' : 'Salvar Avaliação'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default AvaliacaoFormPage;
