import { Box, Typography, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

const PageHeader = ({ title, subtitle, action, actionLabel, actionIcon }) => (
  <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={3}>
    <Box>
      <Typography variant="h5">{title}</Typography>
      {subtitle && <Typography variant="body2" color="text.secondary" mt={0.5}>{subtitle}</Typography>}
    </Box>
    {action && (
      <Button
        variant="contained"
        startIcon={actionIcon || <AddIcon />}
        onClick={action}
      >
        {actionLabel}
      </Button>
    )}
  </Box>
);

export default PageHeader;
