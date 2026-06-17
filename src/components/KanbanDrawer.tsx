'use client'

import { useState, useEffect } from 'react'
import { X, Save, Plus, Check, Clock, AlertTriangle, History, MessageSquare, TrendingUp } from 'lucide-react'

interface Atividade {
  id: string
  descricao: string
  responsavel: string
  prazo: string
  tipo: 'Ação' | 'Entrega' | 'Validação' | 'Reunião' | 'Aprovação'
  prioridade: 'Normal' | 'Alta' | 'Crítica'
  concluida: boolean
  created_at: string
}

interface HistoricoItem {
  id: string
  tipo: string
  descricao: string
  autor: string
  created_at: string
}

interface UpdateItem {
  id: string
  texto: string
  autor: string
  created_at: string
}

interface GestaoData {
  data_inicio_estimada?: string
  data_fim_estimada?: string
  data_inicio_real?: string
  data_fim_real?: string
  orcamento_previsto?: number | null
  custo_realizado?: number | null
  esforco_previsto_hh?: number | null
  esforco_realizado_hh?: number | null
  saving_esperado?: number | null
}

interface KanbanDrawerProps {
  iniciativa: {
    id: string
    protocolo: string
    titulo: string
    status: string
    lista_atividades?: Atividade[]
    lista_historico?: HistoricoItem[]
    lista_updates?: UpdateItem[]
  } & GestaoData
  nomeUsuario: string
  onClose: () => void
  onUpdate: (patch: Record<string, unknown>) => void
}

type TabId = 'gestao' | 'atividades' | 'historico' | 'updates'

function tempoRelativo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min}m`
  const h = Math.floor(min / 60)
  if (h < 24) return `há ${h}h`
  return `há ${Math.floor(h / 24)}d`
}

function iniciais(nome: string) {
  return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

function avatarCor(nome: string) {
  const cores = ['bg-[#451a1a]', 'bg-purple-600', 'bg-green-700', 'bg-orange-600', 'bg-teal-600']
  let h = 0
  for (const c of nome) h = (h * 31 + c.charCodeAt(0)) & 0xffff
  return cores[h % cores.length]
}

function calcROI(saving: number | null | undefined, custo: number | null | undefined) {
  if (!saving || !custo || custo === 0) return null
  return ((saving - custo) / custo) * 100
}

function calcPayback(saving: number | null | undefined, custo: number | null | undefined) {
  if (!saving || !custo || saving === 0) return null
  return custo / (saving / 12)
}

function calcDesvio(real: number | null | undefined, previsto: number | null | undefined) {
  if (!real || !previsto || previsto === 0) return null
  return ((real - previsto) / previsto) * 100
}

function MetricCard({ label, value, suffix = '' }: { label: string; value: number | null; suffix?: string }) {
  if (value === null) return (
    <div className="bg-[#f8f7f6] rounded-lg p-3 border border-[#ededeb]">
      <p className="text-[10px] text-[#6b6966] uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium text-[#6b6966] mt-0.5">—</p>
    </div>
  )
  const abs = Math.abs(value)
  const cor = label.includes('ROI')
    ? value >= 0 ? 'border-[#2d7d46] bg-[#eaf5ec]' : 'border-[#c0392b] bg-[#fcebeb]'
    : abs <= 10 ? 'border-[#b07d1a] bg-[#fef9ec]' : abs > 10 ? 'border-[#c0392b] bg-[#fcebeb]' : 'border-[#2d7d46] bg-[#eaf5ec]'

  return (
    <div className={`rounded-lg p-3 border ${cor}`}>
      <p className="text-[10px] text-[#6b6966] uppercase tracking-wide">{label}</p>
      <p className="text-sm font-bold mt-0.5">
        {value >= 0 ? '+' : ''}{value.toFixed(1)}{suffix}
      </p>
    </div>
  )
}

export default function KanbanDrawer({ iniciativa: ini, nomeUsuario, onClose, onUpdate }: KanbanDrawerProps) {
  const [aba, setAba] = useState<TabId>('gestao')

  // Gestão state
  const [gestao, setGestao] = useState<GestaoData>({
    data_inicio_estimada: ini.data_inicio_estimada ?? '',
    data_fim_estimada: ini.data_fim_estimada ?? '',
    data_inicio_real: ini.data_inicio_real ?? '',
    data_fim_real: ini.data_fim_real ?? '',
    orcamento_previsto: ini.orcamento_previsto ?? null,
    custo_realizado: ini.custo_realizado ?? null,
    esforco_previsto_hh: ini.esforco_previsto_hh ?? null,
    esforco_realizado_hh: ini.esforco_realizado_hh ?? null,
    saving_esperado: ini.saving_esperado ?? null,
  })
  const [salvandoGestao, setSalvandoGestao] = useState(false)

  // Atividades state
  const [atividades, setAtividades] = useState<Atividade[]>(ini.lista_atividades ?? [])
  const [novaAtiv, setNovaAtiv] = useState({ descricao: '', responsavel: '', prazo: '', tipo: 'Ação' as Atividade['tipo'], prioridade: 'Normal' as Atividade['prioridade'] })
  const [showFormAtiv, setShowFormAtiv] = useState(false)
  const [salvandoAtiv, setSalvandoAtiv] = useState(false)

  // Histórico state
  const [historico, setHistorico] = useState<HistoricoItem[]>(ini.lista_historico ?? [])

  // Updates state
  const [updates, setUpdates] = useState<UpdateItem[]>(ini.lista_updates ?? [])
  const [novoUpdate, setNovoUpdate] = useState('')
  const [salvandoUpdate, setSalvandoUpdate] = useState(false)

  const roi = calcROI(gestao.saving_esperado, gestao.custo_realizado)
  const payback = calcPayback(gestao.saving_esperado, gestao.custo_realizado)
  const desvioCusto = calcDesvio(gestao.custo_realizado, gestao.orcamento_previsto)
  const desvioEsforco = calcDesvio(gestao.esforco_realizado_hh, gestao.esforco_previsto_hh)

  async function salvarGestao() {
    setSalvandoGestao(true)
    const entrada: HistoricoItem = {
      id: crypto.randomUUID(),
      tipo: 'gestao',
      descricao: 'Dados de gestão atualizados',
      autor: nomeUsuario,
      created_at: new Date().toISOString(),
    }
    const novoHistorico = [entrada, ...historico]
    const patch = {
      ...gestao,
      roi_calculado: roi,
      payback_meses: payback,
      lista_historico: novoHistorico,
    }
    const res = await fetch(`/api/iniciativas/${ini.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (res.ok) {
      setHistorico(novoHistorico)
      onUpdate(patch)
    }
    setSalvandoGestao(false)
  }

  async function adicionarAtividade() {
    if (!novaAtiv.descricao.trim()) return
    setSalvandoAtiv(true)
    const nova: Atividade = {
      id: crypto.randomUUID(),
      ...novaAtiv,
      concluida: false,
      created_at: new Date().toISOString(),
    }
    const entrada: HistoricoItem = {
      id: crypto.randomUUID(),
      tipo: 'atividade',
      descricao: `Atividade adicionada: "${nova.descricao}"`,
      autor: nomeUsuario,
      created_at: new Date().toISOString(),
    }
    const listaAtiv = [...atividades, nova]
    const novoHistorico = [entrada, ...historico]
    const res = await fetch(`/api/iniciativas/${ini.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lista_atividades: listaAtiv, lista_historico: novoHistorico }),
    })
    if (res.ok) {
      setAtividades(listaAtiv)
      setHistorico(novoHistorico)
      setNovaAtiv({ descricao: '', responsavel: '', prazo: '', tipo: 'Ação', prioridade: 'Normal' })
      setShowFormAtiv(false)
      onUpdate({ lista_atividades: listaAtiv })
    }
    setSalvandoAtiv(false)
  }

  async function toggleAtividade(id: string) {
    const atualizada = atividades.find(a => a.id === id)
    if (!atualizada) return
    const novaConcluida = !atualizada.concluida
    const lista = atividades.map(a => a.id === id ? { ...a, concluida: novaConcluida } : a)
    const entrada: HistoricoItem = {
      id: crypto.randomUUID(),
      tipo: 'atividade',
      descricao: `Atividade "${atualizada.descricao}" marcada como ${novaConcluida ? 'concluída' : 'pendente'}`,
      autor: nomeUsuario,
      created_at: new Date().toISOString(),
    }
    const novoHistorico = [entrada, ...historico]
    setAtividades(lista)
    setHistorico(novoHistorico)
    onUpdate({ lista_atividades: lista })
    await fetch(`/api/iniciativas/${ini.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lista_atividades: lista, lista_historico: novoHistorico }),
    })
  }

  async function publicarUpdate() {
    if (!novoUpdate.trim()) return
    setSalvandoUpdate(true)
    const novo: UpdateItem = {
      id: crypto.randomUUID(),
      texto: novoUpdate.trim(),
      autor: nomeUsuario,
      created_at: new Date().toISOString(),
    }
    const lista = [novo, ...updates]
    const entrada: HistoricoItem = {
      id: crypto.randomUUID(),
      tipo: 'update',
      descricao: 'Update do período publicado',
      autor: nomeUsuario,
      created_at: new Date().toISOString(),
    }
    const novoHistorico = [entrada, ...historico]
    const res = await fetch(`/api/iniciativas/${ini.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lista_updates: lista, lista_historico: novoHistorico }),
    })
    if (res.ok) {
      setUpdates(lista)
      setHistorico(novoHistorico)
      setNovoUpdate('')
      onUpdate({ lista_updates: lista })
    }
    setSalvandoUpdate(false)
  }

  const ABAS: { id: TabId; label: string; Icon: React.ElementType }[] = [
    { id: 'gestao',     label: 'Gestão',     Icon: TrendingUp },
    { id: 'atividades', label: 'Atividades', Icon: Check },
    { id: 'historico',  label: 'Histórico',  Icon: History },
    { id: 'updates',    label: 'Updates',    Icon: MessageSquare },
  ]

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Drawer */}
      <div
        className="relative z-10 w-[400px] max-w-full bg-white h-full flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-[#ededeb]">
          <div className="min-w-0 pr-2">
            <p className="font-mono text-xs text-[#451a1a] font-medium">{ini.protocolo}</p>
            <p className="text-sm font-semibold text-[#1a1917] mt-0.5 leading-tight line-clamp-2">{ini.titulo}</p>
          </div>
          <button onClick={onClose} className="text-[#6b6966] hover:text-[#1a1917] flex-shrink-0">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#ededeb]">
          {ABAS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setAba(id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors border-b-2 ${
                aba === id
                  ? 'text-[#451a1a] border-[#451a1a]'
                  : 'text-[#6b6966] border-transparent hover:text-[#1a1917]'
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">

          {/* ─── ABA GESTÃO ─── */}
          {aba === 'gestao' && (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-base">Início estimado</label>
                  <input type="date" className="input-base" value={gestao.data_inicio_estimada ?? ''} onChange={e => setGestao(g => ({ ...g, data_inicio_estimada: e.target.value }))} />
                </div>
                <div>
                  <label className="label-base">Término estimado</label>
                  <input type="date" className="input-base" value={gestao.data_fim_estimada ?? ''} onChange={e => setGestao(g => ({ ...g, data_fim_estimada: e.target.value }))} />
                </div>
                <div>
                  <label className="label-base">Início real</label>
                  <input type="date" className="input-base" value={gestao.data_inicio_real ?? ''} onChange={e => setGestao(g => ({ ...g, data_inicio_real: e.target.value }))} />
                </div>
                <div>
                  <label className="label-base">Término real</label>
                  <input type="date" className="input-base" value={gestao.data_fim_real ?? ''} onChange={e => setGestao(g => ({ ...g, data_fim_real: e.target.value }))} />
                </div>
              </div>

              <div className="border-t border-[#ededeb] pt-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="label-base">Orçamento previsto R$</label>
                  <input type="number" className="input-base" placeholder="0" value={gestao.orcamento_previsto ?? ''} onChange={e => setGestao(g => ({ ...g, orcamento_previsto: e.target.value ? parseFloat(e.target.value) : null }))} />
                </div>
                <div>
                  <label className="label-base">Custo realizado R$</label>
                  <input type="number" className="input-base" placeholder="0" value={gestao.custo_realizado ?? ''} onChange={e => setGestao(g => ({ ...g, custo_realizado: e.target.value ? parseFloat(e.target.value) : null }))} />
                </div>
                <div>
                  <label className="label-base">Esforço previsto H/h</label>
                  <input type="number" className="input-base" placeholder="0" value={gestao.esforco_previsto_hh ?? ''} onChange={e => setGestao(g => ({ ...g, esforco_previsto_hh: e.target.value ? parseFloat(e.target.value) : null }))} />
                </div>
                <div>
                  <label className="label-base">Esforço realizado H/h</label>
                  <input type="number" className="input-base" placeholder="0" value={gestao.esforco_realizado_hh ?? ''} onChange={e => setGestao(g => ({ ...g, esforco_realizado_hh: e.target.value ? parseFloat(e.target.value) : null }))} />
                </div>
                <div className="col-span-2">
                  <label className="label-base">Benefício / Saving esperado R$</label>
                  <input type="number" className="input-base" placeholder="0" value={gestao.saving_esperado ?? ''} onChange={e => setGestao(g => ({ ...g, saving_esperado: e.target.value ? parseFloat(e.target.value) : null }))} />
                </div>
              </div>

              {/* Calculadora */}
              <div className="border-t border-[#ededeb] pt-3">
                <p className="text-xs font-semibold text-[#6b6966] uppercase tracking-wide mb-2">Calculadora automática</p>
                <div className="grid grid-cols-2 gap-2">
                  <MetricCard label="ROI %" value={roi} suffix="%" />
                  <MetricCard label="Payback (meses)" value={payback} />
                  <MetricCard label="Desvio de custo" value={desvioCusto} suffix="%" />
                  <MetricCard label="Desvio de esforço" value={desvioEsforco} suffix="%" />
                </div>
              </div>

              <button
                onClick={salvarGestao}
                disabled={salvandoGestao}
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                <Save size={14} />
                {salvandoGestao ? 'Salvando...' : 'Salvar dados de gestão'}
              </button>
            </div>
          )}

          {/* ─── ABA ATIVIDADES ─── */}
          {aba === 'atividades' && (
            <div className="p-4 space-y-3">
              <button
                onClick={() => setShowFormAtiv(true)}
                className="w-full flex items-center justify-center gap-2 py-2 text-sm text-[#451a1a] bg-[#f5eded] hover:bg-[#ededeb] rounded-lg border border-dashed border-[#451a1a]/30 transition-colors"
              >
                <Plus size={14} />
                + Adicionar atividade
              </button>

              {showFormAtiv && (
                <div className="bg-[#f8f7f6] rounded-lg p-3 border border-[#ededeb] space-y-2">
                  <input
                    type="text"
                    className="input-base"
                    placeholder="Descrição da atividade"
                    value={novaAtiv.descricao}
                    onChange={e => setNovaAtiv(v => ({ ...v, descricao: e.target.value }))}
                    autoFocus
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" className="input-base" placeholder="Responsável" value={novaAtiv.responsavel} onChange={e => setNovaAtiv(v => ({ ...v, responsavel: e.target.value }))} />
                    <input type="date" className="input-base" value={novaAtiv.prazo} onChange={e => setNovaAtiv(v => ({ ...v, prazo: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <select className="input-base" value={novaAtiv.tipo} onChange={e => setNovaAtiv(v => ({ ...v, tipo: e.target.value as Atividade['tipo'] }))}>
                      {['Ação', 'Entrega', 'Validação', 'Reunião', 'Aprovação'].map(t => <option key={t}>{t}</option>)}
                    </select>
                    <select className="input-base" value={novaAtiv.prioridade} onChange={e => setNovaAtiv(v => ({ ...v, prioridade: e.target.value as Atividade['prioridade'] }))}>
                      {['Normal', 'Alta', 'Crítica'].map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={adicionarAtividade} disabled={salvandoAtiv || !novaAtiv.descricao.trim()} className="btn-primary flex-1 text-sm py-1.5">
                      {salvandoAtiv ? 'Salvando...' : 'Adicionar'}
                    </button>
                    <button onClick={() => setShowFormAtiv(false)} className="btn-secondary text-sm py-1.5 px-3">Cancelar</button>
                  </div>
                </div>
              )}

              {atividades.length === 0 && !showFormAtiv && (
                <p className="text-center text-sm text-[#6b6966] py-8">Nenhuma atividade cadastrada.</p>
              )}

              <div className="space-y-2">
                {atividades.map(a => {
                  const vencida = a.prazo && !a.concluida && new Date(a.prazo) < new Date()
                  return (
                    <div key={a.id} className={`flex items-start gap-2.5 p-3 rounded-lg border ${a.concluida ? 'bg-[#eaf5ec] border-[#2d7d46]/20' : 'bg-white border-[#ededeb]'}`}>
                      <button onClick={() => toggleAtividade(a.id)} className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${a.concluida ? 'bg-[#2d7d46] border-[#2d7d46]' : 'border-[#ededeb] hover:border-[#451a1a]'}`}>
                        {a.concluida && <Check size={10} className="text-white" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${a.concluida ? 'line-through text-[#6b6966]' : 'text-[#1a1917]'}`}>{a.descricao}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {a.responsavel && <span className="text-[10px] text-[#6b6966]">👤 {a.responsavel}</span>}
                          {a.prazo && (
                            <span className={`text-[10px] flex items-center gap-0.5 ${vencida ? 'text-[#c0392b] font-medium' : 'text-[#6b6966]'}`}>
                              {vencida && <AlertTriangle size={9} />}
                              <Clock size={9} />
                              {new Date(a.prazo + 'T00:00:00').toLocaleDateString('pt-BR')}
                            </span>
                          )}
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                            a.prioridade === 'Crítica' ? 'bg-[#fcebeb] text-[#c0392b]' :
                            a.prioridade === 'Alta' ? 'bg-[#fef9ec] text-[#b07d1a]' :
                            'bg-[#f8f7f6] text-[#6b6966]'
                          }`}>{a.tipo} · {a.prioridade}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ─── ABA HISTÓRICO ─── */}
          {aba === 'historico' && (
            <div className="p-4">
              {historico.length === 0 && (
                <p className="text-center text-sm text-[#6b6966] py-8">Nenhuma atividade registrada.</p>
              )}
              <div className="relative">
                {historico.length > 0 && <div className="absolute left-4 top-0 bottom-0 w-px bg-[#ededeb]" />}
                <div className="space-y-4">
                  {historico.map(h => (
                    <div key={h.id} className="flex gap-3 relative">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 z-10 ${avatarCor(h.autor)}`}>
                        {iniciais(h.autor)}
                      </div>
                      <div className="flex-1 bg-white rounded-lg border border-[#ededeb] p-2.5">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="text-xs font-medium text-[#1a1917]">{h.autor}</p>
                          <p className="text-[10px] text-[#6b6966] flex-shrink-0">{tempoRelativo(h.created_at)}</p>
                        </div>
                        <p className="text-xs text-[#6b6966] mt-0.5">{h.descricao}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─── ABA UPDATES ─── */}
          {aba === 'updates' && (
            <div className="p-4 space-y-4">
              <div>
                <textarea
                  className="input-base resize-none"
                  rows={4}
                  placeholder="Escreva o update do período..."
                  value={novoUpdate}
                  onChange={e => setNovoUpdate(e.target.value)}
                />
                <button
                  onClick={publicarUpdate}
                  disabled={salvandoUpdate || !novoUpdate.trim()}
                  className="mt-2 w-full btn-primary text-sm"
                >
                  {salvandoUpdate ? 'Publicando...' : 'Publicar update'}
                </button>
              </div>

              {updates.length === 0 && (
                <p className="text-center text-sm text-[#6b6966] py-4">Nenhum update publicado.</p>
              )}

              <div className="space-y-3">
                {updates.map(u => (
                  <div key={u.id} className="flex gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 ${avatarCor(u.autor)}`}>
                      {iniciais(u.autor)}
                    </div>
                    <div className="flex-1 bg-[#f8f7f6] rounded-lg border border-[#ededeb] p-3">
                      <div className="flex items-baseline justify-between gap-2 mb-1">
                        <p className="text-xs font-medium text-[#1a1917]">{u.autor}</p>
                        <p className="text-[10px] text-[#6b6966]">{tempoRelativo(u.created_at)}</p>
                      </div>
                      <p className="text-sm text-[#1a1917] whitespace-pre-wrap">{u.texto}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
