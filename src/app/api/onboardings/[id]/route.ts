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
  campo?: string
  de?: string
  para?: string
}

function calcularProntidao(ob: Record<string, unknown>): number {
  const campos = [
    ob.sponsor, ob.responsavel_coe, ob.responsavel_area,
    ob.objetivo, ob.escopo, ob.data_inicio_prevista,
    ob.data_conclusao_prevista, ob.indicador_sucesso, ob.beneficio_esperado,
  ]
  const checklist = (ob.checklist as ChecklistItem[]) ?? []
  const itensConcluidos = checklist.filter(i => i.concluido).length
  const totalItens = checklist.length || 1
  const camposConcluidos = campos.filter(c => c && c !== '').length
  const totalCampos = campos.length
  return Math.min(
    Math.round(((itensConcluidos / totalItens) * 0.6 + (camposConcluidos / totalCampos) * 0.4) * 100),
    100
  )
}

// Mapa campo → id do checklist que ele satisfaz
const CAMPO_CHECKLIST: Record<string, string> = {
  sponsor:               'sponsor',
  responsavel_coe:       'resp_coe',
  responsavel_area:      'resp_area',
  objetivo:              'objetivo',
  escopo:                'escopo',
  fora_escopo:           'fora_escopo',
  data_inicio_prevista:  'prazo_inicio',
  data_conclusao_prevista: 'prazo_fim',
  indicador_sucesso:     'metrica',
  beneficio_esperado:    'beneficio',
  areas_impactadas:      'areas',
  sistemas_envolvidos:   'sistemas',
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const { data, error } = await supabase
    .from('onboardings')
    .select('*, iniciativas(*)')
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
    .select('perfil, nome')
    .eq('id', user.id)
    .single()

  if (!['gestor', 'lideranca'].includes(profile?.perfil ?? ''))
    return NextResponse.json({ erro: 'Sem permissão' }, { status: 403 })

  const body: Record<string, unknown> = await req.json()
  const nomeUsuario = profile?.nome ?? user.email ?? 'Usuário'

  // Buscar onboarding atual para merge de checklist e histórico
  const { data: atual, error: fetchErr } = await supabase
    .from('onboardings')
    .select('checklist, historico, sponsor, responsavel_coe, responsavel_area, objetivo, escopo, data_inicio_prevista, data_conclusao_prevista, indicador_sucesso, beneficio_esperado, fora_escopo, areas_impactadas, sistemas_envolvidos')
    .eq('id', params.id)
    .single()

  if (fetchErr) return NextResponse.json({ erro: fetchErr.message }, { status: 404 })

  // Atualizar checklist automaticamente com base nos campos alterados
  let checklist = (atual.checklist as ChecklistItem[]) ?? []
  const novoHistorico = [...((atual.historico as HistoricoItem[]) ?? [])]

  for (const [campo, checkId] of Object.entries(CAMPO_CHECKLIST)) {
    if (campo in body) {
      const valorNovo = body[campo]
      const preenchido = Array.isArray(valorNovo)
        ? valorNovo.length > 0
        : !!(valorNovo && valorNovo !== '')

      checklist = checklist.map(item =>
        item.id === checkId ? { ...item, concluido: preenchido } : item
      )
    }
  }

  // Se body.checklist veio (atualização direta via aba Checklist)
  if (body.checklist) {
    checklist = body.checklist as ChecklistItem[]
    delete body.checklist
  }

  // Registrar no histórico
  const camposAlterados = Object.keys(body).filter(k => k !== 'checklist')
  if (camposAlterados.length > 0) {
    const descricao = body._acao
      ? String(body._acao)
      : `${nomeUsuario} atualizou: ${camposAlterados.join(', ')}`
    novoHistorico.push({ ts: new Date().toISOString(), user: nomeUsuario, text: descricao })
    delete body._acao
  }

  const dadosUpdate = {
    ...body,
    checklist,
    historico: novoHistorico,
    updated_at: new Date().toISOString(),
  }

  // Calcular prontidão com dados mesclados
  const merged = { ...atual, ...dadosUpdate }
  dadosUpdate.percentual_prontidao = calcularProntidao(merged as Record<string, unknown>)

  const { data, error } = await supabase
    .from('onboardings')
    .update(dadosUpdate)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
  return NextResponse.json({ dados: data })
}
