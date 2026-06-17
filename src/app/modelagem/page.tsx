import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LayoutProtegido from '@/components/LayoutProtegido'
import Link from 'next/link'
import { GitBranch } from 'lucide-react'

export default async function ModelagemPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <LayoutProtegido>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#f5eded] flex items-center justify-center mb-5">
          <GitBranch size={28} className="text-[#451a1a]" />
        </div>
        <h1 className="text-xl font-bold text-[#1a1917] mb-2">Modelagem</h1>
        <p className="text-[#6b6966] text-sm mb-4 max-w-sm">
          Esta seção está em desenvolvimento e estará disponível em breve.
        </p>
        <span className="inline-block bg-[#f5eded] text-[#451a1a] text-xs font-medium px-3 py-1 rounded-full mb-6">
          Em breve
        </span>
        <Link
          href="/dashboard"
          className="text-sm text-[#6b6966] hover:text-[#451a1a] flex items-center gap-1.5 transition-colors"
        >
          ← Voltar ao Dashboard
        </Link>
      </div>
    </LayoutProtegido>
  )
}
