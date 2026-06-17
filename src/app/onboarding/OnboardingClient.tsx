'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ClipboardList, Search, Building2, User, Calendar, ChevronRight } from 'lucide-react'

interface OnboardingRow {
  id: string
  status?: string
  percentual_prontidao?: number
  responsavel_coe?: string | null
  created_at?: string
}

interface InicativaRow {
  id: string
  protocolo: string
  titulo: string
  area: string
  tipo_iniciativa: string
  responsavel_nome: string
  sponsor: string | null
  urgencia: string | null
  score: number | null
  updated_at: string
  created_at: string
  onboardings: OnboardingRow[] | OnboardingRow | null
}

const STATUS_COR: Record<string, string> = {
  'Em onboarding':       'border-l-[#451a1a]',
  'Aguardando info':     'border-l-[#b07d1a]',
  'Liberado':            'border-l-[#2d7d46]',
}
const STATUS_BADGE: Record<string, string> = {
  'Em onboarding':   'bg-[#f5eded] text-[#451a1a]',
  'Aguardando info': 'bg-amber-50 text-amber-700',
  'Liberado':        'bg-green-50 text-green-700',
  'Sem onboarding':  'bg-[#f8f7f6] text-[#6b6966]',
}
const TIPO_BADGE: Record<string, string> = {
  'Corporativo':    'bg-blue-50 text-blue-700',
  'Setorial':       'bg-[#f8f7f6] text-[#6b6966]',
  'Intersetorial':  'bg-purple-50 text-purple-700',
  'Implantação':    'bg-amber-50 text-amber-700',
  'Cross-company':  'bg-teal-50 text-teal-700',
}

function diasDesde(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const d = Math.floor(diff / 86400000)
  return d === 0 ? 'hoje' : d === 1 ? 'há 1 dia' : `há ${d} dias`
}

function getOnboarding(row: InicativaRow): OnboardingRow | null {
  if (!row.onboardings) return null
  return Array.isArray(row.onboardings) ? row.onboardings[0] ?? null : row.onboardings
}

const FILTROS = ['Todos', 'Em onboarding', 'Aguardando info', 'Liberado', 'Sem onboarding']

export default function OnboardingClient({ rows }: { rows: InicativaRow[] }) {
  const router = useRouter()
  const [busca,       setBusca]       = useState('')
  const [filtroStatus,setFiltroStatus] = useState('Todos')
  const [filtroArea,  setFiltroArea]  = useState('')
  const [filtroTipo,  setFiltroTipo]  = useState('')
  const [abrindo,     setAbrindo]     = useState<string | null>(null)

  const areas  = useMemo(() => [...new Set(rows.map(r => r.area))].sort(), [rows])
  const tipos  = useMemo(() => [...new Set(rows.map(r => r.tipo_iniciativa))].sort(), [rows])

  const lista = useMemo(() => {
    return rows.filter(r => {
      const ob = getOnboarding(r)
      const statusEfetivo = ob ? (ob.status ?? 'Em onboarding') : 'Sem onboarding'
      if (filtroStatus !== 'Todos' && statusEfetivo !== filtroStatus) return false
      if (filtroArea && r.area !== filtroArea) return false
      if (filtroTipo && r.tipo_iniciativa !== filtroTipo) return false
      if (busca) {
        const q = busca.toLowerCase()
        if (!r.titulo.toLowerCase().includes(q) && !r.protocolo.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [rows, busca, filtroStatus, filtroArea, filtroTipo])

  const contagens = useMemo(() => {
    const c: Record<string, number> = { 'Em onboarding': 0, 'Aguardando info': 0, 'Liberado': 0, 'Sem onboarding': 0 }
    rows.forEach(r => {
      const ob = getOnboarding(r)
      const s = ob ? (ob.status ?? 'Em onboarding') : 'Sem onboarding'
      c[s] = (c[s] ?? 0) + 1
    })
    return c
  }, [rows])

  async function abrirOnboarding(iniciativaId: string) {
    setAbrindo(iniciativaId)
    try {
      const res = await fetch('/api/onboardings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ iniciativa_id: iniciativaId }),
      })
      const json = await res.json()
      if (json.dados?.id) {
        router.push(`/onboarding/${json.dados.id}`)
      }
    } finally {
      setAbrindo(null)
    }
  }

  const emOnboarding = contagens['Em onboarding'] + (contagens['Aguardando info'] ?? 0)
  const prontos      = contagens['Liberado'] ?? 0

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1a1917]">Onboarding de Projetos</h1>
        <p className="text-[#6b6966] text-sm mt-1">
          {emOnboarding} projeto{emOnboarding !== 1 ? 's' : ''} aguardando onboarding
          {prontos > 0 && ` · ${prontos} pronto${prontos !== 1 ? 's' : ''} para o Kanban`}
        </p>
      </div>

      {/* Filtros de status */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {FILTROS.map(f => (
          <button
            key={f}
            onClick={() => setFiltroStatus(f)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              filtroStatus === f
                ? 'bg-[#451a1a] text-white border-[#451a1a]'
                : 'bg-white text-[#6b6966] border-[#ededeb] hover:border-[#451a1a]/30'
            }`}
          >
            {f}
            {f !== 'Todos' && contagens[f] !== undefined && (
              <span className="ml-1.5 opacity-70">{contagens[f]}</span>
            )}
          </button>
        ))}
      </div>

      {/* Busca e filtros */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <div className="flex items-center gap-2 bg-white border border-[#ededeb] rounded-lg px-3 py-2 flex-1 min-w-[200px]">
          <Search size={14} className="text-[#c4c2be] flex-shrink-0" />
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por nome ou código..."
            className="flex-1 text-sm outline-none bg-transparent text-[#1a1917] placeholder:text-[#c4c2be]"
          />
        </div>
        <select
          value={filtroArea}
          onChange={e => setFiltroArea(e.target.value)}
          className="text-sm bg-white border border-[#ededeb] rounded-lg px-3 py-2 text-[#6b6966] outline-none"
        >
          <option value="">Todas as áreas</option>
          {areas.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select
          value={filtroTipo}
          onChange={e => setFiltroTipo(e.target.value)}
          className="text-sm bg-white border border-[#ededeb] rounded-lg px-3 py-2 text-[#6b6966] outline-none"
        >
          <option value="">Todos os tipos</option>
          {tipos.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Estado vazio */}
      {lista.length === 0 && (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#f5eded] flex items-center justify-center mb-4">
            <ClipboardList size={26} className="text-[#c4c2be]" />
          </div>
          <p className="text-[#1a1917] font-semibold text-sm mb-1">Nenhum projeto encontrado</p>
          <p className="text-[#6b6966] text-xs">Tente ajustar os filtros acima.</p>
        </div>
      )}

      {/* Cards */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {lista.map(row => {
          const ob = getOnboarding(row)
          const statusEfetivo = ob ? (ob.status ?? 'Em onboarding') : 'Sem onboarding'
          const prontidao = ob?.percentual_prontidao ?? 0
          const borderCor = STATUS_COR[statusEfetivo] ?? 'border-l-[#ededeb]'
          const checkPendentes = ob
            ? 0
            : 0

          return (
            <div
              key={row.id}
              className={`bg-white border border-[#ededeb] border-l-[3px] ${borderCor} rounded-lg p-4 flex flex-col gap-3 hover:shadow-sm transition-shadow`}
            >
              {/* Topo */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-semibold text-[#c4c2be] uppercase tracking-wider">{row.protocolo}</span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${TIPO_BADGE[row.tipo_iniciativa] ?? 'bg-[#f8f7f6] text-[#6b6966]'}`}>
                      {row.tipo_iniciativa}
                    </span>
                  </div>
                  <h2 className="text-[13px] font-semibold text-[#1a1917] leading-snug">{row.titulo}</h2>
                </div>
                <span className={`flex-shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${STATUS_BADGE[statusEfetivo]}`}>
                  {statusEfetivo}
                </span>
              </div>

              {/* Detalhes */}
              <div className="space-y-1 text-[11px] text-[#6b6966]">
                <div className="flex items-center gap-1.5">
                  <Building2 size={11} className="flex-shrink-0" />
                  <span>{row.area}</span>
                  {row.sponsor && <><span className="text-[#c4c2be]">·</span><span>Sponsor: {row.sponsor}</span></>}
                </div>
                {ob?.responsavel_coe && (
                  <div className="flex items-center gap-1.5">
                    <User size={11} className="flex-shrink-0" />
                    <span>Resp. COE: {ob.responsavel_coe}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Calendar size={11} className="flex-shrink-0" />
                  <span>Aprovado {diasDesde(row.updated_at)}</span>
                </div>
              </div>

              {/* Prontidão */}
              {ob && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-[#6b6966]">Prontidão</span>
                    <span className="text-[10px] font-semibold text-[#1a1917]">{prontidao}%</span>
                  </div>
                  <div className="h-1.5 bg-[#ededeb] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        prontidao >= 80 ? 'bg-[#2d7d46]' : prontidao >= 50 ? 'bg-amber-500' : 'bg-[#c0392b]'
                      }`}
                      style={{ width: `${prontidao}%` }}
                    />
                  </div>
                  {checkPendentes > 0 && (
                    <p className="text-[10px] text-[#c0392b] mt-1">{checkPendentes} itens obrigatórios pendentes</p>
                  )}
                </div>
              )}

              {/* Ação */}
              <button
                onClick={() => abrirOnboarding(row.id)}
                disabled={abrindo === row.id}
                className="mt-auto flex items-center justify-between w-full px-3 py-2 bg-[#f8f7f6] hover:bg-[#f5eded] border border-[#ededeb] rounded-lg text-[12px] font-medium text-[#451a1a] transition-colors disabled:opacity-60"
              >
                <span>{abrindo === row.id ? 'Abrindo...' : 'Abrir onboarding'}</span>
                <ChevronRight size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
