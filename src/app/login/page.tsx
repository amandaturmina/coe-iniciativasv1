'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AtriaMark } from '@/components/AtrioBrandLogo'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setCarregando(true)
    setErro('')
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) {
      setErro('E-mail ou senha incorretos.')
    } else {
      router.push('/dashboard')
    }
    setCarregando(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-atrio p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <AtriaMark size={52} color="#FFFFFF" />
          <div className="mt-3 text-center leading-none">
            <p className="font-semibold tracking-widest uppercase text-xl text-white">Atrio</p>
            <p className="tracking-[0.2em] uppercase text-[10px] text-white/50 mt-0.5">
              Hotel <span className="text-atrio-accent font-medium">Management</span>
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-8">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Entrar no sistema</h2>
          <p className="text-sm text-gray-400 mb-6">Acesso exclusivo para gestores e liderança.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="label-base">E-mail corporativo</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-base"
                placeholder="seu.nome@atriohoteis.com.br"
                required
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="senha" className="label-base">Senha</label>
              <input
                id="senha"
                type="password"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                className="input-base"
                placeholder="••••••••"
                required
              />
            </div>

            {erro && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {erro}
              </p>
            )}

            <button
              type="submit"
              disabled={carregando || !email || !senha}
              className="btn-primary w-full py-2.5 mt-2"
            >
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-white/30 mt-6">
          COE — Centro de Excelência Operacional
        </p>
      </div>
    </div>
  )
}
