'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { AtriaMark } from '@/components/AtrioBrandLogo'
import {
  LayoutList,
  Kanban,
  BarChart2,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react'

interface Profile {
  nome: string
  perfil: 'colaborador' | 'gestor' | 'lideranca'
  area: string
}

const NAV_LINKS = [
  { href: '/fila',           label: 'Fila',           Icon: LayoutList,  perfis: ['gestor'] },
  { href: '/acompanhamento', label: 'Acompanhamento',  Icon: Kanban,       perfis: ['gestor', 'lideranca'] },
  { href: '/relatorios',     label: 'Relatórios',      Icon: BarChart2,    perfis: ['gestor', 'lideranca'] },
]

export default function LayoutProtegido({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const [profile,    setProfile]    = useState<Profile | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [collapsed,  setCollapsed]  = useState(false)
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
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin" />
      </div>
    )
  }

  const linksVisiveis = NAV_LINKS.filter(l =>
    l.perfis.includes(profile?.perfil ?? 'colaborador')
  )

  const initials = profile?.nome
    ? profile.nome.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase()
    : '??'

  return (
    <div className="min-h-screen flex">
      {/* ── Sidebar ── */}
      <aside
        className={`relative flex flex-col bg-white border-r border-gray-200 flex-shrink-0 transition-all duration-200 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 h-14 border-b border-gray-100 flex-shrink-0">
          <AtriaMark size={22} color="#111111" />
          {!collapsed && (
            <span className="font-semibold tracking-widest uppercase text-sm text-gray-900 whitespace-nowrap">
              Atrio
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
          {!collapsed && (
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-2 pb-2">
              Menu
            </p>
          )}
          {linksVisiveis.map(({ href, label, Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                className={`flex items-center gap-3 px-2 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon
                  size={17}
                  className={`flex-shrink-0 ${active ? 'text-blue-600' : 'text-gray-400'}`}
                />
                {!collapsed && <span>{label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* User + Sair */}
        <div className="px-2 py-3 border-t border-gray-100 flex-shrink-0">
          <div
            className={`flex items-center gap-2.5 px-2 py-2 rounded-lg bg-gray-900 ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-medium">{initials}</span>
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-white truncate">{profile?.nome}</p>
                <p className="text-[10px] text-gray-400 truncate capitalize">{profile?.perfil}</p>
              </div>
            )}
          </div>

          {!collapsed && (
            <button
              onClick={sair}
              className="flex items-center gap-2 w-full px-2 py-1.5 mt-1 text-xs text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <LogOut size={13} />
              <span>Sair</span>
            </button>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="absolute -right-3 top-[52px] w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:border-gray-300 shadow-sm z-20 transition-colors"
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-auto bg-gray-100 min-w-0">
        <div className="max-w-7xl mx-auto px-6 py-6">
          {children}
        </div>
      </main>
    </div>
  )
}
