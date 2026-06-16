import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LayoutProtegido from '@/components/LayoutProtegido'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('nome, perfil, area')
    .eq('id', user.id)
    .single()

  const cards = [
    {
      href: '/submeter',
      titulo: 'Submeter Iniciativa',
      descricao: 'Registre uma nova iniciativa para análise do COE',
      icone: '📝',
      cor: 'bg-blue-50 border-blue-200',
      corBtn: 'bg-blue-600',
      perfis: ['colaborador', 'gestor', 'lideranca'],
    },
    {
      href: '/fila',
      titulo: 'Fila de Análise',
      descricao: 'Visualize e analise as iniciativas submetidas',
      icone: '📋',
      cor: 'bg-amber-50 border-amber-200',
      corBtn: 'bg-amber-600',
      perfis: ['gestor'],
    },
    {
      href: '/acompanhamento',
      titulo: 'Acompanhamento',
      descricao: 'Kanban com o andamento das iniciativas aprovadas',
      icone: '📊',
      cor: 'bg-purple-50 border-purple-200',
      corBtn: 'bg-purple-600',
      perfis: ['gestor', 'lideranca'],
    },
    {
      href: '/relatorios',
      titulo: 'Relatórios',
      descricao: 'Dashboard com métricas e gráficos do portfólio',
      icone: '📈',
      cor: 'bg-green-50 border-green-200',
      corBtn: 'bg-green-600',
      perfis: ['gestor', 'lideranca'],
    },
  ]

  const cardsVisiveis = cards.filter(c => c.perfis.includes(profile?.perfil ?? 'colaborador'))

  return (
    <LayoutProtegido>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Olá, {profile?.nome?.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-500 mt-1">
            Bem-vindo ao System COE Átrio Hotel Management.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cardsVisiveis.map(card => (
            <Link
              key={card.href}
              href={card.href}
              className={`card border p-6 hover:shadow-md transition-shadow ${card.cor}`}
            >
              <div className="text-3xl mb-3">{card.icone}</div>
              <h2 className="text-lg font-semibold text-gray-900">{card.titulo}</h2>
              <p className="text-sm text-gray-600 mt-1">{card.descricao}</p>
            </Link>
          ))}
        </div>
      </div>
    </LayoutProtegido>
  )
}
