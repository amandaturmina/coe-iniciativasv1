'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Archive, RotateCcw } from 'lucide-react'

interface Iniciativa {
  id: string
  protocolo: string
  titulo: string
  area: string
  tipo_iniciativa: string
  decisao: string | null
  justificativa: string | null
  status: string
  updated_at: string
  data_decisao?: string | null
}

const BADGE: Record<string, { bg: string; cor: string }> = {
  Recusada:         { bg: '#fcebeb', cor: '#c0392b' },
  'Aguardar ciclo': { bg: '#fef9ec', cor: '#b07d1a' },
}

function fmtData(iso?: string | null) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR')
}

function truncar(txt: string | null | undefined, max = 80) {
  if (!txt) return '—'
  return txt.length > max ? txt.slice(0, max) + '…' : txt
}

export default function BacklogIniciativas() {
  const router = useRouter()
  const [iniciativas, setIniciativas] = useState<Iniciativa[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroDecisao, setFiltroDecisao] = useState<'Todos' | 'Recusada' | 'Aguardar ciclo'>('Todos')
  const [reabrindo, setReabrindo] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setCarregando(true)
    const params = new URLSearchParams({ status: 'Recusada,Aguardar ciclo' })
    if (busca) params.set('busca', busca)
    const res = await fetch(`/api/iniciativas?${params}`)
    const json = await res.json()
    setIniciativas(json.dados ?? [])
    setCarregando(false)
  }, [busca])

  useEffect(() => {
    const t = setTimeout(carregar, 300)
    return () => clearTimeout(t)
  }, [carregar])

  async function reabrir(id: string) {
    setReabrindo(id)
    await fetch(`/api/iniciativas/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Recebida', decisao: null, justificativa: null }),
    })
    setReabrindo(null)
    sessionStorage.setItem('toast', 'Iniciativa reaberta e devolvida à Fila de Análise')
    router.push('/fila')
  }

  const filtradas = iniciativas.filter(i => {
    if (filtroDecisao !== 'Todos' && i.status !== filtroDecisao) return false
    return true
  })

  return (
    <div>
      {/* Filtros */}
      <div className="card p-4 mb-4 flex flex-wrap gap-3 items-center">
        <input
          type="search"
          placeholder="Buscar por título ou protocolo..."
          className="input-base w-64"
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />
        <div className="flex gap-1">
          {(['Todos', 'Recusada', 'Aguardar ciclo'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFiltroDecisao(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filtroDecisao === f
                  ? 'bg-[#451a1a] text-white'
                  : 'bg-[#f8f7f6] text-[#6b6966] hover:bg-[#f0eeec]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-[#6b6966]">{filtradas.length} iniciativa{filtradas.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Tabela */}
      {carregando ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filtradas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#f5eded] flex items-center justify-center mb-4">
            <Archive size={24} className="text-[#451a1a]" />
          </div>
          <p className="text-[#1a1917] font-medium">Nenhuma iniciativa no backlog</p>
          <p className="text-[#6b6966] text-sm mt-1">
            {busca || filtroDecisao !== 'Todos' ? 'Tente ajustar os filtros' : 'As iniciativas recusadas ou em espera aparecerão aqui'}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Protocolo</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Título</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Área</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Tipo</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Decisão</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Justificativa</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Data decisão</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtradas.map(ini => {
                  const badge = BADGE[ini.status] ?? { bg: '#f0f0f0', cor: '#555' }
                  return (
                    <tr key={ini.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-[#451a1a] font-medium">{ini.protocolo}</td>
                      <td className="px-4 py-3 text-gray-900 max-w-48 truncate">{ini.titulo}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-28 truncate">{ini.area}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{ini.tipo_iniciativa}</td>
                      <td className="px-4 py-3">
                        <span style={{
                          background: badge.bg, color: badge.cor,
                          borderRadius: 5, padding: '2px 8px', fontSize: 11, fontWeight: 600,
                        }}>
                          {ini.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 max-w-xs text-xs">{truncar(ini.justificativa)}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{fmtData(ini.data_decisao ?? ini.updated_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/iniciativa/${ini.id}`}
                            className="text-xs px-3 py-1.5 rounded-lg border border-[#ededeb] text-[#6b6966] hover:text-[#451a1a] hover:border-[#451a1a]/30 transition-colors whitespace-nowrap"
                          >
                            Ver detalhes
                          </Link>
                          {ini.status === 'Aguardar ciclo' && (
                            <button
                              onClick={() => reabrir(ini.id)}
                              disabled={reabrindo === ini.id}
                              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[#f5eded] text-[#451a1a] hover:bg-[#eddede] transition-colors whitespace-nowrap"
                            >
                              <RotateCcw size={11} />
                              {reabrindo === ini.id ? 'Reabrindo...' : 'Reabrir'}
                            </button>
                          )}
                        </div>
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
