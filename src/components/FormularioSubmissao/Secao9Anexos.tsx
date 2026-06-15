'use client'

const TIPOS_ACEITOS = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.mp4,.mp3'
const MAX_ARQUIVOS = 5
const MAX_TAMANHO_MB = 10

interface Props {
  arquivos: File[]
  onChange: (arquivos: File[]) => void
  erros: Record<string, string>
}

function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function Secao9Anexos({ arquivos, onChange, erros }: Props) {
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const novos = Array.from(e.target.files ?? [])
    const errosTamanho = novos.filter(f => f.size > MAX_TAMANHO_MB * 1024 * 1024)
    if (errosTamanho.length > 0) {
      alert(`Os seguintes arquivos excedem ${MAX_TAMANHO_MB}MB: ${errosTamanho.map(f => f.name).join(', ')}`)
      return
    }
    const total = [...arquivos, ...novos].slice(0, MAX_ARQUIVOS)
    onChange(total)
    e.target.value = ''
  }

  function remover(index: number) {
    onChange(arquivos.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="label-base">Anexos</label>
        <p className="text-xs text-gray-500 mb-3">
          Espaço para anexar materiais de apoio (prints, documentos, contratos).
          Máximo {MAX_ARQUIVOS} arquivos de até {MAX_TAMANHO_MB}MB cada.
        </p>

        {arquivos.length < MAX_ARQUIVOS && (
          <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-atrio hover:bg-atrio-light/30 transition-colors">
            <div className="flex flex-col items-center gap-2 text-gray-500">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <div className="text-center">
                <span className="text-sm font-medium text-atrio">Clique para selecionar</span>
                <span className="text-sm text-gray-500"> ou arraste os arquivos</span>
              </div>
              <p className="text-xs text-gray-400">PDF, Word, Excel, PowerPoint, imagens, vídeos</p>
            </div>
            <input
              type="file"
              multiple
              accept={TIPOS_ACEITOS}
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        )}

        {arquivos.length > 0 && (
          <ul className="mt-3 space-y-2">
            {arquivos.map((arquivo, index) => (
              <li
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-atrio-light rounded flex items-center justify-center text-xs font-bold text-atrio uppercase">
                    {arquivo.name.split('.').pop()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 truncate max-w-xs">{arquivo.name}</p>
                    <p className="text-xs text-gray-500">{formatarTamanho(arquivo.size)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => remover(index)}
                  className="text-gray-400 hover:text-red-500 transition-colors ml-3"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}

        {arquivos.length >= MAX_ARQUIVOS && (
          <p className="text-xs text-amber-600 mt-2">Limite de {MAX_ARQUIVOS} arquivos atingido.</p>
        )}

        {erros.anexos && <p className="text-red-500 text-xs mt-1">{erros.anexos}</p>}
      </div>

      <div className="p-4 bg-atrio-light rounded-lg">
        <p className="text-sm text-atrio font-medium">Esta é a última seção!</p>
        <p className="text-sm text-gray-600 mt-1">
          Revise as informações antes de submeter. Após a submissão, você receberá um e-mail de confirmação
          com o número do protocolo.
        </p>
      </div>
    </div>
  )
}
