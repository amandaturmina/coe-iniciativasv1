'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Save, Rocket, CheckCircle2, AlertTriangle,
  ChevronRight, User, Building2, Calendar, FileText,
} from 'lucide-react'

/* ─── tipos ─────────────────────────────────────────────── */
interface ChecklistItem {
  id: string
  label: string
  obrigatorio: boolean
  concluido: boolean
}

interface HistoricoItem {
  ts: string
  user: string
  text: string
}

interface Onboarding {
  id: string
  iniciativa_id: string
  codigo: string | null
  nome: string | null
  tipo: string | null
  area: string | null
  solicitante: string | null
  sponsor: string | null
  urgencia: string | null
  eixo_estrategico: string | null
  problema: string | null
  resultado_esperado: string | null
  beneficio_esperado: string | null
  prazo_desejado: string | null
  custo_estimado: number | null
  parecer_coe: string | null
  score: number | null
  decisao_aprovacao: string | null
  nome_oficial: string | null
  objetivo: string | null
  justificativa: string | null
  escopo: string | null
  fora_escopo: string | null
  areas_impactadas: string[] | null
  sistemas_envolvidos: string | null
  responsavel_coe: string | null
  responsavel_area: string | null
  aprovador_final: string | null
  data_inicio_prevista: string | null
  data_conclusao_prevista: string | null
  indicador_sucesso: string | null
  premissas: string | null
  restricoes: string | null
  checklist: ChecklistItem[]
  historico: HistoricoItem[]
  status: string
  percentual_prontidao: number
  criado_por: string | null
  liberado_por: string | null
  data_liberacao: string | null
}

/* ─── helpers ────────────────────────────────────────────── */
function fmt(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}
function fmtTs(d: string) {
  return new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function fmtMoeda(v: number | null) {
  if (!v) return '—'
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
function iniciais(nome: string) {
  return nome.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

const TABS = ['Origem', 'Termo de Abertura', 'Responsáveis', 'Checklist', 'Histórico'] as const
type Tab = (typeof TABS)[number]

const TIPO_BADGE: Record<string, string> = {
  'Corporativo':   'bg-blue-50 text-blue-700',
  'Setorial':      'bg-[#f8f7f6] text-[#6b6966]',
  'Intersetorial': 'bg-purple-50 text-purple-700',
  'Implantação':   'bg-amber-50 text-amber-700',
  'Cross-company': 'bg-teal-50 text-teal-700',
}
const STATUS_BADGE: Record<string, string> = {
  'Em onboarding': 'bg-[#f5eded] text-[#451a1a]',
  'Aguardando info': 'bg-amber-50 text-amber-700',
  'Liberado': 'bg-green-50 text-green-700',
}

/* ─── componente principal ───────────────────────────────── */
export default function OnboardingDetalhe({
  onboarding: inicial,
  iniciativa,
  nomeUsuario,
}: {
  onboarding: Onboarding
  iniciativa: Record<string, unknown>
  nomeUsuario: string
}) {
  const router = useRouter()
  const [ob,       setOb]       = useState<Onboarding>(inicial)
  const [tab,      setTab]      = useState<Tab>('Origem')
  const [salvando, setSalvando] = useState(false)
  const [modal,    setModal]    = useState(false)
  const [liberando,setLiberando]= useState(false)
  const [toast,    setToast]    = useState<{ msg: string; tipo: 'ok' | 'err' } | null>(null)
  const [erros,    setErros]    = useState<string[]>([])

  function showToast(msg: string, tipo: 'ok' | 'err' = 'ok') {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 3500)
  }

  async function salvar(campos: Partial<Onboarding> & { _acao?: string }) {
    setSalvando(true)
    try {
      const res = await fetch(`/api/onboardings/${ob.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campos),
      })
      const json = await res.json()
      if (!res.ok) { showToast(json.erro ?? 'Erro ao salvar', 'err'); return }
      setOb(json.dados)
      showToast('Salvo com sucesso!')
    } finally {
      setSalvando(false)
    }
  }

  async function liberar() {
    setLiberando(true)
    try {
      const res = await fetch(`/api/onboardings/${ob.id}/liberar`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) {
        setErros(json.pendentes ?? [json.erro])
        setModal(false)
        return
      }
      showToast('Projeto liberado para o Kanban!')
      setTimeout(() => router.push('/acompanhamento'), 1500)
    } finally {
      setLiberando(false)
    }
  }

  const checkObrigPendentes = ob.checklist?.filter(i => i.obrigatorio && !i.concluido) ?? []
  const podeLibertar = checkObrigPendentes.length === 0

  const prontidao = ob.percentual_prontidao ?? 0

  /* ── RENDER ── */
  return (
    <div className="pb-10">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <button
            onClick={() => router.push('/onboarding')}
            className="flex items-center gap-1 text-[12px] text-[#6b6966] hover:text-[#451a1a] mb-2 transition-colors"
          >
            <ArrowLeft size={13} /> Voltar à lista
          </button>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-semibold text-[#c4c2be] uppercase tracking-wider">
              {ob.codigo ?? iniciais(ob.nome ?? '??')}
            </span>
            {ob.tipo && (
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${TIPO_BADGE[ob.tipo] ?? 'bg-[#f8f7f6] text-[#6b6966]'}`}>
                {ob.tipo}
              </span>
            )}
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[ob.status] ?? 'bg-[#f8f7f6] text-[#6b6966]'}`}>
              {ob.status}
            </span>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              prontidao >= 80 ? 'bg-green-50 text-green-700' : prontidao >= 50 ? 'bg-amber-50 text-amber-700' : 'bg-[#fcebeb] text-[#c0392b]'
            }`}>
              {prontidao}% Pronto
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#1a1917] mt-1">{ob.nome}</h1>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => salvar({ _acao: `${nomeUsuario} salvou rascunho` })}
            disabled={salvando}
            className="flex items-center gap-1.5 px-3 py-2 border border-[#ededeb] bg-white rounded-lg text-[12px] text-[#6b6966] hover:border-[#451a1a]/30 hover:text-[#451a1a] transition-colors disabled:opacity-50"
          >
            <Save size={13} /> Salvar rascunho
          </button>
          <div className="relative group">
            <button
              onClick={() => { if (podeLibertar) { setErros([]); setModal(true) } }}
              disabled={!podeLibertar || ob.status === 'Liberado'}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-colors ${
                podeLibertar && ob.status !== 'Liberado'
                  ? 'bg-[#2d7d46] text-white hover:bg-[#246338]'
                  : 'bg-[#ededeb] text-[#c4c2be] cursor-not-allowed'
              }`}
            >
              <Rocket size={13} /> Liberar para Kanban
            </button>
            {!podeLibertar && (
              <div className="absolute right-0 top-full mt-1 bg-[#1a1917] text-white text-[11px] px-2.5 py-1.5 rounded-lg whitespace-nowrap z-10 hidden group-hover:block">
                Complete os itens obrigatórios antes de liberar
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Erros de validação */}
      {erros.length > 0 && (
        <div className="mb-4 bg-[#fcebeb] border border-[#f0baba] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2 text-[#c0392b] font-semibold text-sm">
            <AlertTriangle size={15} /> Itens obrigatórios pendentes:
          </div>
          <ul className="list-disc list-inside space-y-0.5">
            {erros.map(e => <li key={e} className="text-[12px] text-[#c0392b]">{e}</li>)}
          </ul>
        </div>
      )}

      {/* TABS */}
      <div className="border-b border-[#ededeb] mb-6">
        <div className="flex gap-1">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors ${
                tab === t
                  ? 'border-[#451a1a] text-[#451a1a]'
                  : 'border-transparent text-[#6b6966] hover:text-[#1a1917]'
              }`}
            >
              {t}
              {t === 'Checklist' && checkObrigPendentes.length > 0 && (
                <span className="ml-1.5 bg-[#c0392b] text-white text-[9px] px-1.5 py-0.5 rounded-full">
                  {checkObrigPendentes.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── ABA ORIGEM ── */}
      {tab === 'Origem' && <AbaOrigem ob={ob} />}

      {/* ── ABA TERMO ── */}
      {tab === 'Termo de Abertura' && <AbaTermo ob={ob} onSalvar={salvar} salvando={salvando} />}

      {/* ── ABA RESPONSÁVEIS ── */}
      {tab === 'Responsáveis' && <AbaResponsaveis ob={ob} onSalvar={salvar} salvando={salvando} />}

      {/* ── ABA CHECKLIST ── */}
      {tab === 'Checklist' && <AbaChecklist ob={ob} onSalvar={salvar} />}

      {/* ── ABA HISTÓRICO ── */}
      {tab === 'Histórico' && <AbaHistorico ob={ob} />}

      {/* MODAL LIBERAR */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <h2 className="text-[15px] font-bold text-[#1a1917] mb-2">Liberar projeto para o Kanban?</h2>
            <p className="text-[13px] text-[#6b6966] mb-1">
              O projeto entrará na coluna <strong className="text-[#1a1917]">"Em planejamento"</strong> do Kanban.
            </p>
            <p className="text-[12px] text-[#c4c2be] mb-6">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setModal(false)}
                className="flex-1 px-4 py-2 border border-[#ededeb] rounded-lg text-[13px] text-[#6b6966] hover:bg-[#f8f7f6] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={liberar}
                disabled={liberando}
                className="flex-1 px-4 py-2 bg-[#2d7d46] text-white rounded-lg text-[13px] font-medium hover:bg-[#246338] disabled:opacity-60 flex items-center justify-center gap-1.5 transition-colors"
              >
                {liberando ? (
                  <span className="w-3.5 h-3.5 border border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <><CheckCircle2 size={14} /> Confirmar e liberar <ChevronRight size={13} /></>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 text-white text-[13px] px-4 py-2.5 rounded-lg shadow-lg z-50 pointer-events-none ${
          toast.tipo === 'ok' ? 'bg-[#1a1917]' : 'bg-[#c0392b]'
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}

/* ─── ABA ORIGEM ─────────────────────────────────────────── */
function AbaOrigem({ ob }: { ob: Onboarding }) {
  return (
    <div>
      <div className="flex items-center gap-2 bg-[#f8f7f6] border border-[#ededeb] rounded-lg px-4 py-2.5 mb-6 text-[12px] text-[#6b6966]">
        <FileText size={14} className="flex-shrink-0 text-[#c4c2be]" />
        Dados importados automaticamente da iniciativa original. Não editáveis nesta aba.
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Secao titulo="Identificação">
          <Campo label="Código"            valor={ob.codigo} />
          <Campo label="Nome"              valor={ob.nome} />
          <Campo label="Tipo"              valor={ob.tipo} />
          <Campo label="Área"              valor={ob.area} />
          <Campo label="Solicitante"       valor={ob.solicitante} />
          <Campo label="Sponsor"           valor={ob.sponsor} />
          <Campo label="Urgência"          valor={ob.urgencia} />
          <Campo label="Eixo estratégico"  valor={ob.eixo_estrategico} />
        </Secao>
        <Secao titulo="Problema e Valor">
          <CampoBlock label="Problema identificado"  valor={ob.problema} />
          <CampoBlock label="Resultado esperado"     valor={ob.resultado_esperado} />
          <CampoBlock label="Benefício esperado"     valor={ob.beneficio_esperado} />
          <Campo label="Prazo desejado"              valor={ob.prazo_desejado ? new Date(ob.prazo_desejado).toLocaleDateString('pt-BR') : null} />
          <Campo label="Custo estimado"              valor={ob.custo_estimado ? ob.custo_estimado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : null} />
        </Secao>
        <Secao titulo="Decisão do COE" className="lg:col-span-2">
          <div className="grid grid-cols-3 gap-4">
            <Campo label="Decisão" valor={ob.decisao_aprovacao} />
            {ob.score !== null && (
              <div>
                <p className="text-[10px] text-[#6b6966] mb-1">Score de priorização</p>
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-semibold text-[#1a1917]">{ob.score?.toFixed(1)}</span>
                  <div className="flex-1 h-1.5 bg-[#ededeb] rounded-full overflow-hidden">
                    <div className="h-full bg-[#451a1a] rounded-full" style={{ width: `${Math.min((ob.score ?? 0) / 5 * 100, 100)}%` }} />
                  </div>
                </div>
              </div>
            )}
          </div>
          {ob.parecer_coe && <CampoBlock label="Parecer do COE" valor={ob.parecer_coe} />}
        </Secao>
      </div>
    </div>
  )
}

/* ─── ABA TERMO ──────────────────────────────────────────── */
function AbaTermo({
  ob, onSalvar, salvando,
}: {
  ob: Onboarding
  onSalvar: (campos: Partial<Onboarding> & { _acao?: string }) => Promise<void>
  salvando: boolean
}) {
  const [form, setForm] = useState({
    nome_oficial:            ob.nome_oficial ?? '',
    objetivo:                ob.objetivo ?? '',
    justificativa:           ob.justificativa ?? '',
    escopo:                  ob.escopo ?? '',
    fora_escopo:             ob.fora_escopo ?? '',
    areas_impactadas:        (ob.areas_impactadas ?? []).join(', '),
    sistemas_envolvidos:     ob.sistemas_envolvidos ?? '',
    data_inicio_prevista:    ob.data_inicio_prevista ?? '',
    data_conclusao_prevista: ob.data_conclusao_prevista ?? '',
    indicador_sucesso:       ob.indicador_sucesso ?? '',
    premissas:               ob.premissas ?? '',
    restricoes:              ob.restricoes ?? '',
  })

  function set(k: keyof typeof form, v: string) {
    setForm(f => ({ ...f, [k]: v }))
  }

  async function handleSalvar() {
    const areas = form.areas_impactadas
      ? form.areas_impactadas.split(',').map(a => a.trim()).filter(Boolean)
      : []
    await onSalvar({
      ...form,
      areas_impactadas: areas,
      _acao: `${ob.solicitante ?? 'Usuário'} preencheu o Termo de Abertura`,
    } as Partial<Onboarding> & { _acao: string })
  }

  return (
    <div className="space-y-8">
      <Secao titulo="Identificação oficial">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="lg:col-span-2">
            <Label>Nome oficial do projeto <Req /></Label>
            <input value={form.nome_oficial} onChange={e => set('nome_oficial', e.target.value)}
              className="input-field" placeholder="Nome oficial conforme será registrado" />
          </div>
          <div className="lg:col-span-2">
            <Label>Objetivo <Req /></Label>
            <textarea value={form.objetivo} onChange={e => set('objetivo', e.target.value)} rows={3}
              className="input-field resize-none" placeholder="Descreva o objetivo principal do projeto" />
          </div>
          <div className="lg:col-span-2">
            <Label>Justificativa</Label>
            <textarea value={form.justificativa} onChange={e => set('justificativa', e.target.value)} rows={2}
              className="input-field resize-none" placeholder="Por que este projeto deve ser realizado?" />
          </div>
        </div>
      </Secao>

      <Secao titulo="Escopo">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <Label>Escopo do projeto <Req /></Label>
            <textarea value={form.escopo} onChange={e => set('escopo', e.target.value)} rows={3}
              className="input-field resize-none" placeholder="O que está incluso no projeto?" />
          </div>
          <div>
            <Label>Fora de escopo</Label>
            <textarea value={form.fora_escopo} onChange={e => set('fora_escopo', e.target.value)} rows={3}
              className="input-field resize-none" placeholder="O que explicitamente não faz parte?" />
          </div>
          <div>
            <Label>Áreas impactadas</Label>
            <input value={form.areas_impactadas} onChange={e => set('areas_impactadas', e.target.value)}
              className="input-field" placeholder="Financeiro, TI, RH (separar por vírgula)" />
          </div>
          <div>
            <Label>Sistemas envolvidos</Label>
            <textarea value={form.sistemas_envolvidos} onChange={e => set('sistemas_envolvidos', e.target.value)} rows={3}
              className="input-field resize-none" placeholder="SAP, Senior, Bankplus..." />
          </div>
        </div>
      </Secao>

      <Secao titulo="Datas">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Data prevista de início <Req /></Label>
            <input type="date" value={form.data_inicio_prevista} onChange={e => set('data_inicio_prevista', e.target.value)}
              className="input-field" />
          </div>
          <div>
            <Label>Data prevista de conclusão <Req /></Label>
            <input type="date" value={form.data_conclusao_prevista} onChange={e => set('data_conclusao_prevista', e.target.value)}
              className="input-field" />
          </div>
        </div>
      </Secao>

      <Secao titulo="Resultados">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label>Indicador de sucesso <Req /></Label>
            <textarea value={form.indicador_sucesso} onChange={e => set('indicador_sucesso', e.target.value)} rows={2}
              className="input-field resize-none" placeholder="Como saberemos que o projeto foi bem-sucedido?" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Premissas</Label>
              <textarea value={form.premissas} onChange={e => set('premissas', e.target.value)} rows={3}
                className="input-field resize-none" placeholder="O que assumimos como verdadeiro..." />
            </div>
            <div>
              <Label>Restrições</Label>
              <textarea value={form.restricoes} onChange={e => set('restricoes', e.target.value)} rows={3}
                className="input-field resize-none" placeholder="Limitações conhecidas..." />
            </div>
          </div>
        </div>
      </Secao>

      <div className="flex justify-end pt-2">
        <button
          onClick={handleSalvar}
          disabled={salvando}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#451a1a] text-white text-[13px] font-medium rounded-lg hover:bg-[#5c2222] disabled:opacity-60 transition-colors"
        >
          {salvando ? <span className="w-3.5 h-3.5 border border-white/40 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
          Salvar
        </button>
      </div>

      <style>{`.input-field { width:100%; padding:8px 12px; border:1px solid #ededeb; border-radius:6px; font-size:13px; color:#1a1917; background:white; outline:none; } .input-field:focus { border-color:#451a1a; }`}</style>
    </div>
  )
}

/* ─── ABA RESPONSÁVEIS ───────────────────────────────────── */
function AbaResponsaveis({
  ob, onSalvar, salvando,
}: {
  ob: Onboarding
  onSalvar: (campos: Partial<Onboarding> & { _acao?: string }) => Promise<void>
  salvando: boolean
}) {
  const [form, setForm] = useState({
    sponsor:          ob.sponsor ?? '',
    responsavel_coe:  ob.responsavel_coe ?? '',
    responsavel_area: ob.responsavel_area ?? '',
    aprovador_final:  ob.aprovador_final ?? '',
  })

  const papeis = [
    { key: 'sponsor',          label: 'Sponsor',           obr: true },
    { key: 'responsavel_coe',  label: 'Responsável COE',   obr: true },
    { key: 'responsavel_area', label: 'Responsável da área', obr: true },
    { key: 'aprovador_final',  label: 'Aprovador final',   obr: false },
  ] as const

  async function handleSalvar() {
    await onSalvar({
      ...form,
      _acao: `${ob.solicitante ?? 'Usuário'} atualizou os responsáveis do projeto`,
    } as Partial<Onboarding> & { _acao: string })
  }

  return (
    <div>
      <div className="bg-white border border-[#ededeb] rounded-lg overflow-hidden mb-6">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#ededeb] bg-[#f8f7f6]">
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#6b6966] uppercase tracking-wide w-48">Papel</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#6b6966] uppercase tracking-wide">Responsável</th>
            </tr>
          </thead>
          <tbody>
            {papeis.map(({ key, label, obr }) => (
              <tr key={key} className="border-b border-[#ededeb] last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <User size={13} className="text-[#c4c2be] flex-shrink-0" />
                    <span className="text-[13px] text-[#1a1917]">{label}</span>
                    {obr && <span className="text-[#c0392b] text-[10px]">*</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <input
                    value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full max-w-sm px-3 py-1.5 border border-[#ededeb] rounded-lg text-[13px] text-[#1a1917] outline-none focus:border-[#451a1a]"
                    placeholder={`Nome do ${label.toLowerCase()}...`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end">
        <button
          onClick={handleSalvar}
          disabled={salvando}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#451a1a] text-white text-[13px] font-medium rounded-lg hover:bg-[#5c2222] disabled:opacity-60 transition-colors"
        >
          {salvando ? <span className="w-3.5 h-3.5 border border-white/40 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
          Salvar responsáveis
        </button>
      </div>
    </div>
  )
}

/* ─── ABA CHECKLIST ──────────────────────────────────────── */
function AbaChecklist({
  ob, onSalvar,
}: {
  ob: Onboarding
  onSalvar: (campos: Partial<Onboarding> & { _acao?: string }) => Promise<void>
}) {
  const [lista, setLista] = useState<ChecklistItem[]>(ob.checklist ?? [])
  const [salvandoItem, setSalvandoItem] = useState<string | null>(null)

  const concluidos = lista.filter(i => i.concluido).length
  const total      = lista.length
  const obrigPend  = lista.filter(i => i.obrigatorio && !i.concluido).length
  const pct        = total > 0 ? Math.round((concluidos / total) * 100) : 0

  async function toggleItem(id: string) {
    const nova = lista.map(i => i.id === id ? { ...i, concluido: !i.concluido } : i)
    setLista(nova)
    setSalvandoItem(id)
    const item = nova.find(i => i.id === id)!
    await onSalvar({
      checklist: nova,
      _acao: `${item.concluido ? '✓' : '✗'} ${item.label}`,
    } as Partial<Onboarding> & { _acao: string })
    setSalvandoItem(null)
  }

  return (
    <div>
      {/* Barra de prontidão */}
      <div className="bg-white border border-[#ededeb] rounded-lg p-4 mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px] font-medium text-[#1a1917]">Prontidão: {concluidos}/{total} itens concluídos</span>
          <span className={`text-[13px] font-semibold ${pct >= 80 ? 'text-[#2d7d46]' : pct >= 50 ? 'text-amber-600' : 'text-[#c0392b]'}`}>
            {pct}%
          </span>
        </div>
        <div className="h-2 bg-[#ededeb] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${pct >= 80 ? 'bg-[#2d7d46]' : pct >= 50 ? 'bg-amber-500' : 'bg-[#c0392b]'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {obrigPend > 0 && (
        <div className="flex items-center gap-2 bg-[#fef9ec] border border-[#f0d99a] rounded-lg px-4 py-2.5 mb-5 text-[12px] text-amber-700">
          <AlertTriangle size={14} className="flex-shrink-0" />
          {obrigPend} item{obrigPend !== 1 ? 's' : ''} obrigatório{obrigPend !== 1 ? 's' : ''} pendente{obrigPend !== 1 ? 's' : ''}. Preencha para liberar o projeto.
        </div>
      )}

      {/* Lista */}
      <div className="bg-white border border-[#ededeb] rounded-lg overflow-hidden">
        {lista.map((item, idx) => (
          <div
            key={item.id}
            className={`flex items-center gap-3 px-4 py-3 ${idx < lista.length - 1 ? 'border-b border-[#ededeb]' : ''} ${
              item.obrigatorio && !item.concluido ? 'bg-[#fefaf8]' : ''
            }`}
          >
            <button
              onClick={() => toggleItem(item.id)}
              disabled={salvandoItem === item.id}
              className={`w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors ${
                item.concluido
                  ? 'bg-[#2d7d46] border-[#2d7d46]'
                  : item.obrigatorio
                    ? 'border-[#c0392b] hover:border-[#2d7d46]'
                    : 'border-[#c4c2be] hover:border-[#451a1a]'
              }`}
            >
              {salvandoItem === item.id
                ? <span className="w-2.5 h-2.5 border border-white/40 border-t-white rounded-full animate-spin" />
                : item.concluido
                  ? <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  : null
              }
            </button>
            <span className={`flex-1 text-[13px] ${
              item.concluido ? 'text-[#6b6966] line-through' : item.obrigatorio ? 'text-[#1a1917]' : 'text-[#6b6966]'
            }`}>
              {item.label}
            </span>
            {item.obrigatorio && !item.concluido && (
              <span className="text-[9px] font-semibold text-[#c0392b] uppercase tracking-wide bg-[#fcebeb] px-2 py-0.5 rounded">
                Obrigatório
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── ABA HISTÓRICO ──────────────────────────────────────── */
function AbaHistorico({ ob }: { ob: Onboarding }) {
  const historico = [...(ob.historico ?? [])].reverse()

  if (historico.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#f5eded] flex items-center justify-center mb-3">
          <Calendar size={22} className="text-[#c4c2be]" />
        </div>
        <p className="text-[#1a1917] font-semibold text-sm mb-1">Nenhuma ação registrada ainda</p>
        <p className="text-[#6b6966] text-xs">As ações aparecerão aqui conforme o onboarding avançar.</p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {historico.map((item, idx) => (
        <div key={idx} className="flex gap-3 py-3 border-b border-[#ededeb] last:border-0">
          <div className="w-7 h-7 rounded-full bg-[#451a1a] flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-white text-[10px] font-medium">{iniciais(item.user)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] text-[#1a1917]">{item.text}</p>
            <p className="text-[11px] text-[#c4c2be] mt-0.5">{fmtTs(item.ts)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── sub-componentes utilitários ────────────────────────── */
function Secao({ titulo, children, className = '' }: { titulo: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <h3 className="text-[11px] font-semibold text-[#6b6966] uppercase tracking-wide mb-3">{titulo}</h3>
      <div className="bg-white border border-[#ededeb] rounded-lg p-4 space-y-3">{children}</div>
    </div>
  )
}
function Campo({ label, valor }: { label: string; valor: string | null | undefined }) {
  return (
    <div>
      <p className="text-[10px] text-[#c4c2be] mb-0.5">{label}</p>
      <p className="text-[13px] text-[#1a1917] font-medium">{valor || '—'}</p>
    </div>
  )
}
function CampoBlock({ label, valor }: { label: string; valor: string | null | undefined }) {
  return (
    <div>
      <p className="text-[10px] text-[#c4c2be] mb-1">{label}</p>
      <p className="text-[13px] text-[#1a1917] bg-[#f8f7f6] rounded px-3 py-2 leading-relaxed">{valor || '—'}</p>
    </div>
  )
}
function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-[11px] text-[#6b6966] mb-1">{children}</label>
}
function Req() { return <span className="text-[#c0392b] ml-0.5">*</span> }
