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
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <meta name="theme-color" content="#111827" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <script
          dangerouslySetInnerHTML={{
            __html: `if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/sw.js') }`,
          }}
        />
      </head>
      <body className="antialiased">
        {children}
        <ToasterProvider />
      </body>
    </html>
  )
}