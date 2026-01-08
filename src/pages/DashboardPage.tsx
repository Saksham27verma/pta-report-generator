import { Add } from '@mui/icons-material'
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { listReportsForUser } from '../services/reports'
import type { ReportSummary } from '../types'

export function DashboardPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<ReportSummary[]>([])
  const [error, setError] = useState<string | null>(null)

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
        if (mounted) setError(e?.message ?? 'Failed to load reports')
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

      {loading ? (
        <Box sx={{ display: 'grid', placeItems: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Paper sx={{ p: 2 }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      ) : items.length === 0 ? (
        <Paper sx={{ p: 3 }}>
          <Typography>No reports yet.</Typography>
        </Paper>
      ) : (
        <Stack spacing={1}>
          {items.map((r) => (
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
              <Button component={Link} to={`/reports/${r.id}`} variant="outlined">
                Open
              </Button>
            </Paper>
          ))}
        </Stack>
      )}
    </Stack>
  )
}


