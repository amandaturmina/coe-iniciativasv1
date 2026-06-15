'use client'

interface Props {
  dados: Record<string, unknown>
  onChange: (campo: string, valor: unknown) => void
  erros: Record<string, string>
}

export default function Secao6Recursos({ dados, onChange, erros }: Props) {
  const temTerceiros = dados.tem_terceiros === 'true' || dados.tem_terceiros === true

  return (
    <div className="space-y-6">
      {/* Equipe */}
      <div>
        <label className="label-base">Equipe executora *</label>
        <p className="text-xs text-gray-500 mb-2">
          Indique os integrantes da equipe e suas funções no projeto
        </p>
        <textarea
          rows={4}
          className={`input-base resize-none ${erros.equipe ? 'border-red-400' : ''}`}
          placeholder="Ex: Ana Silva (líder do projeto), João Costa (analista financeiro)"
          value={(dados.equipe as string) ?? ''}
          onChange={e => onChange('equipe', e.target.value)}
        />
        {erros.equipe && <p className="text-red-500 text-xs mt-1">{erros.equipe}</p>}
      </div>

      {/* Terceiros */}
      <div>
        <label className="label-base">Terceiros envolvidos? *</label>
        <div className="flex gap-4 mt-2">
          {['Sim', 'Não'].map(opcao => (
            <label
              key={opcao}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 cursor-pointer transition-colors ${
                (opcao === 'Sim' ? temTerceiros : !temTerceiros) && dados.tem_terceiros !== undefined
                  ? 'border-atrio bg-atrio-light'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="tem_terceiros"
                value={opcao}
                checked={opcao === 'Sim' ? temTerceiros : (!temTerceiros && dados.tem_terceiros !== undefined)}
                onChange={() => onChange('tem_terceiros', opcao === 'Sim' ? 'true' : 'false')}
                className="accent-atrio"
              />
              <span className="font-medium">{opcao}</span>
            </label>
          ))}
        </div>
        {erros.tem_terceiros && <p className="text-red-500 text-xs mt-1">{erros.tem_terceiros}</p>}
      </div>

      {/* Quem são os terceiros (condicional) */}
      {temTerceiros && (
        <div className="animate-in slide-in-from-top-2">
          <label className="label-base">Quem são os terceiros? *</label>
          <textarea
            rows={3}
            className={`input-base resize-none ${erros.terceiros ? 'border-red-400' : ''}`}
            placeholder="Ex: Empresa XYZ (consultoria), Fornecedor ABC (software)"
            value={(dados.terceiros as string) ?? ''}
            onChange={e => onChange('terceiros', e.target.value)}
          />
          {erros.terceiros && <p className="text-red-500 text-xs mt-1">{erros.terceiros}</p>}
        </div>
      )}
    </div>
  )
}
