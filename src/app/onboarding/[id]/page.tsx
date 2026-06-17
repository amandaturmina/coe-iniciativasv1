import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LayoutProtegido from '@/components/LayoutProtegido'
import OnboardingDetalhe from './OnboardingDetalhe'

export default async function OnboardingDetalhePage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('perfil, nome')
    .eq('id', user.id)
    .single()

  if (!['gestor', 'lideranca'].includes(profile?.perfil ?? ''))
    redirect('/dashboard')

  const { data: ob, error } = await supabase
    .from('onboardings')
    .select('*, iniciativas(*)')
    .eq('id', params.id)
    .single()

  if (error || !ob) notFound()

  return (
    <LayoutProtegido>
      <OnboardingDetalhe
        onboarding={ob}
        iniciativa={ob.iniciativas}
        nomeUsuario={profile?.nome ?? user.email ?? 'Usuário'}
      />
    </LayoutProtegido>
  )
}
