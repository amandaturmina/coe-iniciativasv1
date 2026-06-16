import Link from 'next/link'

interface Props {
  searchParams: { protocolo?: string }
}

export default function SucessoPage({ searchParams }: Props) {
  const protocolo = searchParams.protocolo ?? '—'

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-atrio text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2">
          <div className="w-8 h-8 bg-atrio-light rounded-full flex items-center justify-center">
            <span className="text-atrio font-bold text-sm">C</span>
          </div>
          <span className="font-semibold text-lg">COE Atrio</span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-6">
        <div className="max-w-lg w-full text-center py-16">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Iniciativa registrada com sucesso!
          </h1>

          <div className="bg-atrio-light border-2 border-atrio rounded-xl py-4 px-6 mb-6 inline-block">
            <p className="text-xs text-atrio font-medium uppercase tracking-wide mb-1">Seu protocolo</p>
            <p className="text-3xl font-bold text-atrio">{protocolo}</p>
          </div>

          <p className="text-gray-600 mb-2">
            Guarde esse número para acompanhar o status da sua iniciativa.
          </p>
          <p className="text-gray-500 text-sm mb-8">
            Nossa equipe retornará em até <strong>10 dias úteis</strong>.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={`/acompanhar?protocolo=${protocolo}`} className="btn-primary py-3 px-6">
              Acompanhar esta iniciativa
            </Link>
            <Link href="/submeter" className="btn-secondary py-3 px-6">
              Submeter nova iniciativa
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
