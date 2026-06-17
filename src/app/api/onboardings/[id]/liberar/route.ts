import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface ChecklistItem {
  id: string
  label: string
  obrigatorio: boolean
  concluido: boolean
}

interface HistoricoItem {
  ts: string
  user: string
  text: string
}

const CAMPOS_OBRIGATORIOS = [
  { campo: 'sponsor',                 label: 'Sponsor' },
  { campo: 'responsavel_coe',         label: 'Responsável COE' },
  { campo: 'responsavel_area',        label: 'Responsável da área' },
  { campo: 'objetivo',                label: 'Objetivo' },
  { campo: 'escopo',                  label: 'Escopo' },
  { campo: 'data_inicio_prevista',    label: 'Data de início prevista' },
  { campo: 'data_conclusao_prevista', label: 'Data de conclusão prevista' },
  { campo: 'indicador_sucesso',       label: 'Indicador de sucesso' },
  { campo: 'beneficio_esperado',      label: 'Benefício esperado' },
]

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
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

  const nomeUsuario = profile?.nome ?? user.email ?? 'Usuário'

  // Buscar onboarding completo
  const { data: ob, error: fetchErr } = await supabase
    .from('onboardings')
    .select('*')
    .eq('id', params.id)
    .single()

  if (fetchErr || !ob) return NextResponse.json({ erro: 'Onboarding não encontrado' }, { status: 404 })

  // Validar campos obrigatórios
  const pendentes = CAMPOS_OBRIGATORIOS
    .filter(({ campo }) => !ob[campo] || ob[campo] === '')
    .map(({ label }) => label)

  // Validar checklist obrigatório
  const checklist = (ob.checklist as ChecklistItem[]) ?? []
  const checkPendentes = checklist
    .filter(i => i.obrigatorio && !i.concluido)
    .map(i => i.label)

  const todosPendentes = [...new Set([...pendentes, ...checkPendentes])]

  if (todosPendentes.length > 0) {
    return NextResponse.json(
      { erro: 'Itens obrigatórios pendentes', pendentes: todosPendentes },
      { status: 422 }
    )
  }

  const agora = new Date().toISOString()
  const historico: HistoricoItem[] = [
    ...((ob.historico as HistoricoItem[]) ?? []),
    { ts: agora, user: nomeUsuario, text: `${nomeUsuario} liberou o projeto para o Kanban` },
  ]

  // Atualizar onboarding
  const { error: obErr } = await supabase
    .from('onboardings')
    .update({
      status:          'Liberado',
      liberado_por:    nomeUsuario,
      data_liberacao:  agora,
      historico,
      updated_at:      agora,
    })
    .eq('id', params.id)

  if (obErr) return NextResponse.json({ erro: obErr.message }, { status: 500 })

  // Atualizar iniciativa
  const { error: iniErr } = await supabase
    .from('iniciativas')
    .update({
      kanban_status: 'Em planejamento',
      status:        'Em execução',
      updated_at:    agora,
    })
    .eq('id', ob.iniciativa_id)

  if (iniErr) return NextResponse.json({ erro: iniErr.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
