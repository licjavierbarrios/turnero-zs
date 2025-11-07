import type { Metadata } from 'next'
import './globals.css'
import { ToasterProvider } from '@/components/ToasterProvider'

export const metadata: Metadata = {
  title: 'Turnero ZS - Sistema de Gestión de Turnos',
  description: 'Sistema multi-zona de gestión de turnos para centros de salud argentinos',
  icons: {
    icon: '/images/logo.png',
    apple: '/images/logo.png',
  },
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
        <ToasterProvider />
      </body>
    </html>
  )
}