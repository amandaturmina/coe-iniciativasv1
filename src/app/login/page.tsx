'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setCarregando(true)
    setErro('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setErro('Erro ao enviar o link. Verifique o e-mail e tente novamente.')
    } else {
      setEnviado(true)
    }
    setCarregando(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-atrio to-atrio-dark p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Logo/header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-atrio-light rounded-full mb-4">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M16 4L28 10V22L16 28L4 22V10L16 4Z" stroke="#1D6B4A" strokeWidth="2" fill="#E1F5EE"/>
              <path d="M16 10L22 13V19L16 22L10 19V13L16 10Z" fill="#1D6B4A"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">COE Atrio</h1>
          <p className="text-sm text-gray-500 mt-1">Sistema de Gestão de Iniciativas</p>
        </div>

        {enviado ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Verifique seu e-mail</h2>
            <p className="text-gray-500 text-sm">
              Enviamos um link de acesso para <strong>{email}</strong>.<br/>
              Clique no link para entrar no sistema.
            </p>
            <button
              onClick={() => { setEnviado(false); setEmail('') }}
              className="mt-6 text-sm text-atrio hover:underline"
            >
              Usar outro e-mail
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Entrar no sistema</h2>
              <p className="text-sm text-gray-500">
                Informe seu e-mail corporativo para receber o link de acesso.
              </p>
            </div>

            <div className="mb-4">
              <label htmlFor="email" className="label-base">
                E-mail corporativo
              </label>
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

            {erro && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={carregando || !email}
              className="btn-primary w-full py-3"
            >
              {carregando ? 'Enviando...' : 'Enviar link de acesso'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
