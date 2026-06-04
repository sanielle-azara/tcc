import { Chip } from '@mui/material';

const statusConfig = {
  ACTIVE: { label: 'Ativo', color: 'success' },
  INACTIVE: { label: 'Inativo', color: 'default' },
  DRAFT: { label: 'Rascunho', color: 'warning' },
  ARCHIVED: { label: 'Arquivada', color: 'default' },
  PENDING: { label: 'Pendente', color: 'warning' },
  IN_PROGRESS: { label: 'Em Andamento', color: 'info' },
  COMPLETED: { label: 'Finalizada', color: 'success' },
  ADMIN: { label: 'Admin', color: 'error' },
  PSICOPEDAGOGO: { label: 'Psicopedagogo', color: 'primary' },
  VIEWER: { label: 'Visualizador', color: 'default' },
};

const StatusChip = ({ status, size = 'small' }) => {
  const config = statusConfig[status] || { label: status, color: 'default' };
  return <Chip label={config.label} color={config.color} size={size} />;
};

export default StatusChip;
