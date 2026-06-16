import FormularioSubmissao from '@/components/FormularioSubmissao'
import Link from 'next/link'
import { AtriaMark } from '@/components/AtrioBrandLogo'

export default function SubmeterPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AtriaMark size={22} color="#111111" />
            <span className="font-semibold tracking-widest uppercase text-sm text-gray-900">Atrio</span>
          </div>
          <Link
            href="/acompanhar"
            className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
          >
            Acompanhar protocolo →
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-gray-900">Submeter iniciativa</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Preencha as seções para registrar sua iniciativa no COE.
          </p>
        </div>
        <FormularioSubmissao />
      </main>
    </div>
  )
}
