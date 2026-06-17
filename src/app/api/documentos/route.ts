import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const [{ data: docs }, { data: mudancas }] = await Promise.all([
    supabase.from('documentos').select('*').order('created_at', { ascending: false }),
    supabase.from('mudancas_processo').select('*').order('created_at', { ascending: false }),
  ])

  return NextResponse.json({ dados: docs ?? [], mudancas: mudancas ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const body = await req.json()

  const { data, error } = await supabase
    .from('documentos')
    .insert({
      tipo: body.tipo,
      nome: body.nome,
      versao: body.versao,
      arquivo_url: body.arquivo_url ?? '',
      arquivo_nome: body.arquivo_nome ?? '',
      is_modelo: body.is_modelo ?? false,
      area: body.area ?? '',
      criado_por: body.criado_por ?? '',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
  return NextResponse.json({ dados: data })
}
