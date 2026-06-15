import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const headerHtml = `
  <div style="background:#1D6B4A;padding:24px 32px;">
    <h1 style="color:#fff;margin:0;font-size:20px;font-family:sans-serif;">COE — Atrio Hotéis</h1>
    <p style="color:#E1F5EE;margin:4px 0 0;font-size:13px;font-family:sans-serif;">Centro de Operações de Excelência</p>
  </div>
`

const footerHtml = `
  <div style="background:#f5f5f5;padding:16px 32px;border-top:1px solid #e0e0e0;">
    <p style="color:#888;font-size:12px;font-family:sans-serif;margin:0;">
      COE Atrio — Este é um e-mail automático. Não responda diretamente.
    </p>
  </div>
`

function wrap(conteudo: string) {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#fff;">
    ${headerHtml}
    <div style="padding:32px;font-family:sans-serif;color:#333;">
      ${conteudo}
    </div>
    ${footerHtml}
  </body></html>`
}

export async function enviarEmailSubmissao(dados: {
  para: string
  protocolo: string
  titulo: string
  area: string
}) {
  return resend.emails.send({
    from: 'COE Atrio <noreply@atriohoteis.com.br>',
    to: dados.para,
    subject: `[${dados.protocolo}] Iniciativa recebida — COE Atrio`,
    html: wrap(`
      <h2 style="color:#1D6B4A;">Sua iniciativa foi recebida!</h2>
      <p>Olá,</p>
      <p>A iniciativa abaixo foi registrada com sucesso no sistema COE.</p>
      <div style="background:#E1F5EE;border-radius:8px;padding:20px;margin:20px 0;">
        <p style="font-size:24px;font-weight:bold;color:#1D6B4A;margin:0;">${dados.protocolo}</p>
        <p style="margin:8px 0 0;"><strong>Título:</strong> ${dados.titulo}</p>
        <p style="margin:4px 0 0;"><strong>Área:</strong> ${dados.area}</p>
      </div>
      <p>Nossa equipe retornará em até <strong>10 dias úteis</strong> com o resultado da análise.</p>
      <p>Obrigado por contribuir com a melhoria contínua da Atrio!</p>
    `),
  })
}

export async function enviarEmailNotificacaoGestor(dados: {
  protocolo: string
  titulo: string
  area: string
  score: number
  id: string
  appUrl: string
}) {
  const gestor = process.env.EMAIL_GESTOR
  if (!gestor) return

  return resend.emails.send({
    from: 'COE Atrio <noreply@atriohoteis.com.br>',
    to: gestor,
    subject: `[${dados.protocolo}] Nova iniciativa para análise — ${dados.area} | Score: ${dados.score}`,
    html: wrap(`
      <h2 style="color:#1D6B4A;">Nova iniciativa aguarda análise</h2>
      <div style="background:#E1F5EE;border-radius:8px;padding:20px;margin:20px 0;">
        <p style="font-size:20px;font-weight:bold;color:#1D6B4A;margin:0;">${dados.protocolo}</p>
        <p style="margin:8px 0 0;"><strong>Título:</strong> ${dados.titulo}</p>
        <p style="margin:4px 0 0;"><strong>Área:</strong> ${dados.area}</p>
        <p style="margin:4px 0 0;"><strong>Score inicial:</strong> ${dados.score}</p>
      </div>
      <a href="${dados.appUrl}/iniciativa/${dados.id}"
         style="display:inline-block;background:#1D6B4A;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">
        Analisar Iniciativa
      </a>
    `),
  })
}

export async function enviarEmailAprovacao(dados: {
  para: string
  protocolo: string
  titulo: string
  responsavel: string
  previsaoInicio: string
}) {
  return resend.emails.send({
    from: 'COE Atrio <noreply@atriohoteis.com.br>',
    to: dados.para,
    subject: `✅ [${dados.protocolo}] Iniciativa Aprovada!`,
    html: wrap(`
      <h2 style="color:#1D6B4A;">🎉 Parabéns! Sua iniciativa foi aprovada!</h2>
      <p>A iniciativa <strong>${dados.protocolo} — ${dados.titulo}</strong> foi analisada e aprovada pelo COE.</p>
      <div style="background:#E1F5EE;border-radius:8px;padding:20px;margin:20px 0;">
        <p><strong>Responsável de execução:</strong> ${dados.responsavel}</p>
        <p><strong>Previsão de início:</strong> ${dados.previsaoInicio}</p>
      </div>
      <h3 style="color:#1D6B4A;">Próximos passos</h3>
      <ol>
        <li>Alinhe com o responsável de execução o kickoff do projeto</li>
        <li>Acesse o sistema para acompanhar o andamento no kanban</li>
        <li>Mantenha o status atualizado ao longo da execução</li>
      </ol>
    `),
  })
}

export async function enviarEmailRecusa(dados: {
  para: string
  protocolo: string
  titulo: string
  justificativa: string
}) {
  return resend.emails.send({
    from: 'COE Atrio <noreply@atriohoteis.com.br>',
    to: dados.para,
    subject: `📋 [${dados.protocolo}] Resultado da análise COE`,
    html: wrap(`
      <h2 style="color:#1D6B4A;">Resultado da análise — ${dados.protocolo}</h2>
      <p>A iniciativa <strong>${dados.titulo}</strong> foi analisada pelo COE.</p>
      <div style="background:#fff3f3;border-left:4px solid #e53e3e;border-radius:4px;padding:16px;margin:20px 0;">
        <p style="margin:0;font-weight:bold;">Decisão: Não aprovada neste ciclo</p>
        <p style="margin:8px 0 0;"><strong>Justificativa:</strong> ${dados.justificativa}</p>
      </div>
      <p>Sua iniciativa pode ser reapresentada no próximo ciclo de análise do COE, com os ajustes necessários.</p>
      <p>Agradecemos a participação e a contribuição para a melhoria contínua da Atrio.</p>
    `),
  })
}
