import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LayoutProtegido from '@/components/LayoutProtegido'
import FormularioSubmissao from '@/components/FormularioSubmissao'

export default async function SubmeterPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <LayoutProtegido>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Submeter Nova Iniciativa</h1>
        <p className="text-gray-500 mt-1">
          Preencha todas as seções para registrar sua iniciativa no COE.
        </p>
      </div>
      <FormularioSubmissao />
    </LayoutProtegido>
  )
}
