import { Box, Typography } from '@mui/material'
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartOptions,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import type { AudiometryEar, AudioFrequency, EarSide } from '../../types'
import { AUDIO_FREQS } from '../../types'
import { textPointStyle } from './pointStyles'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler)

type Props = {
  ear: EarSide
  data: AudiometryEar
  title?: string
  height?: number
}

const RIGHT_COLOR = '#D32F2F'
const LEFT_COLOR = '#1565C0'

function colorForEar(ear: EarSide) {
  return ear === 'right' ? RIGHT_COLOR : LEFT_COLOR
}

function labelForEar(ear: EarSide) {
  return ear === 'right' ? 'Right Ear' : 'Left Ear'
}

function freqLabel(f: AudioFrequency) {
  return String(f)
}

function symbolFor(ear: EarSide, type: 'air' | 'bone', masked: boolean): any {
  // Air:
  // - Right: O (circle), Masked: Square
  // - Left:  X (cross),  Masked: Square
  if (type === 'air') {
    if (masked) return 'rect'
    return ear === 'right' ? 'circle' : 'cross'
  }

  // Bone:
  // - Right: < , Masked: [
  // - Left:  > , Masked: ]
  if (masked) return textPointStyle(ear === 'right' ? '[' : ']', colorForEar(ear), 18)
  return textPointStyle(ear === 'right' ? '<' : '>', colorForEar(ear), 18)
}

export function AudiogramChart({ ear, data, title, height = 320 }: Props) {
  const labels = AUDIO_FREQS.map(freqLabel)
  const c = colorForEar(ear)

  const air = AUDIO_FREQS.map((f) => data[f].air.db)
  const bone = AUDIO_FREQS.map((f) => data[f].bone.db)
  const airNr = AUDIO_FREQS.map((f) => data[f].air.nr)
  const boneNr = AUDIO_FREQS.map((f) => data[f].bone.nr)

  // pointStyle can be a single value or array-per-point.
  const airPointStyles = AUDIO_FREQS.map((f) => symbolFor(ear, 'air', data[f].air.masked))
  const bonePointStyles = AUDIO_FREQS.map((f) => symbolFor(ear, 'bone', data[f].bone.masked))

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Air (AC)',
        data: air,
        borderColor: c,
        backgroundColor: c,
        spanGaps: false,
        pointRadius: 5,
        pointHoverRadius: 6,
        pointStyle: airPointStyles,
        borderWidth: 2,
        tension: 0,
      },
      {
        label: 'Bone (BC)',
        data: bone,
        borderColor: c,
        backgroundColor: c,
        spanGaps: false,
        pointRadius: 5,
        pointHoverRadius: 6,
        pointStyle: bonePointStyles,
        borderWidth: 2,
        borderDash: [6, 4],
        tension: 0,
      },
    ],
  }

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const d = ctx.parsed.y
            if (d == null) return `${ctx.dataset.label}: —`
            return `${ctx.dataset.label}: ${d} dB HL`
          },
        },
      },
    },
    scales: {
      x: {
        title: { display: true, text: 'Frequency (Hz)' },
        grid: { color: 'rgba(0,0,0,0.08)' },
        ticks: { maxRotation: 0, autoSkip: false },
      },
      y: {
        title: { display: true, text: 'Hearing Level (dB HL)' },
        reverse: true, // inverted scale: -10 at top to 120 at bottom
        min: -10,
        max: 120,
        ticks: { stepSize: 10 },
        grid: { color: 'rgba(0,0,0,0.10)' },
      },
    },
  }

  const nrLabelPlugin = {
    id: `nr-labels-${ear}`,
    afterDatasetsDraw(chart: any) {
      const ctx = chart.ctx
      ctx.save()
      ctx.fillStyle = c
      ctx.font = '700 11px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'

      const metas = chart.getSortedVisibleDatasetMetas()
      for (const meta of metas) {
        const isAir = meta.dataset?.label === 'Air (AC)'
        const flags = isAir ? airNr : boneNr
        meta.data.forEach((pt: any, idx: number) => {
          if (!flags[idx]) return
          const { x, y } = pt.getProps(['x', 'y'], true)
          ctx.fillText('NR', x, y - 6)
        })
      }
      ctx.restore()
    },
  }

  return (
    <Box sx={{ height }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
        {title ?? labelForEar(ear)}
      </Typography>
      <Box sx={{ height: Math.max(180, height - 40) }}>
        <Line data={chartData as any} options={options} plugins={[nrLabelPlugin as any]} />
      </Box>
    </Box>
  )
}


