'use client'

const AREAS = [
  'Operações','A&B&E','Recursos Humanos','Jurídico','Vendas','Marketing',
  'Revenue Management (RM)','Contabilidade','Contabilidade Fiscal','Escrituração',
  'Master Data Management (MDM)','Departamento Pessoal','Contas a Pagar',
  'Contas a Receber','Faturamento','Cobrança','Conciliação de Cartões','FP&A',
  'Controles Internos','Relacionamento com Investidor (RI)',
  'Inteligência de Compras','Tecnologia da Informação (TI)',
]

const TIPOS = [
  { value: 'Setorial', descricao: 'Iniciativa com impacto apenas dentro da sua área' },
  { value: 'Intersetorial', descricao: 'Envolve duas ou mais áreas específicas, mas não a companhia inteira' },
  { value: 'Cross-company', descricao: 'Impacta transversalmente várias áreas ou toda a companhia' },
]

interface Props {
  dados: Record<string, string>
  onChange: (campo: string, valor: string) => void
  erros: Record<string, string>
}

export default function Secao1Identificacao({ dados, onChange, erros }: Props) {
  return (
    <div className="space-y-6">
      {/* Título */}
      <div>
        <label className="label-base">Título da Iniciativa *</label>
        <input
          type="text"
          className={`input-base ${erros.titulo ? 'border-red-400' : ''}`}
          placeholder="Ex: Automação do processo de conciliação bancária"
          value={dados.titulo ?? ''}
          onChange={e => onChange('titulo', e.target.value)}
        />
        {erros.titulo && <p className="text-red-500 text-xs mt-1">{erros.titulo}</p>}
      </div>

      {/* Área */}
      <div>
        <label className="label-base">Área responsável *</label>
        <select
          className={`input-base ${erros.area ? 'border-red-400' : ''}`}
          value={dados.area ?? ''}
          onChange={e => onChange('area', e.target.value)}
        >
          <option value="">Selecione a área</option>
          {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        {erros.area && <p className="text-red-500 text-xs mt-1">{erros.area}</p>}
      </div>

      {/* Tipo */}
      <div>
        <label className="label-base">Tipo da iniciativa *</label>
        <div className="space-y-3">
          {TIPOS.map(tipo => (
            <label
              key={tipo.value}
              className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                dados.tipo_iniciativa === tipo.value
                  ? 'border-atrio bg-atrio-light'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="tipo_iniciativa"
                value={tipo.value}
                checked={dados.tipo_iniciativa === tipo.value}
                onChange={e => onChange('tipo_iniciativa', e.target.value)}
                className="mt-0.5 accent-atrio"
              />
              <div>
                <p className="font-medium text-gray-900">{tipo.value}</p>
                <p className="text-sm text-gray-500">{tipo.descricao}</p>
              </div>
            </label>
          ))}
        </div>
        {erros.tipo_iniciativa && <p className="text-red-500 text-xs mt-1">{erros.tipo_iniciativa}</p>}
      </div>

      {/* Patrocinador */}
      <div>
        <label className="label-base">Patrocinador *</label>
        <input
          type="text"
          className={`input-base ${erros.patrocinador ? 'border-red-400' : ''}`}
          placeholder="Nome do patrocinador"
          value={dados.patrocinador ?? ''}
          onChange={e => onChange('patrocinador', e.target.value)}
        />
        <p className="text-xs text-gray-500 mt-1">Pessoa da liderança que aprova, apoia e garante recursos</p>
        {erros.patrocinador && <p className="text-red-500 text-xs mt-1">{erros.patrocinador}</p>}
      </div>

      {/* Responsável */}
      <div>
        <label className="label-base">Responsável pela decisão *</label>
        <input
          type="text"
          className={`input-base ${erros.responsavel_nome ? 'border-red-400' : ''}`}
          placeholder="Nome do responsável"
          value={dados.responsavel_nome ?? ''}
          onChange={e => onChange('responsavel_nome', e.target.value)}
        />
        <p className="text-xs text-gray-500 mt-1">Gestor que toma as decisões operacionais sobre a iniciativa</p>
        {erros.responsavel_nome && <p className="text-red-500 text-xs mt-1">{erros.responsavel_nome}</p>}
      </div>

      {/* E-mail */}
      <div>
        <label className="label-base">E-mail do responsável *</label>
        <input
          type="email"
          className={`input-base ${erros.responsavel_email ? 'border-red-400' : ''}`}
          placeholder="nome@atriohoteis.com.br"
          value={dados.responsavel_email ?? ''}
          onChange={e => onChange('responsavel_email', e.target.value)}
        />
        {erros.responsavel_email && <p className="text-red-500 text-xs mt-1">{erros.responsavel_email}</p>}
      </div>
    </div>
  )
}
