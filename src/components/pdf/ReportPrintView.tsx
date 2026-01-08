import { Box, Divider, Paper, Typography } from '@mui/material'
import type { ReportDoc } from '../../types'
import { AudiogramPair } from '../audiogram/AudiogramPair'
import { useClinicSettings } from '../../clinic/ClinicSettingsContext'
import { DEFAULT_ACCENT, DEFAULT_PRIMARY } from '../../utils/clinicSettingsDefaults'

export function ReportPrintView({ report }: { report: ReportDoc }) {
  const { settings } = useClinicSettings()
  const primary = settings.primaryColor || DEFAULT_PRIMARY
  const accent = settings.accentColor || DEFAULT_ACCENT

  return (
    <Box
      sx={{
        width: 794, // ~A4 at 96dpi
        background: '#fff',
        color: '#111',
        p: 2,
      }}
    >
      <Header
        clinicName={settings.clinicName}
        tagline={settings.tagline}
        address={settings.address}
        phone={settings.phone}
        email={settings.email}
        website={settings.website}
        logoDataUrl={settings.logoDataUrl}
        primary={primary}
        accent={accent}
      />
      <Divider sx={{ my: 1.5 }} />
      <PatientBlock report={report} />
      <Box sx={{ my: 1.5 }}>
        <AudiogramPair data={report.audiometry} chartHeight={250} />
      </Box>
      <Box sx={{ my: 1.5 }}>
        <TestsTable report={report} />
      </Box>
      <Box sx={{ my: 1.5 }}>
        <DiagnosisBlock report={report} />
      </Box>
      <Divider sx={{ my: 1.5 }} />
      <Footer report={report} note={settings.footerNote} accent={accent} />
    </Box>
  )
}

function Header({
  clinicName,
  tagline,
  address,
  phone,
  email,
  website,
  logoDataUrl,
  primary,
  accent,
}: {
  clinicName: string
  tagline: string
  address: string
  phone: string
  email: string
  website: string
  logoDataUrl: string | null
  primary: string
  accent: string
}) {
  return (
    <Box>
      <Box sx={{ height: 8, borderRadius: 999, background: `linear-gradient(90deg, ${primary}, ${accent})` }} />
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 1.25 }}>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: 2,
            border: `1px solid rgba(0,0,0,0.10)`,
            display: 'grid',
            placeItems: 'center',
            overflow: 'hidden',
            background: '#fff',
          }}
        >
          {logoDataUrl ? (
            <Box component="img" src={logoDataUrl} alt="Logo" sx={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <Typography sx={{ fontWeight: 900, color: primary }}>HH</Typography>
          )}
        </Box>

        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: 0.5 }}>
            {clinicName || 'Clinic'}
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0,0,0,0.70)', fontWeight: 700 }}>
            {tagline || ''}
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(0,0,0,0.60)' }}>
            {address || ''}
          </Typography>
        </Box>

        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="caption" sx={{ color: 'rgba(0,0,0,0.70)' }}>
            <b style={{ color: accent }}>Phone:</b> {phone || '—'}
          </Typography>
          <br />
          <Typography variant="caption" sx={{ color: 'rgba(0,0,0,0.70)' }}>
            <b style={{ color: accent }}>Email:</b> {email || '—'}
          </Typography>
          {website ? (
            <>
              <br />
              <Typography variant="caption" sx={{ color: 'rgba(0,0,0,0.70)' }}>
                <b style={{ color: accent }}>Web:</b> {website}
              </Typography>
            </>
          ) : null}
        </Box>
      </Box>
    </Box>
  )
}

function PatientBlock({ report }: { report: ReportDoc }) {
  const p = report.patient
  return (
    <Paper sx={{ p: 2 }} variant="outlined">
      <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: 'repeat(12, 1fr)' }}>
        <Box sx={{ gridColumn: 'span 6' }}>
          <Typography sx={{ fontWeight: 800 }}>Patient:</Typography> {p.name || '—'}
        </Box>
        <Box sx={{ gridColumn: 'span 3' }}>
          <Typography sx={{ fontWeight: 800 }}>Age:</Typography> {p.age ?? '—'}
        </Box>
        <Box sx={{ gridColumn: 'span 3' }}>
          <Typography sx={{ fontWeight: 800 }}>Gender:</Typography> {p.gender || '—'}
        </Box>
        <Box sx={{ gridColumn: 'span 6' }}>
          <Typography sx={{ fontWeight: 800 }}>Reg No:</Typography> {p.registrationNumber || '—'}
        </Box>
        <Box sx={{ gridColumn: 'span 6' }}>
          <Typography sx={{ fontWeight: 800 }}>Date:</Typography> {p.dateOfTest || '—'}
        </Box>
        <Box sx={{ gridColumn: 'span 12' }}>
          <Typography sx={{ fontWeight: 800 }}>Referred By:</Typography> {p.referredBy || '—'}
        </Box>
        <Box sx={{ gridColumn: 'span 12' }}>
          <Typography sx={{ fontWeight: 800 }}>Brief History:</Typography> {p.briefHistory || '—'}
        </Box>
      </Box>
    </Paper>
  )
}

function TestsTable({ report }: { report: ReportDoc }) {
  const t = report.tuningFork
  const pta = report.pta
  const s = report.specialTests
  return (
    <Paper sx={{ p: 2 }} variant="outlined">
      <Typography sx={{ fontWeight: 900, mb: 1 }}>Test Summary</Typography>
      <Box
        sx={{
          display: 'grid',
          gap: 1,
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
        }}
      >
        <Box>
          <Typography sx={{ fontWeight: 800 }}>Tuning Fork</Typography>
          <Typography variant="body2">Rinne (R): {t.rinneRight || '—'}</Typography>
          <Typography variant="body2">Rinne (L): {t.rinneLeft || '—'}</Typography>
          <Typography variant="body2">Weber: {t.weber || '—'}</Typography>
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 800 }}>PTA</Typography>
          <Typography variant="body2">Right: {pta.right ?? '—'} dB</Typography>
          <Typography variant="body2">Left: {pta.left ?? '—'} dB</Typography>
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 800 }}>Special Tests</Typography>
          <Typography variant="body2">
            Right: SRT {s.right.srtDb ?? '—'} / SDS {s.right.sdsPercent ?? '—'} / UCL {s.right.uclDb ?? '—'}
          </Typography>
          <Typography variant="body2">
            Left: SRT {s.left.srtDb ?? '—'} / SDS {s.left.sdsPercent ?? '—'} / UCL {s.left.uclDb ?? '—'}
          </Typography>
        </Box>
      </Box>
    </Paper>
  )
}

function DiagnosisBlock({ report }: { report: ReportDoc }) {
  return (
    <Paper sx={{ p: 2 }} variant="outlined">
      <Typography sx={{ fontWeight: 900, mb: 1 }}>Diagnosis</Typography>
      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
        {report.diagnosis.provisionalDiagnosis || '—'}
      </Typography>
      <Typography sx={{ fontWeight: 900, mt: 2, mb: 1 }}>Recommendations</Typography>
      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
        {report.diagnosis.recommendations || '—'}
      </Typography>
    </Paper>
  )
}

function Footer({ report, note, accent }: { report: ReportDoc; note: string; accent: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
      <Typography variant="caption" sx={{ color: 'rgba(0,0,0,0.55)' }}>
        {note || '—'}
      </Typography>
      <Box sx={{ textAlign: 'right' }}>
        {report.diagnosis.signatureDataUrl ? (
          <Box
            component="img"
            src={report.diagnosis.signatureDataUrl}
            alt="Signature"
            sx={{ height: 48, display: 'block', ml: 'auto' }}
          />
        ) : (
          <Box sx={{ height: 48 }} />
        )}
        <Typography sx={{ fontWeight: 900, color: accent }}>
          {report.diagnosis.audiologistName || 'Audiologist'}
        </Typography>
        {report.diagnosis.audiologistRciNumber ? (
          <Typography variant="caption" sx={{ color: 'rgba(0,0,0,0.65)' }}>
            RCI: {report.diagnosis.audiologistRciNumber}
          </Typography>
        ) : null}
        <Typography variant="caption" sx={{ color: 'rgba(0,0,0,0.55)' }}>
          (Signature)
        </Typography>
      </Box>
    </Box>
  )
}


