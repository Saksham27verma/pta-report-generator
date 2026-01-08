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
import { useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useMemo, useState } from 'react'
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
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [freqIdx, setFreqIdx] = useState(0)
  const freq = AUDIO_FREQS[Math.min(freqIdx, AUDIO_FREQS.length - 1)]

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

        {isMobile ? (
          <MobileCardEntry
            freq={freq}
            freqIdx={freqIdx}
            setFreqIdx={setFreqIdx}
            value={value}
            onChange={onChange}
          />
        ) : (
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 980 }}>
            <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  fontWeight: 800,
                  position: 'sticky',
                  left: 0,
                  zIndex: 2,
                  background: '#fff',
                }}
              >
                Hz
              </TableCell>
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
              <TableCell
                sx={{
                  position: 'sticky',
                  left: 0,
                  zIndex: 2,
                  background: '#fff',
                }}
              />
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
        </Box>
        )}
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
      <TableCell
        sx={{
          fontWeight: 900,
          position: 'sticky',
          left: 0,
          zIndex: 1,
          background: '#fff',
        }}
      >
        {freq}
      </TableCell>
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
          inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', style: { width: 56 } }}
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

function MobileCardEntry({
  freq,
  freqIdx,
  setFreqIdx,
  value,
  onChange,
}: {
  freq: AudioFrequency
  freqIdx: number
  setFreqIdx: (n: number) => void
  value: AudiometryData
  onChange: (next: AudiometryData) => void
}) {
  const freqs = useMemo(() => AUDIO_FREQS, [])
  const right = value.right[freq]
  const left = value.left[freq]

  return (
    <Stack spacing={1.5}>
      <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 0.5 }}>
        {freqs.map((f, i) => (
          <Button
            key={f}
            size="small"
            variant={i === freqIdx ? 'contained' : 'outlined'}
            onClick={() => setFreqIdx(i)}
            sx={{ flex: '0 0 auto', minWidth: 84 }}
          >
            {f} Hz
          </Button>
        ))}
      </Box>

      <Paper variant="outlined" sx={{ p: 1.5 }}>
        <Typography sx={{ fontWeight: 900, mb: 1 }}>Frequency: {freq} Hz</Typography>

        <Stack spacing={1.5}>
          <EarCard
            title="Right Ear"
            ac={right.air}
            bc={right.bone}
            onChangeAc={(patch) => onChange(setPoint(value, 'right', freq, 'air', patch))}
            onChangeBc={(patch) => onChange(setPoint(value, 'right', freq, 'bone', patch))}
          />
          <EarCard
            title="Left Ear"
            ac={left.air}
            bc={left.bone}
            onChangeAc={(patch) => onChange(setPoint(value, 'left', freq, 'air', patch))}
            onChangeBc={(patch) => onChange(setPoint(value, 'left', freq, 'bone', patch))}
          />
        </Stack>
      </Paper>
    </Stack>
  )
}

function EarCard({
  title,
  ac,
  bc,
  onChangeAc,
  onChangeBc,
}: {
  title: string
  ac: { db: number | null; masked: boolean; nr: boolean }
  bc: { db: number | null; masked: boolean; nr: boolean }
  onChangeAc: (patch: Partial<{ db: number | null; masked: boolean; nr: boolean }>) => void
  onChangeBc: (patch: Partial<{ db: number | null; masked: boolean; nr: boolean }>) => void
}) {
  return (
    <Paper variant="outlined" sx={{ p: 1.25 }}>
      <Typography sx={{ fontWeight: 900, mb: 1 }}>{title}</Typography>
      <Stack spacing={1.25}>
        <RowCard label="Air (AC)" p={ac} onChange={onChangeAc} />
        <RowCard label="Bone (BC)" p={bc} onChange={onChangeBc} />
      </Stack>
    </Paper>
  )
}

function RowCard({
  label,
  p,
  onChange,
}: {
  label: string
  p: { db: number | null; masked: boolean; nr: boolean }
  onChange: (patch: Partial<{ db: number | null; masked: boolean; nr: boolean }>) => void
}) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 110px', gap: 1, alignItems: 'center' }}>
      <Box>
        <Typography variant="caption" sx={{ fontWeight: 900, color: 'rgba(0,0,0,0.65)' }}>
          {label}
        </Typography>
        <TextField
          value={p.db ?? ''}
          onChange={(e) => {
            const raw = e.target.value
            if (raw === '') return onChange({ db: null })
            const n = clampDb(Number(raw))
            onChange({ db: n })
          }}
          inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
          size="small"
          disabled={p.nr}
          fullWidth
          placeholder="dB"
        />
      </Box>
      <Stack spacing={0.5}>
        <FormControlLabel
          control={
            <Switch
              checked={p.masked}
              onChange={(e) => onChange({ masked: e.target.checked })}
              size="small"
            />
          }
          label={<Typography variant="caption">Masked</Typography>}
          sx={{ m: 0 }}
        />
        <FormControlLabel
          control={
            <Checkbox checked={p.nr} onChange={(e) => onChange({ nr: e.target.checked })} size="small" />
          }
          label={<Typography variant="caption">NR</Typography>}
          sx={{ m: 0 }}
        />
      </Stack>
    </Box>
  )
}

