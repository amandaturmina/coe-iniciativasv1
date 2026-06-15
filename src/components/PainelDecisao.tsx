'use client'

import { useState } from 'react'

interface Props {
  id: string
  decisaoAtual?: string
  onDecisaoSalva: () => void
}

export default function PainelDecisao({ id, decisaoAtual, onDecisaoSalva }: Props) {
  const [decisao, setDecisao] = useState(decisaoAtual ?? '')
  const [justificativa, setJustificativa] = useState('')
  const [responsavelExecucao, setResponsavelExecucao] = useState('')
  const [previsaoInicio, setPrevisaoInicio] = useState('')
  const [roiEstimado, setRoiEstimado] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [toast, setToast] = useState('')

  async function salvar() {
    if (!decisao) { setToast('Selecione uma decisão'); return }
    if (justificativa.length < 20) { setToast('Justificativa muito curta (mín. 20 caracteres)'); return }
    if (decisao === 'Aprovada' && !responsavelExecucao) { setToast('Informe o responsável de execução'); return }

    setSalvando(true)
    const res = await fetch(`/api/iniciativas/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        decisao,
        justificativa,
        responsavel_execucao: responsavelExecucao,
        previsao_inicio: previsaoInicio || null,
        roi_estimado: roiEstimado ? parseFloat(roiEstimado) : null,
      }),
    })

    setSalvando(false)
    if (res.ok) {
      setToast('Decisão salva com sucesso!')
      onDecisaoSalva()
    } else {
      setToast('Erro ao salvar decisão')
    }
    setTimeout(() => setToast(''), 3000)
  }

  return (
    <div className="card p-5 space-y-4">
      <h3 className="font-semibold text-gray-900">Painel de Decisão</h3>

      {/* Decisão */}
      <div>
        <label className="label-base">Decisão *</label>
        <div className="grid grid-cols-3 gap-2 mt-1">
          {[
            { v: 'Aprovada', cor: 'border-green-500 bg-green-50 text-green-800' },
            { v: 'Recusada', cor: 'border-red-500 bg-red-50 text-red-800' },
            { v: 'Aguardar ciclo', cor: 'border-gray-400 bg-gray-50 text-gray-700' },
          ].map(({ v, cor }) => (
            <button
              key={v}
              type="button"
              onClick={() => setDecisao(v)}
              className={`py-2 px-1 rounded-lg border-2 text-xs font-medium transition-colors ${
                decisao === v ? cor : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Justificativa */}
      <div>
        <label className="label-base">Justificativa * <span className="text-gray-400 font-normal">(mín. 20 caracteres)</span></label>
        <textarea
          rows={3}
          className="input-base resize-none"
          placeholder="Descreva o motivo da decisão..."
          value={justificativa}
          onChange={e => setJustificativa(e.target.value)}
        />
        <p className="text-xs text-gray-400 text-right mt-0.5">{justificativa.length} caracteres</p>
      </div>

      {/* Campos extras para aprovação */}
      {decisao === 'Aprovada' && (
        <div className="space-y-3 p-4 bg-green-50 rounded-lg border border-green-200">
          <div>
            <label className="label-base">Responsável de execução *</label>
            <input
              type="text"
              className="input-base"
              placeholder="Nome do responsável"
              value={responsavelExecucao}
              onChange={e => setResponsavelExecucao(e.target.value)}
            />
          </div>
          <div>
            <label className="label-base">Previsão de início</label>
            <input
              type="date"
              className="input-base"
              value={previsaoInicio}
              onChange={e => setPrevisaoInicio(e.target.value)}
            />
          </div>
          <div>
            <label className="label-base">ROI estimado (R$)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">R$</span>
              <input
                type="number"
                step="0.01"
                className="input-base pl-8"
                placeholder="0,00"
                value={roiEstimado}
                onChange={e => setRoiEstimado(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`text-sm p-3 rounded-lg ${
          toast.includes('sucesso') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {toast}
        </div>
      )}

      <button
        type="button"
        onClick={salvar}
        disabled={salvando}
        className="btn-primary w-full py-2.5"
      >
        {salvando ? 'Salvando...' : 'Salvar Decisão'}
      </button>
    </div>
  )
}
