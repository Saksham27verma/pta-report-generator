import { DeleteOutline, Lock, Save, Visibility, VisibilityOff } from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useClinicSettings } from '../clinic/ClinicSettingsContext'
import type { ClinicSettings } from '../types'
import { DEFAULT_ACCENT, DEFAULT_PRIMARY } from '../utils/clinicSettingsDefaults'
import { SignatureUpload } from '../components/report/SignatureUpload'
import { useAudiologists } from '../clinic/AudiologistsContext'
import type { AudiologistProfile } from '../types'
import { useAuth } from '../auth/AuthContext'
import { hashSettingsPassword, randomSalt } from '../utils/settingsAccess'

export function ClinicSettingsPage() {
  const { settings, loading, error: loadError, save } = useClinicSettings()
  const { user } = useAuth()
  const audiologists = useAudiologists()
  const [draft, setDraft] = useState<ClinicSettings>(settings)
  const hydratedForUid = useRef<string | null>(null)
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
    const uid = user?.uid ?? null
    if (!loading && uid && hydratedForUid.current !== uid) {
      setDraft(settings)
      hydratedForUid.current = uid
    }
  }, [loading, settings, user?.uid])

  const unlockKey = useMemo(() => {
    const uid = user?.uid ?? 'unknown'
    return `clinicSettingsUnlocked:${uid}`
  }, [user?.uid])

  const access = settings.settingsAccess ?? null
  const [rememberUnlock, setRememberUnlock] = useState(false)
  const [unlockedHash, setUnlockedHash] = useState<string | null>(null)

  // If user opts into "remember", hydrate from sessionStorage once per uid.
  useEffect(() => {
    setUnlockedHash(null)
    if (!rememberUnlock) return
    const saved = sessionStorage.getItem(unlockKey)
    setUnlockedHash(saved)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlockKey, rememberUnlock])

  const isLocked = !!access?.hash && unlockedHash !== access.hash
  const [unlockPassword, setUnlockPassword] = useState('')
  const [unlockBusy, setUnlockBusy] = useState(false)
  const [unlockErr, setUnlockErr] = useState<string | null>(null)
  const [unlockShow, setUnlockShow] = useState(false)

  const [secOpen, setSecOpen] = useState(false)
  const [secMode, setSecMode] = useState<'set' | 'change' | 'remove'>('set')
  const [secCurrent, setSecCurrent] = useState('')
  const [secNext, setSecNext] = useState('')
  const [secNext2, setSecNext2] = useState('')
  const [secBusy, setSecBusy] = useState(false)
  const [secErr, setSecErr] = useState<string | null>(null)
  const [secShow, setSecShow] = useState(false)

  if (loading) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (isLocked) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
        <Paper sx={{ p: 3, width: '100%', maxWidth: 520 }}>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Lock fontSize="small" />
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                Clinic Settings Locked
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Enter the Clinic Settings password to open this page.
            </Typography>
            <TextField
              label="Password"
              value={unlockPassword}
              onChange={(e) => {
                setUnlockPassword(e.target.value)
                setUnlockErr(null)
              }}
              type={unlockShow ? 'text' : 'password'}
              fullWidth
              onKeyDown={async (e) => {
                if (e.key !== 'Enter') return
                if (!unlockPassword.trim()) return
                setUnlockBusy(true)
                setUnlockErr(null)
                try {
                  const computed = await hashSettingsPassword(unlockPassword, access?.salt ?? '')
                  if (computed !== access?.hash) throw new Error('Incorrect password')
                  setUnlockedHash(access.hash)
                  if (rememberUnlock) sessionStorage.setItem(unlockKey, access.hash)
                } catch (err: any) {
                  setUnlockErr(err?.message ?? 'Unlock failed')
                } finally {
                  setUnlockBusy(false)
                }
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton aria-label="Toggle password visibility" onClick={() => setUnlockShow((v) => !v)}>
                      {unlockShow ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <FormControlLabel
              control={<Checkbox checked={rememberUnlock} onChange={(e) => setRememberUnlock(e.target.checked)} />}
              label="Remember for this tab"
            />
            {unlockErr ? <Alert severity="error">{unlockErr}</Alert> : null}
            <Button
              variant="contained"
              disabled={unlockBusy || !unlockPassword.trim()}
              onClick={async () => {
                setUnlockBusy(true)
                setUnlockErr(null)
                try {
                  const computed = await hashSettingsPassword(unlockPassword, access?.salt ?? '')
                  if (computed !== access?.hash) throw new Error('Incorrect password')
                  setUnlockedHash(access.hash)
                  if (rememberUnlock) sessionStorage.setItem(unlockKey, access.hash)
                } catch (err: any) {
                  setUnlockErr(err?.message ?? 'Unlock failed')
                } finally {
                  setUnlockBusy(false)
                }
              }}
            >
              Unlock
            </Button>
          </Stack>
        </Paper>
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

      {!settings.settingsAccess?.hash ? (
        <Alert severity="warning">
          This page is <b>not password-protected</b> yet. Set a Clinic Settings password below to prevent others from
          opening it.
        </Alert>
      ) : null}

      <Paper sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Typography variant="h6">Security</Typography>
          <Typography variant="body2" color="text.secondary">
            Add a password gate for the Clinic Settings page (stored as a salted hash in Firestore).
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            {!settings.settingsAccess?.hash ? (
              <Button
                variant="contained"
                onClick={() => {
                  setSecMode('set')
                  setSecCurrent('')
                  setSecNext('')
                  setSecNext2('')
                  setSecErr(null)
                  setSecOpen(true)
                }}
              >
                Set Password
              </Button>
            ) : (
              <>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setSecMode('change')
                    setSecCurrent('')
                    setSecNext('')
                    setSecNext2('')
                    setSecErr(null)
                    setSecOpen(true)
                  }}
                >
                  Change Password
                </Button>
                <Button
                  color="error"
                  variant="text"
                  startIcon={<DeleteOutline />}
                  onClick={() => {
                    setSecMode('remove')
                    setSecCurrent('')
                    setSecNext('')
                    setSecNext2('')
                    setSecErr(null)
                    setSecOpen(true)
                  }}
                >
                  Remove Password
                </Button>
              </>
            )}
          </Stack>
        </Stack>
      </Paper>

      <SecurityDialog
        open={secOpen}
        mode={secMode}
        current={secCurrent}
        next={secNext}
        next2={secNext2}
        show={secShow}
        busy={secBusy}
        error={secErr}
        onClose={() => {
          setSecOpen(false)
          setSecErr(null)
        }}
        onSave={onSaveSecurity}
        onChangeCurrent={(v) => {
          setSecCurrent(v)
          setSecErr(null)
        }}
        onChangeNext={(v) => {
          setSecNext(v)
          setSecErr(null)
        }}
        onChangeNext2={(v) => {
          setSecNext2(v)
          setSecErr(null)
        }}
        onToggleShow={() => setSecShow((v) => !v)}
      />

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
          <Typography variant="h6">Sharing</Typography>
          <Typography variant="body2" color="text.secondary">
            Customize the WhatsApp text sent with reports. You can use placeholders:{' '}
            <code>{'{patientName}'}</code>, <code>{'{date}'}</code>, <code>{'{reportId}'}</code>.
          </Typography>
          <TextField
            label="WhatsApp message template"
            value={draft.whatsappMessageTemplate}
            onChange={(e) => setDraft({ ...draft, whatsappMessageTemplate: e.target.value })}
            fullWidth
            multiline
            minRows={3}
          />
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

  async function onSaveSecurity() {
    if (!user) throw new Error('Not authenticated')
    setSecBusy(true)
    setSecErr(null)
    try {
      const currentAccess = settings.settingsAccess ?? null

      if (secMode === 'set') {
        if (currentAccess?.hash) throw new Error('Password already set')
        if (secNext.length < 4) throw new Error('Password must be at least 4 characters')
        if (secNext !== secNext2) throw new Error('Passwords do not match')

        const salt = randomSalt()
        const hash = await hashSettingsPassword(secNext, salt)
        const nextSettings: ClinicSettings = {
          ...settings,
          settingsAccess: { salt, hash, updatedAt: new Date().toISOString() },
        }
        await save(nextSettings)
        setUnlockedHash(hash)
        if (rememberUnlock) sessionStorage.setItem(unlockKey, hash)
        setOk('Password set')
        setSecOpen(false)
      }

      if (secMode === 'change') {
        if (!currentAccess?.hash) throw new Error('No password set yet')
        const currentHash = await hashSettingsPassword(secCurrent, currentAccess.salt)
        if (currentHash !== currentAccess.hash) throw new Error('Current password is incorrect')
        if (secNext.length < 4) throw new Error('New password must be at least 4 characters')
        if (secNext !== secNext2) throw new Error('New passwords do not match')

        const salt = randomSalt()
        const hash = await hashSettingsPassword(secNext, salt)
        const nextSettings: ClinicSettings = {
          ...settings,
          settingsAccess: { salt, hash, updatedAt: new Date().toISOString() },
        }
        await save(nextSettings)
        setUnlockedHash(hash)
        if (rememberUnlock) sessionStorage.setItem(unlockKey, hash)
        setOk('Password changed')
        setSecOpen(false)
      }

      if (secMode === 'remove') {
        if (!currentAccess?.hash) throw new Error('No password set yet')
        const currentHash = await hashSettingsPassword(secCurrent, currentAccess.salt)
        if (currentHash !== currentAccess.hash) throw new Error('Current password is incorrect')

        const nextSettings: ClinicSettings = {
          ...settings,
          settingsAccess: null,
        }
        await save(nextSettings)
        sessionStorage.removeItem(unlockKey)
        setUnlockedHash(null)
        setOk('Password removed')
        setSecOpen(false)
      }
    } catch (err: any) {
      setSecErr(err?.message ?? 'Failed')
    } finally {
      setSecBusy(false)
    }
  }
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

function SecurityDialog({
  open,
  mode,
  current,
  next,
  next2,
  show,
  busy,
  error,
  onClose,
  onSave,
  onChangeCurrent,
  onChangeNext,
  onChangeNext2,
  onToggleShow,
}: {
  open: boolean
  mode: 'set' | 'change' | 'remove'
  current: string
  next: string
  next2: string
  show: boolean
  busy: boolean
  error: string | null
  onClose: () => void
  onSave: () => Promise<void>
  onChangeCurrent: (v: string) => void
  onChangeNext: (v: string) => void
  onChangeNext2: (v: string) => void
  onToggleShow: () => void
}) {
  const title =
    mode === 'set' ? 'Set Clinic Settings Password' : mode === 'change' ? 'Change Clinic Settings Password' : 'Remove Password'

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {mode !== 'set' ? (
            <TextField
              label="Current password"
              value={current}
              onChange={(e) => onChangeCurrent(e.target.value)}
              type={show ? 'text' : 'password'}
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton aria-label="Toggle password visibility" onClick={onToggleShow}>
                      {show ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          ) : null}

          {mode !== 'remove' ? (
            <>
              <TextField
                label={mode === 'set' ? 'New password' : 'New password'}
                value={next}
                onChange={(e) => onChangeNext(e.target.value)}
                type={show ? 'text' : 'password'}
                fullWidth
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton aria-label="Toggle password visibility" onClick={onToggleShow}>
                        {show ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label="Confirm new password"
                value={next2}
                onChange={(e) => onChangeNext2(e.target.value)}
                type={show ? 'text' : 'password'}
                fullWidth
              />
            </>
          ) : (
            <Alert severity="warning">
              Removing the password will make this page accessible to anyone who can log into this account.
            </Alert>
          )}

          {error ? <Alert severity="error">{error}</Alert> : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="text" disabled={busy}>
          Cancel
        </Button>
        <Button onClick={onSave} variant="contained" disabled={busy}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}


