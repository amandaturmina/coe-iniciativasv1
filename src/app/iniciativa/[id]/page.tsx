import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LayoutProtegido from '@/components/LayoutProtegido'
import DetalheIniciativa from './DetalheIniciativa'

export default async function IniciativaPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: iniciativa, error } = await supabase
    .from('iniciativas')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !iniciativa) notFound()

  const { data: profile } = await supabase
    .from('profiles')
    .select('perfil, nome')
    .eq('id', user.id)
    .single()

  return (
    <LayoutProtegido>
      <DetalheIniciativa
        iniciativa={iniciativa}
        perfil={profile?.perfil ?? 'colaborador'}
        autorNome={profile?.nome ?? 'Usuário'}
      />
    </LayoutProtegido>
  )
}
