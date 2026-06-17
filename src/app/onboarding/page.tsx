import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LayoutProtegido from '@/components/LayoutProtegido'
import OnboardingClient from './OnboardingClient'

export default async function OnboardingPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('perfil')
    .eq('id', user.id)
    .single()

  if (!['gestor', 'lideranca'].includes(profile?.perfil ?? '')) {
    redirect('/dashboard')
  }

  const { data: iniciativas } = await supabase
    .from('iniciativas')
    .select('id, protocolo, titulo, area, responsavel_nome, sponsor, status, kanban_status, created_at, updated_at')
    .eq('status', 'Aprovada')
    .eq('kanban_status', 'Em planejamento')
    .order('updated_at', { ascending: false })

  return (
    <LayoutProtegido>
      <OnboardingClient iniciativas={iniciativas ?? []} />
    </LayoutProtegido>
  )
}
