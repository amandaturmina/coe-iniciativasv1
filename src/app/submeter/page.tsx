import FormularioSubmissao from '@/components/FormularioSubmissao'
import Link from 'next/link'
import { AtriaMark } from '@/components/AtrioBrandLogo'

export default function SubmeterPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-atrio text-white">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AtriaMark size={26} color="#FFFFFF" />
            <div className="leading-none">
              <p className="font-semibold tracking-widest uppercase text-sm text-white">Atrio</p>
              <p className="tracking-[0.15em] uppercase text-[9px] text-white/50">
                COE <span className="text-atrio-accent font-medium">Iniciativas</span>
              </p>
            </div>
          </div>
          <Link
            href="/acompanhar"
            className="text-xs text-white/60 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            Acompanhar protocolo
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Submeter iniciativa</h1>
          <p className="text-gray-400 mt-1 text-sm">
            Preencha as seções para registrar sua iniciativa no COE.
          </p>
        </div>
        <FormularioSubmissao />
      </main>
    </div>
  )
}
