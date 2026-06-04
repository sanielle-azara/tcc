import { createTheme } from '@mui/material/styles';
import { ptBR } from '@mui/material/locale';

const theme = createTheme(
  {
    palette: {
      primary: {
        main: '#1976d2',
        light: '#42a5f5',
        dark: '#1565c0',
      },
      secondary: {
        main: '#26a69a',
        light: '#4db6ac',
        dark: '#00897b',
      },
      background: {
        default: '#f5f5f5',
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h4: { fontWeight: 600 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: { textTransform: 'none', fontWeight: 500 },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
        },
      },
    },
  },
  ptBR
);

export default theme;
