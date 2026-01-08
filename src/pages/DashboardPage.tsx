import { Add } from '@mui/icons-material'
import {
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useAudiologists } from '../clinic/AudiologistsContext'
import { firebaseProjectId } from '../firebase'
import { listReportsForUser } from '../services/reports'
import type { ReportSummary } from '../types'
import { Search } from '@mui/icons-material'

export function DashboardPage() {
  const { user } = useAuth()
  const { items: audiologists } = useAudiologists()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<ReportSummary[]>([])
  const [error, setError] = useState<{ message: string; code?: string } | null>(null)
  const [q, setQ] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [audiologistId, setAudiologistId] = useState<string>('all')

  const filteredItems = useMemo(() => {
    return items
      .filter((r) => {
        const needle = q.trim().toLowerCase()
        if (!needle) return true
        const hay = `${r.patientName} ${r.registrationNumber} ${r.dateOfTest} ${r.audiologistName ?? ''}`.toLowerCase()
        return hay.includes(needle)
      })
      .filter((r) => {
        if (!fromDate && !toDate) return true
        const d = r.dateOfTest || ''
        if (!d) return false
        if (fromDate && d < fromDate) return false
        if (toDate && d > toDate) return false
        return true
      })
      .filter((r) => {
        if (audiologistId === 'all') return true
        if (r.audiologistId && r.audiologistId === audiologistId) return true
        // Backward compatibility: older reports may not store audiologistId; try match by name.
        const selected = audiologists.find((a) => a.id === audiologistId)
        if (selected?.name && r.audiologistName) {
          return r.audiologistName.trim().toLowerCase() === selected.name.trim().toLowerCase()
        }
        return false
      })
  }, [items, q, fromDate, toDate, audiologistId, audiologists])

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
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          alignItems: { xs: 'stretch', md: 'center' },
          flexDirection: { xs: 'column', md: 'row' },
        }}
      >
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
          fullWidth
          sx={{ width: { xs: '100%', md: 'auto' } }}
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

      <Box
        sx={{
          display: 'grid',
          gap: 1.5,
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr auto' },
          alignItems: 'center',
        }}
      >
        <TextField
          label="From"
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />
        <TextField
          label="To"
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />
        <TextField
          select
          label="Audiologist"
          value={audiologistId}
          onChange={(e) => setAudiologistId(e.target.value)}
          fullWidth
        >
          <MenuItem value="all">All</MenuItem>
          {audiologists.map((a) => (
            <MenuItem key={a.id} value={a.id}>
              {a.name} {a.rciNumber ? `(RCI: ${a.rciNumber})` : ''}
            </MenuItem>
          ))}
        </TextField>
        <Button
          variant="text"
          onClick={() => {
            setFromDate('')
            setToDate('')
            setAudiologistId('all')
          }}
          sx={{ justifySelf: { xs: 'start', md: 'end' } }}
        >
          Clear
        </Button>
      </Box>

      {!loading && !error ? (
        <Typography variant="body2" color="text.secondary">
          Showing <b>{filteredItems.length}</b> of <b>{items.length}</b> reports
        </Typography>
      ) : null}

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
          {filteredItems.map((r) => (
            <Paper
              key={r.id}
              sx={{
                p: 2,
                  display: 'flex',
                gap: 2,
                  alignItems: { xs: 'stretch', md: 'center' },
                  justifyContent: 'space-between',
                  flexDirection: { xs: 'column', md: 'row' },
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
                {r.audiologistName ? (
                  <Typography variant="body2" color="text.secondary">
                    Audiologist: {r.audiologistName}
                  </Typography>
                ) : null}
              </Box>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: { xs: '100%', md: 'auto' } }}>
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


