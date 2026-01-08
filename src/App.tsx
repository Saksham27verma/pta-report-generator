import './App.css'
import {
  AppBar,
  Box,
  Button,
  ButtonBase,
  Container,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material'
import { Settings } from '@mui/icons-material'
import MenuIcon from '@mui/icons-material/Menu'
import { useState } from 'react'
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { RequireAuth } from './auth/RequireAuth'
import { ClinicSettingsProvider } from './clinic/ClinicSettingsContext'
import { AudiologistsProvider } from './clinic/AudiologistsContext'
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
          <AudiologistsProvider>
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
          </AudiologistsProvider>
        </ClinicSettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App

function Shell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const isAuthRoute = loc.pathname.startsWith('/login')
  return (
    <Box sx={{ minHeight: '100vh' }}>
      <AppBar position="sticky" color="inherit" elevation={0}>
        <Toolbar sx={{ gap: 2 }}>
          {user && !isAuthRoute ? (
            <IconButton
              onClick={() => setDrawerOpen(true)}
              sx={{ display: { xs: 'inline-flex', md: 'none' } }}
              aria-label="Open menu"
            >
              <MenuIcon />
            </IconButton>
          ) : null}
          <ButtonBase
            onClick={() => nav('/')}
            sx={{ borderRadius: 1, px: 0.5, py: 0.25, textAlign: 'left' }}
          >
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
              <Typography variant="h6" sx={{ color: 'inherit', textDecoration: 'none' }}>
                Hearing Hope
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ display: { xs: 'none', md: 'inline' } }}
              >
                • Audiology Reports
              </Typography>
            </Box>
          </ButtonBase>
          <Box sx={{ flex: 1 }} />
          {user && !isAuthRoute ? (
            <Button
              variant="text"
              startIcon={<Settings />}
              onClick={() => nav('/settings')}
              sx={{ display: { xs: 'none', md: 'inline-flex' } }}
            >
              Clinic Settings
            </Button>
          ) : null}
          {user && !isAuthRoute ? (
            <Button
              variant="outlined"
              onClick={logout}
              sx={{ display: { xs: 'none', md: 'inline-flex' } }}
            >
              Logout
            </Button>
          ) : null}
        </Toolbar>
      </AppBar>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} anchor="left">
        <Box sx={{ width: 280, p: 1 }}>
          <Typography sx={{ fontWeight: 900, px: 1, py: 1 }}>Menu</Typography>
          <Divider />
          <List>
            <ListItemButton
              onClick={() => {
                nav('/')
                setDrawerOpen(false)
              }}
            >
              <ListItemText primary="Reports" />
            </ListItemButton>
            <ListItemButton
              onClick={() => {
                nav('/settings')
                setDrawerOpen(false)
              }}
            >
              <ListItemText primary="Clinic Settings" />
            </ListItemButton>
          </List>
          <Divider />
          <Stack sx={{ p: 1 }}>
            <Button
              variant="outlined"
              onClick={async () => {
                await logout()
                setDrawerOpen(false)
              }}
            >
              Logout
            </Button>
          </Stack>
        </Box>
      </Drawer>

      <Container sx={{ py: { xs: 2, md: 3 } }}>{children}</Container>
    </Box>
  )
}
