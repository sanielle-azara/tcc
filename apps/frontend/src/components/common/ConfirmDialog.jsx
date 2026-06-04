import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';

const ConfirmDialog = ({ open, title, message, onConfirm, onCancel, confirmText = 'Confirmar', cancelText = 'Cancelar', severity = 'error' }) => (
  <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
    <DialogTitle>{title}</DialogTitle>
    <DialogContent>
      <Typography>{message}</Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onCancel}>{cancelText}</Button>
      <Button onClick={onConfirm} variant="contained" color={severity} autoFocus>
        {confirmText}
      </Button>
    </DialogActions>
  </Dialog>
);

export default ConfirmDialog;
