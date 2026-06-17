import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LayoutProtegido from '@/components/LayoutProtegido'
import { ClipboardCheck } from 'lucide-react'

export default async function ChecklistPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return (
    <LayoutProtegido>
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#f5eded] flex items-center justify-center mb-4">
          <ClipboardCheck size={28} className="text-[#451a1a]" />
        </div>
        <h1 className="text-xl font-bold text-[#1a1917]">Checklist</h1>
        <p className="text-[#6b6966] mt-2 text-sm">Módulo em desenvolvimento. Em breve.</p>
      </div>
    </LayoutProtegido>
  )
}
