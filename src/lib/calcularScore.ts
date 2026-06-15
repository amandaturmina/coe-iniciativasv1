interface DadosScore {
  valor_esperado: string
  data_inicio_prevista: string
  tipo_iniciativa: 'Setorial' | 'Intersetorial' | 'Cross-company'
}

export function calcularScore(dados: DadosScore): number {
  // Impacto financeiro: tem número no valor esperado?
  const temNumero = /\d/.test(dados.valor_esperado)
  const impacto_financeiro = temNumero ? 3 : 1

  // Urgência: quão próxima é a data de início?
  const hoje = new Date()
  const inicio = new Date(dados.data_inicio_prevista)
  const diffMeses = (inicio.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24 * 30)
  let urgencia = 1
  if (diffMeses < 3) urgencia = 3
  else if (diffMeses < 6) urgencia = 2

  // Abrangência por tipo
  const abrangencia =
    dados.tipo_iniciativa === 'Cross-company' ? 3
    : dados.tipo_iniciativa === 'Intersetorial' ? 2
    : 1

  const score = ((impacto_financeiro * 0.30) + (urgencia * 0.15) + (abrangencia * 0.05)) / 0.50 * 3
  return Math.round(score * 100) / 100
}
