import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LayoutProtegido from '@/components/LayoutProtegido'
import KanbanBoard from '@/components/KanbanBoard'

export default async function AcompanhamentoPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('perfil')
    .eq('id', user.id)
    .single()

  if (!['gestor', 'lideranca'].includes(profile?.perfil ?? '')) redirect('/dashboard')

  return (
    <LayoutProtegido>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Acompanhamento</h1>
        <p className="text-gray-500 mt-1">
          Kanban das iniciativas aprovadas. Arraste os cards para atualizar o status.
        </p>
      </div>
      <KanbanBoard />
    </LayoutProtegido>
  )
}
