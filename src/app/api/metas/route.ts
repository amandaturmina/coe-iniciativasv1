import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const url = new URL(req.url)
  const trimestre = url.searchParams.get('trimestre') ?? 'Q2'
  const ano = parseInt(url.searchParams.get('ano') ?? '2026')

  const { data: indicadores } = await supabase
    .from('metas')
    .select('*')
    .eq('trimestre', trimestre)
    .eq('ano', ano)
    .order('created_at')

  const ids = (indicadores ?? []).map(i => i.id)
  const { data: projetos } = ids.length > 0
    ? await supabase.from('metas_projetos').select('*').in('meta_id', ids).order('created_at')
    : { data: [] }

  return NextResponse.json({ indicadores: indicadores ?? [], projetos: projetos ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const { trimestre, ano, indicadores, projetos } = await req.json()

  // Upsert indicadores
  for (const ind of indicadores ?? []) {
    if (ind.id?.startsWith('novo-')) {
      // insert
      await supabase.from('metas').insert({ trimestre, ano, indicador: ind.indicador, mes_1_label: ind.mes_1_label, mes_1_valor: ind.mes_1_valor, mes_2_label: ind.mes_2_label, mes_2_valor: ind.mes_2_valor, mes_3_label: ind.mes_3_label, mes_3_valor: ind.mes_3_valor, meta_base: ind.meta_base, super_meta: ind.super_meta })
    } else {
      await supabase.from('metas').update({ mes_1_valor: ind.mes_1_valor, mes_2_valor: ind.mes_2_valor, mes_3_valor: ind.mes_3_valor, meta_base: ind.meta_base, super_meta: ind.super_meta }).eq('id', ind.id)
    }
  }

  // Upsert projetos
  const { data: metasExistentes } = await supabase.from('metas').select('id').eq('trimestre', trimestre).eq('ano', ano)
  const metaIds = (metasExistentes ?? []).map(m => m.id)

  if (metaIds.length > 0) {
    await supabase.from('metas_projetos').delete().in('meta_id', metaIds)
    for (const p of projetos ?? []) {
      await supabase.from('metas_projetos').insert({ meta_id: metaIds[0], mes: p.mes, projeto_id: p.projeto_id, nome_projeto: p.nome_projeto, descricao: p.descricao, saving_mensal: p.saving_mensal, fte: p.fte })
    }
  }

  return NextResponse.json({ ok: true })
}
