import './App.css'
import {
  AppBar,
  Box,
  Button,
  ButtonBase,
  Container,
  Toolbar,
  Typography,
} from '@mui/material'
import { Settings } from '@mui/icons-material'
import { BrowserRouter, Route, Routes, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { RequireAuth } from './auth/RequireAuth'
import { ClinicSettingsProvider } from './clinic/ClinicSettingsContext'
import { DashboardPage } from './pages/DashboardPage'
import { FirebaseSetupPage } from './pages/FirebaseSetupPage'
import { LoginPage } from './pages/LoginPage'
import { ReportEditorPage } from './pages/ReportEditorPage'
import { ReportPreviewPage } from './pages/ReportPreviewPage'
import { ClinicSettingsPage } from './pages/ClinicSettingsPage'
import { isFirebaseConfigured } from './firebase'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ClinicSettingsProvider>
          <Shell>
            <Routes>
              {!isFirebaseConfigured ? (
                <Route path="*" element={<FirebaseSetupPage />} />
              ) : (
                <>
                  <Route path="/login" element={<LoginPage />} />
                  <Route
                    path="/"
                    element={
                      <RequireAuth>
                        <DashboardPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <RequireAuth>
                        <ClinicSettingsPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/reports/new"
                    element={
                      <RequireAuth>
                        <ReportEditorPage mode="new" />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/reports/:reportId"
                    element={
                      <RequireAuth>
                        <ReportEditorPage mode="edit" />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/reports/:reportId/preview"
                    element={
                      <RequireAuth>
                        <ReportPreviewPage />
                      </RequireAuth>
                    }
                  />
                </>
              )}
            </Routes>
          </Shell>
        </ClinicSettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App

function Shell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  return (
    <Box sx={{ minHeight: '100vh' }}>
      <AppBar position="sticky" color="inherit" elevation={0}>
        <Toolbar sx={{ gap: 2 }}>
          <ButtonBase
            onClick={() => nav('/')}
            sx={{ borderRadius: 1, px: 0.5, py: 0.25, textAlign: 'left' }}
          >
            <Typography variant="h6" sx={{ color: 'inherit', textDecoration: 'none' }}>
              Hearing Hope • Audiology Reports
            </Typography>
          </ButtonBase>
          <Box sx={{ flex: 1 }} />
          {user ? (
            <Button
              variant="text"
              startIcon={<Settings />}
              onClick={() => nav('/settings')}
              sx={{ mr: 1 }}
            >
              Clinic Settings
            </Button>
          ) : null}
          {user ? (
            <Button variant="outlined" onClick={logout}>
              Logout
            </Button>
          ) : null}
        </Toolbar>
      </AppBar>
      <Container sx={{ py: 3 }}>{children}</Container>
    </Box>
  )
}
