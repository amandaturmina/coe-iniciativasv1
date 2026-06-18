import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LayoutProtegido from '@/components/LayoutProtegido'
import BacklogIniciativas from '@/components/BacklogIniciativas'

export default async function BacklogPage() {
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
        <h1 className="text-2xl font-bold text-gray-900">Backlog de Iniciativas</h1>
        <p className="text-gray-500 mt-1">Iniciativas recusadas ou aguardando próximo ciclo.</p>
      </div>
      <BacklogIniciativas />
    </LayoutProtegido>
  )
}
