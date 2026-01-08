import { Box, Divider, Paper, Typography } from '@mui/material'
import { Email, Language, Phone } from '@mui/icons-material'
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
  const addressLines = (address || '').split('\n').map((s) => s.trim()).filter(Boolean)
  return (
    <Box>
      {/* Letterhead (tinted background for a more formal look) */}
      <Box
        sx={{
          mt: 0.75,
          p: 1.5,
          borderRadius: 2,
          border: '1px solid rgba(0,0,0,0.10)',
          background: `linear-gradient(180deg, ${primary}14, rgba(255,255,255,0) 70%)`,
        }}
      >
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {/* Logo */}
          <Box
            sx={{
              width: 86,
              height: 86,
              borderRadius: 2,
              border: `1px solid rgba(0,0,0,0.10)`,
              display: 'grid',
              placeItems: 'center',
              overflow: 'hidden',
              background: '#fff',
              flex: '0 0 auto',
            }}
          >
            {logoDataUrl ? (
              <Box
                component="img"
                src={logoDataUrl}
                alt="Logo"
                sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            ) : (
              <Typography sx={{ fontWeight: 900, color: primary, letterSpacing: 1 }}>
                {clinicName ? clinicName.slice(0, 2).toUpperCase() : 'HH'}
              </Typography>
            )}
          </Box>

          {/* Center identity */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 900,
                letterSpacing: 1,
                textTransform: 'uppercase',
                lineHeight: 1.1,
              }}
            >
              {clinicName || 'Clinic'}
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: 'rgba(0,0,0,0.75)', fontWeight: 700, mt: 0.25 }}
            >
              {tagline || ''}
            </Typography>
            <Box sx={{ mt: 0.5 }}>
              {addressLines.length ? (
                addressLines.map((ln, idx) => (
                  <Typography
                    key={idx}
                    variant="caption"
                    sx={{ color: 'rgba(0,0,0,0.62)', display: 'block' }}
                  >
                    {ln}
                  </Typography>
                ))
              ) : (
                <Typography variant="caption" sx={{ color: 'rgba(0,0,0,0.62)', display: 'block' }}>
                  —
                </Typography>
              )}
            </Box>
          </Box>

          {/* Right contact */}
          <Box sx={{ textAlign: 'right', minWidth: 200 }}>
            <ContactLine icon={<Email sx={{ fontSize: 14, color: accent }} />} text={email || '—'} />
            <ContactLine icon={<Phone sx={{ fontSize: 14, color: accent }} />} text={phone || '—'} />
            {website ? (
              <ContactLine icon={<Language sx={{ fontSize: 14, color: accent }} />} text={website} />
            ) : null}
          </Box>
        </Box>

        {/* Clean brand divider */}
        <Box sx={{ mt: 1.25, height: 2, borderRadius: 999, background: primary }} />

        {/* Clinics line (highlight) */}
        <Box
          sx={{
            mt: 1,
            px: 1,
            py: 0.5,
            borderRadius: 1,
            background: `${accent}14`,
            textAlign: 'center',
          }}
        >
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              fontWeight: 900,
              color: accent,
              letterSpacing: 0.3,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              textAlign: 'center',
            }}
          >
            Hearing Hope Clinics: Rohini • Green Park • Indirapuram • Sanjay Nagar (Ghaziabad)
          </Typography>
        </Box>
      </Box>

      {/* Sub-divider + report title */}
      <Box sx={{ mt: 1.25 }}>
        <Box sx={{ height: 2, background: 'rgba(0,0,0,0.08)' }} />
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 0.75 }}>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 900,
              letterSpacing: 1,
              textTransform: 'uppercase',
              color: accent,
            }}
          >
            Pure Tone Audiometry Report
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

function ContactLine({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 0.75 }}>
      {icon}
      <Typography variant="caption" sx={{ color: 'rgba(0,0,0,0.75)', fontWeight: 700 }}>
        {text}
      </Typography>
    </Box>
  )
}

function PatientBlock({ report }: { report: ReportDoc }) {
  const p = report.patient
  return (
    <Paper sx={{ p: 1.5 }} variant="outlined">
      <Box sx={{ display: 'grid', gap: 0.75, gridTemplateColumns: 'repeat(12, 1fr)' }}>
        <InfoField label="Patient" value={p.name || '—'} sx={{ gridColumn: 'span 6' }} />
        <InfoField label="Age" value={p.age ?? '—'} sx={{ gridColumn: 'span 3' }} />
        <InfoField label="Gender" value={p.gender || '—'} sx={{ gridColumn: 'span 3' }} />

        <InfoField label="Reg No" value={p.registrationNumber || '—'} sx={{ gridColumn: 'span 6' }} />
        <InfoField label="Date" value={p.dateOfTest || '—'} sx={{ gridColumn: 'span 6' }} />

        <InfoField
          label="Referred By"
          value={p.referredBy || '—'}
          sx={{ gridColumn: 'span 12' }}
          truncate
        />
        <InfoField
          label="Brief History"
          value={p.briefHistory || '—'}
          sx={{ gridColumn: 'span 12' }}
          truncate
        />
      </Box>
    </Paper>
  )
}

function InfoField({
  label,
  value,
  sx,
  truncate,
}: {
  label: string
  value: unknown
  sx?: any
  truncate?: boolean
}) {
  return (
    <Box sx={{ ...sx, minWidth: 0 }}>
      <Typography variant="caption" sx={{ fontWeight: 900, color: 'rgba(0,0,0,0.70)' }}>
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          fontWeight: 700,
          color: 'rgba(0,0,0,0.85)',
          lineHeight: 1.25,
          ...(truncate
            ? { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
            : null),
        }}
      >
        {String(value)}
      </Typography>
    </Box>
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

function Footer({ report, note, accent: _accent }: { report: ReportDoc; note: string; accent: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
      <Typography variant="caption" sx={{ color: 'rgba(0,0,0,0.55)' }}>
        {note || '—'}
      </Typography>
      <Box sx={{ textAlign: 'center' }}>
        {report.diagnosis.signatureDataUrl ? (
          <Box
            component="img"
            src={report.diagnosis.signatureDataUrl}
            alt="Signature"
            sx={{ height: 48, display: 'block', mx: 'auto', mb: 0.5 }}
          />
        ) : (
          <Box sx={{ height: 48, mb: 0.5 }} />
        )}
        <Typography sx={{ fontWeight: 900, color: '#000' }}>
          {report.diagnosis.audiologistName || 'Audiologist'}
        </Typography>
        {report.diagnosis.audiologistRciNumber ? (
          <Typography variant="caption" sx={{ color: 'rgba(0,0,0,0.65)' }}>
            RCI: {report.diagnosis.audiologistRciNumber}
          </Typography>
        ) : null}
      </Box>
    </Box>
  )
}


