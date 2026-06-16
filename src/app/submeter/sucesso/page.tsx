import Link from 'next/link'
import { AtriaMark } from '@/components/AtrioBrandLogo'

interface Props {
  searchParams: { protocolo?: string }
}

export default function SucessoPage({ searchParams }: Props) {
  const protocolo = searchParams.protocolo ?? '—'

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center">
          <div className="flex items-center gap-2.5">
            <AtriaMark size={22} color="#111111" />
            <span className="font-semibold tracking-widest uppercase text-sm text-gray-900">Atrio</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-md w-full text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-xl font-semibold text-gray-900 mb-1">Iniciativa registrada!</h1>
          <p className="text-sm text-gray-400 mb-8">
            Nossa equipe retornará em até <strong className="text-gray-600">10 dias úteis</strong>.
          </p>

          <div className="bg-gray-900 rounded-xl py-5 px-8 mb-2 inline-block">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Protocolo</p>
            <p className="text-xl font-semibold text-white tracking-wide">{protocolo}</p>
          </div>
          <p className="text-xs text-gray-400 mb-8">
            Guarde esse número para acompanhar o status.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={`/acompanhar?protocolo=${protocolo}`} className="btn-primary py-2.5 px-6">
              Acompanhar iniciativa
            </Link>
            <Link href="/submeter" className="btn-secondary py-2.5 px-6">
              Nova iniciativa
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
