/**
 * useCsvExport — exportação de CSV client-side, padronizada para o SaaS.
 *
 * Formato: separador ";" e BOM UTF-8 — abre corretamente no Excel pt-BR
 * (que usa ";" como separador de lista na configuração regional brasileira).
 * Números devem ser passados já formatados com vírgula decimal quando fizer
 * sentido para leitura no Excel pt-BR.
 */
export const useCsvExport = () => {
  const escapeCell = (value: unknown): string => {
    const s = value == null ? '' : String(value)
    // Aspas duplas se contiver separador, aspas ou quebra de linha.
    if (/[";\n\r]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`
    }
    return s
  }

  /**
   * Gera e baixa um arquivo CSV.
   * @param filename nome do arquivo (inclua a extensão .csv)
   * @param header   rótulos das colunas
   * @param rows     matriz de linhas (cada linha é um array de células)
   */
  const downloadCsv = (filename: string, header: string[], rows: unknown[][]): void => {
    if (!import.meta.client) return
    const lines = [header.map(escapeCell).join(';')]
    for (const row of rows) lines.push(row.map(escapeCell).join(';'))
    const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  /** Formata número como string pt-BR com vírgula decimal (para células de valor). */
  const num = (v: number, decimals = 2): string =>
    v.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })

  /** Sufixo de data YYYY-MM-DD para nomes de arquivo. */
  const dateSuffix = (): string => new Date().toISOString().slice(0, 10)

  return { downloadCsv, num, dateSuffix }
}
