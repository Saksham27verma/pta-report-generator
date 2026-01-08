import { ContentCopy, Psychology, South } from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  Collapse,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { useMemo, useState } from 'react'
import type { AudiometryData, TuningForkTests } from '../../types'
import { generateAiAssist } from '../../utils/audiologyAnalysis'

export function AiDiagnosisAssistant({
  audiometry,
  tuningFork,
  onApplyToDiagnosis,
}: {
  audiometry: AudiometryData
  tuningFork: TuningForkTests
  onApplyToDiagnosis: (text: string) => void
}) {
  const [open, setOpen] = useState(true)
  const [result, setResult] = useState<ReturnType<typeof generateAiAssist> | null>(null)

  const disclaimer = useMemo(
    () =>
      'Decision support only. This is not a medical diagnosis and must be validated by the audiologist/ENT with clinical correlation.',
    [],
  )

  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={1.5}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Psychology fontSize="small" /> AI Diagnosis Assistant
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Generates an interpretation draft from the entered audiogram/PTA values (local, no data sent).
            </Typography>
          </Box>
          <Button variant="text" onClick={() => setOpen((v) => !v)} endIcon={<South sx={{ transform: open ? 'rotate(180deg)' : 'none' }} />}>
            {open ? 'Hide' : 'Show'}
          </Button>
        </Box>

        <Collapse in={open}>
          <Stack spacing={1.5}>
            <Alert severity="info">{disclaimer}</Alert>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<Psychology />}
                onClick={() => setResult(generateAiAssist({ audiometry, tuningFork }))}
              >
                Analyze Audiogram
              </Button>
              {result ? (
                <Button
                  variant="outlined"
                  startIcon={<ContentCopy />}
                  onClick={() => onApplyToDiagnosis(result.suggestedText)}
                >
                  Copy into Provisional Diagnosis
                </Button>
              ) : null}
            </Box>

            {result ? (
              <Paper variant="outlined" sx={{ p: 1.5, background: '#fff' }}>
                <Typography sx={{ fontWeight: 900 }}>Summary</Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {result.summary}
                </Typography>

                {result.redFlags.length ? (
                  <>
                    <Typography sx={{ fontWeight: 900, mt: 1 }}>Flags</Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {result.redFlags.map((x) => `- ${x}`).join('\n')}
                    </Typography>
                  </>
                ) : null}

                <Typography sx={{ fontWeight: 900, mt: 1 }}>Reasoning</Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {result.reasoning.join('\n')}
                </Typography>

                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Generated: {result.generatedAtIso}
                </Typography>
              </Paper>
            ) : null}
          </Stack>
        </Collapse>
      </Stack>
    </Paper>
  )
}


