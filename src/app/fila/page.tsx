import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LayoutProtegido from '@/components/LayoutProtegido'
import FilaIniciativas from '@/components/FilaIniciativas'

export default async function FilaPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('perfil')
    .eq('id', user.id)
    .single()

  if (profile?.perfil !== 'gestor') redirect('/dashboard')

  return (
    <LayoutProtegido>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Fila de Análise</h1>
        <p className="text-gray-500 mt-1">Iniciativas submetidas aguardando análise e decisão do COE.</p>
      </div>
      <FilaIniciativas />
    </LayoutProtegido>
  )
}
