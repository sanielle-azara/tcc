import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Button, Card, CardContent, Grid, TextField, MenuItem, Typography,
  Alert, CircularProgress, Divider, IconButton, Tooltip, Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { avaliacoesApi } from '../../api/avaliacoes';
import { createAvaliacaoSchema, updateAvaliacaoSchema } from '@psicopedagogia/shared-validation';
import PageHeader from '../../components/common/PageHeader';

const QUESTION_TYPES = [
  { value: 'TEXT', label: 'Texto curto' },
  { value: 'LONG_TEXT', label: 'Texto longo' },
  { value: 'NUMERIC', label: 'Numérico' },
  { value: 'DATE', label: 'Data' },
  { value: 'SINGLE_SELECT', label: 'Seleção única' },
  { value: 'MULTI_SELECT', label: 'Seleção múltipla' },
  { value: 'SCALE', label: 'Escala' },
  { value: 'YES_NO', label: 'Sim/Não' },
];

const QuestionCard = ({ index, register, errors, control, watch, remove }) => {
  const type = watch(`questions.${index}.type`);
  const hasOptions = ['SINGLE_SELECT', 'MULTI_SELECT'].includes(type);
  const isScale = type === 'SCALE';

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
              error={!!errors?.questions?.[index]?.text}
              helperText={errors?.questions?.[index]?.text?.message}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              {...register(`questions.${index}.type`)}
              label="Tipo *"
              select
              fullWidth
              defaultValue="TEXT"
              error={!!errors?.questions?.[index]?.type}
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
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              {...register(`questions.${index}.required`)}
              label="Obrigatória"
              select
              fullWidth
              size="small"
              defaultValue={true}
            >
              <MenuItem value={true}>Sim</MenuItem>
              <MenuItem value={false}>Não</MenuItem>
            </TextField>
          </Grid>

          {isScale && (
            <>
              <Grid item xs={3}>
                <TextField {...register(`questions.${index}.scaleMin`, { valueAsNumber: true })} label="Mínimo" type="number" fullWidth size="small" />
              </Grid>
              <Grid item xs={3}>
                <TextField {...register(`questions.${index}.scaleMax`, { valueAsNumber: true })} label="Máximo" type="number" fullWidth size="small" />
              </Grid>
              <Grid item xs={3}>
                <TextField {...register(`questions.${index}.scaleMinLabel`)} label="Label mínimo" fullWidth size="small" />
              </Grid>
              <Grid item xs={3}>
                <TextField {...register(`questions.${index}.scaleMaxLabel`)} label="Label máximo" fullWidth size="small" />
              </Grid>
            </>
          )}

          {hasOptions && (
            <Grid item xs={12}>
              <TextField
                {...register(`questions.${index}.options`)}
                label="Opções (uma por linha)"
                fullWidth
                multiline
                rows={3}
                size="small"
                helperText="Digite uma opção por linha"
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

  const { data: avaliacao, isLoading: loadingData } = useQuery({
    queryKey: ['avaliacao', id],
    queryFn: () => avaliacoesApi.findById(id).then((r) => r.data.data),
    enabled: isEdit,
  });

  const { register, handleSubmit, reset, watch, control, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(isEdit ? updateAvaliacaoSchema : createAvaliacaoSchema),
    defaultValues: { status: 'DRAFT', questions: [] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'questions' });

  useEffect(() => {
    if (avaliacao) {
      reset({
        ...avaliacao,
        questions: avaliacao.questions.map((q) => ({
          ...q,
          options: Array.isArray(q.options)
            ? q.options.join('\n')
            : q.options
            ? JSON.parse(q.options).join('\n')
            : '',
        })),
      });
    }
  }, [avaliacao, reset]);

  const mutation = useMutation({
    mutationFn: (data) => {
      const payload = {
        ...data,
        questions: (data.questions || []).map((q, i) => ({
          ...q,
          order: i + 1,
          options: q.options && typeof q.options === 'string'
            ? q.options.split('\n').filter((o) => o.trim())
            : q.options,
        })),
      };
      return isEdit ? avaliacoesApi.update(id, payload) : avaliacoesApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avaliacoes'] });
      navigate('/avaliacoes');
    },
  });

  const addQuestion = () => {
    append({ text: '', type: 'TEXT', required: true, order: fields.length + 1 });
  };

  if (isEdit && loadingData) return <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>;

  return (
    <Box>
      <PageHeader title={isEdit ? 'Editar Avaliação' : 'Nova Avaliação'} />

      {mutation.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {mutation.error?.response?.data?.message || 'Erro ao salvar avaliação'}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit((d) => mutation.mutate(d))} noValidate>
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
                <TextField {...register('status')} label="Status" select fullWidth defaultValue="DRAFT">
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

        {errors.questions?.message && (
          <Alert severity="error" sx={{ mb: 2 }}>{errors.questions.message}</Alert>
        )}

        {fields.map((field, index) => (
          <QuestionCard
            key={field.id}
            index={index}
            register={register}
            errors={errors}
            control={control}
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
          <Button type="submit" variant="contained" disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={18} /> : null}>
            {isSubmitting ? 'Salvando...' : 'Salvar Avaliação'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default AvaliacaoFormPage;
