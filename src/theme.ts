import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#0B5FFF' },
    secondary: { main: '#D32F2F' },
    background: { default: '#FAFAFA', paper: '#FFFFFF' },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily:
      'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
  },
  components: {
    MuiPaper: { defaultProps: { elevation: 0 }, styleOverrides: { root: { border: '1px solid rgba(0,0,0,0.08)' } } },
  },
})


