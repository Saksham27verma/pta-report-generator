import { Box, Paper, Stack, TextField, Typography, MenuItem } from '@mui/material'
import type { PatientInfo } from '../../types'

export function PatientDetailsForm({
  value,
  onChange,
}: {
  value: PatientInfo
  onChange: (next: PatientInfo) => void
}) {
  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={1.5}>
        <Typography variant="h6">Patient Details</Typography>
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: 'repeat(12, 1fr)',
          }}
        >
          <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
            <TextField
              label="Patient Name"
              value={value.name}
              onChange={(e) => onChange({ ...value, name: e.target.value })}
              fullWidth
            />
          </Box>
          <Box sx={{ gridColumn: { xs: 'span 6', md: 'span 2' } }}>
            <TextField
              label="Age"
              value={value.age ?? ''}
              onChange={(e) =>
                onChange({ ...value, age: e.target.value === '' ? null : Number(e.target.value) })
              }
              inputProps={{ inputMode: 'numeric' }}
              fullWidth
            />
          </Box>
          <Box sx={{ gridColumn: { xs: 'span 6', md: 'span 2' } }}>
            <TextField
              select
              label="Gender"
              value={value.gender}
              onChange={(e) => onChange({ ...value, gender: e.target.value as any })}
              fullWidth
            >
              <MenuItem value="">—</MenuItem>
              <MenuItem value="Male">Male</MenuItem>
              <MenuItem value="Female">Female</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </TextField>
          </Box>
          <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 2' } }}>
            <TextField
              label="Date of Test"
              type="date"
              value={value.dateOfTest}
              onChange={(e) => onChange({ ...value, dateOfTest: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Box>

          <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}>
            <TextField
              label="Registration Number"
              value={value.registrationNumber}
              onChange={(e) => onChange({ ...value, registrationNumber: e.target.value })}
              fullWidth
            />
          </Box>
          <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}>
            <TextField
              label="Referred By"
              value={value.referredBy}
              onChange={(e) => onChange({ ...value, referredBy: e.target.value })}
              fullWidth
            />
          </Box>
          <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}>
            <TextField
              label="Brief History"
              value={value.briefHistory}
              onChange={(e) => onChange({ ...value, briefHistory: e.target.value })}
              fullWidth
            />
          </Box>
        </Box>
      </Stack>
    </Paper>
  )
}


