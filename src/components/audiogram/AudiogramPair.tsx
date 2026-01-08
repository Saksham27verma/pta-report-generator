import { Box, Paper } from '@mui/material'
import type { AudiometryData } from '../../types'
import { AudiogramChart } from './AudiogramChart'

export function AudiogramPair({ data, chartHeight }: { data: AudiometryData; chartHeight?: number }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
      }}
    >
      <Box>
        <Paper sx={{ p: 2 }}>
          <AudiogramChart ear="right" data={data.right} height={chartHeight} />
        </Paper>
      </Box>
      <Box>
        <Paper sx={{ p: 2 }}>
          <AudiogramChart ear="left" data={data.left} height={chartHeight} />
        </Paper>
      </Box>
    </Box>
  )
}


