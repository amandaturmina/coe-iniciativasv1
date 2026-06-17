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

  if (!['gestor', 'lideranca'].includes(profile?.perfil ?? ''))
    redirect('/dashboard')

  const { data } = await supabase
    .from('iniciativas')
    .select(`
      id, protocolo, titulo, area, tipo_iniciativa, responsavel_nome,
      sponsor, urgencia, score, updated_at, created_at,
      onboardings(id, status, percentual_prontidao, responsavel_coe, created_at)
    `)
    .eq('status', 'Aprovada')
    .order('updated_at', { ascending: false })

  return (
    <LayoutProtegido>
      <OnboardingClient rows={data ?? []} />
    </LayoutProtegido>
  )
}
