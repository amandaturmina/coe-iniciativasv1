'use client'

interface Props {
  dados: Record<string, string>
  onChange: (campo: string, valor: string) => void
  erros: Record<string, string>
}

export default function Secao4EscopoEntregas({ dados, onChange, erros }: Props) {
  return (
    <div className="space-y-6">
      {/* Entregas */}
      <div>
        <label className="label-base">Principais entregas esperadas *</label>
        <p className="text-xs text-gray-500 mb-2">Liste de 3 a 5 resultados que o projeto deve entregar</p>
        <textarea
          rows={5}
          className={`input-base resize-none ${erros.entregas ? 'border-red-400' : ''}`}
          placeholder={'Ex:\n1. Novo relatório gerencial automatizado\n2. Processo de conciliação automatizado\n3. Treinamento da equipe concluído'}
          value={dados.entregas ?? ''}
          onChange={e => onChange('entregas', e.target.value)}
        />
        {erros.entregas && <p className="text-red-500 text-xs mt-1">{erros.entregas}</p>}
      </div>

      {/* Fora do escopo */}
      <div>
        <label className="label-base">Fora do escopo *</label>
        <p className="text-xs text-gray-500 mb-2">
          Registre o que NÃO será tratado pelo projeto, mas que pode gerar expectativa
        </p>
        <textarea
          rows={4}
          className={`input-base resize-none ${erros.fora_escopo ? 'border-red-400' : ''}`}
          placeholder="Ex: Integração com sistemas de outras empresas do grupo"
          value={dados.fora_escopo ?? ''}
          onChange={e => onChange('fora_escopo', e.target.value)}
        />
        {erros.fora_escopo && <p className="text-red-500 text-xs mt-1">{erros.fora_escopo}</p>}
      </div>
    </div>
  )
}
