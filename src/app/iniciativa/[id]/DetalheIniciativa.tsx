'use client'

import { useState } from 'react'
import Badge, { badgeStatus } from '@/components/Badge'
import Scorecard from '@/components/Scorecard'
import PainelDecisao from '@/components/PainelDecisao'

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
}

const ABAS = ['Identificação','Problema e Valor','Custos','Escopo','Cronograma','Recursos','Riscos','EAP','Anexos']

interface Props {
  iniciativa: Iniciativa
  perfil: string
}

export default function DetalheIniciativa({ iniciativa: ini, perfil }: Props) {
  const [aba, setAba] = useState(0)
  const [scorecard, setScorecard] = useState<Record<string, number>>(ini.scorecard ?? {})
  const [recarregar, setRecarregar] = useState(0)

  async function salvarScorecard(sc: Record<string, number>, scoreTotal: number) {
    setScorecard(sc)
    await fetch(`/api/iniciativas/${ini.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scorecard: sc, score: scoreTotal }),
    })
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
        {/* Coluna principal (60%) */}
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
            {aba === 0 && (
              <dl className="space-y-4">
                {[
                  ['Título', ini.titulo],
                  ['Área', ini.area],
                  ['Tipo', ini.tipo_iniciativa],
                  ['Patrocinador', ini.patrocinador],
                  ['Responsável', ini.responsavel_nome],
                  ['E-mail', ini.responsavel_email],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{k}</dt>
                    <dd className="text-gray-900 mt-0.5">{v}</dd>
                  </div>
                ))}
              </dl>
            )}

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

            {aba === 2 && (
              <div className="space-y-4">
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Custo estimado total</dt>
                  <dd className="text-gray-900 mt-0.5">
                    {ini.custo_estimado
                      ? ini.custo_estimado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                      : 'Não informado'}
                  </dd>
                </div>
                {ini.detalhamento_custos && (
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Detalhamento</dt>
                    <dd className="text-gray-900 mt-0.5 whitespace-pre-line">{ini.detalhamento_custos}</dd>
                  </div>
                )}
              </div>
            )}

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

            {aba === 4 && (
              <dl className="space-y-4">
                {[
                  ['Data de início prevista', ini.data_inicio_prevista ? new Date(ini.data_inicio_prevista + 'T00:00:00').toLocaleDateString('pt-BR') : '—'],
                  ['Data de término prevista', ini.data_fim_prevista ? new Date(ini.data_fim_prevista + 'T00:00:00').toLocaleDateString('pt-BR') : '—'],
                ].map(([k, v]) => (
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
                        <span>Probabilidade: {['','Baixa','Média','Alta'][parseInt(r.probabilidade)] ?? r.probabilidade}</span>
                        <span>Impacto: {['','Baixo','Médio','Alto'][parseInt(r.impacto)] ?? r.impacto}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {aba === 7 && (
              <div>
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Atividades</h3>
                <p className="text-gray-900 whitespace-pre-line">{ini.eap}</p>
              </div>
            )}

            {aba === 8 && (
              <div>
                {(ini.anexos ?? []).length === 0 ? (
                  <p className="text-gray-500">Nenhum anexo enviado.</p>
                ) : (
                  <ul className="space-y-2">
                    {ini.anexos.map((path, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-atrio">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        {path.split('/').pop()}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Coluna lateral (40%) — apenas para gestor */}
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
