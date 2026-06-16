'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-atrio to-atrio-dark p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-atrio-light rounded-full mb-4">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M16 4L28 10V22L16 28L4 22V10L16 4Z" stroke="#1D6B4A" strokeWidth="2" fill="#E1F5EE"/>
              <path d="M16 10L22 13V19L16 22L10 19V13L16 10Z" fill="#1D6B4A"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">COE Atrio</h1>
          <p className="text-sm text-gray-500 mt-1">Acesso exclusivo para gestores e liderança</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
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

          <div className="mb-4">
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
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {erro}
            </div>
          )}

          <button
            type="submit"
            disabled={carregando || !email || !senha}
            className="btn-primary w-full py-3"
          >
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
