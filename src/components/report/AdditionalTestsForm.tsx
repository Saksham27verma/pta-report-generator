import { Box, MenuItem, Paper, Stack, Switch, TextField, Typography, FormControlLabel } from '@mui/material'
import type { Pta, SpecialTests, TuningForkTests } from '../../types'

export function AdditionalTestsForm({
  tuningFork,
  onTuningForkChange,
  pta,
  onPtaChange,
  specialTests,
  onSpecialTestsChange,
}: {
  tuningFork: TuningForkTests
  onTuningForkChange: (next: TuningForkTests) => void
  pta: Pta
  onPtaChange: (next: Pta) => void
  specialTests: SpecialTests
  onSpecialTestsChange: (next: SpecialTests) => void
}) {
  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Typography variant="h6">Additional Tests</Typography>

        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
          }}
        >
          <Box>
            <Typography sx={{ fontWeight: 800, mb: 1 }}>Tuning Fork</Typography>
            <Stack spacing={1.5}>
              <TextField
                select
                label="Rinne (Right)"
                value={tuningFork.rinneRight}
                onChange={(e) =>
                  onTuningForkChange({ ...tuningFork, rinneRight: e.target.value as any })
                }
                fullWidth
              >
                <MenuItem value="">—</MenuItem>
                <MenuItem value="Positive">Positive</MenuItem>
                <MenuItem value="Negative">Negative</MenuItem>
              </TextField>
              <TextField
                select
                label="Rinne (Left)"
                value={tuningFork.rinneLeft}
                onChange={(e) =>
                  onTuningForkChange({ ...tuningFork, rinneLeft: e.target.value as any })
                }
                fullWidth
              >
                <MenuItem value="">—</MenuItem>
                <MenuItem value="Positive">Positive</MenuItem>
                <MenuItem value="Negative">Negative</MenuItem>
              </TextField>
              <TextField
                select
                label="Weber"
                value={tuningFork.weber}
                onChange={(e) => onTuningForkChange({ ...tuningFork, weber: e.target.value as any })}
                fullWidth
              >
                <MenuItem value="">—</MenuItem>
                <MenuItem value="Central">Central</MenuItem>
                <MenuItem value="Left">Left</MenuItem>
                <MenuItem value="Right">Right</MenuItem>
              </TextField>
            </Stack>
          </Box>

          <Box>
            <Typography sx={{ fontWeight: 800, mb: 1 }}>PTA</Typography>
            <Stack spacing={1.5}>
              <FormControlLabel
                control={
                  <Switch
                    checked={pta.auto}
                    onChange={(e) => onPtaChange({ ...pta, auto: e.target.checked })}
                  />
                }
                label="Auto-calculate (avg of 500/1000/2000 Hz AC)"
              />
              <TextField
                label="PTA Right (dB)"
                value={pta.right ?? ''}
                onChange={(e) =>
                  onPtaChange({ ...pta, right: e.target.value === '' ? null : Number(e.target.value) })
                }
                disabled={pta.auto}
                fullWidth
              />
              <TextField
                label="PTA Left (dB)"
                value={pta.left ?? ''}
                onChange={(e) =>
                  onPtaChange({ ...pta, left: e.target.value === '' ? null : Number(e.target.value) })
                }
                disabled={pta.auto}
                fullWidth
              />
            </Stack>
          </Box>

          <Box>
            <Typography sx={{ fontWeight: 800, mb: 1 }}>Special Tests</Typography>
            <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: 'repeat(12, 1fr)' }}>
              <Box sx={{ gridColumn: 'span 12' }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                  Right Ear
                </Typography>
              </Box>
              <Box sx={{ gridColumn: 'span 4' }}>
                <TextField
                  label="SRT (dB)"
                  value={specialTests.right.srtDb ?? ''}
                  onChange={(e) =>
                    onSpecialTestsChange({
                      ...specialTests,
                      right: { ...specialTests.right, srtDb: e.target.value === '' ? null : Number(e.target.value) },
                    })
                  }
                  fullWidth
                />
              </Box>
              <Box sx={{ gridColumn: 'span 4' }}>
                <TextField
                  label="SDS (%)"
                  value={specialTests.right.sdsPercent ?? ''}
                  onChange={(e) =>
                    onSpecialTestsChange({
                      ...specialTests,
                      right: { ...specialTests.right, sdsPercent: e.target.value === '' ? null : Number(e.target.value) },
                    })
                  }
                  fullWidth
                />
              </Box>
              <Box sx={{ gridColumn: 'span 4' }}>
                <TextField
                  label="UCL (dB)"
                  value={specialTests.right.uclDb ?? ''}
                  onChange={(e) =>
                    onSpecialTestsChange({
                      ...specialTests,
                      right: { ...specialTests.right, uclDb: e.target.value === '' ? null : Number(e.target.value) },
                    })
                  }
                  fullWidth
                />
              </Box>

              <Box sx={{ gridColumn: 'span 12', mt: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                  Left Ear
                </Typography>
              </Box>
              <Box sx={{ gridColumn: 'span 4' }}>
                <TextField
                  label="SRT (dB)"
                  value={specialTests.left.srtDb ?? ''}
                  onChange={(e) =>
                    onSpecialTestsChange({
                      ...specialTests,
                      left: { ...specialTests.left, srtDb: e.target.value === '' ? null : Number(e.target.value) },
                    })
                  }
                  fullWidth
                />
              </Box>
              <Box sx={{ gridColumn: 'span 4' }}>
                <TextField
                  label="SDS (%)"
                  value={specialTests.left.sdsPercent ?? ''}
                  onChange={(e) =>
                    onSpecialTestsChange({
                      ...specialTests,
                      left: { ...specialTests.left, sdsPercent: e.target.value === '' ? null : Number(e.target.value) },
                    })
                  }
                  fullWidth
                />
              </Box>
              <Box sx={{ gridColumn: 'span 4' }}>
                <TextField
                  label="UCL (dB)"
                  value={specialTests.left.uclDb ?? ''}
                  onChange={(e) =>
                    onSpecialTestsChange({
                      ...specialTests,
                      left: { ...specialTests.left, uclDb: e.target.value === '' ? null : Number(e.target.value) },
                    })
                  }
                  fullWidth
                />
              </Box>
            </Box>
          </Box>
        </Box>
      </Stack>
    </Paper>
  )
}


