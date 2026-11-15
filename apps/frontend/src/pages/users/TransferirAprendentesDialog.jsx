import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField, Typography,
} from '@mui/material';
import { usersApi } from '../../api/users';

// Transferência dos aprendentes e instrumentos de um profissional que deixa o serviço.
// O administrador escolhe apenas o novo responsável; não vê quem são as crianças.
const TransferirAprendentesDialog = ({ origem, onClose, onDone }) => {
  const [destinoId, setDestinoId] = useState('');
  const queryClient = useQueryClient();

  const { data: destinos = [], isLoading } = useQuery({
    queryKey: ['users', 'destinos-transferencia'],
    queryFn: () => usersApi.list({ role: 'PSICOPEDAGOGO', status: 'ACTIVE', limit: 100 }).then((r) => r.data.data),
    enabled: !!origem,
  });

  const mutation = useMutation({
    mutationFn: () => usersApi.transferirAprendentes(origem.id, destinoId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDestinoId('');
      onDone(res.data.data);
    },
  });

  const opcoes = destinos.filter((u) => u.id !== origem?.id);
  const total = origem?._count?.aprendentes || 0;

  return (
    <Dialog open={!!origem} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Transferir aprendentes</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" mb={2}>
          {total === 1 ? 'O aprendente' : `Os ${total} aprendentes`} sob responsabilidade de <strong>{origem?.name}</strong>,
          com suas aplicações e relatórios, e os instrumentos criados por esse profissional passarão ao psicopedagogo
          escolhido. A transferência fica registrada na auditoria de cada aprendente.
        </Typography>
        {mutation.isError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {mutation.error?.response?.data?.message || 'Erro ao transferir'}
          </Alert>
        )}
        {isLoading ? <CircularProgress size={24} /> : (
          <TextField
            select fullWidth label="Novo responsável" value={destinoId}
            onChange={(e) => setDestinoId(e.target.value)}
            helperText={opcoes.length === 0 ? 'Nenhum outro psicopedagogo ativo disponível' : ' '}
          >
            {opcoes.map((u) => <MenuItem key={u.id} value={u.id}>{u.name} ({u.email})</MenuItem>)}
          </TextField>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained" onClick={() => mutation.mutate()}
          disabled={!destinoId || mutation.isPending}
        >
          Transferir
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TransferirAprendentesDialog;
