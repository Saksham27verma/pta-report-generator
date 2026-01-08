import {
  Box,
  Checkbox,
  FormControlLabel,
  Paper,
  Stack,
  Button,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import type { AudiometryData, AudioFrequency, ConductionType, EarSide } from '../../types'
import { AUDIO_FREQS } from '../../types'

type Props = {
  value: AudiometryData
  onChange: (next: AudiometryData) => void
}

function clampDb(n: number) {
  if (Number.isNaN(n)) return null
  return Math.max(-10, Math.min(120, n))
}

function setPoint(
  value: AudiometryData,
  ear: EarSide,
  freq: AudioFrequency,
  type: ConductionType,
  patch: Partial<{ db: number | null; masked: boolean; nr: boolean }>,
): AudiometryData {
  const next: AudiometryData = structuredClone(value)
  const point = next[ear][freq][type]
  next[ear][freq][type] = { ...point, ...patch }
  if (patch.nr === true) {
    // NR should NOT create a definitive plotted threshold.
    // We keep db unset so the chart line won't connect through it.
    next[ear][freq][type].db = null
  }
  if (patch.db != null) {
    next[ear][freq][type].nr = false
  }

  // Rule: BC cannot be worse than AC (i.e., BC dB should not be higher than AC dB).
  // Only enforce when both values exist and neither is marked NR.
  const ac = next[ear][freq].air
  const bc = next[ear][freq].bone
  if (ac.db != null && bc.db != null && !ac.nr && !bc.nr) {
    if (bc.db > ac.db) {
      bc.db = ac.db
    }
  }

  return next
}

export function AudiometryGrid({ value, onChange }: Props) {
  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={1.5}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6">Audiometry Data Entry</Typography>
            <Typography variant="body2" color="text.secondary">
              Frequencies: 250, 500, 1k, 2k, 4k, 8k Hz • dB HL scale -10 to 120
            </Typography>
          </Box>
          <Button
            variant="outlined"
            onClick={() => {
              const next: AudiometryData = structuredClone(value)
              for (const f of AUDIO_FREQS) {
                next.left[f].bone = { ...next.right[f].bone }
              }
              onChange(next)
            }}
          >
            Copy Right BC → Left BC
          </Button>
        </Box>

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 800 }}>Hz</TableCell>
              <TableCell sx={{ fontWeight: 800 }} colSpan={3}>
                Right Air (AC)
              </TableCell>
              <TableCell sx={{ fontWeight: 800 }} colSpan={3}>
                Right Bone (BC)
              </TableCell>
              <TableCell sx={{ fontWeight: 800 }} colSpan={3}>
                Left Air (AC)
              </TableCell>
              <TableCell sx={{ fontWeight: 800 }} colSpan={3}>
                Left Bone (BC)
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell />
              {Array.from({ length: 4 }).flatMap((_, i) => [
                <TableCell key={`db-${i}`} sx={{ fontWeight: 700 }}>
                  dB
                </TableCell>,
                <TableCell key={`m-${i}`} sx={{ fontWeight: 700 }}>
                  Mask
                </TableCell>,
                <TableCell key={`nr-${i}`} sx={{ fontWeight: 700 }}>
                  NR
                </TableCell>,
              ])}
            </TableRow>
          </TableHead>
          <TableBody>
            {AUDIO_FREQS.map((freq) => (
              <Row key={freq} freq={freq} value={value} onChange={onChange} />
            ))}
          </TableBody>
        </Table>
      </Stack>
    </Paper>
  )
}

function Row({
  freq,
  value,
  onChange,
}: {
  freq: AudioFrequency
  value: AudiometryData
  onChange: (next: AudiometryData) => void
}) {
  return (
    <TableRow>
      <TableCell sx={{ fontWeight: 800 }}>{freq}</TableCell>
      <Cell ear="right" type="air" freq={freq} value={value} onChange={onChange} />
      <Cell ear="right" type="bone" freq={freq} value={value} onChange={onChange} />
      <Cell ear="left" type="air" freq={freq} value={value} onChange={onChange} />
      <Cell ear="left" type="bone" freq={freq} value={value} onChange={onChange} />
    </TableRow>
  )
}

function Cell({
  ear,
  type,
  freq,
  value,
  onChange,
}: {
  ear: EarSide
  type: ConductionType
  freq: AudioFrequency
  value: AudiometryData
  onChange: (next: AudiometryData) => void
}) {
  const p = value[ear][freq][type]
  return (
    <>
      <TableCell>
        <TextField
          value={p.db ?? ''}
          onChange={(e) => {
            const raw = e.target.value
            if (raw === '') return onChange(setPoint(value, ear, freq, type, { db: null }))
            const n = clampDb(Number(raw))
            onChange(setPoint(value, ear, freq, type, { db: n }))
          }}
          inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', style: { width: 70 } }}
          size="small"
          disabled={p.nr}
        />
      </TableCell>
      <TableCell>
        <FormControlLabel
          control={
            <Switch
              checked={p.masked}
              onChange={(e) =>
                onChange(setPoint(value, ear, freq, type, { masked: e.target.checked }))
              }
              size="small"
            />
          }
          label=""
        />
      </TableCell>
      <TableCell>
        <Checkbox
          checked={p.nr}
          onChange={(e) => onChange(setPoint(value, ear, freq, type, { nr: e.target.checked }))}
          size="small"
        />
      </TableCell>
    </>
  )
}


