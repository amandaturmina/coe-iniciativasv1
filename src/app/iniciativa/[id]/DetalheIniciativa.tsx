'use client'

import { useState } from 'react'
import Badge, { badgeStatus } from '@/components/Badge'
import Scorecard from '@/components/Scorecard'
import PainelDecisao from '@/components/PainelDecisao'
import { createClient } from '@/lib/supabase/client'

interface Entrega {
  id: string
  descricao: string
  responsavel: string
  concluida: boolean
  created_at: string
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
  responsavel_email: string
  problema: string
  valor_esperado: string
  beneficiarios: string[]
  custo_estimado: number | null
  detalhamento_custos: string
  entregas: string
  fora_escopo: string
  data_inicio_prevista: string
  data_fim_prevista: string
  dependencias: string
  equipe: string
  tem_terceiros: boolean
  terceiros: string
  riscos: Array<{ descricao: string; probabilidade: string; impacto: string; nivel: string }>
  eap: string
  anexos: string[]
  status: string
  score: number
  scorecard: Record<string, number>
  decisao: string | null
  justificativa: string | null
  lista_entregas: Entrega[] | null
  lista_raid: RaidItem[] | null
  update_periodo: string | null
}

const ABAS = [
  'Identificação', 'Problema e Valor', 'Custos', 'Escopo',
  'Cronograma', 'Recursos', 'Riscos', 'EAP',
  'Entregas', 'RAID', 'Update', 'Anexos',
]

interface Props {
  iniciativa: Iniciativa
  perfil: string
}

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function AnexoLink({ path }: { path: string }) {
  const supabase = createClient()
  const { data } = supabase.storage.from('iniciativas').getPublicUrl(path)
  const nome = path.split('/').pop() ?? path

  return (
    <li className="flex items-center gap-2 text-sm">
      <svg className="w-4 h-4 text-atrio flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
      </svg>
      <a
        href={data.publicUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-atrio hover:underline truncate max-w-xs"
        title={nome}
      >
        {nome}
      </a>
    </li>
  )
}

const RAID_CONFIG = {
  risco: {
    titulo: 'Riscos',
    cor: 'border-red-200',
    headerCor: 'bg-red-50 text-red-800 border-b border-red-200',
    dot: 'bg-red-500',
    campos: [
      { key: 'descricao', label: 'Descrição do risco', tipo: 'text' },
      { key: 'acao', label: 'Ação mitigadora', tipo: 'text' },
      { key: 'responsavel', label: 'Responsável', tipo: 'text' },
    ],
  },
  acao: {
    titulo: 'Ações',
    cor: 'border-blue-200',
    headerCor: 'bg-blue-50 text-blue-800 border-b border-blue-200',
    dot: 'bg-blue-500',
    campos: [
      { key: 'descricao', label: 'Descrição da ação', tipo: 'text' },
      { key: 'responsavel', label: 'Responsável', tipo: 'text' },
      { key: 'status', label: 'Status', tipo: 'select', opcoes: ['Pendente', 'Em andamento', 'Concluída'] },
    ],
  },
  impedimento: {
    titulo: 'Impedimentos',
    cor: 'border-orange-200',
    headerCor: 'bg-orange-50 text-orange-800 border-b border-orange-200',
    dot: 'bg-orange-500',
    campos: [
      { key: 'descricao', label: 'Descrição do impedimento', tipo: 'text' },
      { key: 'acao', label: 'Ação para resolver', tipo: 'text' },
      { key: 'responsavel', label: 'Responsável', tipo: 'text' },
    ],
  },
  decisao: {
    titulo: 'Decisões',
    cor: 'border-purple-200',
    headerCor: 'bg-purple-50 text-purple-800 border-b border-purple-200',
    dot: 'bg-purple-500',
    campos: [
      { key: 'descricao', label: 'Decisão necessária', tipo: 'text' },
      { key: 'prazo', label: 'Prazo', tipo: 'date' },
      { key: 'status', label: 'Status', tipo: 'select', opcoes: ['Pendente', 'Resolvida'] },
    ],
  },
} as const

function gerarId() {
  return Math.random().toString(36).slice(2, 10)
}

export default function DetalheIniciativa({ iniciativa: ini, perfil }: Props) {
  const [aba, setAba] = useState(0)
  const [scorecard, setScorecard] = useState<Record<string, number>>(ini.scorecard ?? {})
  const [recarregar, setRecarregar] = useState(0)

  // Custos
  const [custoEstimado, setCustoEstimado] = useState(ini.custo_estimado?.toString() ?? '')
  const [detalhamentoCustos, setDetalhamentoCustos] = useState(ini.detalhamento_custos ?? '')
  const [salvandoCustos, setSalvandoCustos] = useState(false)
  const [toastCustos, setToastCustos] = useState('')

  // Entregas
  const [listaEntregas, setListaEntregas] = useState<Entrega[]>(ini.lista_entregas ?? [])
  const [novaEntrega, setNovaEntrega] = useState({ descricao: '', responsavel: '' })
  const [salvandoEntregas, setSalvandoEntregas] = useState(false)
  const [toastEntregas, setToastEntregas] = useState('')
  const entregasConcluidas = listaEntregas.filter(e => e.concluida).length
  const progressoEntregas = listaEntregas.length > 0 ? Math.round((entregasConcluidas / listaEntregas.length) * 100) : 0

  // RAID
  const [listaRaid, setListaRaid] = useState<RaidItem[]>(ini.lista_raid ?? [])
  const [novoRaid, setNovoRaid] = useState<{ tipo: RaidItem['tipo']; descricao: string; acao: string; responsavel: string; prazo: string; status: string }>({ tipo: 'risco', descricao: '', acao: '', responsavel: '', prazo: '', status: 'Pendente' })
  const [adicionandoRaid, setAdicionandoRaid] = useState<RaidItem['tipo'] | null>(null)
  const [salvandoRaid, setSalvandoRaid] = useState(false)
  const [toastRaid, setToastRaid] = useState('')

  // Update do período
  const [updatePeriodo, setUpdatePeriodo] = useState(ini.update_periodo ?? '')
  const [salvandoUpdate, setSalvandoUpdate] = useState(false)
  const [toastUpdate, setToastUpdate] = useState('')

  async function salvarScorecard(sc: Record<string, number>, scoreTotal: number) {
    setScorecard(sc)
    await fetch(`/api/iniciativas/${ini.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scorecard: sc, score: scoreTotal }),
    })
  }

  async function salvarCustos() {
    setSalvandoCustos(true)
    const res = await fetch(`/api/iniciativas/${ini.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        custo_estimado: custoEstimado ? parseFloat(custoEstimado) : null,
        detalhamento_custos: detalhamentoCustos || null,
      }),
    })
    setSalvandoCustos(false)
    setToastCustos(res.ok ? 'Custos salvos!' : 'Erro ao salvar')
    setTimeout(() => setToastCustos(''), 3000)
  }

  function toggleEntrega(index: number) {
    setListaEntregas(prev => prev.map((e, i) => i === index ? { ...e, concluida: !e.concluida } : e))
  }

  function removerEntrega(index: number) {
    setListaEntregas(prev => prev.filter((_, i) => i !== index))
  }

  function adicionarEntrega() {
    if (!novaEntrega.descricao.trim()) return
    setListaEntregas(prev => [...prev, {
      id: gerarId(),
      descricao: novaEntrega.descricao.trim(),
      responsavel: novaEntrega.responsavel.trim(),
      concluida: false,
      created_at: new Date().toISOString(),
    }])
    setNovaEntrega({ descricao: '', responsavel: '' })
  }

  async function salvarEntregas() {
    setSalvandoEntregas(true)
    const res = await fetch(`/api/iniciativas/${ini.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lista_entregas: listaEntregas }),
    })
    setSalvandoEntregas(false)
    setToastEntregas(res.ok ? 'Entregas salvas!' : 'Erro ao salvar')
    setTimeout(() => setToastEntregas(''), 3000)
  }

  function adicionarRaid(tipo: RaidItem['tipo']) {
    if (!novoRaid.descricao?.trim()) return
    setListaRaid(prev => [...prev, {
      id: gerarId(),
      tipo,
      descricao: novoRaid.descricao.trim(),
      acao: novoRaid.acao.trim() || undefined,
      responsavel: novoRaid.responsavel.trim() || undefined,
      prazo: novoRaid.prazo || undefined,
      status: novoRaid.status || 'Pendente',
    }])
    setNovoRaid({ tipo, descricao: '', acao: '', responsavel: '', prazo: '', status: 'Pendente' })
    setAdicionandoRaid(null)
  }

  function removerRaid(id: string) {
    setListaRaid(prev => prev.filter(r => r.id !== id))
  }

  async function salvarRaid() {
    setSalvandoRaid(true)
    const res = await fetch(`/api/iniciativas/${ini.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lista_raid: listaRaid }),
    })
    setSalvandoRaid(false)
    setToastRaid(res.ok ? 'RAID salvo!' : 'Erro ao salvar')
    setTimeout(() => setToastRaid(''), 3000)
  }

  async function salvarUpdate() {
    setSalvandoUpdate(true)
    const res = await fetch(`/api/iniciativas/${ini.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ update_periodo: updatePeriodo }),
    })
    setSalvandoUpdate(false)
    setToastUpdate(res.ok ? 'Update salvo!' : 'Erro ao salvar')
    setTimeout(() => setToastUpdate(''), 3000)
  }

  const bs = badgeStatus(ini.status)

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="font-mono text-sm text-atrio font-semibold bg-atrio-light px-2 py-0.5 rounded">
              {ini.protocolo}
            </span>
            <Badge texto={bs.texto} variante={bs.variante} />
          </div>
          <h1 className="text-xl font-bold text-gray-900">{ini.titulo}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{ini.area} · {ini.tipo_iniciativa}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-atrio">{(ini.score ?? 0).toFixed(1)}</p>
          <p className="text-xs text-gray-500">Score</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Coluna principal */}
        <div className="flex-1 min-w-0">
          {/* Abas */}
          <div className="flex overflow-x-auto gap-1 mb-4 pb-1">
            {ABAS.map((a, i) => (
              <button
                key={a}
                onClick={() => setAba(i)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  aba === i ? 'bg-atrio text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-atrio'
                }`}
              >
                {a}
              </button>
            ))}
          </div>

          <div className="card p-6">
            {/* 0 — Identificação */}
            {aba === 0 && (
              <dl className="space-y-4">
                {([
                  ['Título', ini.titulo],
                  ['Área', ini.area],
                  ['Tipo', ini.tipo_iniciativa],
                  ['Patrocinador', ini.patrocinador],
                  ['Responsável', ini.responsavel_nome],
                  ['E-mail', ini.responsavel_email],
                ] as [string, string][]).map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{k}</dt>
                    <dd className="text-gray-900 mt-0.5">{v}</dd>
                  </div>
                ))}
              </dl>
            )}

            {/* 1 — Problema e Valor */}
            {aba === 1 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Problema</h3>
                  <p className="text-gray-900 whitespace-pre-line">{ini.problema}</p>
                </div>
                <div>
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Valor esperado</h3>
                  <p className="text-gray-900 whitespace-pre-line">{ini.valor_esperado}</p>
                </div>
                <div>
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Beneficiários</h3>
                  <div className="flex flex-wrap gap-1">
                    {(ini.beneficiarios ?? []).map(b => (
                      <span key={b} className="px-2 py-1 bg-atrio-light text-atrio text-xs rounded-full">{b}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2 — Custos */}
            {aba === 2 && (
              perfil === 'gestor' ? (
                <div className="space-y-4">
                  <div>
                    <label className="label-base">Custo estimado total (R$)</label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">R$</span>
                      <input type="number" step="0.01" min="0" className="input-base pl-8" placeholder="0,00"
                        value={custoEstimado} onChange={e => setCustoEstimado(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="label-base">Detalhamento dos custos</label>
                    <textarea rows={5} className="input-base resize-none mt-1"
                      placeholder="Ex: R$ 15k consultoria, R$ 5k licença de software..."
                      value={detalhamentoCustos} onChange={e => setDetalhamentoCustos(e.target.value)} />
                  </div>
                  {toastCustos && (
                    <p className={`text-sm ${toastCustos.includes('salvo') ? 'text-green-600' : 'text-red-600'}`}>{toastCustos}</p>
                  )}
                  <button type="button" onClick={salvarCustos} disabled={salvandoCustos} className="btn-primary px-6">
                    {salvandoCustos ? 'Salvando...' : 'Salvar custos'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Custo estimado total</dt>
                    <dd className="text-gray-900 mt-0.5">{ini.custo_estimado ? formatBRL(ini.custo_estimado) : 'Não informado'}</dd>
                  </div>
                  {ini.detalhamento_custos && (
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Detalhamento</dt>
                      <dd className="text-gray-900 mt-0.5 whitespace-pre-line">{ini.detalhamento_custos}</dd>
                    </div>
                  )}
                </div>
              )
            )}

            {/* 3 — Escopo */}
            {aba === 3 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Entregas esperadas</h3>
                  <p className="text-gray-900 whitespace-pre-line">{ini.entregas}</p>
                </div>
                <div>
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Fora do escopo</h3>
                  <p className="text-gray-900 whitespace-pre-line">{ini.fora_escopo}</p>
                </div>
              </div>
            )}

            {/* 4 — Cronograma */}
            {aba === 4 && (
              <dl className="space-y-4">
                {([
                  ['Data de início prevista', ini.data_inicio_prevista ? new Date(ini.data_inicio_prevista + 'T00:00:00').toLocaleDateString('pt-BR') : '—'],
                  ['Data de término prevista', ini.data_fim_prevista ? new Date(ini.data_fim_prevista + 'T00:00:00').toLocaleDateString('pt-BR') : '—'],
                ] as [string, string][]).map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{k}</dt>
                    <dd className="text-gray-900 mt-0.5">{v}</dd>
                  </div>
                ))}
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Dependências críticas</dt>
                  <dd className="text-gray-900 mt-0.5 whitespace-pre-line">{ini.dependencias}</dd>
                </div>
              </dl>
            )}

            {/* 5 — Recursos */}
            {aba === 5 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Equipe executora</h3>
                  <p className="text-gray-900 whitespace-pre-line">{ini.equipe}</p>
                </div>
                {ini.tem_terceiros && (
                  <div>
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Terceiros envolvidos</h3>
                    <p className="text-gray-900 whitespace-pre-line">{ini.terceiros}</p>
                  </div>
                )}
              </div>
            )}

            {/* 6 — Riscos (do formulário) */}
            {aba === 6 && (
              <div className="space-y-4">
                {(ini.riscos ?? []).map((r, i) => {
                  const cores: Record<string, string> = {
                    'Crítico': 'bg-red-900 text-white',
                    'Alto': 'bg-red-100 text-red-800',
                    'Médio': 'bg-orange-100 text-orange-800',
                    'Baixo-Médio': 'bg-yellow-100 text-yellow-800',
                    'Baixo': 'bg-green-100 text-green-800',
                  }
                  return (
                    <div key={i} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-gray-900">{r.descricao}</p>
                        {r.nivel && (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${cores[r.nivel] ?? 'bg-gray-100'}`}>
                            {r.nivel}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-4 mt-2 text-xs text-gray-500">
                        <span>Probabilidade: {['', 'Baixa', 'Média', 'Alta'][parseInt(r.probabilidade)] ?? r.probabilidade}</span>
                        <span>Impacto: {['', 'Baixo', 'Médio', 'Alto'][parseInt(r.impacto)] ?? r.impacto}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* 7 — EAP */}
            {aba === 7 && (
              <div>
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Atividades</h3>
                <p className="text-gray-900 whitespace-pre-line">{ini.eap}</p>
              </div>
            )}

            {/* 8 — Entregas (tracking) */}
            {aba === 8 && (
              <div>
                {listaEntregas.length > 0 && (
                  <div className="mb-5">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progresso das entregas</span>
                      <span className="font-medium">{entregasConcluidas}/{listaEntregas.length} ({progressoEntregas}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${progressoEntregas}%` }} />
                    </div>
                  </div>
                )}

                <div className="space-y-2 mb-4">
                  {listaEntregas.length === 0 && (
                    <p className="text-sm text-gray-400 py-2">Nenhuma entrega cadastrada.</p>
                  )}
                  {listaEntregas.map((e, i) => (
                    <div key={e.id} className={`flex items-start gap-3 p-3 border rounded-lg transition-colors ${e.concluida ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-200'}`}>
                      <input
                        type="checkbox"
                        checked={e.concluida}
                        onChange={() => toggleEntrega(i)}
                        className="mt-0.5 w-4 h-4 accent-blue-600 cursor-pointer flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${e.concluida ? 'line-through text-gray-400' : 'text-gray-900'}`}>{e.descricao}</p>
                        {e.responsavel && <p className="text-xs text-gray-400 mt-0.5">Resp: {e.responsavel}</p>}
                      </div>
                      {perfil === 'gestor' && (
                        <button onClick={() => removerEntrega(i)} className="text-gray-300 hover:text-red-400 text-xs flex-shrink-0 transition-colors">✕</button>
                      )}
                    </div>
                  ))}
                </div>

                {perfil === 'gestor' && (
                  <div className="border border-dashed border-gray-200 rounded-lg p-3 space-y-2 bg-gray-50">
                    <input
                      type="text"
                      placeholder="Descrição da entrega"
                      className="input-base text-sm"
                      value={novaEntrega.descricao}
                      onChange={e => setNovaEntrega(prev => ({ ...prev, descricao: e.target.value }))}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); adicionarEntrega() } }}
                    />
                    <input
                      type="text"
                      placeholder="Responsável (opcional)"
                      className="input-base text-sm"
                      value={novaEntrega.responsavel}
                      onChange={e => setNovaEntrega(prev => ({ ...prev, responsavel: e.target.value }))}
                    />
                    <button type="button" onClick={adicionarEntrega} disabled={!novaEntrega.descricao.trim()} className="btn-secondary text-sm px-4 py-1.5">
                      + Adicionar entrega
                    </button>
                  </div>
                )}

                {toastEntregas && (
                  <p className={`text-sm mt-2 ${toastEntregas.includes('salvas') ? 'text-green-600' : 'text-red-600'}`}>{toastEntregas}</p>
                )}
                {perfil === 'gestor' && (
                  <button type="button" onClick={salvarEntregas} disabled={salvandoEntregas} className="btn-primary px-6 mt-4">
                    {salvandoEntregas ? 'Salvando...' : 'Salvar entregas'}
                  </button>
                )}
              </div>
            )}

            {/* 9 — RAID */}
            {aba === 9 && (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(['risco', 'acao', 'impedimento', 'decisao'] as const).map(tipo => {
                    const cfg = RAID_CONFIG[tipo]
                    const items = listaRaid.filter(r => r.tipo === tipo)
                    const adicionando = adicionandoRaid === tipo

                    return (
                      <div key={tipo} className={`border rounded-xl overflow-hidden ${cfg.cor}`}>
                        <div className={`px-3 py-2.5 flex items-center justify-between ${cfg.headerCor}`}>
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                            <span className="text-sm font-semibold">{cfg.titulo}</span>
                            {items.length > 0 && (
                              <span className="text-xs font-medium bg-white/70 px-1.5 rounded-full">{items.length}</span>
                            )}
                          </div>
                          {perfil === 'gestor' && (
                            <button
                              onClick={() => {
                                setAdicionandoRaid(adicionando ? null : tipo)
                                setNovoRaid({ tipo, descricao: '', acao: '', responsavel: '', prazo: '', status: 'Pendente' })
                              }}
                              className="text-xs font-medium hover:opacity-70 transition-opacity"
                            >
                              {adicionando ? '✕' : '+ Adicionar'}
                            </button>
                          )}
                        </div>

                        <div className="p-3 space-y-2">
                          {items.length === 0 && !adicionando && (
                            <p className="text-xs text-gray-400 py-1">Nenhum item cadastrado.</p>
                          )}
                          {items.map(item => (
                            <div key={item.id} className="bg-white rounded-lg p-3 border border-gray-100 text-xs space-y-1 shadow-sm">
                              <p className="text-gray-900 font-medium leading-snug">{item.descricao}</p>
                              {item.acao && <p className="text-gray-500">Ação: {item.acao}</p>}
                              <div className="flex items-center justify-between flex-wrap gap-1 pt-1">
                                <div className="flex gap-2 text-gray-400">
                                  {item.responsavel && <span>Resp: {item.responsavel}</span>}
                                  {item.prazo && <span>Prazo: {new Date(item.prazo + 'T00:00:00').toLocaleDateString('pt-BR')}</span>}
                                </div>
                                <div className="flex items-center gap-2">
                                  {item.status && (
                                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                      item.status === 'Concluída' || item.status === 'Resolvida'
                                        ? 'bg-green-100 text-green-700'
                                        : item.status === 'Em andamento'
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-gray-100 text-gray-600'
                                    }`}>
                                      {item.status}
                                    </span>
                                  )}
                                  {perfil === 'gestor' && (
                                    <button onClick={() => removerRaid(item.id)} className="text-gray-300 hover:text-red-400 transition-colors ml-1">✕</button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}

                          {adicionando && (
                            <div className="bg-white rounded-lg p-3 border border-gray-200 space-y-2 shadow-sm">
                              {cfg.campos.map(campo => (
                                campo.tipo === 'select' ? (
                                  <select
                                    key={campo.key}
                                    className="input-base text-xs"
                                    value={(novoRaid as Record<string, string>)[campo.key] ?? ''}
                                    onChange={e => setNovoRaid(prev => ({ ...prev, [campo.key]: e.target.value }))}
                                  >
                                    {campo.opcoes?.map(o => <option key={o} value={o}>{o}</option>)}
                                  </select>
                                ) : campo.tipo === 'date' ? (
                                  <input key={campo.key} type="date" className="input-base text-xs"
                                    value={(novoRaid as Record<string, string>)[campo.key] ?? ''}
                                    onChange={e => setNovoRaid(prev => ({ ...prev, [campo.key]: e.target.value }))} />
                                ) : (
                                  <input key={campo.key} type="text" placeholder={campo.label} className="input-base text-xs"
                                    value={(novoRaid as Record<string, string>)[campo.key] ?? ''}
                                    onChange={e => setNovoRaid(prev => ({ ...prev, [campo.key]: e.target.value }))} />
                                )
                              ))}
                              <button type="button" onClick={() => adicionarRaid(tipo)} disabled={!novoRaid.descricao?.trim()} className="btn-secondary text-xs px-3 py-1.5">
                                Adicionar
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {toastRaid && (
                  <p className={`text-sm mt-3 ${toastRaid.includes('salvo') ? 'text-green-600' : 'text-red-600'}`}>{toastRaid}</p>
                )}
                {perfil === 'gestor' && (
                  <button type="button" onClick={salvarRaid} disabled={salvandoRaid} className="btn-primary px-6 mt-4">
                    {salvandoRaid ? 'Salvando...' : 'Salvar RAID'}
                  </button>
                )}
              </div>
            )}

            {/* 10 — Update do Período */}
            {aba === 10 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Update quinzenal</h3>
                  <p className="text-xs text-gray-400 mb-3">
                    Status atual, avanços do período, próximos passos e pontos de atenção.
                  </p>
                  {perfil === 'gestor' ? (
                    <textarea
                      rows={8}
                      className="input-base resize-none"
                      placeholder="Ex: Projeto aprovado pelo CFO. Alinhamento inicial com RH realizado. Próximos passos: formalizar movimentação até 09/05 e realizar kick-off na semana de 12/05."
                      value={updatePeriodo}
                      onChange={e => setUpdatePeriodo(e.target.value)}
                    />
                  ) : (
                    <p className="text-gray-900 whitespace-pre-line bg-gray-50 rounded-lg p-4 border border-gray-100 min-h-[100px]">
                      {updatePeriodo || 'Nenhum update registrado.'}
                    </p>
                  )}
                </div>
                {toastUpdate && (
                  <p className={`text-sm ${toastUpdate.includes('salvo') ? 'text-green-600' : 'text-red-600'}`}>{toastUpdate}</p>
                )}
                {perfil === 'gestor' && (
                  <button type="button" onClick={salvarUpdate} disabled={salvandoUpdate} className="btn-primary px-6">
                    {salvandoUpdate ? 'Salvando...' : 'Salvar update'}
                  </button>
                )}
              </div>
            )}

            {/* 11 — Anexos */}
            {aba === 11 && (
              <div>
                {(ini.anexos ?? []).length === 0 ? (
                  <p className="text-gray-500">Nenhum anexo enviado.</p>
                ) : (
                  <ul className="space-y-2">
                    {ini.anexos.map((path, i) => (
                      <AnexoLink key={i} path={path} />
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Coluna lateral — apenas gestor */}
        {perfil === 'gestor' && (
          <div className="w-full lg:w-96 flex-shrink-0 space-y-4 lg:sticky lg:top-4 self-start">
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Scorecard</h3>
              <Scorecard scorecard={scorecard} onSalvar={salvarScorecard} />
            </div>
            <PainelDecisao
              id={ini.id}
              decisaoAtual={ini.decisao ?? undefined}
              onDecisaoSalva={() => setRecarregar(r => r + 1)}
            />
          </div>
        )}
      </div>
    </div>
  )
}
