import { Add } from '@mui/icons-material'
import {
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { firebaseProjectId } from '../firebase'
import { listReportsForUser } from '../services/reports'
import type { ReportSummary } from '../types'
import { Search } from '@mui/icons-material'

export function DashboardPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<ReportSummary[]>([])
  const [error, setError] = useState<{ message: string; code?: string } | null>(null)
  const [q, setQ] = useState('')

  useEffect(() => {
    let mounted = true
    async function run() {
      if (!user) return
      setLoading(true)
      setError(null)
      try {
        const res = await listReportsForUser(user.uid)
        if (mounted) setItems(res)
      } catch (e: any) {
        if (mounted)
          setError({
            message: e?.message ?? 'Failed to load reports',
            code: e?.code,
          })
      } finally {
        if (mounted) setLoading(false)
      }
    }
    run()
    return () => {
      mounted = false
    }
  }, [user])

  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5">Reports</Typography>
          <Typography variant="body2" color="text.secondary">
            Create, edit, and export audiology reports.
          </Typography>
        </Box>
        <Button
          component={Link}
          to="/reports/new"
          variant="contained"
          startIcon={<Add />}
        >
          New Report
        </Button>
      </Box>

      <TextField
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by patient name, registration number, or test date (YYYY-MM-DD)…"
        fullWidth
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search fontSize="small" />
            </InputAdornment>
          ),
        }}
      />

      {loading ? (
        <Box sx={{ display: 'grid', placeItems: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Paper sx={{ p: 2 }}>
          <Typography color="error" sx={{ fontWeight: 800 }}>
            {error.code ? `${error.code}: ` : null}
            {error.message}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Project: <b>{firebaseProjectId || '—'}</b> • Logged in UID:{' '}
            <b>{user?.uid ?? '—'}</b>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            If code is <b>permission-denied</b>, publish Firestore rules from <code>firestore.rules</code>. If code is{' '}
            <b>failed-precondition</b>, Firestore needs an index (error message will contain an index link).
          </Typography>
        </Paper>
      ) : items.length === 0 ? (
        <Paper sx={{ p: 3 }}>
          <Typography>No reports yet.</Typography>
        </Paper>
      ) : (
        <Stack spacing={1}>
          {items
            .filter((r) => {
              const needle = q.trim().toLowerCase()
              if (!needle) return true
              const hay = `${r.patientName} ${r.registrationNumber} ${r.dateOfTest}`.toLowerCase()
              return hay.includes(needle)
            })
            .map((r) => (
            <Paper
              key={r.id}
              sx={{
                p: 2,
                display: 'flex',
                gap: 2,
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box>
                <Typography sx={{ fontWeight: 700 }}>
                  {r.patientName || 'Unnamed Patient'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Reg: {r.registrationNumber || '—'} • Test:{' '}
                  {r.dateOfTest || '—'}
                </Typography>
              </Box>
                <Stack direction="row" spacing={1}>
                  <Button component={Link} to={`/reports/${r.id}/preview`} variant="outlined">
                    Preview
                  </Button>
                  <Button component={Link} to={`/reports/${r.id}`} variant="contained">
                    Edit
                  </Button>
                </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Stack>
  )
}


