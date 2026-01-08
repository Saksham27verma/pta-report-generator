import { Box, Button, Paper, Stack, Typography } from '@mui/material'
import { useRef } from 'react'

export function SignatureUpload({
  value,
  onChange,
}: {
  value: string | null
  onChange: (next: string | null) => void
}) {
  const inputRef = useRef<HTMLInputElement | null>(null)

  return (
    <Stack spacing={1}>
      <Typography sx={{ fontWeight: 800 }}>Digital Signature</Typography>
      <Paper
        sx={{
          p: 1,
          minHeight: 92,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fff',
        }}
        variant="outlined"
      >
        {value ? (
          <Box component="img" src={value} alt="Signature" sx={{ maxHeight: 80, maxWidth: '100%' }} />
        ) : (
          <Typography variant="body2" color="text.secondary">
            Upload signature image (PNG/JPG)
          </Typography>
        )}
      </Paper>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={async (e) => {
          const file = e.target.files?.[0]
          if (!file) return
          const reader = new FileReader()
          reader.onload = () => onChange(String(reader.result))
          reader.readAsDataURL(file)
        }}
      />
      <Stack direction="row" spacing={1}>
        <Button variant="outlined" onClick={() => inputRef.current?.click()}>
          {value ? 'Replace' : 'Upload'}
        </Button>
        {value ? (
          <Button color="error" variant="text" onClick={() => onChange(null)}>
            Remove
          </Button>
        ) : null}
      </Stack>
    </Stack>
  )
}


