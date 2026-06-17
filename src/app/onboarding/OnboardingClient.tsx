'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ClipboardList, ArrowRight, CheckCircle2, Calendar, User, Building2 } from 'lucide-react'

interface Iniciativa {
  id: string
  protocolo: string
  titulo: string
  area: string
  responsavel_nome: string
  sponsor: string | null
  status: string
  kanban_status: string | null
  created_at: string
  updated_at: string
}

const ETAPAS = [
  { label: 'Aprovação',   cor: 'bg-green-100 text-green-700' },
  { label: 'Planejamento', cor: 'bg-blue-100 text-blue-700' },
  { label: 'Kick-off',    cor: 'bg-amber-100 text-amber-700' },
  { label: 'Execução',    cor: 'bg-purple-100 text-purple-700' },
]

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function OnboardingClient({ iniciativas }: { iniciativas: Iniciativa[] }) {
  const supabase = createClient()
  const [lista,   setLista]   = useState(iniciativas)
  const [loading, setLoading] = useState<string | null>(null)
  const [toast,   setToast]   = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  async function iniciarOnboarding(id: string, titulo: string) {
    setLoading(id)
    const { error } = await supabase
      .from('iniciativas')
      .update({ kanban_status: 'Em andamento' })
      .eq('id', id)

    if (error) {
      showToast('Erro ao iniciar onboarding. Tente novamente.')
    } else {
      setLista(prev => prev.filter(i => i.id !== id))
      showToast(`"${titulo}" movida para Em andamento com sucesso.`)
    }
    setLoading(null)
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1a1917]">Onboarding de Projetos</h1>
        <p className="text-[#6b6966] text-sm mt-1">Iniciativas aprovadas aguardando início formal</p>
      </div>

      {/* Fluxo de etapas */}
      <div className="flex items-center gap-2 mb-8 flex-wrap">
        {ETAPAS.map((etapa, i) => (
          <div key={etapa.label} className="flex items-center gap-2">
            <span className={`text-xs font-medium px-3 py-1 rounded-full ${etapa.cor}`}>
              {etapa.label}
            </span>
            {i < ETAPAS.length - 1 && (
              <ArrowRight size={14} className="text-[#c4c2be] flex-shrink-0" />
            )}
          </div>
        ))}
      </div>

      {/* Estado vazio */}
      {lista.length === 0 && (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#f5eded] flex items-center justify-center mb-4">
            <ClipboardList size={26} className="text-[#c4c2be]" />
          </div>
          <p className="text-[#1a1917] font-semibold text-sm mb-1">Nenhum projeto em onboarding no momento</p>
          <p className="text-[#6b6966] text-xs">Quando uma iniciativa for aprovada e marcada como "Em planejamento", ela aparecerá aqui.</p>
        </div>
      )}

      {/* Cards */}
      {lista.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {lista.map(ini => (
            <div
              key={ini.id}
              className="bg-white border border-[#ededeb] rounded-xl p-5 flex flex-col gap-4 hover:border-[#451a1a]/20 transition-colors"
            >
              {/* Topo */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-semibold text-[#c4c2be] uppercase tracking-wider">
                    {ini.protocolo}
                  </span>
                  <h2 className="text-[14px] font-semibold text-[#1a1917] mt-0.5 leading-snug">
                    {ini.titulo}
                  </h2>
                </div>
                <span className="flex-shrink-0 text-[10px] font-medium bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                  Aguardando kick-off
                </span>
              </div>

              {/* Detalhes */}
              <div className="space-y-1.5 text-xs text-[#6b6966]">
                <div className="flex items-center gap-1.5">
                  <Building2 size={12} className="flex-shrink-0" />
                  <span>{ini.area}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <User size={12} className="flex-shrink-0" />
                  <span>{ini.responsavel_nome}</span>
                  {ini.sponsor && (
                    <span className="text-[#c4c2be]">· Sponsor: {ini.sponsor}</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar size={12} className="flex-shrink-0" />
                  <span>Aprovada em {formatarData(ini.updated_at)}</span>
                </div>
              </div>

              {/* Etapas visuais */}
              <div className="flex items-center gap-1">
                {ETAPAS.map((etapa, i) => (
                  <div key={etapa.label} className="flex items-center gap-1 flex-1">
                    <div className={`h-1.5 rounded-full flex-1 ${i <= 1 ? 'bg-[#451a1a]' : 'bg-[#ededeb]'}`} />
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-[#c4c2be] -mt-2">Etapa atual: Planejamento</p>

              {/* Ação */}
              <div className="flex items-center gap-2 mt-auto pt-1 border-t border-[#ededeb]">
                <Link
                  href={`/iniciativa/${ini.id}`}
                  className="text-xs text-[#6b6966] hover:text-[#451a1a] transition-colors"
                >
                  Ver detalhes
                </Link>
                <button
                  onClick={() => iniciarOnboarding(ini.id, ini.titulo)}
                  disabled={loading === ini.id}
                  className="ml-auto flex items-center gap-1.5 bg-[#451a1a] hover:bg-[#5c2222] text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading === ini.id ? (
                    <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <CheckCircle2 size={13} />
                  )}
                  Iniciar onboarding
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1a1917] text-white text-[13px] px-4 py-2.5 rounded-lg shadow-lg z-50 pointer-events-none">
          {toast}
        </div>
      )}
    </div>
  )
}
