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
ChartJS.defaults.font.family = 'Roboto, Arial, sans-serif'

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
    // Keep chart rendering consistent across devices (mobile DPR vs desktop DPR).
    devicePixelRatio: 2,
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
      ctx.font = '800 11px Roboto, Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      const xScale = chart.scales?.x
      const yScale = chart.scales?.y
      if (!xScale || !yScale) {
        ctx.restore()
        return
      }

      // NR should be shown at max output markers, without plotting a definitive threshold:
      // - AC NR at 120 dB
      // - BC NR at 75 dB (typical max BC output)
      const drawTag = (x: number, y: number, label: string) => {
        const padX = 6
        const textW = ctx.measureText(label).width
        const w = Math.ceil(textW + padX * 2)
        const h = 18
        const r = 6

        const left = x - w / 2
        const top = y - h - 8

        // Tag background
        ctx.fillStyle = 'rgba(255,255,255,0.95)'
        ctx.strokeStyle = c
        ctx.lineWidth = 1.5

        ctx.beginPath()
        ctx.moveTo(left + r, top)
        ctx.arcTo(left + w, top, left + w, top + h, r)
        ctx.arcTo(left + w, top + h, left, top + h, r)
        ctx.arcTo(left, top + h, left, top, r)
        ctx.arcTo(left, top, left + w, top, r)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()

        // Arrow from tag to point
        ctx.beginPath()
        ctx.moveTo(x, top + h)
        ctx.lineTo(x, y - 2)
        ctx.stroke()

        // Small marker at y
        ctx.fillStyle = c
        ctx.beginPath()
        ctx.arc(x, y, 3, 0, Math.PI * 2)
        ctx.fill()

        // Label text
        ctx.fillStyle = c
        ctx.fillText(label, x, top + h / 2 + 0.5)
      }

      const drawNrAt = (idx: number, yValue: number) => {
        const x = xScale.getPixelForTick(idx)
        const y = yScale.getPixelForValue(yValue)
        drawTag(x, y, 'NR')
      }

      airNr.forEach((flag, idx) => {
        if (flag) drawNrAt(idx, 120)
      })
      boneNr.forEach((flag, idx) => {
        if (flag) drawNrAt(idx, 75)
      })

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


