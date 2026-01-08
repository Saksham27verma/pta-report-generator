import { Box, Paper, Stack, TextField, Typography } from '@mui/material'
import type { Diagnosis } from '../../types'
import { SignatureUpload } from './SignatureUpload'

export function DiagnosisForm({
  value,
  onChange,
}: {
  value: Diagnosis
  onChange: (next: Diagnosis) => void
}) {
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
              label="Audiologist Name (for footer)"
              value={value.audiologistName}
              onChange={(e) => onChange({ ...value, audiologistName: e.target.value })}
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


