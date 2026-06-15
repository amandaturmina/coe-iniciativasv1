import { NextRequest, NextResponse } from 'next/server'
import {
  enviarEmailSubmissao,
  enviarEmailNotificacaoGestor,
  enviarEmailAprovacao,
  enviarEmailRecusa,
} from '@/lib/emails'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { tipo, ...rest } = body

    switch (tipo) {
      case 'submissao':
        await enviarEmailSubmissao(rest)
        break
      case 'notificacao_gestor':
        await enviarEmailNotificacaoGestor({
          ...rest,
          appUrl: process.env.NEXT_PUBLIC_APP_URL ?? '',
        })
        break
      case 'aprovacao':
        await enviarEmailAprovacao(rest)
        break
      case 'recusa':
        await enviarEmailRecusa(rest)
        break
      default:
        return NextResponse.json({ erro: 'Tipo desconhecido' }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Erro ao enviar e-mail:', err)
    return NextResponse.json({ erro: 'Falha no envio' }, { status: 500 })
  }
}
