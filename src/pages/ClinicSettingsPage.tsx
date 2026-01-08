import { Save } from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useClinicSettings } from '../clinic/ClinicSettingsContext'
import type { ClinicSettings } from '../types'
import { DEFAULT_ACCENT, DEFAULT_PRIMARY } from '../utils/clinicSettingsDefaults'
import { SignatureUpload } from '../components/report/SignatureUpload'

export function ClinicSettingsPage() {
  const { settings, loading, error: loadError, save } = useClinicSettings()
  const [draft, setDraft] = useState<ClinicSettings>(settings)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  // Keep draft in sync when settings load/refresh.
  useEffect(() => {
    if (!loading) setDraft(settings)
  }, [loading, settings])

  if (loading) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5">Clinic / PDF Branding</Typography>
          <Typography variant="body2" color="text.secondary">
            These details appear on the PDF header and preview.
          </Typography>
        </Box>
        <Button
          startIcon={<Save />}
          variant="contained"
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            setError(null)
            setOk(null)
            try {
              await save(draft)
              setOk('Saved')
            } catch (e: any) {
              setError(e?.message ?? 'Save failed')
            } finally {
              setBusy(false)
            }
          }}
        >
          Save
        </Button>
      </Box>

      {loadError ? (
        <Alert severity="warning">
          {loadError.code ? `${loadError.code}: ` : null}
          {loadError.message}
          <br />
          If this is <b>permission-denied</b>, publish the updated <code>firestore.rules</code> (it includes the{' '}
          <code>clinicSettings</code> rule).
        </Alert>
      ) : null}
      {error ? <Alert severity="error">{error}</Alert> : null}
      {ok ? <Alert severity="success">{ok}</Alert> : null}

      <Paper sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Typography variant="h6">Branding</Typography>
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            }}
          >
            <TextField
              label="Clinic Name"
              value={draft.clinicName}
              onChange={(e) => setDraft({ ...draft, clinicName: e.target.value })}
              fullWidth
            />
            <TextField
              label="Tagline"
              value={draft.tagline}
              onChange={(e) => setDraft({ ...draft, tagline: e.target.value })}
              fullWidth
            />
            <TextField
              label="Primary Color"
              value={draft.primaryColor}
              onChange={(e) => setDraft({ ...draft, primaryColor: e.target.value })}
              helperText={`Default: ${DEFAULT_PRIMARY}`}
              fullWidth
            />
            <TextField
              label="Accent Color"
              value={draft.accentColor}
              onChange={(e) => setDraft({ ...draft, accentColor: e.target.value })}
              helperText={`Default: ${DEFAULT_ACCENT}`}
              fullWidth
            />
          </Box>

          <Box>
            <Typography sx={{ fontWeight: 800, mb: 1 }}>Logo</Typography>
            {/* Reuse SignatureUpload as a generic image uploader */}
            <SignatureUpload
              value={draft.logoDataUrl}
              onChange={(v) => setDraft({ ...draft, logoDataUrl: v })}
            />
          </Box>
        </Stack>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Typography variant="h6">Contact</Typography>
          <TextField
            label="Address"
            value={draft.address}
            onChange={(e) => setDraft({ ...draft, address: e.target.value })}
            fullWidth
            multiline
            minRows={2}
          />
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
            }}
          >
            <TextField
              label="Phone"
              value={draft.phone}
              onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
              fullWidth
            />
            <TextField
              label="Email"
              value={draft.email}
              onChange={(e) => setDraft({ ...draft, email: e.target.value })}
              fullWidth
            />
            <TextField
              label="Website"
              value={draft.website}
              onChange={(e) => setDraft({ ...draft, website: e.target.value })}
              fullWidth
            />
          </Box>
        </Stack>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Typography variant="h6">Footer</Typography>
          <TextField
            label="Footer Note"
            value={draft.footerNote}
            onChange={(e) => setDraft({ ...draft, footerNote: e.target.value })}
            fullWidth
            multiline
            minRows={2}
          />
        </Stack>
      </Paper>
    </Stack>
  )
}


