import './App.css'
import {
  AppBar,
  Box,
  Button,
  Container,
  Toolbar,
  Typography,
} from '@mui/material'
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { RequireAuth } from './auth/RequireAuth'
import { DashboardPage } from './pages/DashboardPage'
import { FirebaseSetupPage } from './pages/FirebaseSetupPage'
import { LoginPage } from './pages/LoginPage'
import { ReportEditorPage } from './pages/ReportEditorPage'
import { isFirebaseConfigured } from './firebase'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
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
              </>
            )}
          </Routes>
        </Shell>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App

function Shell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  return (
    <Box sx={{ minHeight: '100vh' }}>
      <AppBar position="sticky" color="inherit" elevation={0}>
        <Toolbar sx={{ gap: 2 }}>
          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{ color: 'inherit', textDecoration: 'none' }}
          >
            Hearing Hope • Audiology Reports
          </Typography>
          <Box sx={{ flex: 1 }} />
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
