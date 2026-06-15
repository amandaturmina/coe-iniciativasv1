import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const TIPOS_ACEITOS = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
  'video/mp4',
  'audio/mpeg',
]

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const formData = await req.formData()
  const arquivo = formData.get('arquivo') as File
  const protocolo = formData.get('protocolo') as string

  if (!arquivo || !protocolo) {
    return NextResponse.json({ erro: 'Arquivo e protocolo são obrigatórios' }, { status: 400 })
  }

  if (!TIPOS_ACEITOS.includes(arquivo.type)) {
    return NextResponse.json({ erro: 'Tipo de arquivo não permitido' }, { status: 400 })
  }

  if (arquivo.size > 10 * 1024 * 1024) {
    return NextResponse.json({ erro: 'Arquivo maior que 10MB' }, { status: 400 })
  }

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const buffer = Buffer.from(await arquivo.arrayBuffer())
  const path = `iniciativas/${protocolo}/anexos/${arquivo.name}`

  const { error } = await serviceClient.storage
    .from('iniciativas')
    .upload(path, buffer, { contentType: arquivo.type, upsert: true })

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 })

  return NextResponse.json({ path })
}
