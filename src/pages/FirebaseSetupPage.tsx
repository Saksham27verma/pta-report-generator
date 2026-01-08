import { Box, Paper, Stack, Typography } from '@mui/material'

export function FirebaseSetupPage() {
  return (
    <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '70vh' }}>
      <Paper sx={{ p: 3, width: 'min(760px, 100%)' }}>
        <Stack spacing={1.5}>
          <Typography variant="h5" sx={{ fontWeight: 900 }}>
            Firebase Setup Required
          </Typography>
          <Typography variant="body2" color="text.secondary">
            The app was started without Firebase keys, so it can’t initialize Authentication/Firestore yet.
          </Typography>

          <Typography sx={{ fontWeight: 800, mt: 1 }}>Do this:</Typography>
          <Typography variant="body2" component="div">
            1) Firebase Console → create a project<br />
            2) Authentication → enable Email/Password (and Google optional)<br />
            3) Firestore Database → create database<br />
            4) Project settings → add a Web App → copy config<br />
            5) In project root, create <code>.env.local</code> and paste values from <code>ENV.example</code><br />
            6) Restart dev server (<code>npm run dev</code>)
          </Typography>

          <Typography variant="body2" color="text.secondary">
            After restart, refresh this page and you should see the Login screen.
          </Typography>
        </Stack>
      </Paper>
    </Box>
  )
}


