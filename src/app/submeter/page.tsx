import FormularioSubmissao from '@/components/FormularioSubmissao'
import Link from 'next/link'

export default function SubmeterPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-atrio text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-atrio-light rounded-full flex items-center justify-center">
              <span className="text-atrio font-bold text-sm">C</span>
            </div>
            <span className="font-semibold text-lg">COE Atrio</span>
          </div>
          <Link
            href="/acompanhar"
            className="text-sm text-white/80 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            Acompanhar iniciativa
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Submeter Nova Iniciativa</h1>
          <p className="text-gray-500 mt-1">
            Preencha todas as seções para registrar sua iniciativa no COE.
          </p>
        </div>
        <FormularioSubmissao />
      </main>
    </div>
  )
}
