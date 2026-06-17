'use client'

import { useState, useEffect } from 'react'
import { redirect } from 'next/navigation'
import LayoutProtegido from '@/components/LayoutProtegido'
import { Plus, Search, ChevronDown, Save, X, Link2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface MetaIndicador {
  id: string
  indicador: string
  meta_base: number | null
  super_meta: number | null
  mes_1_label: string
  mes_1_valor: number | null
  mes_2_label: string
  mes_2_valor: number | null
  mes_3_label: string
  mes_3_valor: number | null
}

interface MetaProjetoVinculado {
  id: string
  mes: string
  projeto_id: string
  nome_projeto: string
  descricao: string
  saving_mensal: number | null
  fte: number | null
}

const INDICADORES_PADRAO = [
  { indicador: 'Saving Mensal R$', mes_1_label: 'Abr', mes_2_label: 'Mai', mes_3_label: 'Jun' },
  { indicador: 'FTE Liberado',     mes_1_label: 'Abr', mes_2_label: 'Mai', mes_3_label: 'Jun' },
  { indicador: 'Saving Realizado', mes_1_label: 'Abr', mes_2_label: 'Mai', mes_3_label: 'Jun' },
  { indicador: 'FTE Realizado',    mes_1_label: 'Abr', mes_2_label: 'Mai', mes_3_label: 'Jun' },
]

const TRIMESTRES = ['Q1', 'Q2', 'Q3', 'Q4']

function fmt(v: number | null | undefined) {
  if (v == null) return '—'
  return v.toLocaleString('pt-BR')
}

function EditableCell({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  const [editing, setEditing] = useState(false)
  const [local, setLocal] = useState(value?.toString() ?? '')

  function commit() {
    setEditing(false)
    onChange(local ? parseFloat(local) : null)
  }

  if (editing) {
    return (
      <input
        type="number"
        className="w-full text-xs border border-[#451a1a]/40 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-[#451a1a]/30"
        value={local}
        onChange={e => setLocal(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
        autoFocus
      />
    )
  }

  return (
    <button
      onClick={() => { setLocal(value?.toString() ?? ''); setEditing(true) }}
      className="w-full text-left text-xs px-1.5 py-1 rounded hover:bg-[#f5eded] hover:text-[#451a1a] transition-colors"
    >
      {fmt(value)}
    </button>
  )
}

export default function MetasPage() {
  const [trimestre, setTrimestre] = useState('Q2')
  const [indicadores, setIndicadores] = useState<MetaIndicador[]>([])
  const [projetos, setProjetos] = useState<MetaProjetoVinculado[]>([])
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [showModalProjeto, setShowModalProjeto] = useState(false)
  const [novoProjeto, setNovoProjeto] = useState({ mes: '', projeto_id: '', nome_projeto: '', descricao: '', saving_mensal: '', fte: '' })
  const [projetosDisponiveis, setProjetosDisponiveis] = useState<{ id: string; protocolo: string; titulo: string }[]>([])

  useEffect(() => {
    async function carregar() {
      setCarregando(true)
      const res = await fetch(`/api/metas?trimestre=${trimestre}&ano=2026`)
      if (res.ok) {
        const json = await res.json()
        setIndicadores(json.indicadores ?? [])
        setProjetos(json.projetos ?? [])
      } else {
        // Inicializar com padrões vazios se não existirem ainda
        setIndicadores(INDICADORES_PADRAO.map((p, i) => ({
          id: `novo-${i}`,
          ...p,
          meta_base: null,
          super_meta: null,
          mes_1_valor: null,
          mes_2_valor: null,
          mes_3_valor: null,
        })))
        setProjetos([])
      }

      const resIni = await fetch('/api/iniciativas?status=Em andamento,Em planejamento,Concluída')
      const jsonIni = await resIni.json()
      setProjetosDisponiveis(jsonIni.dados?.map((i: { id: string; protocolo: string; titulo: string }) => ({
        id: i.id, protocolo: i.protocolo, titulo: i.titulo
      })) ?? [])

      setCarregando(false)
    }
    carregar()
  }, [trimestre])

  function updateIndicador(idx: number, field: string, value: number | null) {
    setIndicadores(prev => prev.map((ind, i) => i === idx ? { ...ind, [field]: value } : ind))
  }

  async function salvar() {
    setSalvando(true)
    await fetch('/api/metas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trimestre, ano: 2026, indicadores, projetos }),
    })
    setSalvando(false)
  }

  async function vincularProjeto() {
    const novo: MetaProjetoVinculado = {
      id: crypto.randomUUID(),
      mes: novoProjeto.mes,
      projeto_id: novoProjeto.projeto_id,
      nome_projeto: novoProjeto.nome_projeto,
      descricao: novoProjeto.descricao,
      saving_mensal: novoProjeto.saving_mensal ? parseFloat(novoProjeto.saving_mensal) : null,
      fte: novoProjeto.fte ? parseFloat(novoProjeto.fte) : null,
    }
    setProjetos(prev => [...prev, novo])
    setNovoProjeto({ mes: '', projeto_id: '', nome_projeto: '', descricao: '', saving_mensal: '', fte: '' })
    setShowModalProjeto(false)
  }

  const [perfil, setPerfil] = useState('')
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { window.location.href = '/login'; return }
      const { data } = await supabase.from('profiles').select('perfil').eq('id', user.id).single()
      if (!['gestor', 'lideranca'].includes(data?.perfil ?? '')) window.location.href = '/dashboard'
      setPerfil(data?.perfil ?? '')
    })
  }, [])

  if (!perfil) return null

  return (
    <LayoutProtegido>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#1a1917]">Metas e Acompanhamento</h1>
            <p className="text-[#6b6966] text-sm mt-0.5">Indicadores de desempenho e metas do período</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-[#ededeb] overflow-hidden bg-white">
              {TRIMESTRES.map(t => (
                <button
                  key={t}
                  onClick={() => setTrimestre(t)}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${trimestre === t ? 'bg-[#451a1a] text-white' : 'text-[#6b6966] hover:bg-[#f8f7f6]'}`}
                >
                  {t}
                </button>
              ))}
            </div>
            <button onClick={salvar} disabled={salvando} className="btn-primary flex items-center gap-2 text-sm">
              <Save size={14} />
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>

        {carregando ? (
          <div className="h-40 bg-white rounded-xl border border-[#ededeb] animate-pulse" />
        ) : (
          <>
            {/* Tabela de indicadores */}
            <div className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-[#ededeb]">
                <h2 className="font-semibold text-[#1a1917]">Indicadores — {trimestre} 2026</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#ededeb] bg-[#f8f7f6]">
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-[#6b6966] uppercase tracking-wide">Indicador</th>
                      {indicadores[0] && (
                        <>
                          <th className="text-center px-3 py-2.5 text-xs font-semibold text-[#6b6966]">{indicadores[0].mes_1_label}</th>
                          <th className="text-center px-3 py-2.5 text-xs font-semibold text-[#6b6966]">{indicadores[0].mes_2_label}</th>
                          <th className="text-center px-3 py-2.5 text-xs font-semibold text-[#6b6966]">{indicadores[0].mes_3_label}</th>
                        </>
                      )}
                      <th className="text-center px-3 py-2.5 text-xs font-semibold text-[#6b6966]">Meta Base</th>
                      <th className="text-center px-3 py-2.5 text-xs font-semibold text-[#6b6966]">Super Meta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {indicadores.map((ind, idx) => (
                      <tr key={ind.id} className="border-b border-[#ededeb] hover:bg-[#f8f7f6] transition-colors">
                        <td className="px-4 py-2.5 font-medium text-[#1a1917] text-sm">{ind.indicador}</td>
                        <td className="px-3 py-2">
                          <EditableCell value={ind.mes_1_valor} onChange={v => updateIndicador(idx, 'mes_1_valor', v)} />
                        </td>
                        <td className="px-3 py-2">
                          <EditableCell value={ind.mes_2_valor} onChange={v => updateIndicador(idx, 'mes_2_valor', v)} />
                        </td>
                        <td className="px-3 py-2">
                          <EditableCell value={ind.mes_3_valor} onChange={v => updateIndicador(idx, 'mes_3_valor', v)} />
                        </td>
                        <td className="px-3 py-2">
                          {ind.indicador.includes('Realizado') ? (
                            <span className="text-xs text-[#6b6966] px-1.5">—</span>
                          ) : (
                            <EditableCell value={ind.meta_base} onChange={v => updateIndicador(idx, 'meta_base', v)} />
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {ind.indicador.includes('Realizado') ? (
                            <span className="text-xs text-[#6b6966] px-1.5">—</span>
                          ) : (
                            <EditableCell value={ind.super_meta} onChange={v => updateIndicador(idx, 'super_meta', v)} />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Projetos vinculados */}
            <div className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-[#ededeb] flex items-center justify-between">
                <h2 className="font-semibold text-[#1a1917]">Projetos Vinculados</h2>
                <button
                  onClick={() => setShowModalProjeto(true)}
                  className="flex items-center gap-1.5 text-sm text-[#451a1a] bg-[#f5eded] hover:bg-[#ededeb] px-3 py-1.5 rounded-lg font-medium transition-colors"
                >
                  <Link2 size={13} />
                  + Vincular projeto
                </button>
              </div>
              {projetos.length === 0 ? (
                <div className="p-8 text-center text-[#6b6966] text-sm">
                  Nenhum projeto vinculado. Clique em "Vincular projeto" para adicionar.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#ededeb] bg-[#f8f7f6]">
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-[#6b6966] uppercase tracking-wide">Mês</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-[#6b6966]">ID</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-[#6b6966]">Nome do Projeto</th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold text-[#6b6966]">Saving R$/mês</th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold text-[#6b6966]">FTE</th>
                        <th className="px-2 py-2.5" />
                      </tr>
                    </thead>
                    <tbody>
                      {projetos.map(p => (
                        <tr key={p.id} className="border-b border-[#ededeb] hover:bg-[#f8f7f6]">
                          <td className="px-4 py-3 text-[#6b6966] text-xs">{p.mes}</td>
                          <td className="px-4 py-3 font-mono text-xs text-[#451a1a]">{p.projeto_id}</td>
                          <td className="px-4 py-3 text-[#1a1917]">{p.nome_projeto}</td>
                          <td className="px-4 py-3 text-right text-[#2d7d46] font-medium">
                            {p.saving_mensal ? `R$ ${p.saving_mensal.toLocaleString('pt-BR')}` : '—'}
                          </td>
                          <td className="px-4 py-3 text-right text-[#6b6966]">{p.fte ?? '—'}</td>
                          <td className="px-2 py-3">
                            <button onClick={() => setProjetos(prev => prev.filter(x => x.id !== p.id))} className="text-[#6b6966] hover:text-[#c0392b]">
                              <X size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modal vincular projeto */}
      {showModalProjeto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[#1a1917]">Vincular Projeto</h3>
              <button onClick={() => setShowModalProjeto(false)} className="text-[#6b6966] hover:text-[#1a1917]"><X size={18} /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="label-base">Mês (ex: 04/2026)</label>
                <input className="input-base" placeholder="MM/AAAA" value={novoProjeto.mes} onChange={e => setNovoProjeto(v => ({ ...v, mes: e.target.value }))} />
              </div>
              <div>
                <label className="label-base">Projeto</label>
                <select className="input-base" value={novoProjeto.projeto_id} onChange={e => {
                  const p = projetosDisponiveis.find(x => x.id === e.target.value)
                  setNovoProjeto(v => ({ ...v, projeto_id: e.target.value, nome_projeto: p?.titulo ?? '' }))
                }}>
                  <option value="">Selecione...</option>
                  {projetosDisponiveis.map(p => <option key={p.id} value={p.id}>{p.protocolo} — {p.titulo}</option>)}
                </select>
              </div>
              <div>
                <label className="label-base">Descrição</label>
                <input className="input-base" placeholder="Descrição curta" value={novoProjeto.descricao} onChange={e => setNovoProjeto(v => ({ ...v, descricao: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-base">Saving R$/mês</label>
                  <input type="number" className="input-base" placeholder="0" value={novoProjeto.saving_mensal} onChange={e => setNovoProjeto(v => ({ ...v, saving_mensal: e.target.value }))} />
                </div>
                <div>
                  <label className="label-base">FTE</label>
                  <input type="number" className="input-base" placeholder="0" step="0.1" value={novoProjeto.fte} onChange={e => setNovoProjeto(v => ({ ...v, fte: e.target.value }))} />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={vincularProjeto} disabled={!novoProjeto.projeto_id} className="btn-primary flex-1">Vincular</button>
              <button onClick={() => setShowModalProjeto(false)} className="btn-secondary px-4">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </LayoutProtegido>
  )
}
