import { ArrowBack, Download, Save, WhatsApp } from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { AudiogramPair } from '../components/audiogram/AudiogramPair'
import { AudiometryGrid } from '../components/audiogram/AudiometryGrid'
import { AdditionalTestsForm } from '../components/report/AdditionalTestsForm'
import { DiagnosisForm } from '../components/report/DiagnosisForm'
import { PatientDetailsForm } from '../components/report/PatientDetailsForm'
import { ReportPrintView } from '../components/pdf/ReportPrintView'
import { AiDiagnosisAssistant } from '../components/ai/AiDiagnosisAssistant'
import { createReport, getReport, normalizeTimestamps, updateReport } from '../services/reports'
import type { ReportDoc } from '../types'
import { defaultReport } from '../utils/reportDefaults'
import { calculatePtaFromAudiometry } from '../utils/pta'
import { downloadPdfFromElement } from '../utils/pdf'

export function ReportEditorPage({ mode }: { mode: 'new' | 'edit' }) {
  const { user } = useAuth()
  const nav = useNavigate()
  const { reportId } = useParams()

  const [loading, setLoading] = useState(mode === 'edit')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<ReportDoc | null>(null)

  const printRef = useRef<HTMLDivElement | null>(null)
  const pdfRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (mode === 'new' && user && !report) {
      setReport(defaultReport(user.uid))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, user])

  useEffect(() => {
    if (mode !== 'edit') return
    const id = reportId
    if (!id) return
    let mounted = true
    async function run(reportId: string) {
      setLoading(true)
      setError(null)
      try {
        const r = await getReport(reportId)
        if (!r) throw new Error('Report not found')
        if (mounted) setReport(normalizeTimestamps(r))
      } catch (e: any) {
        if (mounted) setError(e?.message ?? 'Failed to load report')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    run(id)
    return () => {
      mounted = false
    }
  }, [mode, reportId])

  // Auto PTA from audiometry
  useEffect(() => {
    if (!report) return
    if (!report.pta.auto) return
    const p = calculatePtaFromAudiometry(report.audiometry)
    setReport((prev) => (prev ? { ...prev, pta: { ...prev.pta, right: p.right, left: p.left } } : prev))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report])

  const pdfFilename = useMemo(() => {
    if (!report) return 'report.pdf'
    const safeName = (report.patient.name || 'report').replaceAll(/\s+/g, '_')
    const date = report.patient.dateOfTest || 'date'
    return `${safeName}_${date}.pdf`
  }, [report])

  if (!report) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  const r = report

  if (loading) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Paper sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Paper>
    )
  }

  return (
    <Stack spacing={2}>
      <Box
        sx={{
          display: 'flex',
          alignItems: { xs: 'stretch', md: 'center' },
          gap: 2,
          flexDirection: { xs: 'column', md: 'row' },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Button onClick={() => nav('/')} startIcon={<ArrowBack />} variant="text">
            Back
          </Button>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5">{mode === 'new' ? 'New Report' : 'Edit Report'}</Typography>
            <Typography variant="body2" color="text.secondary">
              Fill patient details, enter audiometry readings, review graphs, then export PDF.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ flex: 1 }} />

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: { xs: '100%', md: 'auto' } }}>
          <Button
            startIcon={<Save />}
            variant="contained"
            disabled={saving}
            fullWidth
            onClick={async () => {
              if (!user) throw new Error('Not authenticated')
              setSaving(true)
              setError(null)
              try {
                const payload: ReportDoc = { ...r, createdByUid: user.uid }
                if (mode === 'new') {
                  const id = await createReport(payload)
                  nav(`/reports/${id}`, { replace: true })
                } else {
                  const id = reportId
                  if (!id) throw new Error('Missing report id')
                  await updateReport(id, payload)
                }
              } catch (e: any) {
                setError(e?.message ?? 'Save failed')
              } finally {
                setSaving(false)
              }
            }}
          >
            Save
          </Button>
          <Button
            startIcon={<Download />}
            variant="outlined"
            fullWidth
            onClick={async () => {
              if (!pdfRef.current) return
              await downloadPdfFromElement(pdfRef.current, pdfFilename)
            }}
          >
            Generate PDF
          </Button>
          <Button
            startIcon={<WhatsApp />}
            variant="outlined"
            fullWidth
            onClick={() => {
              const msg = `Audiology Report: ${r.patient.name || 'Patient'} (${r.patient.dateOfTest || ''}). Please find the attached PDF.`
              window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
            }}
          >
            WhatsApp
          </Button>
        </Stack>
      </Box>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <PatientDetailsForm
        value={r.patient}
        onChange={(p) => setReport({ ...r, patient: p })}
      />

      <AudiometryGrid
        value={r.audiometry}
        onChange={(a) => setReport({ ...r, audiometry: a })}
      />

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Audiogram Preview
        </Typography>
        <AudiogramPair data={r.audiometry} />
      </Paper>

      <AdditionalTestsForm
        tuningFork={r.tuningFork}
        onTuningForkChange={(v) => setReport({ ...r, tuningFork: v })}
        pta={r.pta}
        onPtaChange={(v) => setReport({ ...r, pta: v })}
        specialTests={r.specialTests}
        onSpecialTestsChange={(v) => setReport({ ...r, specialTests: v })}
      />

      <AiDiagnosisAssistant
        audiometry={r.audiometry}
        tuningFork={r.tuningFork}
        onApplyToDiagnosis={(text) =>
          setReport({
            ...r,
            diagnosis: {
              ...r.diagnosis,
              provisionalDiagnosis: r.diagnosis.provisionalDiagnosis
                ? `${r.diagnosis.provisionalDiagnosis}\n\n${text}`
                : text,
            },
          })
        }
      />

      <DiagnosisForm
        value={r.diagnosis}
        onChange={(d) => setReport({ ...r, diagnosis: d })}
      />

      <Divider />

      <Paper sx={{ p: 2, display: { xs: 'none', md: 'block' } }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Print / PDF Layout Preview
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          This section is what gets captured into the PDF (letterhead-style).
        </Typography>
        <Box
          sx={{
            overflowX: 'auto',
            border: '1px dashed rgba(0,0,0,0.2)',
            p: 2,
            background: '#f6f6f6',
          }}
        >
          <Box ref={printRef} sx={{ display: 'inline-block' }}>
            <ReportPrintView report={r} />
          </Box>
        </Box>
      </Paper>

      {/* Hidden fixed-width render target for consistent PDF generation across devices */}
      <Box
        ref={pdfRef}
        sx={{
          position: 'fixed',
          left: -10000,
          top: 0,
          width: 794,
          background: '#fff',
        }}
      >
        <ReportPrintView report={r} />
      </Box>
    </Stack>
  )
}


