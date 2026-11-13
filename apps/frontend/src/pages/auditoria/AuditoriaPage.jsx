import { useState } from 'react';
import { Box, Grid, MenuItem, TextField } from '@mui/material';
import PageHeader from '../../components/common/PageHeader';
import AuditLogTable, { AUDIT_ACTIONS, AUDIT_ENTITIES } from '../../components/common/AuditLogTable';

// Consulta do registro de auditoria completo, restrita ao ADMIN
const AuditoriaPage = () => {
  const [entity, setEntity] = useState('');
  const [action, setAction] = useState('');
  const [aprendenteId, setAprendenteId] = useState('');

  const params = {
    ...(entity && { entity }),
    ...(action && { action }),
    ...(aprendenteId.trim() && { aprendenteId: aprendenteId.trim() }),
  };

  return (
    <Box>
      <PageHeader
        title="Auditoria"
        subtitle="Registro de criações, alterações, exclusões, consultas a dados clínicos e logins"
      />
      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} sm={4} md={3}>
          <TextField select fullWidth size="small" label="Registro" value={entity} onChange={(e) => setEntity(e.target.value)}>
            <MenuItem value="">Todos</MenuItem>
            {Object.entries(AUDIT_ENTITIES).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={4} md={3}>
          <TextField select fullWidth size="small" label="Ação" value={action} onChange={(e) => setAction(e.target.value)}>
            <MenuItem value="">Todas</MenuItem>
            {Object.entries(AUDIT_ACTIONS).map(([value, { label }]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={4} md={3}>
          <TextField fullWidth size="small" label="Id do aprendente" value={aprendenteId} onChange={(e) => setAprendenteId(e.target.value)} />
        </Grid>
      </Grid>
      {/* A chave recria a tabela ao mudar os filtros, voltando para a primeira página */}
      <AuditLogTable key={JSON.stringify(params)} params={params} showAprendente />
    </Box>
  );
};

export default AuditoriaPage;
