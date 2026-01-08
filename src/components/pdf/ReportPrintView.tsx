import { Box, Divider, Paper, Typography } from '@mui/material'
import type { ReportDoc } from '../../types'
import { AudiogramPair } from '../audiogram/AudiogramPair'

export function ReportPrintView({ report }: { report: ReportDoc }) {
  return (
    <Box
      sx={{
        width: 794, // ~A4 at 96dpi
        background: '#fff',
        color: '#111',
        p: 2,
      }}
    >
      <Header />
      <Divider sx={{ my: 2 }} />
      <PatientBlock report={report} />
      <Box sx={{ my: 2 }}>
        <AudiogramPair data={report.audiometry} chartHeight={250} />
      </Box>
      <Box sx={{ my: 2 }}>
        <TestsTable report={report} />
      </Box>
      <Box sx={{ my: 2 }}>
        <DiagnosisBlock report={report} />
      </Box>
      <Divider sx={{ my: 2 }} />
      <Footer report={report} />
    </Box>
  )
}

function Header() {
  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: 1 }}>
        HEARING HOPE
      </Typography>
      <Typography variant="body2" color="text.secondary">
        (Audiology & Speech Clinic) • Address line 1, City • +91-XXXXXXXXXX • clinic@email.com
      </Typography>
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

function Footer({ report }: { report: ReportDoc }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
      <Typography variant="caption" color="text.secondary">
        This report is computer generated and intended for clinical correlation.
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
        <Typography sx={{ fontWeight: 800 }}>{report.diagnosis.audiologistName || 'Audiologist'}</Typography>
        <Typography variant="caption" color="text.secondary">
          (Signature)
        </Typography>
      </Box>
    </Box>
  )
}


