import { ArrowBack, Download, Edit, Settings } from '@mui/icons-material'
import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography } from '@mui/material'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ReportPrintView } from '../components/pdf/ReportPrintView'
import { getReport, normalizeTimestamps } from '../services/reports'
import type { ReportDoc } from '../types'
import { downloadPdfFromElement } from '../utils/pdf'

export function ReportPreviewPage() {
  const { reportId } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<ReportDoc | null>(null)
  const printRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const id = reportId
    if (!id) {
      setError('Missing report id')
      setLoading(false)
      return
    }
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
  }, [reportId])

  const pdfFilename = useMemo(() => {
    if (!report) return 'report.pdf'
    const safeName = (report.patient.name || 'report').replaceAll(/\s+/g, '_')
    const date = report.patient.dateOfTest || 'date'
    return `${safeName}_${date}.pdf`
  }, [report])

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

  if (!report) return null

  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
        <Button component={Link} to="/" startIcon={<ArrowBack />} variant="text">
          Back to Reports
        </Button>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5">Preview</Typography>
          <Typography variant="body2" color="text.secondary">
            This is the final printable layout.
          </Typography>
        </Box>
        <Button component={Link} to="/settings" startIcon={<Settings />} variant="text">
          Branding
        </Button>
        <Button
          component={Link}
          to={`/reports/${report.id}`}
          startIcon={<Edit />}
          variant="outlined"
        >
          Edit
        </Button>
        <Button
          startIcon={<Download />}
          variant="contained"
          onClick={async () => {
            if (!printRef.current) return
            await downloadPdfFromElement(printRef.current, pdfFilename)
          }}
        >
          Generate PDF
        </Button>
      </Box>

      <Paper sx={{ p: 2 }}>
        <Box
          sx={{
            overflowX: 'auto',
            border: '1px dashed rgba(0,0,0,0.2)',
            p: 2,
            background: '#f6f6f6',
          }}
        >
          <Box ref={printRef} sx={{ display: 'inline-block' }}>
            <ReportPrintView report={report} />
          </Box>
        </Box>
      </Paper>
    </Stack>
  )
}


