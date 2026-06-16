'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { AtriaMark } from '@/components/AtrioBrandLogo'

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
      if (!user) { router.push('/login'); return }
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
        <div className="w-6 h-6 border-2 border-atrio border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const navLinks = [
    { href: '/fila',          label: 'Fila',           perfis: ['gestor'] },
    { href: '/acompanhamento',label: 'Acompanhamento',  perfis: ['gestor', 'lideranca'] },
    { href: '/relatorios',    label: 'Relatórios',      perfis: ['gestor', 'lideranca'] },
  ]

  const linksVisiveis = navLinks.filter(l => l.perfis.includes(profile?.perfil ?? 'colaborador'))

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-atrio text-white">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <AtriaMark size={28} color="#FFFFFF" />
            <div className="leading-none">
              <p className="font-semibold tracking-widest uppercase text-sm text-white">Atrio</p>
              <p className="tracking-[0.15em] uppercase text-[9px] text-white/50">
                COE <span className="text-atrio-accent font-medium">Iniciativas</span>
              </p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-0.5">
            {linksVisiveis.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  pathname === link.href
                    ? 'bg-white/15 text-white font-medium'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white">{profile?.nome}</p>
              <p className="text-xs text-white/50 capitalize">{profile?.perfil}</p>
            </div>
            <button
              onClick={sair}
              className="text-xs text-white/60 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
