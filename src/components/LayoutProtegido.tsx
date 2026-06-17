'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { AtriaMark } from '@/components/AtrioBrandLogo'
import {
  LayoutDashboard,
  Target,
  BarChart2,
  LayoutList,
  Kanban,
  PlusCircle,
  Hotel,
  ClipboardCheck,
  BookOpen,
  FileText,
  AlertCircle,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react'

interface Profile {
  nome: string
  perfil: 'colaborador' | 'gestor' | 'lideranca'
  area: string
}

interface NavItem {
  href: string
  label: string
  Icon: React.ElementType
  perfis: string[]
  badge?: boolean
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Visão Geral',
    items: [
      { href: '/dashboard',   label: 'Dashboard',      Icon: LayoutDashboard, perfis: ['colaborador', 'gestor', 'lideranca'] },
      { href: '/metas',       label: 'Metas',          Icon: Target,          perfis: ['gestor', 'lideranca'] },
      { href: '/relatorios',  label: 'Relatórios',     Icon: BarChart2,       perfis: ['gestor', 'lideranca'] },
    ],
  },
  {
    label: 'Projetos',
    items: [
      { href: '/fila',            label: 'Fila de análise', Icon: LayoutList,  perfis: ['gestor'], badge: true },
      { href: '/acompanhamento',  label: 'Acompanhamento',  Icon: Kanban,      perfis: ['gestor', 'lideranca'] },
      { href: '/submeter',        label: 'Nova iniciativa',  Icon: PlusCircle,  perfis: ['colaborador', 'gestor', 'lideranca'] },
    ],
  },
  {
    label: 'Implantações',
    items: [
      { href: '/hoteis',    label: 'Hotéis ativos', Icon: Hotel,         perfis: ['gestor', 'lideranca'], badge: true },
      { href: '/checklist', label: 'Checklist',     Icon: ClipboardCheck, perfis: ['colaborador', 'gestor', 'lideranca'] },
    ],
  },
  {
    label: 'Processos',
    items: [
      { href: '/catalogo',   label: 'Catálogo',   Icon: BookOpen,  perfis: ['colaborador', 'gestor', 'lideranca'] },
      { href: '/documentos', label: 'Documentos', Icon: FileText,  perfis: ['gestor', 'lideranca'] },
      { href: '/problemas',  label: 'Problemas',  Icon: AlertCircle, perfis: ['gestor'], badge: true },
    ],
  },
  {
    label: 'Estratégia',
    items: [
      { href: '/planejamento', label: 'Planejamento', Icon: CalendarRange, perfis: ['gestor', 'lideranca'] },
    ],
  },
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
      <div className="min-h-screen flex items-center justify-center bg-[#f8f7f6]">
        <div className="w-5 h-5 border-2 border-[#ededeb] border-t-[#451a1a] rounded-full animate-spin" />
      </div>
    )
  }

  const perfil = profile?.perfil ?? 'colaborador'
  const initials = profile?.nome
    ? profile.nome.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase()
    : '??'

  return (
    <div className="min-h-screen flex">
      {/* ── Sidebar ── */}
      <aside
        className={`relative flex flex-col bg-white border-r border-[#ededeb] flex-shrink-0 transition-all duration-200 ${
          collapsed ? 'w-[56px]' : 'w-[220px]'
        }`}
      >
        {/* Logo */}
        <div className={`flex items-center h-14 border-b border-[#ededeb] flex-shrink-0 ${collapsed ? 'justify-center px-0' : 'px-4'}`}>
          {collapsed
            ? <AtriaMark size={24} color="#1a1917" />
            : (
              <div className="flex items-center gap-2.5">
                <AtriaMark size={26} color="#1a1917" />
                <div className="leading-none">
                  <p className="font-bold text-[12px] text-[#1a1917] tracking-wide">COE SYSTEM ATRIO</p>
                  <p className="text-[9px] text-[#6b6966] tracking-wide">Hotel Management</p>
                </div>
              </div>
            )
          }
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-4 overflow-y-auto">
          {NAV_GROUPS.map(group => {
            const visíveis = group.items.filter(i => i.perfis.includes(perfil))
            if (visíveis.length === 0) return null
            return (
              <div key={group.label}>
                {!collapsed && (
                  <p className="text-[9px] font-semibold text-[#6b6966] uppercase tracking-widest px-2 pb-1.5">
                    {group.label}
                  </p>
                )}
                <div className="space-y-0.5">
                  {visíveis.map(({ href, label, Icon, badge }) => {
                    const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
                    return (
                      <Link
                        key={href}
                        href={href}
                        title={collapsed ? label : undefined}
                        className={`flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition-colors ${
                          active
                            ? 'bg-[#f5eded] text-[#451a1a] font-medium'
                            : 'text-[#6b6966] hover:bg-[#f8f7f6] hover:text-[#1a1917]'
                        } ${collapsed ? 'justify-center' : ''}`}
                      >
                        <Icon
                          size={16}
                          className={`flex-shrink-0 ${active ? 'text-[#451a1a]' : 'text-[#6b6966]'}`}
                        />
                        {!collapsed && (
                          <span className="flex-1 truncate">{label}</span>
                        )}
                        {!collapsed && badge && (
                          <span className="w-2 h-2 rounded-full bg-[#451a1a] flex-shrink-0" />
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </nav>

        {/* User */}
        <div className="px-2 py-3 border-t border-[#ededeb] flex-shrink-0">
          <div className={`flex items-center gap-2 px-2 py-2 rounded-lg ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-7 h-7 rounded-full bg-[#451a1a] flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-medium">{initials}</span>
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-[#1a1917] truncate">{profile?.nome}</p>
                <p className="text-[10px] text-[#6b6966] truncate capitalize">{profile?.perfil}</p>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={sair}
              className="flex items-center gap-2 w-full px-2 py-1.5 mt-0.5 text-xs text-[#6b6966] hover:text-[#451a1a] rounded-lg hover:bg-[#f5eded] transition-colors"
            >
              <LogOut size={13} />
              <span>Sair</span>
            </button>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="absolute -right-3 top-[52px] w-6 h-6 bg-white border border-[#ededeb] rounded-full flex items-center justify-center text-[#6b6966] hover:text-[#451a1a] hover:border-[#451a1a]/30 shadow-sm z-20 transition-colors"
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-auto bg-[#f8f7f6] min-w-0">
        <div className="max-w-7xl mx-auto px-6 py-6">
          {children}
        </div>
      </main>
    </div>
  )
}
