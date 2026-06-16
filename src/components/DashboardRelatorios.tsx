'use client'

import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { X } from 'lucide-react'

interface Entrega {
  id: string
  descricao: string
  responsavel: string
  concluida: boolean
}

interface RaidItem {
  id: string
  tipo: 'risco' | 'acao' | 'impedimento' | 'decisao'
  descricao: string
  acao?: string
  responsavel?: string
  prazo?: string
  status?: string
}

interface Iniciativa {
  id: string
  protocolo: string
  titulo: string
  area: string
  tipo_iniciativa: string
  patrocinador: string
  responsavel_nome: string
  status: string
  score: number
  data_fim_prevista: string | null
  lista_entregas: Entrega[] | null
  lista_raid: RaidItem[] | null
  update_periodo: string | null
}

type StatusPortfolio = 'no_prazo' | 'atencao' | 'critico' | 'concluido'

const STATUS_CFG: Record<StatusPortfolio, { label: string; badge: string; dot: string; pieCor: string }> = {
  no_prazo:  { label: 'No prazo',  badge: 'bg-green-100 text-green-800',   dot: '#22c55e', pieCor: '#22c55e' },
  atencao:   { label: 'Atenção',   badge: 'bg-yellow-100 text-yellow-800', dot: '#eab308', pieCor: '#eab308' },
  critico:   { label: 'Crítico',   badge: 'bg-red-100 text-red-800',       dot: '#ef4444', pieCor: '#ef4444' },
  concluido: { label: 'Concluído', badge: 'bg-gray-100 text-gray-600',     dot: '#9ca3af', pieCor: '#9ca3af' },
}

function calcStatus(ini: Iniciativa): StatusPortfolio {
  const s = (ini.status ?? '').toLowerCase()
  if (s === 'concluída' || s === 'concluida') return 'concluido'

  const raid = ini.lista_raid ?? []
  const impedimentos = raid.filter(r => r.tipo === 'impedimento')
  const decisoesPendentes = raid.filter(r => r.tipo === 'decisao' && (!r.status || r.status === 'Pendente'))

  const hoje = new Date()
  const fim = ini.data_fim_prevista ? new Date(ini.data_fim_prevista + 'T00:00:00') : null
  const atrasado = fim ? fim < hoje : false
  const muitoAtrasado = atrasado && fim ? (hoje.getTime() - fim.getTime()) > 30 * 24 * 60 * 60 * 1000 : false

  if (muitoAtrasado || (atrasado && impedimentos.length > 0)) return 'critico'
  if (impedimentos.length > 0 || decisoesPendentes.length > 0 || atrasado) return 'atencao'
  return 'no_prazo'
}

function calcProgresso(ini: Iniciativa): number {
  const e = ini.lista_entregas ?? []
  if (e.length === 0) return 0
  return Math.round((e.filter(x => x.concluida).length / e.length) * 100)
}

function ProgressBar({ pct }: { pct: number }) {
  const cor = pct >= 80 ? 'bg-green-500' : pct >= 40 ? 'bg-blue-500' : 'bg-gray-300'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${cor}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500 w-8 text-right">{pct}%</span>
    </div>
  )
}

export default function DashboardRelatorios() {
  const [dados, setDados] = useState<Iniciativa[]>([])
  const [carregando, setCarregando] = useState(true)
  const [selecionado, setSelecionado] = useState<Iniciativa | null>(null)
  const [updateDrawer, setUpdateDrawer] = useState('')
  const [salvandoUpdate, setSalvandoUpdate] = useState(false)
  const [toastUpdate, setToastUpdate] = useState('')
  const [narrativaAberta, setNarrativaAberta] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    async function carregar() {
      const { data } = await supabase
        .from('iniciativas')
        .select('id, protocolo, titulo, area, tipo_iniciativa, patrocinador, responsavel_nome, status, score, data_fim_prevista, lista_entregas, lista_raid, update_periodo')
        .not('status', 'in', '("recebida","em_analise","Recusada")')
        .order('created_at', { ascending: false })

      setDados(data ?? [])
      setCarregando(false)
    }
    carregar()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function abrirDrawer(ini: Iniciativa) {
    setSelecionado(ini)
    setUpdateDrawer(ini.update_periodo ?? '')
    setToastUpdate('')
  }

  async function salvarUpdateDrawer() {
    if (!selecionado) return
    setSalvandoUpdate(true)
    const res = await fetch(`/api/iniciativas/${selecionado.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ update_periodo: updateDrawer }),
    })
    setSalvandoUpdate(false)
    if (res.ok) {
      setDados(prev => prev.map(d => d.id === selecionado.id ? { ...d, update_periodo: updateDrawer } : d))
      setSelecionado(prev => prev ? { ...prev, update_periodo: updateDrawer } : prev)
      setToastUpdate('Salvo!')
      setTimeout(() => setToastUpdate(''), 2500)
    } else {
      setToastUpdate('Erro ao salvar')
    }
  }

  function gerarNarrativa(): string {
    const data = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    const comStatus = dados.map(d => ({ ...d, _st: calcStatus(d), _prog: calcProgresso(d) }))
    const noPrazo = comStatus.filter(d => d._st === 'no_prazo')
    const atencao = comStatus.filter(d => d._st === 'atencao' || d._st === 'critico')
    const decisoesPendentes = comStatus.flatMap(d =>
      (d.lista_raid ?? [])
        .filter(r => r.tipo === 'decisao' && (!r.status || r.status === 'Pendente'))
        .map(r => `${d.titulo}: ${r.descricao}`)
    )

    return `Portfólio System COE Átrio Hotel Management — ${data}

Total de projetos: ${comStatus.length}
Em andamento: ${comStatus.filter(d => d._st !== 'concluido').length}
Concluídos: ${comStatus.filter(d => d._st === 'concluido').length}
Prioridade alta (score ≥ 2.4): ${comStatus.filter(d => d.score >= 2.4).length}

DESTAQUES — No prazo:
${noPrazo.length > 0 ? noPrazo.map(d => `• ${d.titulo} (${d.protocolo}) — ${d._prog}% concluído`).join('\n') : '• Nenhum projeto sem pendências'}

ATENÇÃO — Impedimentos ou risco:
${atencao.length > 0 ? atencao.map(d => `• ${d.titulo} (${d.protocolo}) — ${STATUS_CFG[d._st].label}`).join('\n') : '• Nenhum projeto com impedimentos'}

DECISÕES NECESSÁRIAS:
${decisoesPendentes.length > 0 ? decisoesPendentes.map(d => `• ${d}`).join('\n') : '• Nenhuma decisão pendente'}
`
  }

  if (carregando) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />)}
      </div>
    )
  }

  const comStatus = dados.map(d => ({ ...d, _status: calcStatus(d), _progresso: calcProgresso(d) }))
  const total = comStatus.length
  const emAndamento = comStatus.filter(d => d._status !== 'concluido').length
  const prioridadeAlta = comStatus.filter(d => d.score >= 2.4).length
  const concluidas = comStatus.filter(d => d._status === 'concluido').length

  const comImpedimento = comStatus.filter(d => {
    const raid = d.lista_raid ?? []
    return raid.some(r => r.tipo === 'impedimento') ||
      raid.some(r => r.tipo === 'decisao' && (!r.status || r.status === 'Pendente'))
  })

  const pieData = (Object.keys(STATUS_CFG) as StatusPortfolio[])
    .map(key => ({
      name: STATUS_CFG[key].label,
      value: comStatus.filter(d => d._status === key).length,
      cor: STATUS_CFG[key].pieCor,
    }))
    .filter(d => d.value > 0)

  const porArea = Object.entries(
    comStatus.reduce((acc, d) => ({ ...acc, [d.area]: (acc[d.area] ?? 0) + 1 }), {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1])

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <p className="text-xs text-gray-400">
          Atualizado em {new Date().toLocaleDateString('pt-BR')} · Referência quinzenal para o CFO
        </p>
        <button
          onClick={() => setNarrativaAberta(true)}
          className="flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          Gerar narrativa para CFO ↗
        </button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total no portfólio', valor: total,        sub: 'projetos ativos' },
          { label: 'Em andamento',       valor: emAndamento,  sub: 'em execução'     },
          { label: 'Prioridade alta',    valor: prioridadeAlta, sub: 'requerem atenção' },
          { label: 'Concluídos',         valor: concluidas,   sub: 'entregues'       },
        ].map(c => (
          <div key={c.label} className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">{c.label}</p>
            <p className="text-2xl font-bold text-gray-900">{c.valor}</p>
            <p className="text-xs text-gray-400 mt-0.5">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Alerta */}
      {comImpedimento.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-900">
          <p className="font-semibold mb-1">
            Atenção: {comImpedimento.length} {comImpedimento.length === 1 ? 'projeto com' : 'projetos com'} impedimento ativo ou decisão pendente.
          </p>
          <p className="text-amber-800">
            {comImpedimento.map(d => {
              const decisao = (d.lista_raid ?? []).find(r => r.tipo === 'decisao' && (!r.status || r.status === 'Pendente'))
              return decisao
                ? `${d.protocolo} requer decisão: "${decisao.descricao}"${decisao.prazo ? ` até ${new Date(decisao.prazo + 'T00:00:00').toLocaleDateString('pt-BR')}` : ''}`
                : `${d.protocolo} possui impedimento ativo`
            }).join(' · ')}
          </p>
        </div>
      )}

      {/* Tabela + Gráficos */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Tabela */}
        <div className="flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['PROJETO', 'ÁREA', 'STATUS', 'PROGRESSO', 'PRAZO'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {comStatus.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-400 text-sm">
                    Nenhum projeto no portfólio. Aprove iniciativas para elas aparecerem aqui.
                  </td>
                </tr>
              )}
              {comStatus.map(d => {
                const cfg = STATUS_CFG[d._status]
                return (
                  <tr key={d.id} onClick={() => abrirDrawer(d)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 text-sm leading-snug">{d.titulo}</p>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">{d.protocolo}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">{d.area}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${cfg.badge}`}>
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 min-w-[120px]">
                      <ProgressBar pct={d._progresso} />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {d.data_fim_prevista
                        ? new Date(d.data_fim_prevista + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
                        : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Painel lateral */}
        <div className="w-full lg:w-56 flex-shrink-0 space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Distribuição por status</p>
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={130}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={2}>
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.cor} />)}
                    </Pie>
                    <Tooltip formatter={(val, name) => [`${val} projeto${val === 1 ? '' : 's'}`, name]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1 mt-1">
                  {pieData.map(d => (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.cor }} />
                        <span className="text-gray-600">{d.name}</span>
                      </div>
                      <span className="font-semibold text-gray-900">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[130px] flex items-center justify-center text-xs text-gray-400">Sem dados</div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Por área</p>
            <div className="space-y-1.5">
              {porArea.map(([area, count]) => (
                <div key={area} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 truncate mr-2">{area}</span>
                  <span className="font-semibold text-gray-900 flex-shrink-0">{count}</span>
                </div>
              ))}
              {porArea.length === 0 && <p className="text-xs text-gray-400">Sem projetos</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Drawer — ficha rápida */}
      {selecionado && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setSelecionado(null)} />
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
            <div className="border-b border-gray-100 px-5 py-4 flex items-start justify-between gap-3 flex-shrink-0">
              <div className="min-w-0">
                <p className="text-xs font-mono text-blue-600 mb-0.5">{selecionado.protocolo}</p>
                <h2 className="font-semibold text-gray-900 text-sm leading-snug">{selecionado.titulo}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{selecionado.area} · {selecionado.tipo_iniciativa}</p>
              </div>
              <button onClick={() => setSelecionado(null)} className="text-gray-400 hover:text-gray-700 flex-shrink-0 mt-0.5">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-gray-400 mb-0.5">Responsável</p>
                  <p className="text-gray-900 font-medium">{selecionado.responsavel_nome || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-0.5">Patrocinador</p>
                  <p className="text-gray-900 font-medium">{selecionado.patrocinador || '—'}</p>
                </div>
              </div>

              {(() => {
                const st = calcStatus(selecionado)
                const cfg = STATUS_CFG[st]
                const prog = calcProgresso(selecionado)
                return (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full ${cfg.badge}`}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
                        {cfg.label}
                      </span>
                      <span className="text-xs text-gray-400">Score: {(selecionado.score ?? 0).toFixed(1)}</span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Progresso das entregas</p>
                      <ProgressBar pct={prog} />
                    </div>
                  </div>
                )
              })()}

              {(() => {
                const raid = selecionado.lista_raid ?? []
                const imps = raid.filter(r => r.tipo === 'impedimento')
                const decs = raid.filter(r => r.tipo === 'decisao' && (!r.status || r.status === 'Pendente'))
                if (imps.length === 0 && decs.length === 0) return null
                return (
                  <div className="space-y-2">
                    {imps.map(r => (
                      <div key={r.id} className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-xs">
                        <span className="font-semibold text-orange-800">Impedimento</span>
                        <p className="text-orange-900 mt-0.5">{r.descricao}</p>
                        {r.acao && <p className="text-orange-600 mt-0.5">Ação: {r.acao}{r.responsavel ? ` · Resp: ${r.responsavel}` : ''}</p>}
                      </div>
                    ))}
                    {decs.map(r => (
                      <div key={r.id} className="bg-amber-50 border border-amber-300 rounded-lg p-3 text-xs">
                        <p className="font-semibold text-amber-900 uppercase tracking-wide text-[10px] mb-0.5">Requer decisão</p>
                        <p className="text-amber-900">{r.descricao}</p>
                        {r.prazo && <p className="text-amber-600 mt-0.5">Prazo: {new Date(r.prazo + 'T00:00:00').toLocaleDateString('pt-BR')}</p>}
                      </div>
                    ))}
                  </div>
                )
              })()}

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Update do período</p>
                <textarea
                  rows={5}
                  className="input-base text-sm resize-none"
                  placeholder="Registre o status atual, avanços e próximos passos..."
                  value={updateDrawer}
                  onChange={e => setUpdateDrawer(e.target.value)}
                />
                {toastUpdate && (
                  <p className={`text-xs mt-1 ${toastUpdate === 'Salvo!' ? 'text-green-600' : 'text-red-600'}`}>{toastUpdate}</p>
                )}
                <button onClick={salvarUpdateDrawer} disabled={salvandoUpdate} className="btn-primary text-sm px-4 py-2 mt-2">
                  {salvandoUpdate ? 'Salvando...' : 'Salvar update'}
                </button>
              </div>

              <Link
                href={`/iniciativa/${selecionado.id}`}
                className="block text-center text-sm text-blue-600 hover:text-blue-800 font-medium border border-blue-200 rounded-lg py-2.5 hover:bg-blue-50 transition-colors"
              >
                Ver iniciativa completa →
              </Link>
            </div>
          </div>
        </>
      )}

      {/* Modal narrativa */}
      {narrativaAberta && (
        <>
          <div className="fixed inset-0 bg-black/30 z-50" onClick={() => setNarrativaAberta(false)} />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl z-50 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Narrativa para CFO</h3>
              <button onClick={() => setNarrativaAberta(false)} className="text-gray-400 hover:text-gray-700">
                <X size={18} />
              </button>
            </div>
            <div className="p-6">
              <pre className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-700 whitespace-pre-wrap font-mono leading-relaxed max-h-72 overflow-y-auto">
                {gerarNarrativa()}
              </pre>
              <button
                onClick={() => { navigator.clipboard.writeText(gerarNarrativa()) }}
                className="btn-primary px-6 mt-4"
              >
                Copiar texto
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
