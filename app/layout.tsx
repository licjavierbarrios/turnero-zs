import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'Turnero ZS - Sistema de Gestión de Turnos',
  description: 'Sistema multi-zona de gestión de turnos para centros de salud argentinos',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  )
}