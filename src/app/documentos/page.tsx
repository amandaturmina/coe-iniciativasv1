'use client'

import { useState, useEffect, useRef } from 'react'
import LayoutProtegido from '@/components/LayoutProtegido'
import { createClient } from '@/lib/supabase/client'
import { Plus, FileText, Download, Upload, X, Tag, AlertCircle, ChevronDown } from 'lucide-react'

interface Documento {
  id: string
  tipo: 'automacao' | 'processo'
  nome: string
  versao: string
  arquivo_url: string
  arquivo_nome: string
  is_modelo: boolean
  area: string
  criado_por: string
  created_at: string
}

interface MudancaProcesso {
  id: string
  processo: string
  tipo_mudanca: string
  solicitante: string
  urgencia: string
  descricao: string
  status: string
  created_at: string
}

const TIPOS_MUDANCA = ['Melhoria de fluxo', 'Correção de erro', 'Nova etapa', 'Eliminação de etapa']
const URGENCIAS = ['Normal', 'Alta', 'Crítica']

function corUrgencia(u: string) {
  if (u === 'Crítica') return 'bg-[#fcebeb] text-[#c0392b] border-[#c0392b]/20'
  if (u === 'Alta') return 'bg-[#fef9ec] text-[#b07d1a] border-[#b07d1a]/20'
  return 'bg-[#f8f7f6] text-[#6b6966] border-[#ededeb]'
}

function DocumentCard({ doc, onRemove }: { doc: Documento; onRemove?: (id: string) => void }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[#ededeb] hover:border-[#451a1a]/20 transition-colors">
      <div className="w-9 h-9 rounded-lg bg-[#f5eded] flex items-center justify-center flex-shrink-0">
        <FileText size={18} className="text-[#451a1a]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-[#1a1917] truncate">{doc.nome}</p>
          {doc.is_modelo && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#f5eded] text-[#451a1a] font-semibold border border-[#451a1a]/20">
              Modelo
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-[#6b6966]">
          {doc.versao && <span>v{doc.versao}</span>}
          {doc.criado_por && <span>{doc.criado_por}</span>}
          <span>{new Date(doc.created_at).toLocaleDateString('pt-BR')}</span>
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {doc.arquivo_url && (
          <a
            href={doc.arquivo_url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-[#6b6966] hover:text-[#451a1a] rounded-lg hover:bg-[#f5eded] transition-colors"
            title="Baixar"
          >
            <Download size={15} />
          </a>
        )}
        {onRemove && (
          <button onClick={() => onRemove(doc.id)} className="p-1.5 text-[#6b6966] hover:text-[#c0392b] rounded-lg hover:bg-[#fcebeb] transition-colors">
            <X size={15} />
          </button>
        )}
      </div>
    </div>
  )
}

function ModalAddDocumento({
  tipo,
  nomeUsuario,
  onClose,
  onAdd,
}: {
  tipo: 'automacao' | 'processo'
  nomeUsuario: string
  onClose: () => void
  onAdd: (doc: Documento) => void
}) {
  const [nome, setNome] = useState('')
  const [versao, setVersao] = useState('1.0')
  const [isModelo, setIsModelo] = useState(false)
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [salvando, setSalvando] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function salvar() {
    if (!nome.trim()) return
    setSalvando(true)
    let arquivo_url = ''
    let arquivo_nome = ''

    if (arquivo) {
      const supabase = createClient()
      const path = `documentos/${Date.now()}_${arquivo.name}`
      const { data } = await supabase.storage.from('iniciativas').upload(path, arquivo)
      if (data) {
        const { data: urlData } = supabase.storage.from('iniciativas').getPublicUrl(path)
        arquivo_url = urlData.publicUrl
        arquivo_nome = arquivo.name
      }
    }

    const res = await fetch('/api/documentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo, nome, versao, is_modelo: isModelo, arquivo_url, arquivo_nome, criado_por: nomeUsuario }),
    })
    if (res.ok) {
      const json = await res.json()
      onAdd(json.dados)
    }
    setSalvando(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-[#1a1917]">Adicionar documento</h3>
          <button onClick={onClose} className="text-[#6b6966] hover:text-[#1a1917]"><X size={18} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="label-base">Nome do documento</label>
            <input className="input-base" placeholder="Ex: Fluxo de Aprovação v2" value={nome} onChange={e => setNome(e.target.value)} autoFocus />
          </div>
          <div>
            <label className="label-base">Versão</label>
            <input className="input-base" placeholder="1.0" value={versao} onChange={e => setVersao(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isModelo} onChange={e => setIsModelo(e.target.checked)} className="w-4 h-4 accent-[#451a1a]" />
            <span className="text-sm text-[#1a1917]">É um modelo / template</span>
          </label>
          <div>
            <label className="label-base">Arquivo</label>
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-[#ededeb] hover:border-[#451a1a]/30 rounded-xl p-4 text-center cursor-pointer hover:bg-[#f8f7f6] transition-colors"
            >
              {arquivo ? (
                <p className="text-sm text-[#1a1917] font-medium">{arquivo.name}</p>
              ) : (
                <div>
                  <Upload size={20} className="mx-auto text-[#6b6966] mb-1" />
                  <p className="text-xs text-[#6b6966]">Clique ou arraste o arquivo aqui</p>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" className="hidden" onChange={e => setArquivo(e.target.files?.[0] ?? null)} />
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={salvar} disabled={salvando || !nome.trim()} className="btn-primary flex-1">
            {salvando ? 'Salvando...' : 'Adicionar'}
          </button>
          <button onClick={onClose} className="btn-secondary px-4">Cancelar</button>
        </div>
      </div>
    </div>
  )
}

export default function DocumentosPage() {
  const [docAutomacao, setDocAutomacao] = useState<Documento[]>([])
  const [docProcesso, setDocProcesso] = useState<Documento[]>([])
  const [mudancas, setMudancas] = useState<MudancaProcesso[]>([])
  const [carregando, setCarregando] = useState(true)
  const [nomeUsuario, setNomeUsuario] = useState('')
  const [modalTipo, setModalTipo] = useState<'automacao' | 'processo' | null>(null)
  const [formMudanca, setFormMudanca] = useState({ processo: '', tipo_mudanca: TIPOS_MUDANCA[0], solicitante: '', urgencia: 'Normal', descricao: '' })
  const [enviandoMudanca, setEnviandoMudanca] = useState(false)
  const [mudancaEnviada, setMudancaEnviada] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { window.location.href = '/login'; return }
      const { data: profile } = await supabase.from('profiles').select('perfil, nome').eq('id', user.id).single()
      if (!['gestor', 'lideranca'].includes(profile?.perfil ?? '')) { window.location.href = '/dashboard'; return }
      setNomeUsuario(profile?.nome ?? '')
      setFormMudanca(v => ({ ...v, solicitante: profile?.nome ?? '' }))

      const res = await fetch('/api/documentos')
      if (res.ok) {
        const json = await res.json()
        setDocAutomacao((json.dados ?? []).filter((d: Documento) => d.tipo === 'automacao'))
        setDocProcesso((json.dados ?? []).filter((d: Documento) => d.tipo === 'processo'))
        setMudancas(json.mudancas ?? [])
      }
      setCarregando(false)
    })
  }, [])

  async function enviarMudanca() {
    if (!formMudanca.processo.trim() || !formMudanca.descricao.trim()) return
    setEnviandoMudanca(true)
    const res = await fetch('/api/documentos/mudancas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formMudanca),
    })
    if (res.ok) {
      const json = await res.json()
      setMudancas(prev => [json.dados, ...prev])
      setFormMudanca({ processo: '', tipo_mudanca: TIPOS_MUDANCA[0], solicitante: nomeUsuario, urgencia: 'Normal', descricao: '' })
      setMudancaEnviada(true)
      setTimeout(() => setMudancaEnviada(false), 3000)
    }
    setEnviandoMudanca(false)
  }

  if (carregando) {
    return (
      <LayoutProtegido>
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white rounded-xl border border-[#ededeb] animate-pulse" />)}
        </div>
      </LayoutProtegido>
    )
  }

  return (
    <LayoutProtegido>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-[#1a1917]">Documentos</h1>
          <p className="text-[#6b6966] text-sm mt-0.5">Repositório de documentos de automação e processos</p>
        </div>

        {/* Seção 1: Automação */}
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-[#ededeb] flex items-center justify-between">
            <h2 className="font-semibold text-[#1a1917]">Documentos de Automação</h2>
            <button
              onClick={() => setModalTipo('automacao')}
              className="flex items-center gap-1.5 text-sm text-[#451a1a] bg-[#f5eded] hover:bg-[#ededeb] px-3 py-1.5 rounded-lg font-medium transition-colors"
            >
              <Plus size={13} /> Adicionar
            </button>
          </div>
          <div className="p-4 space-y-2">
            {docAutomacao.length === 0 ? (
              <p className="text-sm text-[#6b6966] text-center py-6">Nenhum documento de automação cadastrado.</p>
            ) : (
              docAutomacao.map(d => (
                <DocumentCard key={d.id} doc={d} onRemove={id => setDocAutomacao(prev => prev.filter(x => x.id !== id))} />
              ))
            )}
          </div>
        </div>

        {/* Seção 2: Processos */}
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-[#ededeb] flex items-center justify-between">
            <h2 className="font-semibold text-[#1a1917]">Documentos de Processos</h2>
            <button
              onClick={() => setModalTipo('processo')}
              className="flex items-center gap-1.5 text-sm text-[#451a1a] bg-[#f5eded] hover:bg-[#ededeb] px-3 py-1.5 rounded-lg font-medium transition-colors"
            >
              <Plus size={13} /> Adicionar
            </button>
          </div>
          <div className="p-4 space-y-2">
            {docProcesso.length === 0 ? (
              <p className="text-sm text-[#6b6966] text-center py-6">Nenhum documento de processo cadastrado.</p>
            ) : (
              docProcesso.map(d => (
                <DocumentCard key={d.id} doc={d} onRemove={id => setDocProcesso(prev => prev.filter(x => x.id !== id))} />
              ))
            )}
          </div>
        </div>

        {/* Seção 3: Solicitação de mudança */}
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-[#ededeb]">
            <h2 className="font-semibold text-[#1a1917]">Solicitação de Mudança de Processo</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label-base">Processo afetado</label>
                <input className="input-base" placeholder="Nome do processo" value={formMudanca.processo} onChange={e => setFormMudanca(v => ({ ...v, processo: e.target.value }))} />
              </div>
              <div>
                <label className="label-base">Tipo de mudança</label>
                <select className="input-base" value={formMudanca.tipo_mudanca} onChange={e => setFormMudanca(v => ({ ...v, tipo_mudanca: e.target.value }))}>
                  {TIPOS_MUDANCA.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="label-base">Solicitante</label>
                <input className="input-base" value={formMudanca.solicitante} onChange={e => setFormMudanca(v => ({ ...v, solicitante: e.target.value }))} />
              </div>
              <div>
                <label className="label-base">Urgência</label>
                <select className="input-base" value={formMudanca.urgencia} onChange={e => setFormMudanca(v => ({ ...v, urgencia: e.target.value }))}>
                  {URGENCIAS.map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="label-base">Descrição da mudança</label>
                <textarea className="input-base resize-none" rows={4} placeholder="Descreva detalhadamente a mudança solicitada..." value={formMudanca.descricao} onChange={e => setFormMudanca(v => ({ ...v, descricao: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={enviarMudanca}
                disabled={enviandoMudanca || !formMudanca.processo.trim() || !formMudanca.descricao.trim()}
                className="btn-primary"
              >
                {enviandoMudanca ? 'Enviando...' : 'Enviar solicitação'}
              </button>
              {mudancaEnviada && <span className="text-sm text-[#2d7d46] font-medium">✓ Solicitação enviada!</span>}
            </div>

            {/* Lista de mudanças */}
            {mudancas.length > 0 && (
              <div className="border-t border-[#ededeb] pt-4 space-y-2">
                <p className="text-xs font-semibold text-[#6b6966] uppercase tracking-wide">Solicitações recentes</p>
                {mudancas.slice(0, 5).map(m => (
                  <div key={m.id} className="flex items-start gap-3 p-3 rounded-xl bg-[#f8f7f6] border border-[#ededeb]">
                    <AlertCircle size={15} className="text-[#6b6966] mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-[#1a1917]">{m.processo}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${corUrgencia(m.urgencia)}`}>{m.urgencia}</span>
                        <span className="text-xs text-[#6b6966]">{m.tipo_mudanca}</span>
                      </div>
                      <p className="text-xs text-[#6b6966] mt-0.5 line-clamp-1">{m.descricao}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {modalTipo && (
        <ModalAddDocumento
          tipo={modalTipo}
          nomeUsuario={nomeUsuario}
          onClose={() => setModalTipo(null)}
          onAdd={doc => {
            if (doc.tipo === 'automacao') setDocAutomacao(prev => [doc, ...prev])
            else setDocProcesso(prev => [doc, ...prev])
          }}
        />
      )}
    </LayoutProtegido>
  )
}
