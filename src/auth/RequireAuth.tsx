import { Box, CircularProgress } from '@mui/material'
import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const loc = useLocation()

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  if (!user) return <Navigate to="/login" replace state={{ from: loc }} />
  return <>{children}</>
}


