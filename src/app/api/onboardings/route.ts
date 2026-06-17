import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function calcularProntidao(ob: Record<string, unknown>): number {
  const campos = [
    ob.sponsor, ob.responsavel_coe, ob.responsavel_area,
    ob.objetivo, ob.escopo, ob.data_inicio_prevista,
    ob.data_conclusao_prevista, ob.indicador_sucesso, ob.beneficio_esperado,
  ]
  const checklist = (ob.checklist as Array<{ concluido: boolean }>) ?? []
  const itensConcluidos = checklist.filter(i => i.concluido).length
  const totalItens = checklist.length || 1
  const camposConcluidos = campos.filter(c => c && c !== '').length
  const totalCampos = campos.length
  return Math.min(
    Math.round(((itensConcluidos / totalItens) * 0.6 + (camposConcluidos / totalCampos) * 0.4) * 100),
    100
  )
}

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const { data, error } = await supabase
    .from('iniciativas')
    .select(`
      id, protocolo, titulo, area, tipo_iniciativa, responsavel_nome,
      sponsor, status, kanban_status, urgencia, eixo_estrategico,
      score, updated_at, created_at,
      onboardings(id, status, percentual_prontidao, responsavel_coe, created_at, checklist)
    `)
    .eq('status', 'Aprovada')
    .order('updated_at', { ascending: false })

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
  return NextResponse.json({ dados: data })
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('perfil, nome')
    .eq('id', user.id)
    .single()

  if (!['gestor', 'lideranca'].includes(profile?.perfil ?? ''))
    return NextResponse.json({ erro: 'Sem permissão' }, { status: 403 })

  const body = await req.json()
  const { iniciativa_id } = body

  // Verificar se já existe
  const { data: existente } = await supabase
    .from('onboardings')
    .select('id')
    .eq('iniciativa_id', iniciativa_id)
    .single()

  if (existente) return NextResponse.json({ dados: existente })

  // Buscar dados da iniciativa para herdar
  const { data: ini, error: iniErr } = await supabase
    .from('iniciativas')
    .select('*')
    .eq('id', iniciativa_id)
    .single()

  if (iniErr || !ini) return NextResponse.json({ erro: 'Iniciativa não encontrada' }, { status: 404 })

  const entrada: Record<string, unknown> = {
    iniciativa_id,
    codigo:             ini.protocolo,
    nome:               ini.titulo,
    tipo:               ini.tipo_iniciativa,
    area:               ini.area,
    solicitante:        ini.responsavel_nome,
    sponsor:            ini.sponsor ?? null,
    urgencia:           ini.urgencia ?? null,
    eixo_estrategico:   ini.eixo_estrategico ?? null,
    problema:           ini.problema_identificado ?? ini.problema ?? null,
    resultado_esperado: ini.resultado_esperado ?? null,
    beneficio_esperado: ini.beneficio_esperado ?? null,
    prazo_desejado:     ini.prazo_desejado ?? null,
    custo_estimado:     ini.custo_estimado ?? null,
    parecer_coe:        ini.parecer_coe ?? null,
    score:              ini.score ?? null,
    decisao_aprovacao:  ini.status,
    criado_por:         profile?.nome ?? user.email,
    status:             'Em onboarding',
  }

  // Marcar checklist inicial com campos já preenchidos
  const checklistDefault = [
    { id: 'sponsor',    label: 'Sponsor definido',                obrigatorio: true,  concluido: !!ini.sponsor },
    { id: 'resp_coe',   label: 'Responsável COE definido',        obrigatorio: true,  concluido: false },
    { id: 'resp_area',  label: 'Responsável da área definido',    obrigatorio: true,  concluido: false },
    { id: 'objetivo',   label: 'Objetivo preenchido',             obrigatorio: true,  concluido: false },
    { id: 'escopo',     label: 'Escopo definido',                 obrigatorio: true,  concluido: false },
    { id: 'fora_escopo',label: 'Fora de escopo definido',         obrigatorio: false, concluido: false },
    { id: 'prazo_inicio',label: 'Prazo inicial definido',         obrigatorio: true,  concluido: false },
    { id: 'prazo_fim',  label: 'Prazo final definido',            obrigatorio: true,  concluido: false },
    { id: 'metrica',    label: 'Métrica de sucesso definida',     obrigatorio: true,  concluido: false },
    { id: 'beneficio',  label: 'Benefício esperado informado',    obrigatorio: true,  concluido: !!ini.beneficio_esperado },
    { id: 'areas',      label: 'Áreas envolvidas confirmadas',    obrigatorio: false, concluido: false },
    { id: 'sistemas',   label: 'Sistemas envolvidos mapeados',    obrigatorio: false, concluido: false },
    { id: 'riscos',     label: 'Riscos iniciais registrados',     obrigatorio: false, concluido: false },
    { id: 'governanca', label: 'Governança definida',             obrigatorio: false, concluido: false },
    { id: 'criterio',   label: 'Critério de encerramento definido', obrigatorio: false, concluido: false },
  ]
  entrada.checklist = checklistDefault

  const histEntrada = [{
    ts:   new Date().toISOString(),
    user: profile?.nome ?? user.email,
    text: `Onboarding criado e dados herdados da iniciativa ${ini.protocolo}`,
  }]
  entrada.historico = histEntrada

  entrada.percentual_prontidao = calcularProntidao(entrada)

  const { data: novo, error: insErr } = await supabase
    .from('onboardings')
    .insert(entrada)
    .select()
    .single()

  if (insErr) return NextResponse.json({ erro: insErr.message }, { status: 500 })
  return NextResponse.json({ dados: novo }, { status: 201 })
}
