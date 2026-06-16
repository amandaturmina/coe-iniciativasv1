'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { AtriaMark } from '@/components/AtrioBrandLogo'

const STATUS_INFO: Record<string, { label: string; cor: string; descricao: string }> = {
  recebida: {
    label: 'Recebida',
    cor: 'bg-blue-100 text-blue-800 border-blue-200',
    descricao: 'Sua iniciativa foi recebida pela equipe COE e está na fila de análise.',
  },
  em_analise: {
    label: 'Em análise',
    cor: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    descricao: 'Nossa equipe está avaliando sua iniciativa.',
  },
  aprovada: {
    label: 'Aprovada',
    cor: 'bg-green-100 text-green-800 border-green-200',
    descricao: 'Parabéns! Sua iniciativa foi aprovada pelo COE.',
  },
  recusada: {
    label: 'Recusada',
    cor: 'bg-red-100 text-red-800 border-red-200',
    descricao: 'Sua iniciativa não foi aprovada neste ciclo. Entre em contato com o COE para mais detalhes.',
  },
}

interface Iniciativa {
  protocolo: string
  titulo: string
  status: string
  created_at: string
}

function AcompanharContent() {
  const searchParams = useSearchParams()
  const [protocolo, setProtocolo] = useState(searchParams.get('protocolo') ?? '')
  const [buscando, setBuscando] = useState(false)
  const [iniciativa, setIniciativa] = useState<Iniciativa | null>(null)
  const [naoEncontrado, setNaoEncontrado] = useState(false)

  const supabase = createClient()

  async function buscar(e?: React.FormEvent) {
    e?.preventDefault()
    if (!protocolo.trim()) return
    setBuscando(true)
    setIniciativa(null)
    setNaoEncontrado(false)

    const { data } = await supabase
      .from('iniciativas')
      .select('protocolo, titulo, status, created_at')
      .ilike('protocolo', protocolo.trim())
      .maybeSingle()

    if (data) {
      setIniciativa(data)
    } else {
      setNaoEncontrado(true)
    }
    setBuscando(false)
  }

  useEffect(() => {
    if (searchParams.get('protocolo')) buscar()
  }, [])

  const statusInfo = iniciativa ? (STATUS_INFO[iniciativa.status] ?? {
    label: iniciativa.status,
    cor: 'bg-gray-100 text-gray-800 border-gray-200',
    descricao: '',
  }) : null

  return (
    <main className="flex-1 flex items-start justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Acompanhar Iniciativa</h1>
          <p className="text-gray-500 mt-2">
            Informe o número do protocolo recebido na submissão.
          </p>
        </div>

        <form onSubmit={buscar} className="flex gap-2 mb-8">
          <input
            type="text"
            value={protocolo}
            onChange={e => setProtocolo(e.target.value)}
            className="input-base flex-1"
            placeholder="Ex: COE-2026-001"
            autoFocus
          />
          <button
            type="submit"
            disabled={buscando || !protocolo.trim()}
            className="btn-primary px-6"
          >
            {buscando ? 'Buscando...' : 'Buscar'}
          </button>
        </form>

        {naoEncontrado && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
            <p className="text-gray-600 font-medium">Protocolo não encontrado.</p>
            <p className="text-gray-400 text-sm mt-1">Verifique o número e tente novamente.</p>
          </div>
        )}

        {iniciativa && statusInfo && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Protocolo</p>
              <p className="text-xl font-bold text-atrio">{iniciativa.protocolo}</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Iniciativa</p>
                <p className="font-medium text-gray-900">{iniciativa.titulo}</p>
              </div>

              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Status</p>
                <span className={`inline-block border rounded-full px-4 py-1.5 text-sm font-semibold ${statusInfo.cor}`}>
                  {statusInfo.label}
                </span>
                {statusInfo.descricao && (
                  <p className="text-gray-500 text-sm mt-2">{statusInfo.descricao}</p>
                )}
              </div>

              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Submetida em</p>
                <p className="text-gray-600 text-sm">
                  {new Date(iniciativa.created_at).toLocaleDateString('pt-BR', {
                    day: '2-digit', month: 'long', year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default function AcompanharPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AtriaMark size={22} color="#111111" />
            <span className="font-semibold tracking-widest uppercase text-sm text-gray-900">Atrio</span>
          </div>
          <Link
            href="/submeter"
            className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
          >
            Submeter iniciativa →
          </Link>
        </div>
      </header>

      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-atrio border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <AcompanharContent />
      </Suspense>
    </div>
  )
}
