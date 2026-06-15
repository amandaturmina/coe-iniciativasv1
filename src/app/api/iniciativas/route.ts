import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { gerarProtocolo } from '@/lib/gerarProtocolo'
import { calcularScore } from '@/lib/calcularScore'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  try {
    const formData = await req.formData()
    const dadosRaw = JSON.parse(formData.get('dados') as string)
    const riscosRaw = JSON.parse(formData.get('riscos') as string)
    const arquivos = formData.getAll('anexos') as File[]

    // Contar iniciativas para gerar protocolo
    const { count } = await supabase
      .from('iniciativas')
      .select('*', { count: 'exact', head: true })

    const protocolo = gerarProtocolo(count ?? 0)

    // Calcular score
    const score = calcularScore({
      valor_esperado: dadosRaw.valor_esperado ?? '',
      data_inicio_prevista: dadosRaw.data_inicio_prevista ?? '',
      tipo_iniciativa: dadosRaw.tipo_iniciativa ?? 'Setorial',
    })

    // Inserir iniciativa
    const { data: iniciativa, error } = await supabase
      .from('iniciativas')
      .insert({
        protocolo,
        titulo: dadosRaw.titulo,
        area: dadosRaw.area,
        tipo_iniciativa: dadosRaw.tipo_iniciativa,
        patrocinador: dadosRaw.patrocinador,
        responsavel_nome: dadosRaw.responsavel_nome,
        responsavel_email: dadosRaw.responsavel_email,
        problema: dadosRaw.problema,
        valor_esperado: dadosRaw.valor_esperado,
        beneficiarios: dadosRaw.beneficiarios ?? [],
        custo_estimado: dadosRaw.custo_estimado ? parseFloat(dadosRaw.custo_estimado) : null,
        detalhamento_custos: dadosRaw.detalhamento_custos,
        entregas: dadosRaw.entregas,
        fora_escopo: dadosRaw.fora_escopo,
        data_inicio_prevista: dadosRaw.data_inicio_prevista,
        data_fim_prevista: dadosRaw.data_fim_prevista,
        dependencias: dadosRaw.dependencias,
        equipe: dadosRaw.equipe,
        tem_terceiros: dadosRaw.tem_terceiros === 'true',
        terceiros: dadosRaw.terceiros,
        riscos: riscosRaw.filter((r: { descricao: string }) => r.descricao),
        eap: dadosRaw.eap,
        submetido_por: user.id,
        score,
        status: 'Recebida',
      })
      .select()
      .single()

    if (error) throw error

    // Upload de anexos
    const anexosPaths: string[] = []
    if (arquivos.length > 0) {
      const serviceClient = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      for (const arquivo of arquivos) {
        const buffer = Buffer.from(await arquivo.arrayBuffer())
        const path = `iniciativas/${protocolo}/anexos/${arquivo.name}`
        const { error: uploadError } = await serviceClient.storage
          .from('iniciativas')
          .upload(path, buffer, { contentType: arquivo.type })
        if (!uploadError) anexosPaths.push(path)
      }

      if (anexosPaths.length > 0) {
        await serviceClient
          .from('iniciativas')
          .update({ anexos: anexosPaths })
          .eq('id', iniciativa.id)
      }
    }

    // Enviar e-mails
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
    await fetch(`${appUrl}/api/emails`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo: 'submissao',
        protocolo,
        titulo: dadosRaw.titulo,
        area: dadosRaw.area,
        para: dadosRaw.responsavel_email,
      }),
    }).catch(() => {})

    await fetch(`${appUrl}/api/emails`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo: 'notificacao_gestor',
        protocolo,
        titulo: dadosRaw.titulo,
        area: dadosRaw.area,
        score,
        id: iniciativa.id,
      }),
    }).catch(() => {})

    return NextResponse.json({ protocolo, id: iniciativa.id })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('perfil')
    .eq('id', user.id)
    .single()

  const url = new URL(req.url)
  const status = url.searchParams.get('status')
  const area = url.searchParams.get('area')
  const tipo = url.searchParams.get('tipo')
  const busca = url.searchParams.get('busca')
  const dias = url.searchParams.get('dias')

  let query = supabase.from('iniciativas').select('*')

  if (profile?.perfil === 'colaborador') {
    query = query.eq('submetido_por', user.id)
  }
  if (status) query = query.in('status', status.split(','))
  if (area) query = query.in('area', area.split(','))
  if (tipo) query = query.eq('tipo_iniciativa', tipo)
  if (busca) query = query.or(`titulo.ilike.%${busca}%,protocolo.ilike.%${busca}%`)
  if (dias) {
    const desde = new Date()
    desde.setDate(desde.getDate() - parseInt(dias))
    query = query.gte('created_at', desde.toISOString())
  }

  const { data, error } = await query.order('score', { ascending: false })
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 })

  return NextResponse.json({ dados: data })
}
