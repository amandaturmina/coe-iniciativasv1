'use client'

import { useState, useMemo } from 'react'

interface Props {
  id: string
  decisaoAtual?: string
  onDecisaoSalva: () => void
}

function NumInput({ label, value, onChange, prefix = '' }: {
  label: string
  value: string
  onChange: (v: string) => void
  prefix?: string
}) {
  return (
    <div>
      <label className="text-xs text-gray-600 font-medium">{label}</label>
      <div className="relative mt-0.5">
        {prefix && (
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">{prefix}</span>
        )}
        <input
          type="number"
          min="0"
          step="any"
          className={`w-full border border-gray-200 rounded-lg py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-atrio ${prefix ? 'pl-7 pr-3' : 'px-3'}`}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      </div>
    </div>
  )
}

export default function PainelDecisao({ id, decisaoAtual, onDecisaoSalva }: Props) {
  const [decisao, setDecisao] = useState(decisaoAtual ?? '')
  const [justificativa, setJustificativa] = useState('')
  const [responsavelExecucao, setResponsavelExecucao] = useState('')
  const [previsaoInicio, setPrevisaoInicio] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [toast, setToast] = useState('')

  // Campos da calculadora de ROI
  const [horasMes, setHorasMes] = useState('')
  const [custoHora, setCustoHora] = useState('')
  const [economiaMensal, setEconomiaMensal] = useState('')
  const [receitaAdicional, setReceitaAdicional] = useState('')
  const [custoProjeto, setCustoProjeto] = useState('')

  const roi = useMemo(() => {
    const h = parseFloat(horasMes) || 0
    const ch = parseFloat(custoHora) || 0
    const em = parseFloat(economiaMensal) || 0
    const ra = parseFloat(receitaAdicional) || 0
    const cp = parseFloat(custoProjeto) || 0

    const economiasAnualFTE = h * ch * 12
    const beneficioTotal = economiasAnualFTE + em * 12 + ra
    const roiPct = cp > 0 ? ((beneficioTotal - cp) / cp) * 100 : 0
    const paybackMeses = beneficioTotal > 0 ? cp / (beneficioTotal / 12) : 0

    return { economiasAnualFTE, beneficioTotal, roiPct, paybackMeses, temDados: cp > 0 || beneficioTotal > 0 }
  }, [horasMes, custoHora, economiaMensal, receitaAdicional, custoProjeto])

  function fmtBRL(v: number) {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
  }

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
        roi_estimado: roi.temDados ? parseFloat(roi.roiPct.toFixed(2)) : null,
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
        <label className="label-base">
          Justificativa * <span className="text-gray-400 font-normal">(mín. 20 caracteres)</span>
        </label>
        <textarea
          rows={3}
          className="input-base resize-none"
          placeholder="Descreva o motivo da decisão..."
          value={justificativa}
          onChange={e => setJustificativa(e.target.value)}
        />
        <p className="text-xs text-gray-400 text-right mt-0.5">{justificativa.length} caracteres</p>
      </div>

      {/* Campos extras para aprovação + Calculadora ROI */}
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

          {/* Calculadora ROI */}
          <div className="pt-2 border-t border-green-300">
            <p className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">Calculadora de ROI</p>
            <div className="space-y-2">
              <NumInput label="Horas economizadas / mês" value={horasMes} onChange={setHorasMes} />
              <NumInput label="Custo-hora médio da equipe" value={custoHora} onChange={setCustoHora} prefix="R$" />
              <NumInput label="Economia mensal gerada" value={economiaMensal} onChange={setEconomiaMensal} prefix="R$" />
              <NumInput label="Receita adicional esperada" value={receitaAdicional} onChange={setReceitaAdicional} prefix="R$" />
              <NumInput label="Custo total do projeto" value={custoProjeto} onChange={setCustoProjeto} prefix="R$" />
            </div>

            {roi.temDados && (
              <div className="mt-3 p-3 bg-white rounded-lg border border-green-200 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Economia FTE anual</span>
                  <span className="font-medium text-gray-800">{fmtBRL(roi.economiasAnualFTE)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Benefício total anual</span>
                  <span className="font-medium text-gray-800">{fmtBRL(roi.beneficioTotal)}</span>
                </div>
                <div className="flex justify-between text-xs border-t border-gray-100 pt-1.5 mt-1.5">
                  <span className="text-gray-700 font-semibold">ROI</span>
                  <span className={`font-bold text-sm ${roi.roiPct >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                    {roi.roiPct.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Payback estimado</span>
                  <span className="font-medium text-gray-800">
                    {roi.paybackMeses > 0 ? `${roi.paybackMeses.toFixed(1)} meses` : '—'}
                  </span>
                </div>
              </div>
            )}
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
