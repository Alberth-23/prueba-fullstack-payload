import React from 'react'
import './styles.css'
import { AuthProvider } from '@/context/AuthContext'

export const metadata = {
  description: 'Sistema con Payload + Next.js',
  title: 'Sistema de Gestión',
}

export default function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="es">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
