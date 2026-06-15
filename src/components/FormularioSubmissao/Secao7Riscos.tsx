'use client'

export interface Risco {
  descricao: string
  probabilidade: '1' | '2' | '3' | ''
  impacto: '1' | '2' | '3' | ''
  nivel: string
}

function calcularNivel(prob: string, imp: string): { texto: string; cor: string } {
  const p = parseInt(prob)
  const i = parseInt(imp)
  if (!p || !i) return { texto: '—', cor: 'bg-gray-100 text-gray-500' }

  if (p === 3 && i === 3) return { texto: 'Crítico', cor: 'bg-red-900 text-white' }
  if ((p === 2 && i === 3) || (p === 3 && i === 2)) return { texto: 'Alto', cor: 'bg-red-100 text-red-800' }
  if ((p === 2 && i === 2) || (p === 1 && i === 3) || (p === 3 && i === 1)) return { texto: 'Médio', cor: 'bg-orange-100 text-orange-800' }
  if ((p === 1 && i === 2) || (p === 2 && i === 1)) return { texto: 'Baixo-Médio', cor: 'bg-yellow-100 text-yellow-800' }
  return { texto: 'Baixo', cor: 'bg-green-100 text-green-800' }
}

interface Props {
  riscos: Risco[]
  onChange: (riscos: Risco[]) => void
  erros: Record<string, string>
}

export default function Secao7Riscos({ riscos, onChange, erros }: Props) {
  function atualizarRisco(index: number, campo: keyof Risco, valor: string) {
    const novos = [...riscos]
    novos[index] = { ...novos[index], [campo]: valor }
    // recalcular nível
    const nivel = calcularNivel(
      campo === 'probabilidade' ? valor : novos[index].probabilidade,
      campo === 'impacto' ? valor : novos[index].impacto
    )
    novos[index].nivel = nivel.texto
    onChange(novos)
  }

  function adicionarRisco() {
    if (riscos.length >= 5) return
    onChange([...riscos, { descricao: '', probabilidade: '', impacto: '', nivel: '' }])
  }

  function removerRisco(index: number) {
    onChange(riscos.filter((_, i) => i !== index))
  }

  const ultimoRiscoPreenchido = riscos.length > 0 && riscos[riscos.length - 1].descricao.length > 0

  return (
    <div className="space-y-6">
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
        Identifique os principais riscos do projeto. O nível de risco é calculado automaticamente.
      </div>

      {riscos.map((risco, index) => {
        const nivel = calcularNivel(risco.probabilidade, risco.impacto)
        return (
          <div key={index} className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Risco {index + 1}</h3>
              <div className="flex items-center gap-3">
                {risco.probabilidade && risco.impacto && (
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${nivel.cor}`}>
                    {nivel.texto}
                  </span>
                )}
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => removerRisco(index)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Remover
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="label-base">Descrição {index === 0 ? '*' : ''}</label>
              <textarea
                rows={3}
                className="input-base resize-none"
                placeholder="Ex: Atraso de fornecedor, indisponibilidade de equipe"
                value={risco.descricao}
                onChange={e => atualizarRisco(index, 'descricao', e.target.value)}
              />
            </div>

            {risco.descricao && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-base">Probabilidade</label>
                  <div className="flex gap-2 mt-1">
                    {[['1','Baixa'],['2','Média'],['3','Alta']].map(([v, l]) => (
                      <label
                        key={v}
                        className={`flex-1 text-center py-2 rounded-lg border cursor-pointer text-sm transition-colors ${
                          risco.probabilidade === v
                            ? 'border-atrio bg-atrio-light text-atrio font-medium'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`prob-${index}`}
                          value={v}
                          checked={risco.probabilidade === v}
                          onChange={e => atualizarRisco(index, 'probabilidade', e.target.value)}
                          className="sr-only"
                        />
                        {l}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="label-base">Impacto</label>
                  <div className="flex gap-2 mt-1">
                    {[['1','Baixo'],['2','Médio'],['3','Alto']].map(([v, l]) => (
                      <label
                        key={v}
                        className={`flex-1 text-center py-2 rounded-lg border cursor-pointer text-sm transition-colors ${
                          risco.impacto === v
                            ? 'border-atrio bg-atrio-light text-atrio font-medium'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`imp-${index}`}
                          value={v}
                          checked={risco.impacto === v}
                          onChange={e => atualizarRisco(index, 'impacto', e.target.value)}
                          className="sr-only"
                        />
                        {l}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {ultimoRiscoPreenchido && riscos.length < 5 && (
        <button
          type="button"
          onClick={adicionarRisco}
          className="flex items-center gap-2 text-sm text-atrio hover:text-atrio-dark font-medium"
        >
          <span className="text-lg">+</span> Adicionar risco
        </button>
      )}

      {erros.riscos && <p className="text-red-500 text-xs mt-1">{erros.riscos}</p>}
    </div>
  )
}
