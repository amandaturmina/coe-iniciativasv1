import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const body = await req.json()

  const { data, error } = await supabase
    .from('mudancas_processo')
    .insert({
      processo: body.processo,
      tipo_mudanca: body.tipo_mudanca,
      solicitante: body.solicitante,
      urgencia: body.urgencia,
      descricao: body.descricao,
      status: 'pendente',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
  return NextResponse.json({ dados: data })
}
