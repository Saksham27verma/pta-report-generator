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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useClinicSettings } from '../clinic/ClinicSettingsContext'
import type { ClinicSettings } from '../types'
import { DEFAULT_ACCENT, DEFAULT_PRIMARY } from '../utils/clinicSettingsDefaults'
import { SignatureUpload } from '../components/report/SignatureUpload'
import { useAudiologists } from '../clinic/AudiologistsContext'
import type { AudiologistProfile } from '../types'

export function ClinicSettingsPage() {
  const { settings, loading, error: loadError, save } = useClinicSettings()
  const audiologists = useAudiologists()
  const [draft, setDraft] = useState<ClinicSettings>(settings)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)
  const [dlgOpen, setDlgOpen] = useState(false)
  const [editing, setEditing] = useState<AudiologistProfile | null>(null)
  const [aName, setAName] = useState('')
  const [aRci, setARci] = useState('')
  const [aSig, setASig] = useState<string | null>(null)
  const [aBusy, setABusy] = useState(false)
  const [aErr, setAErr] = useState<string | null>(null)

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

      <Paper sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6">Audiologists</Typography>
              <Typography variant="body2" color="text.secondary">
                Create team profiles (Name, RCI, Signature) for one-click signing.
              </Typography>
            </Box>
            <Button
              variant="contained"
              onClick={() => {
                setEditing(null)
                setAName('')
                setARci('')
                setASig(null)
                setDlgOpen(true)
              }}
            >
              Add Audiologist
            </Button>
          </Box>

          {audiologists.error ? (
            <Alert severity="warning">
              {audiologists.error.code ? `${audiologists.error.code}: ` : null}
              {audiologists.error.message}
              <br />
              If this is <b>permission-denied</b>, publish updated <code>firestore.rules</code> (now includes{' '}
              <code>clinicSettings/&lt;uid&gt;/audiologists</code>).
            </Alert>
          ) : null}

          {audiologists.loading ? (
            <Box sx={{ display: 'grid', placeItems: 'center', py: 2 }}>
              <CircularProgress size={22} />
            </Box>
          ) : audiologists.items.length === 0 ? (
            <Typography color="text.secondary">No audiologists added yet.</Typography>
          ) : (
            <Stack spacing={1}>
              {audiologists.items.map((a) => (
                <Paper
                  key={a.id}
                  variant="outlined"
                  sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}
                >
                  <Box>
                    <Typography sx={{ fontWeight: 900 }}>{a.name || '—'}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      RCI: {a.rciNumber || '—'}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setEditing(a)
                        setAName(a.name)
                        setARci(a.rciNumber)
                        setASig(a.signatureDataUrl)
                        setDlgOpen(true)
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      color="error"
                      variant="text"
                      onClick={async () => {
                        if (!confirm(`Delete audiologist "${a.name}"?`)) return
                        await audiologists.remove(a.id)
                      }}
                    >
                      Delete
                    </Button>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}

          {aErr ? <Alert severity="error">{aErr}</Alert> : null}
          <AudiologistDialog
            open={dlgOpen}
            title={editing ? 'Edit Audiologist' : 'Add Audiologist'}
            name={aName}
            rci={aRci}
            signature={aSig}
            busy={aBusy}
            onClose={() => {
              setDlgOpen(false)
              setAErr(null)
            }}
            onChangeName={setAName}
            onChangeRci={setARci}
            onChangeSignature={setASig}
            onSave={async () => {
              setABusy(true)
              setAErr(null)
              try {
                const input = { name: aName.trim(), rciNumber: aRci.trim(), signatureDataUrl: aSig }
                if (editing) await audiologists.update(editing.id, input)
                else await audiologists.create(input)
                setDlgOpen(false)
              } catch (e: any) {
                setAErr(e?.message ?? 'Save failed')
              } finally {
                setABusy(false)
              }
            }}
          />
        </Stack>
      </Paper>
    </Stack>
  )
}

function AudiologistDialog({
  open,
  title,
  name,
  rci,
  signature,
  onClose,
  onChangeName,
  onChangeRci,
  onChangeSignature,
  onSave,
  busy,
}: {
  open: boolean
  title: string
  name: string
  rci: string
  signature: string | null
  busy: boolean
  onClose: () => void
  onChangeName: (v: string) => void
  onChangeRci: (v: string) => void
  onChangeSignature: (v: string | null) => void
  onSave: () => Promise<void>
}) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Audiologist Name" value={name} onChange={(e) => onChangeName(e.target.value)} fullWidth />
          <TextField label="RCI Number" value={rci} onChange={(e) => onChangeRci(e.target.value)} fullWidth />
          <SignatureUpload value={signature} onChange={onChangeSignature} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="text" disabled={busy}>
          Cancel
        </Button>
        <Button onClick={onSave} variant="contained" disabled={busy || !name.trim()}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}


