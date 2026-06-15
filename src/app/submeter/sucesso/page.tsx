import Link from 'next/link'
import LayoutProtegido from '@/components/LayoutProtegido'

interface Props {
  searchParams: { protocolo?: string }
}

export default function SucessoPage({ searchParams }: Props) {
  const protocolo = searchParams.protocolo ?? '—'

  return (
    <LayoutProtegido>
      <div className="max-w-lg mx-auto text-center py-16">
        {/* Ícone de sucesso */}
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Iniciativa registrada com sucesso!
        </h1>

        {/* Protocolo em destaque */}
        <div className="bg-atrio-light border-2 border-atrio rounded-xl py-4 px-6 mb-6 inline-block">
          <p className="text-xs text-atrio font-medium uppercase tracking-wide mb-1">Protocolo</p>
          <p className="text-3xl font-bold text-atrio">{protocolo}</p>
        </div>

        <p className="text-gray-600 mb-8">
          Você receberá um e-mail de confirmação em breve.
          Nossa equipe retornará em até <strong>10 dias úteis</strong>.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/submeter" className="btn-primary py-3 px-6">
            Submeter nova iniciativa
          </Link>
          <Link href="/dashboard" className="btn-secondary py-3 px-6">
            Voltar ao início
          </Link>
        </div>
      </div>
    </LayoutProtegido>
  )
}
