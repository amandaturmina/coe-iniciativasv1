import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const { data, error } = await supabase
    .from('iniciativas')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error) return NextResponse.json({ erro: error.message }, { status: 404 })
  return NextResponse.json({ dados: data })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('perfil')
    .eq('id', user.id)
    .single()

  if (profile?.perfil !== 'gestor') {
    return NextResponse.json({ erro: 'Sem permissão' }, { status: 403 })
  }

  const body = await req.json()

  // Se é uma decisão, adicionar campos extras
  if (body.decisao) {
    body.data_decisao = new Date().toISOString()
    body.decidido_por = user.id
    body.status = body.decisao
  }

  const { data, error } = await supabase
    .from('iniciativas')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 })

  // Enviar e-mail de decisão
  if (body.decisao && (body.decisao === 'Aprovada' || body.decisao === 'Recusada')) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
    await fetch(`${appUrl}/api/emails`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo: body.decisao === 'Aprovada' ? 'aprovacao' : 'recusa',
        protocolo: data.protocolo,
        titulo: data.titulo,
        para: data.responsavel_email,
        responsavel: body.responsavel_execucao,
        previsaoInicio: body.previsao_inicio,
        justificativa: body.justificativa,
      }),
    }).catch(() => {})
  }

  return NextResponse.json({ dados: data })
}
