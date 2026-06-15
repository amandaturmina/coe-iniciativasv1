'use client'

const AREAS = [
  'Operações','A&B&E','Recursos Humanos','Jurídico','Vendas','Marketing',
  'Revenue Management (RM)','Contabilidade','Contabilidade Fiscal','Escrituração',
  'Master Data Management (MDM)','Departamento Pessoal','Contas a Pagar',
  'Contas a Receber','Faturamento','Cobrança','Conciliação de Cartões','FP&A',
  'Controles Internos','Relacionamento com Investidor (RI)',
  'Inteligência de Compras','Tecnologia da Informação (TI)',
]

interface Props {
  dados: Record<string, unknown>
  onChange: (campo: string, valor: unknown) => void
  erros: Record<string, string>
}

export default function Secao2ProblemaValor({ dados, onChange, erros }: Props) {
  const beneficiarios = (dados.beneficiarios as string[]) ?? []

  function toggleBeneficiario(area: string) {
    const atual = beneficiarios
    if (atual.includes(area)) {
      onChange('beneficiarios', atual.filter(a => a !== area))
    } else {
      onChange('beneficiarios', [...atual, area])
    }
  }

  return (
    <div className="space-y-6">
      {/* Problema */}
      <div>
        <label className="label-base">Qual problema será resolvido? *</label>
        <p className="text-xs text-gray-500 mb-2">Explique o cenário atual e a dor</p>
        <textarea
          rows={5}
          className={`input-base resize-none ${erros.problema ? 'border-red-400' : ''}`}
          placeholder="Ex: Atualmente o processo de conciliação é feito manualmente, levando 3 dias e gerando erros frequentes..."
          value={(dados.problema as string) ?? ''}
          onChange={e => onChange('problema', e.target.value)}
        />
        {erros.problema && <p className="text-red-500 text-xs mt-1">{erros.problema}</p>}
      </div>

      {/* Valor esperado */}
      <div>
        <label className="label-base">Valor esperado ao final *</label>
        <p className="text-xs text-gray-500 mb-2">Benefício ou ganho mensurável esperado com a iniciativa</p>
        <textarea
          rows={3}
          className={`input-base resize-none ${erros.valor_esperado ? 'border-red-400' : ''}`}
          placeholder="Ex: Reduzir tempo em 40% ou +R$ 50k/mês"
          value={(dados.valor_esperado as string) ?? ''}
          onChange={e => onChange('valor_esperado', e.target.value)}
        />
        {erros.valor_esperado && <p className="text-red-500 text-xs mt-1">{erros.valor_esperado}</p>}
      </div>

      {/* Beneficiários */}
      <div>
        <label className="label-base">Beneficiários principais *</label>
        <p className="text-xs text-gray-500 mb-3">
          Áreas ou unidades que terão maior impacto ou benefício direto. Selecione ao menos uma.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {AREAS.map(area => (
            <label
              key={area}
              className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer text-sm transition-colors ${
                beneficiarios.includes(area)
                  ? 'border-atrio bg-atrio-light text-atrio font-medium'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <input
                type="checkbox"
                checked={beneficiarios.includes(area)}
                onChange={() => toggleBeneficiario(area)}
                className="accent-atrio flex-shrink-0"
              />
              <span className="leading-tight">{area}</span>
            </label>
          ))}
        </div>
        {erros.beneficiarios && <p className="text-red-500 text-xs mt-2">{erros.beneficiarios}</p>}
      </div>
    </div>
  )
}
