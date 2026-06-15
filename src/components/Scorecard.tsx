'use client'

import { useState } from 'react'

interface Dimensao {
  key: string
  label: string
  peso: number
  criterio: string
}

const DIMENSOES_PADRAO: Dimensao[] = [
  { key: 'impacto', label: 'Impacto no Negócio', peso: 30, criterio: '1=Baixo impacto local | 2=Impacto moderado | 3=Impacto transformador ou financeiro significativo' },
  { key: 'urgencia', label: 'Urgência / Oportunidade', peso: 20, criterio: '1=Sem urgência | 2=Pode aguardar ciclo | 3=Urgente, janela de oportunidade' },
  { key: 'viabilidade', label: 'Viabilidade', peso: 20, criterio: '1=Alta complexidade/custo | 2=Viável com esforço | 3=Simples, recursos disponíveis' },
  { key: 'abrangencia', label: 'Abrangência', peso: 15, criterio: '1=Setorial | 2=Intersetorial | 3=Cross-company' },
  { key: 'alinhamento', label: 'Alinhamento Estratégico', peso: 10, criterio: '1=Pouco relacionado | 2=Alinhado a objetivos | 3=Estratégico e priorizado pela liderança' },
  { key: 'maturidade', label: 'Maturidade da Proposta', peso: 5, criterio: '1=Ideia vaga | 2=Bem descrita | 3=Detalhada com cronograma e riscos mapeados' },
]

interface Props {
  scorecard?: Record<string, number>
  onSalvar: (scorecard: Record<string, number>, scoreTotal: number) => void
}

function getVeredito(pct: number) {
  if (pct >= 80) return { texto: 'Prioridade Alta', cor: 'bg-green-100 text-green-800 border-green-200' }
  if (pct >= 60) return { texto: 'Análise Recomendada', cor: 'bg-yellow-100 text-yellow-800 border-yellow-200' }
  if (pct >= 40) return { texto: 'Backlog', cor: 'bg-orange-100 text-orange-800 border-orange-200' }
  return { texto: 'Reconsiderar', cor: 'bg-red-100 text-red-800 border-red-200' }
}

export default function Scorecard({ scorecard = {}, onSalvar }: Props) {
  const [valores, setValores] = useState<Record<string, number>>(scorecard)

  function atualizar(key: string, valor: number) {
    setValores(prev => {
      const novo = { ...prev, [key]: valor }
      const pontos = DIMENSOES_PADRAO.reduce((acc, d) => acc + (novo[d.key] ?? 0) * d.peso, 0)
      const max = DIMENSOES_PADRAO.reduce((acc, d) => acc + 3 * d.peso, 0)
      const scoreTotal = Math.round((pontos / max) * 300) / 100
      onSalvar(novo, scoreTotal)
      return novo
    })
  }

  const pontos = DIMENSOES_PADRAO.reduce((acc, d) => acc + (valores[d.key] ?? 0) * d.peso, 0)
  const max = DIMENSOES_PADRAO.reduce((acc, d) => acc + 3 * d.peso, 0)
  const pct = Math.round((pontos / max) * 100)
  const veredito = getVeredito(pct)

  return (
    <div className="space-y-4">
      {/* Score total */}
      <div className={`p-4 rounded-xl border-2 ${veredito.cor}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Score Ponderado</span>
          <span className="text-2xl font-bold">{pct}%</span>
        </div>
        <div className="h-2 bg-white/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-current rounded-full transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-sm font-semibold mt-2">{veredito.texto}</p>
      </div>

      {/* Dimensões */}
      {DIMENSOES_PADRAO.map(d => (
        <div key={d.key} className="card p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="font-medium text-gray-900 text-sm">{d.label}</p>
              <p className="text-xs text-gray-400">Peso: {d.peso}%</p>
            </div>
          </div>
          <div className="flex gap-2 mb-2">
            {[1, 2, 3].map(v => (
              <button
                key={v}
                type="button"
                onClick={() => atualizar(d.key, v)}
                className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                  valores[d.key] === v
                    ? 'border-atrio bg-atrio text-white'
                    : 'border-gray-200 text-gray-600 hover:border-atrio/50'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500">{d.criterio}</p>
        </div>
      ))}
    </div>
  )
}
