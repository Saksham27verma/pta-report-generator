import { Box, CircularProgress, Typography } from '@mui/material'
import { signInAnonymously } from 'firebase/auth'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AudiogramPair } from '../components/audiogram/AudiogramPair'
import { auth } from '../firebase'
import { getReport, normalizeTimestamps } from '../services/reports'
import type { ReportDoc } from '../types'

export function EmbedReportPage() {
  const { reportId } = useParams()
  const [report, setReport] = useState<ReportDoc | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!reportId) {
      setError('Missing report id')
      setLoading(false)
      return
    }
    if (!auth) {
      setError('Firebase is not configured')
      setLoading(false)
      return
    }

    let cancelled = false

    async function run() {
      setLoading(true)
      setError(null)
      try {
        if (!auth!.currentUser) {
          await signInAnonymously(auth!)
        }
        const r = await getReport(reportId!)
        if (cancelled) return
        if (!r) {
          setError('Report not found')
          setReport(null)
          return
        }
        setReport(normalizeTimestamps(r))
      } catch (e: unknown) {
        if (cancelled) return
        const msg = e instanceof Error ? e.message : 'Failed to load report'
        setError(msg)
        setReport(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [reportId])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 240, p: 2 }}>
        <CircularProgress size={32} />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error" variant="body2">
          {error}
        </Typography>
      </Box>
    )
  }

  if (!report) return null

  const title = [report.patient?.name?.trim(), report.patient?.dateOfTest].filter(Boolean).join(' · ')

  return (
    <Box sx={{ p: { xs: 1, sm: 2 }, maxWidth: 1200, mx: 'auto' }}>
      {title ? (
        <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 700 }}>
          {title}
        </Typography>
      ) : null}
      <AudiogramPair data={report.audiometry} chartHeight={280} layout="responsive" />
    </Box>
  )
}
