'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AtriaMark } from '@/components/AtrioBrandLogo'

export default function LoginPage() {
  const router = useRouter()
  const [email,      setEmail]      = useState('')
  const [senha,      setSenha]      = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro,       setErro]       = useState('')
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
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-80 bg-gray-900 flex-col justify-between p-10">
        <div className="flex items-center gap-2.5">
          <AtriaMark size={24} color="#FFFFFF" />
          <span className="font-semibold tracking-widest uppercase text-sm text-white">Atrio</span>
        </div>
        <div>
          <p className="text-gray-400 text-sm leading-relaxed">
            Sistema de gestão de iniciativas do Centro de Excelência Operacional.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 px-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <AtriaMark size={22} color="#111111" />
            <span className="font-semibold tracking-widest uppercase text-sm text-gray-900">Atrio</span>
          </div>

          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Entrar</h1>
          <p className="text-sm text-gray-400 mb-8">
            Acesso exclusivo para gestores e liderança.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="label-base">E-mail</label>
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
              className="btn-primary w-full py-2.5"
            >
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
