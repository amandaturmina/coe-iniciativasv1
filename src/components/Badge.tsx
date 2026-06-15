interface BadgeProps {
  texto: string
  variante?: 'azul' | 'verde' | 'amarelo' | 'vermelho' | 'cinza' | 'roxo' | 'laranja' | 'vermelho-escuro'
  className?: string
}

const variantes = {
  azul: 'bg-blue-100 text-blue-800',
  verde: 'bg-green-100 text-green-800',
  amarelo: 'bg-yellow-100 text-yellow-800',
  vermelho: 'bg-red-100 text-red-800',
  cinza: 'bg-gray-100 text-gray-700',
  roxo: 'bg-purple-100 text-purple-800',
  laranja: 'bg-orange-100 text-orange-800',
  'vermelho-escuro': 'bg-red-200 text-red-900',
}

export default function Badge({ texto, variante = 'cinza', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantes[variante]} ${className}`}>
      {texto}
    </span>
  )
}

export function badgeStatus(status: string) {
  const mapa: Record<string, { texto: string; variante: BadgeProps['variante'] }> = {
    'Recebida': { texto: 'Recebida', variante: 'azul' },
    'Em análise': { texto: 'Em análise', variante: 'amarelo' },
    'Aprovada': { texto: 'Aprovada', variante: 'verde' },
    'Recusada': { texto: 'Recusada', variante: 'vermelho' },
    'Aguardar ciclo': { texto: 'Aguardar ciclo', variante: 'cinza' },
    'Em planejamento': { texto: 'Em planejamento', variante: 'azul' },
    'Em andamento': { texto: 'Em andamento', variante: 'amarelo' },
    'Concluída': { texto: 'Concluída', variante: 'verde' },
    'Pausada': { texto: 'Pausada', variante: 'cinza' },
  }
  return mapa[status] ?? { texto: status, variante: 'cinza' as const }
}

export function badgeTipo(tipo: string) {
  const mapa: Record<string, { variante: BadgeProps['variante'] }> = {
    'Setorial': { variante: 'cinza' },
    'Intersetorial': { variante: 'azul' },
    'Cross-company': { variante: 'roxo' },
  }
  return mapa[tipo] ?? { variante: 'cinza' as const }
}
