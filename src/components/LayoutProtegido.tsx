'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Profile {
  nome: string
  perfil: 'colaborador' | 'gestor' | 'lideranca'
  area: string
}

export default function LayoutProtegido({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [carregando, setCarregando] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function verificarSessao() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      const { data } = await supabase
        .from('profiles')
        .select('nome, perfil, area')
        .eq('id', user.id)
        .single()
      setProfile(data)
      setCarregando(false)
    }
    verificarSessao()
  }, [])

  async function sair() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-atrio border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const navLinks = [
    { href: '/submeter', label: 'Submeter Iniciativa', perfis: ['colaborador', 'gestor', 'lideranca'] },
    { href: '/fila', label: 'Fila de Análise', perfis: ['gestor'] },
    { href: '/acompanhamento', label: 'Acompanhamento', perfis: ['gestor', 'lideranca'] },
    { href: '/relatorios', label: 'Relatórios', perfis: ['gestor', 'lideranca'] },
  ]

  const linksVisiveis = navLinks.filter(l => l.perfis.includes(profile?.perfil ?? 'colaborador'))

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-atrio text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-atrio-light rounded-full flex items-center justify-center">
              <span className="text-atrio font-bold text-sm">C</span>
            </div>
            <span className="font-semibold text-lg">COE Atrio</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {linksVisiveis.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'bg-white/20 text-white'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{profile?.nome}</p>
              <p className="text-xs text-white/70 capitalize">{profile?.perfil}</p>
            </div>
            <button
              onClick={sair}
              className="text-sm text-white/80 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
