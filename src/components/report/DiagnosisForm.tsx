import { Box, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material'
import type { Diagnosis } from '../../types'
import { SignatureUpload } from './SignatureUpload'
import { useAudiologists } from '../../clinic/AudiologistsContext'

export function DiagnosisForm({
  value,
  onChange,
}: {
  value: Diagnosis
  onChange: (next: Diagnosis) => void
}) {
  const { items } = useAudiologists()
  const byId = new Map(items.map((a) => [a.id, a]))

  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Typography variant="h6">Diagnosis & Recommendations</Typography>
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          }}
        >
          <Box>
            <TextField
              label="Provisional Diagnosis"
              value={value.provisionalDiagnosis}
              onChange={(e) => onChange({ ...value, provisionalDiagnosis: e.target.value })}
              fullWidth
              multiline
              minRows={5}
            />
          </Box>
          <Box>
            <TextField
              label="Recommendations"
              value={value.recommendations}
              onChange={(e) => onChange({ ...value, recommendations: e.target.value })}
              fullWidth
              multiline
              minRows={5}
            />
          </Box>
          <Box>
            <TextField
              select
              label="Select Audiologist (auto-fill signature/RCI)"
              value={value.audiologistId ?? ''}
              onChange={(e) => {
                const id = e.target.value || null
                const a = id ? byId.get(id) : undefined
                onChange({
                  ...value,
                  audiologistId: id,
                  audiologistName: a?.name ?? value.audiologistName,
                  audiologistRciNumber: a?.rciNumber ?? value.audiologistRciNumber,
                  signatureDataUrl: a?.signatureDataUrl ?? value.signatureDataUrl,
                })
              }}
              fullWidth
            >
              <MenuItem value="">— Manual —</MenuItem>
              {items.map((a) => (
                <MenuItem key={a.id} value={a.id}>
                  {a.name} {a.rciNumber ? `(RCI: ${a.rciNumber})` : ''}
                </MenuItem>
              ))}
            </TextField>
          </Box>
          <Box>
            <TextField
              label="Audiologist Name (for footer)"
              value={value.audiologistName}
              onChange={(e) => onChange({ ...value, audiologistName: e.target.value })}
              fullWidth
            />
          </Box>
          <Box>
            <TextField
              label="RCI Number"
              value={value.audiologistRciNumber}
              onChange={(e) => onChange({ ...value, audiologistRciNumber: e.target.value })}
              fullWidth
            />
          </Box>
          <Box>
            <SignatureUpload
              value={value.signatureDataUrl}
              onChange={(sig) => onChange({ ...value, signatureDataUrl: sig })}
            />
          </Box>
        </Box>
      </Stack>
    </Paper>
  )
}


