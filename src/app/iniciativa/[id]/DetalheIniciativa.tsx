'use client'

import { useState } from 'react'
import Badge, { badgeStatus } from '@/components/Badge'
import Scorecard, { DIMENSOES_PADRAO } from '@/components/Scorecard'
import PainelDecisao from '@/components/PainelDecisao'
import { createClient } from '@/lib/supabase/client'
import { FileDown, ChevronDown, ChevronUp } from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────

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

interface UpdateItem {
  id: string
  texto: string
  autor: string
  created_at: string
}

interface HistoricoEntrega {
  id: string
  texto: string
  created_at: string
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
  responsavel_execucao: string | null
  previsao_inicio: string | null
  roi_estimado: number | null
  lista_entregas: Entrega[] | null
  lista_raid: RaidItem[] | null
  lista_updates: UpdateItem[] | null
  update_periodo: string | null
  created_at: string
}

interface Props {
  iniciativa: Iniciativa
  perfil: string
  autorNome: string
}

// ─── Tabs ────────────────────────────────────────────────────────────────────

const ABAS = [
  'Identificação', 'Problema e Valor', 'Custos', 'Escopo',
  'Cronograma', 'Recursos', 'Riscos', 'EAP',
  'Entregas', 'RAID', 'Updates', 'Anexos',
]

// ─── RAID config ─────────────────────────────────────────────────────────────

const RAID_CONFIG = {
  risco:       { titulo: 'Riscos',       cor: 'border-red-200',    headerCor: 'bg-red-50 text-red-800 border-b border-red-200',       dot: 'bg-red-500',
    campos: [{ key: 'descricao', label: 'Descrição do risco', tipo: 'text' }, { key: 'acao', label: 'Ação mitigadora', tipo: 'text' }, { key: 'responsavel', label: 'Responsável', tipo: 'text' }] },
  acao:        { titulo: 'Ações',        cor: 'border-blue-200',   headerCor: 'bg-blue-50 text-blue-800 border-b border-blue-200',     dot: 'bg-blue-500',
    campos: [{ key: 'descricao', label: 'Descrição da ação', tipo: 'text' }, { key: 'responsavel', label: 'Responsável', tipo: 'text' }, { key: 'status', label: 'Status', tipo: 'select', opcoes: ['Pendente', 'Em andamento', 'Concluída'] }] },
  impedimento: { titulo: 'Impedimentos', cor: 'border-orange-200', headerCor: 'bg-orange-50 text-orange-800 border-b border-orange-200', dot: 'bg-orange-500',
    campos: [{ key: 'descricao', label: 'Descrição do impedimento', tipo: 'text' }, { key: 'acao', label: 'Ação para resolver', tipo: 'text' }, { key: 'responsavel', label: 'Responsável', tipo: 'text' }] },
  decisao:     { titulo: 'Decisões',     cor: 'border-purple-200', headerCor: 'bg-purple-50 text-purple-800 border-b border-purple-200', dot: 'bg-purple-500',
    campos: [{ key: 'descricao', label: 'Decisão necessária', tipo: 'text' }, { key: 'prazo', label: 'Prazo', tipo: 'date' }, { key: 'status', label: 'Status', tipo: 'select', opcoes: ['Pendente', 'Resolvida'] }] },
} as const

// ─── Helpers ──────────────────────────────────────────────────────────────────

function gerarId() { return Math.random().toString(36).slice(2, 10) }

function formatBRL(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }

function tempoRelativo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const horas = Math.floor(diff / 3600000)
  const dias  = Math.floor(diff / 86400000)
  if (mins < 2)   return 'agora'
  if (mins < 60)  return `há ${mins} min`
  if (horas < 24) return `há ${horas} h`
  if (dias === 1) return 'ontem'
  if (dias < 7)   return `há ${dias} dias`
  return new Date(dateStr).toLocaleString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function avatarCor(nome: string): string {
  const cores = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#EF4444']
  const hash  = nome.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return cores[hash % cores.length]
}

function iniciais(nome: string): string {
  return nome.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

// ─── AnexoLink ────────────────────────────────────────────────────────────────

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
      <a href={data.publicUrl} target="_blank" rel="noopener noreferrer"
        className="text-atrio hover:underline truncate max-w-xs" title={nome}>{nome}</a>
    </li>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DetalheIniciativa({ iniciativa: ini, perfil, autorNome }: Props) {
  const [aba, setAba] = useState(0)
  const [scorecard, setScorecard] = useState<Record<string, number>>(ini.scorecard ?? {})
  const [recarregar, setRecarregar] = useState(0)
  const [gerandoPDF, setGerandoPDF] = useState(false)

  // Custos
  const [custoEstimado,     setCustoEstimado]     = useState(ini.custo_estimado?.toString() ?? '')
  const [detalhamentoCustos, setDetalhamentoCustos] = useState(ini.detalhamento_custos ?? '')
  const [salvandoCustos,    setSalvandoCustos]    = useState(false)
  const [toastCustos,       setToastCustos]       = useState('')

  // Entregas
  const [listaEntregas,   setListaEntregas]   = useState<Entrega[]>(ini.lista_entregas ?? [])
  const [novaEntrega,     setNovaEntrega]     = useState({ descricao: '', responsavel: '' })
  const [salvandoEntregas, setSalvandoEntregas] = useState(false)
  const [toastEntregas,   setToastEntregas]   = useState('')
  const [historicoEntregas, setHistoricoEntregas] = useState<HistoricoEntrega[]>([])
  const [historicoAberto, setHistoricoAberto] = useState(false)
  const entregasConcluidas = listaEntregas.filter(e => e.concluida).length
  const progressoEntregas  = listaEntregas.length > 0 ? Math.round((entregasConcluidas / listaEntregas.length) * 100) : 0

  // RAID
  const [listaRaid,    setListaRaid]    = useState<RaidItem[]>(ini.lista_raid ?? [])
  const [novoRaid,     setNovoRaid]     = useState<{ tipo: RaidItem['tipo']; descricao: string; acao: string; responsavel: string; prazo: string; status: string }>({ tipo: 'risco', descricao: '', acao: '', responsavel: '', prazo: '', status: 'Pendente' })
  const [adicionandoRaid, setAdicionandoRaid] = useState<RaidItem['tipo'] | null>(null)
  const [salvandoRaid, setSalvandoRaid] = useState(false)
  const [toastRaid,    setToastRaid]    = useState('')

  // Updates (timeline)
  const [listaUpdates,   setListaUpdates]   = useState<UpdateItem[]>(ini.lista_updates ?? [])
  const [novoUpdate,     setNovoUpdate]     = useState('')
  const [salvandoUpdate, setSalvandoUpdate] = useState(false)
  const [toastUpdate,    setToastUpdate]    = useState('')

  // ── Actions ───────────────────────────────────────────────────────────────

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
      body: JSON.stringify({ custo_estimado: custoEstimado ? parseFloat(custoEstimado) : null, detalhamento_custos: detalhamentoCustos || null }),
    })
    setSalvandoCustos(false)
    setToastCustos(res.ok ? 'Custos salvos!' : 'Erro ao salvar')
    setTimeout(() => setToastCustos(''), 3000)
  }

  function addHistorico(texto: string) {
    setHistoricoEntregas(prev => [{ id: gerarId(), texto, created_at: new Date().toISOString() }, ...prev])
  }

  function toggleEntrega(index: number) {
    const e = listaEntregas[index]
    const concluindo = !e.concluida
    setListaEntregas(prev => prev.map((x, i) => i === index ? { ...x, concluida: !x.concluida } : x))
    addHistorico(`${autorNome} marcou "${e.descricao}" como ${concluindo ? 'concluída' : 'pendente'}`)
  }

  function removerEntrega(index: number) {
    const e = listaEntregas[index]
    setListaEntregas(prev => prev.filter((_, i) => i !== index))
    addHistorico(`${autorNome} removeu a entrega "${e.descricao}"`)
  }

  function adicionarEntrega() {
    if (!novaEntrega.descricao.trim()) return
    const nova: Entrega = { id: gerarId(), descricao: novaEntrega.descricao.trim(), responsavel: novaEntrega.responsavel.trim(), concluida: false, created_at: new Date().toISOString() }
    setListaEntregas(prev => [...prev, nova])
    addHistorico(`${autorNome} adicionou a entrega "${nova.descricao}"`)
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
    setListaRaid(prev => [...prev, { id: gerarId(), tipo, descricao: novoRaid.descricao.trim(), acao: novoRaid.acao.trim() || undefined, responsavel: novoRaid.responsavel.trim() || undefined, prazo: novoRaid.prazo || undefined, status: novoRaid.status || 'Pendente' }])
    setNovoRaid({ tipo, descricao: '', acao: '', responsavel: '', prazo: '', status: 'Pendente' })
    setAdicionandoRaid(null)
  }

  function removerRaid(id: string) { setListaRaid(prev => prev.filter(r => r.id !== id)) }

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

  async function publicarUpdate() {
    if (!novoUpdate.trim()) return
    setSalvandoUpdate(true)
    const novo: UpdateItem = { id: gerarId(), texto: novoUpdate.trim(), autor: autorNome, created_at: new Date().toISOString() }
    const novos = [novo, ...listaUpdates]
    const res = await fetch(`/api/iniciativas/${ini.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lista_updates: novos }),
    })
    setSalvandoUpdate(false)
    if (res.ok) {
      setListaUpdates(novos)
      setNovoUpdate('')
      setToastUpdate('')
    } else {
      setToastUpdate('Erro ao publicar update')
      setTimeout(() => setToastUpdate(''), 3000)
    }
  }

  // ── TAP PDF ───────────────────────────────────────────────────────────────

  async function gerarTAP() {
    setGerandoPDF(true)
    try {
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
      ])

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW   = doc.internal.pageSize.getWidth()
      const pageH   = doc.internal.pageSize.getHeight()
      const margin  = 20
      const cW      = pageW - margin * 2

      // ── CAPA ──────────────────────────────────────────────────────────────
      doc.setFillColor(17, 17, 17)
      doc.rect(0, 0, pageW, 55, 'F')

      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(255, 255, 255)
      doc.text('System COE Átrio Hotel Management', margin, 24)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(156, 163, 175)
      doc.text('Centro de Excelência Operacional', margin, 32)

      doc.setTextColor(17, 17, 17)
      doc.setFontSize(24)
      doc.setFont('helvetica', 'bold')
      doc.text('TERMO DE ABERTURA', margin, 78)
      doc.text('DO PROJETO', margin, 92)

      doc.setDrawColor(229, 231, 235)
      doc.setLineWidth(0.5)
      doc.line(margin, 100, pageW - margin, 100)

      const labelY = 115
      const valY   = 125
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(107, 114, 128)
      doc.text('PROTOCOLO',   margin,       labelY)
      doc.text('SUBMETIDO EM', margin + 70,  labelY)
      doc.text('STATUS',       margin + 140, labelY)

      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(17, 17, 17)
      doc.text(ini.protocolo, margin, valY)
      doc.text(ini.created_at ? new Date(ini.created_at).toLocaleDateString('pt-BR') : '—', margin + 70, valY)
      doc.text(ini.status, margin + 140, valY)

      // ── CONTEÚDO ──────────────────────────────────────────────────────────
      doc.addPage()
      let y = margin

      function checkPage(needed = 20) {
        if (y + needed > pageH - 20) { doc.addPage(); y = margin }
      }

      function sectionTitle(num: number, titulo: string) {
        checkPage(18)
        doc.setFillColor(243, 244, 246)
        doc.rect(margin, y, cW, 9, 'F')
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(37, 99, 235)
        doc.text(`${num}.`, margin + 3, y + 6)
        doc.setTextColor(55, 65, 81)
        doc.text(titulo, margin + 9, y + 6)
        y += 13
      }

      function field(label: string, value: string | undefined | null) {
        const v = value?.trim() || '—'
        checkPage(14)
        doc.setFontSize(7.5)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(107, 114, 128)
        doc.text(label.toUpperCase(), margin, y)
        y += 4.5
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(17, 17, 17)
        const lines = doc.splitTextToSize(v, cW)
        checkPage(lines.length * 4.5 + 6)
        doc.text(lines, margin, y)
        y += lines.length * 4.5 + 7
      }

      // 1 — Identificação
      sectionTitle(1, 'IDENTIFICAÇÃO')
      field('Título',       ini.titulo)
      field('Área',         ini.area)
      field('Tipo',         ini.tipo_iniciativa)
      field('Patrocinador', ini.patrocinador)
      field('Responsável',  ini.responsavel_nome)
      field('E-mail',       ini.responsavel_email)
      y += 3

      // 2 — Problema e Valor
      sectionTitle(2, 'PROBLEMA E VALOR')
      field('Problema que resolve', ini.problema)
      field('Valor esperado',       ini.valor_esperado)
      field('Beneficiários',        (ini.beneficiarios ?? []).join(', '))
      y += 3

      // 3 — Escopo e Entregas
      sectionTitle(3, 'ESCOPO E ENTREGAS')
      field('Principais entregas', ini.entregas)
      field('Fora do escopo',      ini.fora_escopo)
      y += 3

      // 4 — Cronograma
      sectionTitle(4, 'CRONOGRAMA')
      field('Data início prevista', ini.data_inicio_prevista ? new Date(ini.data_inicio_prevista + 'T00:00:00').toLocaleDateString('pt-BR') : '—')
      field('Data fim prevista',    ini.data_fim_prevista    ? new Date(ini.data_fim_prevista    + 'T00:00:00').toLocaleDateString('pt-BR') : '—')
      field('Dependências críticas', ini.dependencias)
      y += 3

      // 5 — Recursos
      sectionTitle(5, 'RECURSOS')
      field('Equipe executora', ini.equipe)
      if (ini.tem_terceiros) field('Terceiros envolvidos', ini.terceiros)
      y += 3

      // 6 — Riscos (tabela)
      sectionTitle(6, 'RISCOS')
      if ((ini.riscos ?? []).length > 0) {
        autoTable(doc, {
          startY: y,
          margin: { left: margin, right: margin },
          head: [['Risco', 'Probabilidade', 'Impacto', 'Nível']],
          body: (ini.riscos ?? []).map(r => [
            r.descricao,
            ['', 'Baixa', 'Média', 'Alta'][parseInt(r.probabilidade)] ?? r.probabilidade,
            ['', 'Baixo', 'Médio', 'Alto'][parseInt(r.impacto)] ?? r.impacto,
            r.nivel,
          ]),
          styles: { fontSize: 8, cellPadding: 3 },
          headStyles: { fillColor: [243, 244, 246], textColor: [55, 65, 81], fontStyle: 'bold' },
          columnStyles: { 0: { cellWidth: 80 } },
        })
        y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8
      } else {
        doc.setFontSize(8); doc.setTextColor(107, 114, 128); doc.text('Nenhum risco mapeado.', margin, y); y += 10
      }
      y += 3

      // 7 — EAP
      sectionTitle(7, 'EAP — ESTRUTURA ANALÍTICA DO PROJETO')
      field('Atividades', ini.eap)
      y += 3

      // 8 — Scorecard (se preenchido)
      const scKeys = Object.keys(ini.scorecard ?? {}).filter(k => (ini.scorecard?.[k] ?? 0) > 0)
      if (scKeys.length > 0) {
        checkPage(40)
        sectionTitle(8, 'SCORECARD DE ANÁLISE')
        const pontos = DIMENSOES_PADRAO.reduce((acc, d) => acc + (ini.scorecard?.[d.key] ?? 0) * d.peso, 0)
        const maxP   = DIMENSOES_PADRAO.reduce((acc, d) => acc + 3 * d.peso, 0)
        const pct    = Math.round((pontos / maxP) * 100)
        const veredito = pct >= 80 ? 'Prioridade Alta' : pct >= 60 ? 'Análise Recomendada' : pct >= 40 ? 'Backlog' : 'Reconsiderar'
        const bodyRows = DIMENSOES_PADRAO.map(d => {
          const nota = ini.scorecard?.[d.key] ?? 0
          return [d.label, nota > 0 ? nota.toString() : '—', `${d.peso}%`, nota > 0 ? (nota * d.peso).toFixed(0) : '—']
        })
        bodyRows.push(['TOTAL', `${(ini.score ?? 0).toFixed(2)}`, '100%', `${pct}% — ${veredito}`])
        autoTable(doc, {
          startY: y,
          margin: { left: margin, right: margin },
          head: [['Dimensão', 'Nota (1-3)', 'Peso', 'Score parcial']],
          body: bodyRows,
          styles: { fontSize: 8, cellPadding: 3 },
          headStyles: { fillColor: [243, 244, 246], textColor: [55, 65, 81], fontStyle: 'bold' },
        })
        y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
      }

      // 9 — Decisão (se registrada)
      if (ini.decisao) {
        checkPage(30)
        sectionTitle(9, 'DECISÃO')
        field('Decisão',       ini.decisao)
        field('Justificativa', ini.justificativa)
      }

      // ── RODAPÉ ──────────────────────────────────────────────────────────
      const total = doc.getNumberOfPages()
      for (let i = 1; i <= total; i++) {
        doc.setPage(i)
        doc.setFontSize(7.5)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(156, 163, 175)
        doc.text(`System COE Átrio Hotel Management  |  Gerado em ${new Date().toLocaleDateString('pt-BR')}`, margin, pageH - 10)
        doc.text(`${i} / ${total}`, pageW - margin, pageH - 10, { align: 'right' })
      }

      const nomeArquivo = `TAP_${ini.protocolo}_${ini.titulo.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
      doc.save(nomeArquivo)
    } catch (err) {
      console.error('Erro ao gerar PDF:', err)
    }
    setGerandoPDF(false)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const bs = badgeStatus(ini.status)

  return (
    <div className="max-w-[900px] mx-auto space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <span className="font-mono text-sm text-atrio font-semibold bg-atrio-light px-2 py-0.5 rounded">
              {ini.protocolo}
            </span>
            <Badge texto={bs.texto} variante={bs.variante} />
            <span className="text-sm text-gray-400">{ini.area} · {ini.tipo_iniciativa}</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">{ini.titulo}</h1>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <p className="text-2xl font-bold text-atrio">{(ini.score ?? 0).toFixed(1)}</p>
            <p className="text-xs text-gray-500">Score</p>
          </div>
          <button
            onClick={gerarTAP}
            disabled={gerandoPDF}
            className="flex items-center gap-2 btn-secondary px-4 py-2 text-sm"
            title="Baixar Termo de Abertura do Projeto em PDF"
          >
            <FileDown size={16} />
            {gerandoPDF ? 'Gerando...' : 'Baixar TAP'}
          </button>
        </div>
      </div>

      {/* ── Abas ───────────────────────────────────────────────────────────── */}
      <div>
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
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              {([
                ['Título', ini.titulo], ['Área', ini.area], ['Tipo', ini.tipo_iniciativa],
                ['Patrocinador', ini.patrocinador], ['Responsável', ini.responsavel_nome], ['E-mail', ini.responsavel_email],
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
              <div><h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Problema</h3><p className="text-gray-900 whitespace-pre-line">{ini.problema}</p></div>
              <div><h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Valor esperado</h3><p className="text-gray-900 whitespace-pre-line">{ini.valor_esperado}</p></div>
              <div>
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Beneficiários</h3>
                <div className="flex flex-wrap gap-1">
                  {(ini.beneficiarios ?? []).map(b => <span key={b} className="px-2 py-1 bg-atrio-light text-atrio text-xs rounded-full">{b}</span>)}
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
                    <input type="number" step="0.01" min="0" className="input-base pl-8" placeholder="0,00" value={custoEstimado} onChange={e => setCustoEstimado(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="label-base">Detalhamento dos custos</label>
                  <textarea rows={5} className="input-base resize-none mt-1" placeholder="Ex: R$ 15k consultoria, R$ 5k licença..." value={detalhamentoCustos} onChange={e => setDetalhamentoCustos(e.target.value)} />
                </div>
                {toastCustos && <p className={`text-sm ${toastCustos.includes('salvo') ? 'text-green-600' : 'text-red-600'}`}>{toastCustos}</p>}
                <button onClick={salvarCustos} disabled={salvandoCustos} className="btn-primary px-6">{salvandoCustos ? 'Salvando...' : 'Salvar custos'}</button>
              </div>
            ) : (
              <div className="space-y-4">
                <div><dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Custo estimado total</dt><dd className="text-gray-900 mt-0.5">{ini.custo_estimado ? formatBRL(ini.custo_estimado) : 'Não informado'}</dd></div>
                {ini.detalhamento_custos && <div><dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Detalhamento</dt><dd className="text-gray-900 mt-0.5 whitespace-pre-line">{ini.detalhamento_custos}</dd></div>}
              </div>
            )
          )}

          {/* 3 — Escopo */}
          {aba === 3 && (
            <div className="space-y-4">
              <div><h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Entregas esperadas</h3><p className="text-gray-900 whitespace-pre-line">{ini.entregas}</p></div>
              <div><h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Fora do escopo</h3><p className="text-gray-900 whitespace-pre-line">{ini.fora_escopo}</p></div>
            </div>
          )}

          {/* 4 — Cronograma */}
          {aba === 4 && (
            <dl className="space-y-4">
              {([
                ['Data de início prevista', ini.data_inicio_prevista ? new Date(ini.data_inicio_prevista + 'T00:00:00').toLocaleDateString('pt-BR') : '—'],
                ['Data de término prevista', ini.data_fim_prevista   ? new Date(ini.data_fim_prevista   + 'T00:00:00').toLocaleDateString('pt-BR') : '—'],
              ] as [string, string][]).map(([k, v]) => (
                <div key={k}><dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{k}</dt><dd className="text-gray-900 mt-0.5">{v}</dd></div>
              ))}
              <div><dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Dependências críticas</dt><dd className="text-gray-900 mt-0.5 whitespace-pre-line">{ini.dependencias}</dd></div>
            </dl>
          )}

          {/* 5 — Recursos */}
          {aba === 5 && (
            <div className="space-y-4">
              <div><h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Equipe executora</h3><p className="text-gray-900 whitespace-pre-line">{ini.equipe}</p></div>
              {ini.tem_terceiros && <div><h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Terceiros envolvidos</h3><p className="text-gray-900 whitespace-pre-line">{ini.terceiros}</p></div>}
            </div>
          )}

          {/* 6 — Riscos */}
          {aba === 6 && (
            <div className="space-y-4">
              {(ini.riscos ?? []).map((r, i) => {
                const cores: Record<string, string> = { 'Crítico': 'bg-red-900 text-white', 'Alto': 'bg-red-100 text-red-800', 'Médio': 'bg-orange-100 text-orange-800', 'Baixo-Médio': 'bg-yellow-100 text-yellow-800', 'Baixo': 'bg-green-100 text-green-800' }
                return (
                  <div key={i} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-gray-900">{r.descricao}</p>
                      {r.nivel && <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${cores[r.nivel] ?? 'bg-gray-100'}`}>{r.nivel}</span>}
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
            <div><h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Atividades</h3><p className="text-gray-900 whitespace-pre-line">{ini.eap}</p></div>
          )}

          {/* 8 — Entregas (tracking) */}
          {aba === 8 && (
            <div>
              {listaEntregas.length > 0 && (
                <div className="mb-5">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progresso</span>
                    <span className="font-medium">{entregasConcluidas}/{listaEntregas.length} ({progressoEntregas}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${progressoEntregas}%` }} />
                  </div>
                </div>
              )}

              <div className="space-y-2 mb-4">
                {listaEntregas.length === 0 && <p className="text-sm text-gray-400 py-2">Nenhuma entrega cadastrada.</p>}
                {listaEntregas.map((e, i) => (
                  <div key={e.id} className={`flex items-start gap-3 p-3 border rounded-lg transition-colors ${e.concluida ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-200'}`}>
                    <input type="checkbox" checked={e.concluida} onChange={() => toggleEntrega(i)} className="mt-0.5 w-4 h-4 accent-blue-600 cursor-pointer flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${e.concluida ? 'line-through text-gray-400' : 'text-gray-900'}`}>{e.descricao}</p>
                      {e.responsavel && <p className="text-xs text-gray-400 mt-0.5">Resp: {e.responsavel}</p>}
                    </div>
                    {perfil === 'gestor' && <button onClick={() => removerEntrega(i)} className="text-gray-300 hover:text-red-400 text-xs flex-shrink-0 transition-colors">✕</button>}
                  </div>
                ))}
              </div>

              {perfil === 'gestor' && (
                <div className="border border-dashed border-gray-200 rounded-lg p-3 space-y-2 bg-gray-50 mb-4">
                  <input type="text" placeholder="Descrição da entrega" className="input-base text-sm" value={novaEntrega.descricao}
                    onChange={e => setNovaEntrega(prev => ({ ...prev, descricao: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); adicionarEntrega() } }} />
                  <input type="text" placeholder="Responsável (opcional)" className="input-base text-sm" value={novaEntrega.responsavel}
                    onChange={e => setNovaEntrega(prev => ({ ...prev, responsavel: e.target.value }))} />
                  <button onClick={adicionarEntrega} disabled={!novaEntrega.descricao.trim()} className="btn-secondary text-sm px-4 py-1.5">
                    + Adicionar entrega
                  </button>
                </div>
              )}

              {toastEntregas && <p className={`text-sm mb-2 ${toastEntregas.includes('salvas') ? 'text-green-600' : 'text-red-600'}`}>{toastEntregas}</p>}
              {perfil === 'gestor' && (
                <button onClick={salvarEntregas} disabled={salvandoEntregas} className="btn-primary px-6">
                  {salvandoEntregas ? 'Salvando...' : 'Salvar entregas'}
                </button>
              )}

              {/* Histórico de atividade */}
              {historicoEntregas.length > 0 && (
                <div className="mt-6 border-t border-gray-100 pt-4">
                  <button
                    onClick={() => setHistoricoAberto(h => !h)}
                    className="flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors"
                  >
                    {historicoAberto ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    Histórico de atividade ({historicoEntregas.length})
                  </button>
                  {historicoAberto && (
                    <div className="mt-3 space-y-2">
                      {historicoEntregas.map(h => (
                        <div key={h.id} className="flex items-start gap-3 text-xs text-gray-500">
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 flex-shrink-0" />
                          <div>
                            <span>{h.texto}</span>
                            <span className="text-gray-400 ml-2">— {tempoRelativo(h.created_at)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
                          {items.length > 0 && <span className="text-xs font-medium bg-white/70 px-1.5 rounded-full">{items.length}</span>}
                        </div>
                        {perfil === 'gestor' && (
                          <button onClick={() => { setAdicionandoRaid(adicionando ? null : tipo); setNovoRaid({ tipo, descricao: '', acao: '', responsavel: '', prazo: '', status: 'Pendente' }) }} className="text-xs font-medium hover:opacity-70 transition-opacity">
                            {adicionando ? '✕' : '+ Adicionar'}
                          </button>
                        )}
                      </div>
                      <div className="p-3 space-y-2">
                        {items.length === 0 && !adicionando && <p className="text-xs text-gray-400 py-1">Nenhum item cadastrado.</p>}
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
                                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${item.status === 'Concluída' || item.status === 'Resolvida' ? 'bg-green-100 text-green-700' : item.status === 'Em andamento' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{item.status}</span>
                                )}
                                {perfil === 'gestor' && <button onClick={() => removerRaid(item.id)} className="text-gray-300 hover:text-red-400 transition-colors ml-1">✕</button>}
                              </div>
                            </div>
                          </div>
                        ))}
                        {adicionando && (
                          <div className="bg-white rounded-lg p-3 border border-gray-200 space-y-2 shadow-sm">
                            {cfg.campos.map(campo => (
                              campo.tipo === 'select' ? (
                                <select key={campo.key} className="input-base text-xs" value={(novoRaid as Record<string, string>)[campo.key] ?? ''} onChange={e => setNovoRaid(prev => ({ ...prev, [campo.key]: e.target.value }))}>
                                  {campo.opcoes?.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                              ) : campo.tipo === 'date' ? (
                                <input key={campo.key} type="date" className="input-base text-xs" value={(novoRaid as Record<string, string>)[campo.key] ?? ''} onChange={e => setNovoRaid(prev => ({ ...prev, [campo.key]: e.target.value }))} />
                              ) : (
                                <input key={campo.key} type="text" placeholder={campo.label} className="input-base text-xs" value={(novoRaid as Record<string, string>)[campo.key] ?? ''} onChange={e => setNovoRaid(prev => ({ ...prev, [campo.key]: e.target.value }))} />
                              )
                            ))}
                            <button onClick={() => adicionarRaid(tipo)} disabled={!novoRaid.descricao?.trim()} className="btn-secondary text-xs px-3 py-1.5">Adicionar</button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              {toastRaid && <p className={`text-sm mt-3 ${toastRaid.includes('salvo') ? 'text-green-600' : 'text-red-600'}`}>{toastRaid}</p>}
              {perfil === 'gestor' && <button onClick={salvarRaid} disabled={salvandoRaid} className="btn-primary px-6 mt-4">{salvandoRaid ? 'Salvando...' : 'Salvar RAID'}</button>}
            </div>
          )}

          {/* 10 — Updates (timeline) */}
          {aba === 10 && (
            <div>
              {/* Campo novo update */}
              {perfil === 'gestor' && (
                <div className="mb-6">
                  <textarea
                    rows={4}
                    className="input-base resize-none"
                    placeholder="Digite o update do período: avanços, próximos passos, pontos de atenção..."
                    value={novoUpdate}
                    onChange={e => setNovoUpdate(e.target.value)}
                  />
                  {toastUpdate && <p className="text-sm text-red-600 mt-1">{toastUpdate}</p>}
                  <button
                    onClick={publicarUpdate}
                    disabled={salvandoUpdate || !novoUpdate.trim()}
                    className="btn-primary px-6 mt-2"
                  >
                    {salvandoUpdate ? 'Publicando...' : 'Publicar update'}
                  </button>
                </div>
              )}

              {/* Timeline */}
              {listaUpdates.length === 0 ? (
                <p className="text-sm text-gray-400">Nenhum update registrado ainda.</p>
              ) : (
                <div className="relative">
                  {/* Linha vertical */}
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-100" />

                  <div className="space-y-6">
                    {listaUpdates.map((u, idx) => {
                      const cor = avatarCor(u.autor)
                      const ini2 = iniciais(u.autor)
                      return (
                        <div key={u.id} className="flex gap-4 relative">
                          {/* Avatar */}
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 text-white text-xs font-semibold shadow-sm"
                            style={{ background: cor }}
                          >
                            {ini2}
                          </div>
                          {/* Conteúdo */}
                          <div className="flex-1 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
                              <p className="text-sm font-semibold text-gray-900">{u.autor}</p>
                              <p className="text-xs text-gray-400" title={new Date(u.created_at).toLocaleString('pt-BR')}>
                                {tempoRelativo(u.created_at)}
                              </p>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{u.texto}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
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
                  {ini.anexos.map((path, i) => <AnexoLink key={i} path={path} />)}
                </ul>
              )}
            </div>
          )}

        </div>
      </div>

      {/* ── Scorecard + Decisão (abaixo, apenas gestor) ─────────────────────── */}
      {perfil === 'gestor' && (
        <>
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Scorecard de Análise</h2>
            <Scorecard scorecard={scorecard} onSalvar={salvarScorecard} colunas={3} />
          </div>

          <div>
            <PainelDecisao
              id={ini.id}
              decisaoAtual={ini.decisao ?? undefined}
              justificativaAtual={ini.justificativa ?? undefined}
              responsavelExecucaoAtual={ini.responsavel_execucao ?? undefined}
              previsaoInicioAtual={ini.previsao_inicio ?? undefined}
              roiEstimadoAtual={ini.roi_estimado ?? undefined}
              onDecisaoSalva={() => setRecarregar(r => r + 1)}
            />
          </div>
        </>
      )}
    </div>
  )
}
