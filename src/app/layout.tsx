import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'COE Atrio — Gestão de Iniciativas',
  description: 'Sistema de gestão do ciclo completo de iniciativas do COE Atrio Hotéis',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} font-sans antialiased bg-gray-50 min-h-screen`}>
        {children}
      </body>
    </html>
  )
}
