'use client'

interface Props {
  dados: Record<string, unknown>
  onChange: (campo: string, valor: unknown) => void
  erros: Record<string, string>
}

export default function Secao3Custos({ dados, onChange, erros }: Props) {
  return (
    <div className="space-y-6">
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
        Esta seção é opcional. Se ainda não tiver os custos definidos, pode preencher posteriormente.
      </div>

      {/* Custo estimado */}
      <div>
        <label className="label-base">Custo estimado total (R$)</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">R$</span>
          <input
            type="number"
            step="0.01"
            min="0"
            className="input-base pl-8"
            placeholder="0,00"
            value={(dados.custo_estimado as string) ?? ''}
            onChange={e => onChange('custo_estimado', e.target.value)}
          />
        </div>
        {erros.custo_estimado && <p className="text-red-500 text-xs mt-1">{erros.custo_estimado}</p>}
      </div>

      {/* Detalhamento */}
      <div>
        <label className="label-base">Detalhamento dos custos</label>
        <textarea
          rows={4}
          className="input-base resize-none"
          placeholder="Ex: R$ 15k consultoria, R$ 5k licença de software, R$ 3k treinamento"
          value={(dados.detalhamento_custos as string) ?? ''}
          onChange={e => onChange('detalhamento_custos', e.target.value)}
        />
      </div>
    </div>
  )
}
