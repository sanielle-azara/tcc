import { useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Card, CardContent, Grid, Typography, Chip, CircularProgress, Alert, Button, Link,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { avaliacoesApi } from '../../api/avaliacoes';
import { AuthContext } from '../../contexts/AuthContext';
import { formatDate } from '@psicopedagogia/shared-utils';
import PageHeader from '../../components/common/PageHeader';
import StatusChip from '../../components/common/StatusChip';
import { parseOptions, questionTypeLabel, SELECT_TYPES } from './avaliacaoForm';

const InfoField = ({ label, value }) => (
  <Box mb={1.5}>
    <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
    <Typography variant="body1" component="div">{value || '—'}</Typography>
  </Box>
);

const QuestionDetail = ({ question, index }) => {
  const options = parseOptions(question.options);
  const isScale = question.type === 'SCALE';

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" gap={1} mb={1} flexWrap="wrap" alignItems="center">
          <Typography variant="body2" color="text.secondary">#{index + 1}</Typography>
          <Chip label={questionTypeLabel(question.type)} size="small" variant="outlined" />
          {question.required
            ? <Chip label="Obrigatória" size="small" color="error" variant="outlined" />
            : <Chip label="Opcional" size="small" variant="outlined" />}
        </Box>
        <Typography variant="body1" fontWeight={500}>{question.text}</Typography>
        {question.helpText && (
          <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>{question.helpText}</Typography>
        )}

        {SELECT_TYPES.includes(question.type) && (
          <Box mt={1.5}>
            <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>Opções</Typography>
            {options.length > 0 ? (
              <Box display="flex" gap={1} flexWrap="wrap">
                {options.map((opt) => <Chip key={opt} label={opt} size="small" />)}
              </Box>
            ) : (
              <Typography variant="body2" color="text.disabled">Nenhuma opção cadastrada</Typography>
            )}
          </Box>
        )}

        {isScale && (
          <Box mt={1.5}>
            <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>Escala</Typography>
            <Typography variant="body2">
              {question.scaleMin ?? 1}{question.scaleMinLabel ? ` (${question.scaleMinLabel})` : ''}
              {' até '}
              {question.scaleMax ?? 5}{question.scaleMaxLabel ? ` (${question.scaleMaxLabel})` : ''}
              {question.scaleMin == null && question.scaleMax == null ? ' — limites padrão' : ''}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

const VersionLink = ({ version, onClick }) => (
  <Link component="button" variant="body2" onClick={onClick} sx={{ mr: 1 }}>
    v{version.version}
  </Link>
);

const AvaliacaoDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  // Só o psicopedagogo edita instrumentos; o administrador apenas os consulta e exclui
  const isAdmin = useContext(AuthContext)?.user?.role === 'ADMIN';

  const { data: a, isLoading, error } = useQuery({
    queryKey: ['avaliacao', id],
    queryFn: () => avaliacoesApi.findById(id).then((r) => r.data.data),
  });

  if (isLoading) return <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>;
  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error.response?.data?.message || 'Erro ao carregar avaliação'}
        </Alert>
        <Button variant="outlined" onClick={() => navigate('/avaliacoes')}>Voltar para avaliações</Button>
      </Box>
    );
  }

  const questions = a.questions || [];
  const totalAplicacoes = a._count?.aplicacoes || 0;
  const versions = a.versions || [];

  return (
    <Box>
      <PageHeader
        title={a.name}
        subtitle={`Versão ${a.version}${a.category ? ` • ${a.category}` : ''}`}
        action={isAdmin ? undefined : () => navigate(`/avaliacoes/${id}/editar`)}
        actionLabel="Editar"
        actionIcon={<EditIcon />}
      />

      {a.status === 'ARCHIVED' && versions.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Esta versão está arquivada e foi substituída pela{' '}
          <VersionLink version={versions[versions.length - 1]} onClick={() => navigate(`/avaliacoes/${versions[versions.length - 1].id}`)} />.
        </Alert>
      )}

      <Grid container spacing={2} mb={1}>
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} mb={2}>Informações</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}><InfoField label="Status" value={<StatusChip status={a.status} />} /></Grid>
                <Grid item xs={6} sm={3}><InfoField label="Versão" value={`v${a.version}`} /></Grid>
                <Grid item xs={6} sm={3}><InfoField label="Perguntas" value={String(questions.length)} /></Grid>
                <Grid item xs={6} sm={3}><InfoField label="Aplicações" value={String(totalAplicacoes)} /></Grid>
                <Grid item xs={6} sm={3}><InfoField label="Categoria" value={a.category} /></Grid>
                <Grid item xs={6} sm={3}><InfoField label="Criada em" value={formatDate(a.createdAt)} /></Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" display="block">Descrição</Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{a.description || '—'}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} mb={2}>Histórico de versões</Typography>
              <InfoField
                label="Versão de origem"
                value={a.parent
                  ? <VersionLink version={a.parent} onClick={() => navigate(`/avaliacoes/${a.parent.id}`)} />
                  : 'Versão original'}
              />
              <InfoField
                label="Versões derivadas desta"
                value={versions.length > 0
                  ? versions.map((v) => (
                    <VersionLink key={v.id} version={v} onClick={() => navigate(`/avaliacoes/${v.id}`)} />
                  ))
                  : 'Nenhuma'}
              />
              {totalAplicacoes > 0 && (
                <Typography variant="caption" color="text.secondary" display="block">
                  Alterar as perguntas desta versão criará uma nova versão; as aplicações já realizadas
                  continuam ligadas a ela.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Typography variant="subtitle1" fontWeight={600} my={2}>Perguntas ({questions.length})</Typography>
      {questions.length === 0 ? (
        <Typography color="text.secondary">Nenhuma pergunta cadastrada.</Typography>
      ) : (
        questions.map((q, i) => <QuestionDetail key={q.id} question={q} index={i} />)
      )}
    </Box>
  );
};

export default AvaliacaoDetailPage;
