import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material'
import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function LoginPage() {
  const { loginWithEmail, loginWithGoogle } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const nav = useNavigate()
  const loc = useLocation()

  const nextPath = useMemo(() => {
    const state = loc.state as { from?: { pathname?: string } } | null
    return state?.from?.pathname ?? '/'
  }, [loc.state])

  return (
    <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '70vh' }}>
      <Paper sx={{ p: 3, width: 'min(520px, 100%)' }}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h5">Audiologist Login</Typography>
            <Typography variant="body2" color="text.secondary">
              Sign in to access patient reports (Firebase Auth).
            </Typography>
          </Box>

          {error ? <Alert severity="error">{error}</Alert> : null}

          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            fullWidth
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            fullWidth
          />

          <Button
            variant="contained"
            disabled={busy || !email || !password}
            onClick={async () => {
              setBusy(true)
              setError(null)
              try {
                await loginWithEmail(email, password)
                nav(nextPath, { replace: true })
              } catch (e: any) {
                setError(e?.message ?? 'Login failed')
              } finally {
                setBusy(false)
              }
            }}
          >
            Login
          </Button>

          <Button
            variant="outlined"
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              setError(null)
              try {
                await loginWithGoogle()
                nav(nextPath, { replace: true })
              } catch (e: any) {
                setError(e?.message ?? 'Google login failed')
              } finally {
                setBusy(false)
              }
            }}
          >
            Login with Google
          </Button>

          <Typography variant="caption" color="text.secondary">
            Tip: create staff accounts in Firebase Console → Authentication.
          </Typography>
        </Stack>
      </Paper>
    </Box>
  )
}


