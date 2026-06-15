'use client'

import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
  LineChart, Line,
} from 'recharts'

interface Iniciativa {
  id: string
  protocolo: string
  titulo: string
  area: string
  status: string
  decisao: string | null
  score: number
  roi_estimado: number | null
  roi_realizado: number | null
  created_at: string
  data_decisao: string | null
}

const CORES = ['#1D6B4A','#2D9B6E','#4ade80','#facc15','#f87171','#a78bfa','#60a5fa','#fb923c']
const PERIODOS = [
  { label: '30 dias', dias: 30 },
  { label: '90 dias', dias: 90 },
  { label: '180 dias', dias: 180 },
  { label: '365 dias', dias: 365 },
]

export default function DashboardRelatorios() {
  const [dados, setDados] = useState<Iniciativa[]>([])
  const [periodo, setPeriodo] = useState(90)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    async function carregar() {
      setCarregando(true)
      const res = await fetch(`/api/iniciativas?dias=${periodo}`)
      const json = await res.json()
      setDados(json.dados ?? [])
      setCarregando(false)
    }
    carregar()
  }, [periodo])

  if (carregando) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse" />)}
      </div>
    )
  }

  const aprovadas = dados.filter(d => d.decisao === 'Aprovada')
  const recusadas = dados.filter(d => d.decisao === 'Recusada')
  const taxaAprovacao = dados.length > 0 ? Math.round((aprovadas.length / dados.length) * 100) : 0

  const tempoMedioDecisao = dados
    .filter(d => d.data_decisao)
    .map(d => (new Date(d.data_decisao!).getTime() - new Date(d.created_at).getTime()) / (1000 * 60 * 60 * 24))
    .reduce((a, b, _, arr) => a + b / arr.length, 0)

  const roiEstimadoTotal = aprovadas.reduce((a, d) => a + (d.roi_estimado ?? 0), 0)
  const roiRealizadoTotal = dados.filter(d => d.status === 'Concluída').reduce((a, d) => a + (d.roi_realizado ?? 0), 0)

  // Dados para gráfico de barras por área
  const areas = [...new Set(dados.map(d => d.area))]
  const dadosPorArea = areas.map(area => ({
    area: area.length > 15 ? area.substring(0, 15) + '…' : area,
    areaFull: area,
    aprovadas: dados.filter(d => d.area === area && d.decisao === 'Aprovada').length,
    recusadas: dados.filter(d => d.area === area && d.decisao === 'Recusada').length,
    scoreMedio: +(dados.filter(d => d.area === area).reduce((a, d, _, arr) => a + d.score / arr.length, 0)).toFixed(1),
    submetidas: dados.filter(d => d.area === area).length,
  })).sort((a, b) => b.submetidas - a.submetidas)

  // Dados para PieChart de status
  const statusCount = Object.entries(
    dados.reduce((acc, d) => ({ ...acc, [d.status]: (acc[d.status] ?? 0) + 1 }), {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }))

  // Dados para LineChart por mês
  const meses: Record<string, number> = {}
  dados.forEach(d => {
    const mes = new Date(d.created_at).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
    meses[mes] = (meses[mes] ?? 0) + 1
  })
  const dadosMes = Object.entries(meses).map(([mes, total]) => ({ mes, total }))

  function CardMetrica({ label, valor, sub }: { label: string; valor: string | number; sub?: string }) {
    return (
      <div className="card p-4">
        <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{valor}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    )
  }

  return (
    <div>
      {/* Filtro de período */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {PERIODOS.map(p => (
          <button
            key={p.dias}
            onClick={() => setPeriodo(p.dias)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              periodo === p.dias ? 'bg-atrio text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-atrio'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <CardMetrica label="Total submetidas" valor={dados.length} />
        <CardMetrica label="Aprovadas" valor={aprovadas.length} />
        <CardMetrica label="Recusadas" valor={recusadas.length} />
        <CardMetrica label="Taxa de aprovação" valor={`${taxaAprovacao}%`} />
        <CardMetrica label="Tempo médio decisão" valor={`${tempoMedioDecisao.toFixed(1)} dias`} />
        <CardMetrica label="ROI estimado total" valor={roiEstimadoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })} />
        <CardMetrica label="ROI realizado total" valor={roiRealizadoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })} />
        <CardMetrica label="Score médio" valor={(dados.reduce((a, d) => a + d.score, 0) / Math.max(dados.length, 1)).toFixed(1)} />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Barras por área */}
        <div className="card p-4">
          <h3 className="font-semibold text-gray-900 mb-4 text-sm">Iniciativas por Área</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dadosPorArea.slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="area" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="aprovadas" fill="#1D6B4A" name="Aprovadas" />
              <Bar dataKey="recusadas" fill="#f87171" name="Recusadas" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Distribuição por status */}
        <div className="card p-4">
          <h3 className="font-semibold text-gray-900 mb-4 text-sm">Distribuição por Status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusCount} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {statusCount.map((_, i) => <Cell key={i} fill={CORES[i % CORES.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Volume por mês */}
        <div className="card p-4">
          <h3 className="font-semibold text-gray-900 mb-4 text-sm">Volume de Submissões por Mês</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={dadosMes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#1D6B4A" strokeWidth={2} dot={{ fill: '#1D6B4A' }} name="Submissões" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Score médio por área */}
        <div className="card p-4">
          <h3 className="font-semibold text-gray-900 mb-4 text-sm">Score Médio por Área</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dadosPorArea.slice(0, 8)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis dataKey="area" type="category" tick={{ fontSize: 10 }} width={90} />
              <Tooltip />
              <Bar dataKey="scoreMedio" fill="#2D9B6E" name="Score médio" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabelas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Ranking de áreas */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm">Ranking de Áreas</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  {['Área','Submetidas','Aprovadas','Taxa%','Score médio'].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-gray-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dadosPorArea.map(d => (
                  <tr key={d.areaFull} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-900 font-medium">{d.areaFull}</td>
                    <td className="px-3 py-2 text-gray-600">{d.submetidas}</td>
                    <td className="px-3 py-2 text-green-700">{d.aprovadas}</td>
                    <td className="px-3 py-2">{d.submetidas > 0 ? Math.round((d.aprovadas / d.submetidas) * 100) : 0}%</td>
                    <td className="px-3 py-2 text-atrio font-medium">{d.scoreMedio}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Comparativo ROI */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm">Comparativo ROI</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  {['Protocolo','Título','Est.','Realiz.','Var.%'].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-gray-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {aprovadas.filter(d => d.roi_estimado).map(d => {
                  const variacao = d.roi_estimado && d.roi_realizado
                    ? Math.round(((d.roi_realizado - d.roi_estimado) / d.roi_estimado) * 100)
                    : null
                  return (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-mono text-atrio">{d.protocolo}</td>
                      <td className="px-3 py-2 text-gray-700 max-w-24 truncate">{d.titulo}</td>
                      <td className="px-3 py-2">{d.roi_estimado?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }) ?? '—'}</td>
                      <td className="px-3 py-2">{d.roi_realizado?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }) ?? '—'}</td>
                      <td className={`px-3 py-2 font-medium ${variacao == null ? '' : variacao >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                        {variacao == null ? '—' : `${variacao > 0 ? '+' : ''}${variacao}%`}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
