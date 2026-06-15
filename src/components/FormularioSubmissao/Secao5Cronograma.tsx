'use client'

interface Props {
  dados: Record<string, string>
  onChange: (campo: string, valor: string) => void
  erros: Record<string, string>
}

export default function Secao5Cronograma({ dados, onChange, erros }: Props) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Data início */}
        <div>
          <label className="label-base">Data de início prevista *</label>
          <input
            type="date"
            className={`input-base ${erros.data_inicio_prevista ? 'border-red-400' : ''}`}
            value={dados.data_inicio_prevista ?? ''}
            onChange={e => onChange('data_inicio_prevista', e.target.value)}
          />
          {erros.data_inicio_prevista && <p className="text-red-500 text-xs mt-1">{erros.data_inicio_prevista}</p>}
        </div>

        {/* Data fim */}
        <div>
          <label className="label-base">Data de término prevista *</label>
          <input
            type="date"
            className={`input-base ${erros.data_fim_prevista ? 'border-red-400' : ''}`}
            value={dados.data_fim_prevista ?? ''}
            min={dados.data_inicio_prevista ?? ''}
            onChange={e => onChange('data_fim_prevista', e.target.value)}
          />
          {erros.data_fim_prevista && <p className="text-red-500 text-xs mt-1">{erros.data_fim_prevista}</p>}
        </div>
      </div>

      {/* Dependências */}
      <div>
        <label className="label-base">Dependências críticas *</label>
        <p className="text-xs text-gray-500 mb-2">
          Condições externas que precisam acontecer para o projeto avançar
        </p>
        <textarea
          rows={4}
          className={`input-base resize-none ${erros.dependencias ? 'border-red-400' : ''}`}
          placeholder="Ex: Liberação de orçamento pela diretoria, entrega do sistema X pelo fornecedor"
          value={dados.dependencias ?? ''}
          onChange={e => onChange('dependencias', e.target.value)}
        />
        {erros.dependencias && <p className="text-red-500 text-xs mt-1">{erros.dependencias}</p>}
      </div>
    </div>
  )
}
