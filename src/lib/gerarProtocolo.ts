export function gerarProtocolo(count: number): string {
  const ano = new Date().getFullYear()
  const numero = String(count + 1).padStart(3, '0')
  return `COE-${ano}-${numero}`
}
