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
  ListChecks,
  Kanban,
  Plus,
  ClipboardList,
  Building2,
  Layers,
  Hotel,
  Archive,
  BookOpen,
  GitBranch,
  Files,
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
  badgeKey?: 'fila' | 'backlog'
  dev?: boolean
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Projetos',
    items: [
      { href: '/submeter',            label: 'Nova Iniciativa',        Icon: Plus,            perfis: ['colaborador', 'gestor', 'lideranca'] },
      { href: '/dashboard',           label: 'Dashboard',              Icon: LayoutDashboard, perfis: ['colaborador', 'gestor', 'lideranca'], dev: true },
      { href: '/onboarding',          label: 'Onboarding de Projetos', Icon: ClipboardList,   perfis: ['gestor', 'lideranca'], dev: true },
      { href: '/fila',                label: 'Fila de Análise',        Icon: ListChecks,      perfis: ['gestor'], badge: true },
      { href: '/acompanhamento',      label: 'Acompanhamento',         Icon: Kanban,          perfis: ['gestor', 'lideranca'] },
      { href: '/corporativos',        label: 'Projetos Corporativos',  Icon: Building2,       perfis: ['gestor', 'lideranca'], dev: true },
      { href: '/setoriais',           label: 'Projetos Setoriais',     Icon: Layers,          perfis: ['gestor', 'lideranca'], dev: true },
      { href: '/implantacoes',        label: 'Implantações de Hotéis', Icon: Hotel,           perfis: ['gestor', 'lideranca'], dev: true },
      { href: '/backlog',             label: 'Backlog de Iniciativas', Icon: Archive,         perfis: ['gestor', 'lideranca'], badge: true, badgeKey: 'backlog' },
      { href: '/relatorios-projetos', label: 'Relatórios de Projetos', Icon: BarChart2,       perfis: ['gestor', 'lideranca'], dev: true },
    ],
  },
  {
    label: 'Processos',
    items: [
      { href: '/catalogo',   label: 'Catálogo de Serviços',    Icon: BookOpen,  perfis: ['colaborador', 'gestor', 'lideranca'], dev: true },
      { href: '/modelagem',  label: 'Modelagem',               Icon: GitBranch, perfis: ['gestor', 'lideranca'], dev: true },
      { href: '/documentos', label: 'Documentos de Automação', Icon: Files,     perfis: ['gestor', 'lideranca'], dev: true },
    ],
  },
  {
    label: 'Metas',
    items: [
      { href: '/metas', label: 'Acompanhamento de Metas', Icon: Target, perfis: ['gestor', 'lideranca'] },
    ],
  },
]

export default function LayoutProtegido({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const [profile,    setProfile]    = useState<Profile | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [collapsed,  setCollapsed]  = useState(false)
  const [filaBadge,    setFilaBadge]    = useState<number>(0)
  const [backlogBadge, setBacklogBadge] = useState<number>(0)
  const [toast,        setToast]        = useState<string | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved !== null) setCollapsed(saved === 'true')
  }, [])

  function toggleCollapsed() {
    setCollapsed(c => {
      const next = !c
      localStorage.setItem('sidebar-collapsed', String(next))
      return next
    })
  }

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

  useEffect(() => {
    async function fetchBadges() {
      const [{ count: fila }, { count: backlog }] = await Promise.all([
        supabase.from('iniciativas').select('id', { count: 'exact', head: true }).in('status', ['Recebida', 'Em análise']),
        supabase.from('iniciativas').select('id', { count: 'exact', head: true }).in('status', ['Recusada', 'Aguardar ciclo']),
      ])
      setFilaBadge(fila ?? 0)
      setBacklogBadge(backlog ?? 0)
    }
    fetchBadges()
  }, [pathname])

  useEffect(() => {
    const msg = sessionStorage.getItem('toast')
    if (msg) {
      sessionStorage.removeItem('toast')
      showToast(msg)
    }
  }, [pathname])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

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

  const perfil  = profile?.perfil ?? 'colaborador'
  const initials = profile?.nome
    ? profile.nome.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase()
    : '??'

  return (
    <div className="min-h-screen flex">
      {/* ── Sidebar ── */}
      <aside
        className={`relative flex flex-col bg-white border-r border-[#ededeb] flex-shrink-0 transition-all duration-200 ${
          collapsed ? 'w-[52px]' : 'w-[220px]'
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
                  <p className="font-bold text-[12px] text-red-700 tracking-wide">COE SYSTEM ATRIO</p>
                  <p className="text-[9px] text-[#6b6966] tracking-wide">Hotel Management</p>
                </div>
              </div>
            )
          }
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-4">
          {NAV_GROUPS.map(group => {
            const visiveis = group.items.filter(i => i.perfis.includes(perfil))
            if (visiveis.length === 0) return null
            return (
              <div key={group.label}>
                {!collapsed && (
                  <p className="text-[10px] font-medium text-[#c4c2be] uppercase tracking-[0.08em] px-2 pb-1 pt-1">
                    {group.label}
                  </p>
                )}
                <div className="space-y-0.5">
                  {visiveis.map(({ href, label, Icon, badge, badgeKey, dev }) => {
                    const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))

                    if (dev) {
                      return (
                        <button
                          key={href}
                          title={collapsed ? label : 'Em desenvolvimento'}
                          onClick={() => showToast('Seção em desenvolvimento. Em breve disponível.')}
                          className={`flex items-center gap-2.5 w-full px-2 py-[7px] rounded-md text-[12px] text-[#c4c2be] cursor-default ${
                            collapsed ? 'justify-center' : ''
                          }`}
                        >
                          <Icon size={15} className="flex-shrink-0 text-[#c4c2be]" />
                          {!collapsed && <span className="flex-1 text-left truncate">{label}</span>}
                        </button>
                      )
                    }

                    return (
                      <Link
                        key={href}
                        href={href}
                        title={collapsed ? label : undefined}
                        className={`flex items-center gap-2.5 px-2 py-[7px] rounded-md text-[12px] transition-colors ${
                          active
                            ? 'bg-[#f5eded] text-[#451a1a] font-medium border-l-2 border-[#451a1a] pl-[6px]'
                            : 'text-[#6b6966] hover:bg-[#f8f7f6] hover:text-[#1a1917]'
                        } ${collapsed ? 'justify-center' : ''}`}
                      >
                        <Icon
                          size={15}
                          className={`flex-shrink-0 ${active ? 'text-[#451a1a]' : 'text-[#6b6966]'}`}
                        />
                        {!collapsed && (
                          <>
                            <span className="flex-1 truncate">{label}</span>
                            {badge && badgeKey === 'backlog' && backlogBadge > 0 && (
                              <span className="ml-auto bg-[#451a1a] text-white text-[9px] font-semibold px-[5px] py-[1px] rounded-full leading-none">
                                {backlogBadge}
                              </span>
                            )}
                            {badge && badgeKey !== 'backlog' && filaBadge > 0 && (
                              <span className="ml-auto bg-[#451a1a] text-white text-[9px] font-semibold px-[5px] py-[1px] rounded-full leading-none">
                                {filaBadge}
                              </span>
                            )}
                          </>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </nav>

        {/* User footer */}
        <div className="px-2 py-3 border-t border-[#ededeb] flex-shrink-0">
          <div className={`flex items-center gap-2 px-2 py-1.5 rounded-md ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-7 h-7 rounded-full bg-[#451a1a] flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[11px] font-medium">{initials}</span>
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-medium text-[#1a1917] truncate">{profile?.nome}</p>
                <p className="text-[10px] text-[#6b6966] truncate capitalize">{profile?.perfil}</p>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={sair}
              className="flex items-center gap-2 w-full px-2 py-1.5 mt-0.5 text-[11px] text-[#6b6966] hover:text-[#451a1a] rounded-md hover:bg-[#f5eded] transition-colors"
            >
              <LogOut size={13} />
              <span>Sair</span>
            </button>
          )}
          {collapsed && (
            <button
              onClick={sair}
              title="Sair"
              className="flex items-center justify-center w-full py-1.5 mt-1 text-[#6b6966] hover:text-[#451a1a] rounded-md hover:bg-[#f5eded] transition-colors"
            >
              <LogOut size={13} />
            </button>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={toggleCollapsed}
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

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1a1917] text-white text-[13px] px-4 py-2.5 rounded-lg shadow-lg z-50 pointer-events-none">
          {toast}
        </div>
      )}
    </div>
  )
}

