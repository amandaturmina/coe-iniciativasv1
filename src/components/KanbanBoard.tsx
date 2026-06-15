'use client'

import { useEffect, useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core'

interface Iniciativa {
  id: string
  protocolo: string
  titulo: string
  area: string
  responsavel_execucao: string
  roi_estimado: number | null
  roi_realizado: number | null
  score: number
  status: string
}

const COLUNAS = [
  { id: 'Em planejamento', label: 'Em planejamento', cor: 'border-blue-400 bg-blue-50' },
  { id: 'Em andamento', label: 'Em andamento', cor: 'border-yellow-400 bg-yellow-50' },
  { id: 'Concluída', label: 'Concluída', cor: 'border-green-400 bg-green-50' },
  { id: 'Pausada', label: 'Pausada', cor: 'border-gray-400 bg-gray-50' },
]

function Card({ ini, isConcluida }: { ini: Iniciativa; isConcluida: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: ini.id })
  const [roi, setRoi] = useState(ini.roi_realizado ?? '')
  const [salvando, setSalvando] = useState(false)

  async function salvarRoi() {
    setSalvando(true)
    await fetch(`/api/iniciativas/${ini.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roi_realizado: roi ? parseFloat(roi as string) : null }),
    })
    setSalvando(false)
  }

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
        opacity: isDragging ? 0.4 : 1,
      }}
      className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm cursor-grab active:cursor-grabbing"
    >
      <p className="font-mono text-xs text-atrio font-medium">{ini.protocolo}</p>
      <p className="text-sm font-semibold text-gray-900 mt-1 leading-tight">{ini.titulo}</p>
      <p className="text-xs text-gray-500 mt-1">{ini.area}</p>
      {ini.responsavel_execucao && (
        <p className="text-xs text-gray-500">👤 {ini.responsavel_execucao}</p>
      )}
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-gray-400">Score: <strong className="text-atrio">{ini.score?.toFixed(1)}</strong></span>
        {ini.roi_estimado && (
          <span className="text-xs text-gray-400">
            Est: {ini.roi_estimado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
          </span>
        )}
      </div>
      {isConcluida && (
        <div className="mt-2 pt-2 border-t border-gray-100 flex gap-1" onClick={e => e.stopPropagation()}>
          <input
            type="number"
            placeholder="ROI realizado"
            className="flex-1 text-xs border border-gray-200 rounded px-2 py-1"
            value={roi}
            onChange={e => setRoi(e.target.value)}
          />
          <button
            onClick={salvarRoi}
            className="text-xs bg-atrio text-white px-2 py-1 rounded"
            disabled={salvando}
          >
            {salvando ? '...' : 'OK'}
          </button>
        </div>
      )}
    </div>
  )
}

function Coluna({ col, iniciativas }: { col: typeof COLUNAS[0]; iniciativas: Iniciativa[] }) {
  const { isOver, setNodeRef } = useDroppable({ id: col.id })

  return (
    <div className={`flex-1 min-w-60 rounded-xl border-t-4 ${col.cor} ${isOver ? 'ring-2 ring-atrio ring-offset-2' : ''}`}>
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 text-sm">{col.label}</h3>
          <span className="text-xs bg-white border border-gray-200 rounded-full px-2 py-0.5 font-medium">
            {iniciativas.length}
          </span>
        </div>
      </div>
      <div ref={setNodeRef} className="p-3 space-y-2 min-h-64">
        {iniciativas.map(ini => (
          <Card key={ini.id} ini={ini} isConcluida={col.id === 'Concluída'} />
        ))}
      </div>
    </div>
  )
}

export default function KanbanBoard() {
  const [iniciativas, setIniciativas] = useState<Iniciativa[]>([])
  const [carregando, setCarregando] = useState(true)
  const [ativo, setAtivo] = useState<Iniciativa | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  useEffect(() => {
    async function carregar() {
      const res = await fetch('/api/iniciativas?status=Em planejamento,Em andamento,Concluída,Pausada')
      const json = await res.json()
      setIniciativas((json.dados ?? []).filter((i: Iniciativa) =>
        ['Em planejamento', 'Em andamento', 'Concluída', 'Pausada'].includes(i.status)
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

  if (carregando) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUNAS.map(c => (
          <div key={c.id} className="flex-1 min-w-60 h-64 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUNAS.map(col => (
          <Coluna
            key={col.id}
            col={col}
            iniciativas={iniciativas.filter(i => i.status === col.id)}
          />
        ))}
      </div>
      <DragOverlay>
        {ativo && (
          <div className="bg-white rounded-lg border border-atrio p-3 shadow-lg opacity-95 w-60">
            <p className="font-mono text-xs text-atrio">{ativo.protocolo}</p>
            <p className="text-sm font-semibold">{ativo.titulo}</p>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
