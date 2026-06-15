'use client'

interface Props {
  dados: Record<string, string>
  onChange: (campo: string, valor: string) => void
  erros: Record<string, string>
}

export default function Secao8EAP({ dados, onChange, erros }: Props) {
  return (
    <div className="space-y-6">
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
        A EAP (Estrutura Analítica do Projeto) organiza as atividades em sequência lógica,
        facilitando o planejamento e acompanhamento do projeto.
      </div>

      <div>
        <label className="label-base">Lista de atividades *</label>
        <p className="text-xs text-gray-500 mb-2">
          Liste as principais atividades do projeto, uma por linha, indicando o responsável entre parênteses quando aplicável
        </p>
        <textarea
          rows={8}
          className={`input-base resize-none ${erros.eap ? 'border-red-400' : ''}`}
          placeholder={'1. Levantamento de requisitos (Ana Silva)\n2. Desenvolvimento do protótipo (TI)\n3. Testes e validação (equipe financeira)\n4. Treinamento (RH)\n5. Go-live e monitoramento'}
          value={dados.eap ?? ''}
          onChange={e => onChange('eap', e.target.value)}
        />
        {erros.eap && <p className="text-red-500 text-xs mt-1">{erros.eap}</p>}
      </div>
    </div>
  )
}
