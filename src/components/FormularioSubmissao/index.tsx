'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Secao1Identificacao from './Secao1Identificacao'
import Secao2ProblemaValor from './Secao2ProblemaValor'
import Secao3Custos from './Secao3Custos'
import Secao4EscopoEntregas from './Secao4EscopoEntregas'
import Secao5Cronograma from './Secao5Cronograma'
import Secao6Recursos from './Secao6Recursos'
import Secao7Riscos, { type Risco } from './Secao7Riscos'
import Secao8EAP from './Secao8EAP'
import Secao9Anexos from './Secao9Anexos'

const SECOES = [
  'Identificação',
  'Problema e Valor',
  'Custos',
  'Escopo e Entregas',
  'Cronograma',
  'Recursos',
  'Riscos',
  'EAP',
  'Anexos',
]

function validarSecao(secao: number, dados: Record<string, unknown>, riscos: Risco[], arquivos: File[]): Record<string, string> {
  const erros: Record<string, string> = {}
  if (secao === 0) {
    if (!dados.titulo) erros.titulo = 'Obrigatório'
    if (!dados.area) erros.area = 'Obrigatório'
    if (!dados.tipo_iniciativa) erros.tipo_iniciativa = 'Obrigatório'
    if (!dados.patrocinador) erros.patrocinador = 'Obrigatório'
    if (!dados.responsavel_nome) erros.responsavel_nome = 'Obrigatório'
    if (!dados.responsavel_email) erros.responsavel_email = 'Obrigatório'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.responsavel_email as string))
      erros.responsavel_email = 'E-mail inválido'
  }
  if (secao === 1) {
    if (!dados.problema) erros.problema = 'Obrigatório'
    if (!dados.valor_esperado) erros.valor_esperado = 'Obrigatório'
    if (!((dados.beneficiarios as string[])?.length > 0)) erros.beneficiarios = 'Selecione ao menos uma área'
  }
  if (secao === 3) {
    if (!dados.entregas) erros.entregas = 'Obrigatório'
    if (!dados.fora_escopo) erros.fora_escopo = 'Obrigatório'
  }
  if (secao === 4) {
    if (!dados.data_inicio_prevista) erros.data_inicio_prevista = 'Obrigatório'
    if (!dados.data_fim_prevista) erros.data_fim_prevista = 'Obrigatório'
    else if (dados.data_inicio_prevista && dados.data_fim_prevista &&
      new Date(dados.data_fim_prevista as string) <= new Date(dados.data_inicio_prevista as string))
      erros.data_fim_prevista = 'Deve ser posterior à data de início'
    if (!dados.dependencias) erros.dependencias = 'Obrigatório'
  }
  if (secao === 5) {
    if (!dados.equipe) erros.equipe = 'Obrigatório'
    if (dados.tem_terceiros === undefined) erros.tem_terceiros = 'Obrigatório'
    if ((dados.tem_terceiros === 'true' || dados.tem_terceiros === true) && !dados.terceiros)
      erros.terceiros = 'Obrigatório'
  }
  if (secao === 6) {
    if (!riscos[0]?.descricao) erros.riscos = 'Descreva ao menos um risco'
  }
  if (secao === 7) {
    if (!dados.eap) erros.eap = 'Obrigatório'
  }
  return erros
}

export default function FormularioSubmissao() {
  const router = useRouter()
  const [secaoAtual, setSecaoAtual] = useState(0)
  const [dados, setDados] = useState<Record<string, unknown>>({})
  const [riscos, setRiscos] = useState<Risco[]>([{ descricao: '', probabilidade: '', impacto: '', nivel: '' }])
  const [arquivos, setArquivos] = useState<File[]>([])
  const [erros, setErros] = useState<Record<string, string>>({})
  const [submetendo, setSubmetendo] = useState(false)

  function atualizarDado(campo: string, valor: unknown) {
    setDados(prev => ({ ...prev, [campo]: valor }))
    setErros(prev => ({ ...prev, [campo]: '' }))
  }

  function avancar() {
    const novosErros = validarSecao(secaoAtual, dados, riscos, arquivos)
    if (Object.keys(novosErros).length > 0) {
      setErros(novosErros)
      return
    }
    setErros({})
    setSecaoAtual(prev => Math.min(prev + 1, SECOES.length - 1))
    window.scrollTo(0, 0)
  }

  function voltar() {
    setSecaoAtual(prev => Math.max(prev - 1, 0))
    window.scrollTo(0, 0)
  }

  async function submeter() {
    const novosErros = validarSecao(secaoAtual, dados, riscos, arquivos)
    if (Object.keys(novosErros).length > 0) {
      setErros(novosErros)
      return
    }

    setSubmetendo(true)
    try {
      const formData = new FormData()
      formData.append('dados', JSON.stringify(dados))
      formData.append('riscos', JSON.stringify(riscos))
      arquivos.forEach(f => formData.append('anexos', f))

      const res = await fetch('/api/iniciativas', { method: 'POST', body: formData })
      const json = await res.json()

      if (!res.ok) throw new Error(json.erro ?? 'Erro ao submeter')
      router.push(`/submeter/sucesso?protocolo=${json.protocolo}`)
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setSubmetendo(false)
    }
  }

  const dadosStr = dados as Record<string, string>

  const secaoProps = { dados: dadosStr, onChange: atualizarDado, erros }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">
            Seção {secaoAtual + 1} de {SECOES.length}: <strong>{SECOES[secaoAtual]}</strong>
          </span>
          <span className="text-sm text-gray-500">{Math.round(((secaoAtual + 1) / SECOES.length) * 100)}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-atrio rounded-full transition-all duration-300"
            style={{ width: `${((secaoAtual + 1) / SECOES.length) * 100}%` }}
          />
        </div>
        <div className="flex gap-1 mt-2 overflow-x-auto pb-1">
          {SECOES.map((s, i) => (
            <button
              key={s}
              type="button"
              onClick={() => i <= secaoAtual && setSecaoAtual(i)}
              className={`flex-shrink-0 px-2 py-1 rounded text-xs transition-colors ${
                i === secaoAtual ? 'bg-atrio text-white font-medium'
                : i < secaoAtual ? 'bg-atrio-light text-atrio cursor-pointer'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
              disabled={i > secaoAtual}
            >
              {i + 1}. {s}
            </button>
          ))}
        </div>
      </div>

      {/* Seção atual */}
      <div className="card p-6 md:p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">{SECOES[secaoAtual]}</h2>

        {secaoAtual === 0 && <Secao1Identificacao {...secaoProps} />}
        {secaoAtual === 1 && <Secao2ProblemaValor dados={dados} onChange={atualizarDado} erros={erros} />}
        {secaoAtual === 2 && <Secao3Custos />}
        {secaoAtual === 3 && <Secao4EscopoEntregas {...secaoProps} />}
        {secaoAtual === 4 && <Secao5Cronograma {...secaoProps} />}
        {secaoAtual === 5 && <Secao6Recursos dados={dados} onChange={atualizarDado} erros={erros} />}
        {secaoAtual === 6 && <Secao7Riscos riscos={riscos} onChange={setRiscos} erros={erros} />}
        {secaoAtual === 7 && <Secao8EAP {...secaoProps} />}
        {secaoAtual === 8 && <Secao9Anexos arquivos={arquivos} onChange={setArquivos} erros={erros} />}
      </div>

      {/* Navegação */}
      <div className="flex items-center justify-between mt-6">
        <button
          type="button"
          onClick={voltar}
          disabled={secaoAtual === 0}
          className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ← Anterior
        </button>

        {secaoAtual < SECOES.length - 1 ? (
          <button type="button" onClick={avancar} className="btn-primary px-8">
            Próximo →
          </button>
        ) : (
          <button
            type="button"
            onClick={submeter}
            disabled={submetendo}
            className="btn-primary px-8"
          >
            {submetendo ? 'Enviando...' : 'Submeter Iniciativa'}
          </button>
        )}
      </div>
    </div>
  )
}
