'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Badge, { badgeStatus, badgeTipo } from './Badge'

interface Iniciativa {
  id: string
  protocolo: string
  area: string
  tipo_iniciativa: string
  titulo: string
  responsavel_nome: string
  created_at: string
  score: number
  status: string
}

const STATUS_OPCOES = ['Recebida','Em análise','Aprovada','Recusada','Aguardar ciclo','Em planejamento','Em andamento','Concluída','Pausada']
const AREAS = ['Operações','A&B&E','Recursos Humanos','Jurídico','Vendas','Marketing','Revenue Management (RM)','Contabilidade','Contabilidade Fiscal','Escrituração','Master Data Management (MDM)','Departamento Pessoal','Contas a Pagar','Contas a Receber','Faturamento','Cobrança','Conciliação de Cartões','FP&A','Controles Internos','Relacionamento com Investidor (RI)','Inteligência de Compras','Tecnologia da Informação (TI)']
const TIPOS = ['Setorial','Intersetorial','Cross-company']

type OrdemCampo = 'score' | 'created_at' | 'protocolo' | 'area'

export default function FilaIniciativas() {
  const [iniciativas, setIniciativas] = useState<Iniciativa[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<string[]>([])
  const [filtroArea, setFiltroArea] = useState<string[]>([])
  const [filtroTipo, setFiltroTipo] = useState('')
  const [ordem, setOrdem] = useState<OrdemCampo>('score')
  const [ordemAsc, setOrdemAsc] = useState(false)

  const carregar = useCallback(async () => {
    setCarregando(true)
    const params = new URLSearchParams()
    if (filtroStatus.length) params.set('status', filtroStatus.join(','))
    if (filtroArea.length) params.set('area', filtroArea.join(','))
    if (filtroTipo) params.set('tipo', filtroTipo)
    if (busca) params.set('busca', busca)

    const res = await fetch(`/api/iniciativas?${params}`)
    const json = await res.json()
    setIniciativas(json.dados ?? [])
    setCarregando(false)
  }, [filtroStatus, filtroArea, filtroTipo, busca])

  useEffect(() => {
    const t = setTimeout(carregar, 300)
    return () => clearTimeout(t)
  }, [carregar])

  function toggleOrdem(campo: OrdemCampo) {
    if (ordem === campo) setOrdemAsc(a => !a)
    else { setOrdem(campo); setOrdemAsc(false) }
  }

  const ordenadas = [...iniciativas].sort((a, b) => {
    let va: string | number = a[ordem]
    let vb: string | number = b[ordem]
    if (typeof va === 'string') va = va.toLowerCase()
    if (typeof vb === 'string') vb = vb.toLowerCase()
    return ordemAsc ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1)
  })

  const contadores = {
    total: iniciativas.length,
    recebidas: iniciativas.filter(i => i.status === 'Recebida').length,
    emAnalise: iniciativas.filter(i => i.status === 'Em análise').length,
    aprovadas: iniciativas.filter(i => i.status === 'Aprovada').length,
    recusadas: iniciativas.filter(i => i.status === 'Recusada').length,
  }

  function ThBtn({ campo, label }: { campo: OrdemCampo; label: string }) {
    return (
      <button onClick={() => toggleOrdem(campo)} className="flex items-center gap-1 hover:text-atrio">
        {label}
        {ordem === campo && <span>{ordemAsc ? '↑' : '↓'}</span>}
      </button>
    )
  }

  return (
    <div>
      {/* Contadores */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total', valor: contadores.total, cor: 'bg-gray-50' },
          { label: 'Recebidas', valor: contadores.recebidas, cor: 'bg-blue-50' },
          { label: 'Em análise', valor: contadores.emAnalise, cor: 'bg-yellow-50' },
          { label: 'Aprovadas', valor: contadores.aprovadas, cor: 'bg-green-50' },
          { label: 'Recusadas', valor: contadores.recusadas, cor: 'bg-red-50' },
        ].map(c => (
          <div key={c.label} className={`card p-4 text-center ${c.cor}`}>
            <p className="text-2xl font-bold text-gray-900">{c.valor}</p>
            <p className="text-xs text-gray-500 mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="card p-4 mb-4 flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Buscar por título ou protocolo..."
          className="input-base w-64"
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />
        <select
          className="input-base w-40"
          value={filtroTipo}
          onChange={e => setFiltroTipo(e.target.value)}
        >
          <option value="">Todos os tipos</option>
          {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select
          className="input-base w-44"
          value=""
          onChange={e => {
            if (!filtroStatus.includes(e.target.value))
              setFiltroStatus(prev => [...prev, e.target.value])
          }}
        >
          <option value="">+ Filtrar status</option>
          {STATUS_OPCOES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {filtroStatus.map(s => (
          <button
            key={s}
            onClick={() => setFiltroStatus(prev => prev.filter(x => x !== s))}
            className="flex items-center gap-1 px-2 py-1 bg-atrio-light text-atrio rounded-lg text-sm"
          >
            {s} ×
          </button>
        ))}
      </div>

      {/* Tabela */}
      {carregando ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">
                    <ThBtn campo="protocolo" label="Protocolo" />
                  </th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">
                    <ThBtn campo="area" label="Área" />
                  </th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Tipo</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Título</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Responsável</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">
                    <ThBtn campo="created_at" label="Data" />
                  </th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">
                    <ThBtn campo="score" label="Score" />
                  </th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ordenadas.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-gray-500">
                      Nenhuma iniciativa encontrada
                    </td>
                  </tr>
                ) : ordenadas.map(ini => {
                  const bs = badgeStatus(ini.status)
                  const bt = badgeTipo(ini.tipo_iniciativa)
                  return (
                    <tr key={ini.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-atrio font-medium">
                        {ini.protocolo}
                      </td>
                      <td className="px-4 py-3 text-gray-700 max-w-28 truncate">{ini.area}</td>
                      <td className="px-4 py-3">
                        <Badge texto={ini.tipo_iniciativa} variante={bt.variante} />
                      </td>
                      <td className="px-4 py-3 text-gray-900 max-w-48 truncate">{ini.titulo}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-32 truncate">{ini.responsavel_nome}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(ini.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-atrio">{ini.score.toFixed(1)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge texto={bs.texto} variante={bs.variante} />
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/iniciativa/${ini.id}`}
                          className="text-xs btn-primary py-1.5 px-3 whitespace-nowrap"
                        >
                          Analisar
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
