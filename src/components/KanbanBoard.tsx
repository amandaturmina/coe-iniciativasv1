'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core'
import {
  GripVertical,
  Plus,
  Activity,
  CheckSquare,
  AlertTriangle,
  ExternalLink,
  X,
} from 'lucide-react'
import KanbanDrawer from './KanbanDrawer'

interface Atividade {
  id: string
  descricao: string
  responsavel: string
  prazo: string
  tipo: string
  prioridade: string
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

interface EntregaItem {
  id: string
  texto: string
  concluida: boolean
}

interface RaidItem {
  id: string
  texto: string
  tipo: 'risco' | 'acao' | 'impedimento' | 'decisao'
}

interface Iniciativa {
  id: string
  protocolo: string
  titulo: string
  area: string
  responsavel_execucao: string
  roi_estimado: number | null
  roi_realizado: number | null
  roi_calculado: number | null
  score: number
  status: string
  data_fim_prevista?: string
  data_fim_estimada?: string
  data_inicio_estimada?: string
  data_inicio_real?: string
  data_fim_real?: string
  orcamento_previsto?: number | null
  custo_realizado?: number | null
  esforco_previsto_hh?: number | null
  esforco_realizado_hh?: number | null
  saving_esperado?: number | null
  payback_meses?: number | null
  lista_entregas?: EntregaItem[]
  lista_raid?: RaidItem[]
  lista_atividades?: Atividade[]
  lista_historico?: HistoricoItem[]
  lista_updates?: UpdateItem[]
}

const COLUNAS = [
  { id: 'Em planejamento', label: 'Em planejamento', borderCor: 'border-blue-400',   bg: 'bg-blue-50',   badge: 'bg-blue-100 text-blue-700' },
  { id: 'Em andamento',    label: 'Em andamento',    borderCor: 'border-yellow-400', bg: 'bg-yellow-50', badge: 'bg-yellow-100 text-yellow-700' },
  { id: 'Em validação',    label: 'Em validação',    borderCor: 'border-purple-400', bg: 'bg-purple-50', badge: 'bg-purple-100 text-purple-700' },
  { id: 'Concluída',       label: 'Concluída',       borderCor: 'border-green-400',  bg: 'bg-green-50',  badge: 'bg-green-100 text-green-700' },
  { id: 'Pausada',         label: 'Pausada',         borderCor: 'border-gray-300',   bg: 'bg-gray-50',   badge: 'bg-gray-100 text-gray-500' },
]

function Card({
  ini,
  nomeUsuario,
  onOpenDrawer,
}: {
  ini: Iniciativa
  nomeUsuario: string
  onOpenDrawer: (ini: Iniciativa) => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: ini.id })

  const entregas = ini.lista_entregas ?? []
  const progresso = entregas.length > 0
    ? Math.round(entregas.filter(e => e.concluida).length / entregas.length * 100)
    : null

  const impedimentos = (ini.lista_raid ?? []).filter(r => r.tipo === 'impedimento')
  const temImpedimento = impedimentos.length > 0

  const prazoRef = ini.data_fim_estimada ?? ini.data_fim_prevista
  const prazoAtrasado = prazoRef && ini.status !== 'Concluída'
    ? new Date(prazoRef) < new Date()
    : false

  const totalAtiv = (ini.lista_atividades ?? []).length
  const concluidasAtiv = (ini.lista_atividades ?? []).filter(a => a.concluida).length

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 999 : undefined,
      }}
      className="bg-white rounded-xl border border-[#ededeb] shadow-sm"
    >
      {/* Header */}
      <div className="flex items-start gap-2 p-3 pb-2">
        <div
          {...listeners}
          {...attributes}
          className="mt-0.5 text-gray-300 hover:text-[#451a1a] cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
          title="Arrastar para mover"
        >
          <GripVertical size={15} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <p className="font-mono text-xs text-[#451a1a] font-medium">{ini.protocolo}</p>
            {temImpedimento && (
              <span title={`${impedimentos.length} impedimento(s)`}>
                <AlertTriangle size={11} className="text-[#c0392b]" />
              </span>
            )}
            {prazoAtrasado && (
              <span className="text-[10px] text-[#c0392b] font-medium">• Atrasado</span>
            )}
          </div>
          <p className="text-sm font-semibold text-[#1a1917] leading-tight line-clamp-2">{ini.titulo}</p>
          <p className="text-xs text-[#6b6966] mt-0.5 truncate">{ini.area}</p>
          {ini.responsavel_execucao && (
            <p className="text-xs text-[#6b6966]">👤 {ini.responsavel_execucao}</p>
          )}
        </div>
      </div>

      {/* Métricas */}
      <div className="px-3 pb-2 flex items-center gap-3 text-xs text-[#6b6966]">
        <span>Score <strong className="text-[#451a1a]">{ini.score?.toFixed(1)}</strong></span>
        {ini.roi_calculado != null && (
          <span className={ini.roi_calculado >= 0 ? 'text-[#2d7d46]' : 'text-[#c0392b]'}>
            ROI {ini.roi_calculado >= 0 ? '+' : ''}{ini.roi_calculado.toFixed(0)}%
          </span>
        )}
        {prazoRef && (
          <span className={prazoAtrasado ? 'text-[#c0392b] font-medium' : ''}>
            {new Date(prazoRef).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
          </span>
        )}
      </div>

      {/* Barra de progresso entregas */}
      {progresso !== null && (
        <div className="px-3 pb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-[#6b6966] flex items-center gap-1">
              <CheckSquare size={10} /> Entregas
            </span>
            <span className="text-[10px] font-medium text-[#6b6966]">{progresso}%</span>
          </div>
          <div className="h-1.5 bg-[#f8f7f6] rounded-full overflow-hidden border border-[#ededeb]">
            <div
              className={`h-full rounded-full transition-all ${progresso === 100 ? 'bg-[#2d7d46]' : 'bg-[#451a1a]'}`}
              style={{ width: `${progresso}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-3 py-2 border-t border-[#ededeb] flex items-center justify-between gap-2">
        <a
          href={`/iniciativa/${ini.id}`}
          className="text-xs text-[#6b6966] hover:text-[#451a1a] flex items-center gap-1 transition-colors"
          onPointerDown={e => e.stopPropagation()}
        >
          <ExternalLink size={11} />
          Detalhes
        </a>
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={() => onOpenDrawer(ini)}
          className="flex items-center gap-1.5 text-xs text-[#451a1a] bg-[#f5eded] hover:bg-[#ededeb] px-2.5 py-1 rounded-lg font-medium transition-colors"
        >
          <Activity size={11} />
          {totalAtiv > 0 ? `${concluidasAtiv}/${totalAtiv}` : ''} + Atividade
        </button>
      </div>
    </div>
  )
}

function AddTaskInline({ colStatus, nomeUsuario, onAdd }: { colStatus: string; nomeUsuario: string; onAdd: (ini: Iniciativa) => void }) {
  const [open, setOpen] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [salvando, setSalvando] = useState(false)

  async function criar() {
    if (!titulo.trim()) return
    setSalvando(true)
    const formData = new FormData()
    formData.append('dados', JSON.stringify({
      titulo: titulo.trim(),
      area: '',
      tipo_iniciativa: 'Setorial',
      patrocinador: '',
      responsavel_nome: nomeUsuario,
      responsavel_email: '',
      problema: '',
      valor_esperado: '',
      entregas: '',
      fora_escopo: '',
      data_inicio_prevista: '',
      data_fim_prevista: '',
      dependencias: '',
      equipe: '',
      tem_terceiros: 'false',
    }))
    formData.append('riscos', JSON.stringify([]))

    const res = await fetch('/api/iniciativas', { method: 'POST', body: formData })
    if (res.ok) {
      const { id } = await res.json()
      // move to correct status
      await fetch(`/api/iniciativas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: colStatus }),
      })
      const r2 = await fetch(`/api/iniciativas/${id}`)
      const json = await r2.json()
      if (json.dados) onAdd(json.dados)
    }
    setTitulo('')
    setOpen(false)
    setSalvando(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#6b6966] hover:text-[#451a1a] hover:bg-[#f5eded] rounded-lg border border-dashed border-[#ededeb] hover:border-[#451a1a]/30 transition-colors mt-2"
      >
        <Plus size={14} />
        Adicionar tarefa
      </button>
    )
  }

  return (
    <div className="mt-2 bg-white border border-[#ededeb] rounded-xl p-3 space-y-2">
      <input
        type="text"
        className="input-base"
        placeholder="Nome da tarefa..."
        value={titulo}
        onChange={e => setTitulo(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') criar(); if (e.key === 'Escape') setOpen(false) }}
        autoFocus
      />
      <div className="flex gap-2">
        <button
          onClick={criar}
          disabled={salvando || !titulo.trim()}
          className="btn-primary flex-1 py-1.5 text-sm"
        >
          {salvando ? 'Criando...' : 'Adicionar'}
        </button>
        <button
          onClick={() => { setTitulo(''); setOpen(false) }}
          className="p-1.5 text-[#6b6966] hover:text-[#1a1917]"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}

function Coluna({
  col,
  iniciativas,
  nomeUsuario,
  onOpenDrawer,
  onAdd,
}: {
  col: typeof COLUNAS[0]
  iniciativas: Iniciativa[]
  nomeUsuario: string
  onOpenDrawer: (ini: Iniciativa) => void
  onAdd: (ini: Iniciativa) => void
}) {
  const { isOver, setNodeRef } = useDroppable({ id: col.id })

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-[260px] rounded-xl border-t-4 ${col.borderCor} ${col.bg} ${isOver ? 'ring-2 ring-[#451a1a]/30 ring-offset-2' : ''} transition-shadow`}
    >
      <div className="p-3 border-b border-[#ededeb]/70">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-[#1a1917] text-sm">{col.label}</h3>
          <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${col.badge}`}>
            {iniciativas.length}
          </span>
        </div>
      </div>
      <div className="p-3 min-h-64">
        <div className="space-y-2">
          {iniciativas.map(ini => (
            <Card
              key={ini.id}
              ini={ini}
              nomeUsuario={nomeUsuario}
              onOpenDrawer={onOpenDrawer}
            />
          ))}
          {iniciativas.length === 0 && (
            <div className="text-center py-6 text-[#6b6966] text-xs border-2 border-dashed border-[#ededeb] rounded-xl">
              Nenhum projeto aqui
            </div>
          )}
        </div>
        <AddTaskInline colStatus={col.id} nomeUsuario={nomeUsuario} onAdd={onAdd} />
      </div>
    </div>
  )
}

export default function KanbanBoard() {
  const [iniciativas, setIniciativas] = useState<Iniciativa[]>([])
  const [carregando, setCarregando] = useState(true)
  const [ativo, setAtivo] = useState<Iniciativa | null>(null)
  const [nomeUsuario, setNomeUsuario] = useState('')
  const [drawerIni, setDrawerIni] = useState<Iniciativa | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  )

  useEffect(() => {
    async function carregar() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('nome')
          .eq('id', user.id)
          .single()
        setNomeUsuario(profile?.nome ?? 'Usuário')
      }

      const res = await fetch('/api/iniciativas?status=Em planejamento,Em andamento,Em validação,Concluída,Pausada')
      const json = await res.json()
      setIniciativas((json.dados ?? []).filter((i: Iniciativa) =>
        ['Em planejamento', 'Em andamento', 'Em validação', 'Concluída', 'Pausada'].includes(i.status)
      ))
      setCarregando(false)
    }
    carregar()
  }, [])

  function onDragStart(e: DragStartEvent) {
    setAtivo(iniciativas.find(i => i.id === e.active.id) ?? null)
  }

  async function onDragEnd(e: DragEndEvent) {
    setAtivo(null)
    const { active, over } = e
    if (!over) return
    const novoStatus = over.id as string
    const ini = iniciativas.find(i => i.id === active.id)
    if (!ini || ini.status === novoStatus) return

    setIniciativas(prev => prev.map(i => i.id === active.id ? { ...i, status: novoStatus } : i))
    await fetch(`/api/iniciativas/${active.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: novoStatus }),
    })
  }

  function handleDrawerUpdate(patch: Record<string, unknown>) {
    if (!drawerIni) return
    const atualizado = { ...drawerIni, ...patch }
    setIniciativas(prev => prev.map(i => i.id === atualizado.id ? atualizado : i))
    setDrawerIni(atualizado)
  }

  if (carregando) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUNAS.map(c => (
          <div key={c.id} className="flex-1 min-w-[260px] h-72 bg-white rounded-xl border border-[#ededeb] animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <>
      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 items-start">
          {COLUNAS.map(col => (
            <Coluna
              key={col.id}
              col={col}
              iniciativas={iniciativas.filter(i => i.status === col.id)}
              nomeUsuario={nomeUsuario}
              onOpenDrawer={setDrawerIni}
              onAdd={nova => setIniciativas(prev => [...prev, nova])}
            />
          ))}
        </div>
        <DragOverlay>
          {ativo && (
            <div className="bg-white rounded-xl border-2 border-[#451a1a] p-3 shadow-2xl w-64 rotate-1">
              <p className="font-mono text-xs text-[#451a1a]">{ativo.protocolo}</p>
              <p className="text-sm font-semibold text-[#1a1917] mt-0.5">{ativo.titulo}</p>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {drawerIni && (
        <KanbanDrawer
          iniciativa={drawerIni}
          nomeUsuario={nomeUsuario}
          onClose={() => setDrawerIni(null)}
          onUpdate={handleDrawerUpdate}
        />
      )}
    </>
  )
}
