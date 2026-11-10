export type CsvValue = string | number | boolean | null | undefined;

/** Значения, которые Excel может принять за формулу (CSV injection) */
const FORMULA_START = /^[=+\-@\t\r]/;

function escapeCell(value: CsvValue): string {
  if (value === null || value === undefined) return '';
  let text = String(value);
  if (typeof value === 'string' && FORMULA_START.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** CSV по RFC 4180: запятая, кавычки удваиваются, строки через CRLF */
export function toCsv(headers: readonly string[], rows: readonly (readonly CsvValue[])[]): string {
  return [headers, ...rows].map((row) => row.map(escapeCell).join(',')).join('\r\n');
}

/** Имя файла с датой: tickets-2026-11-10.csv */
export function csvFileName(prefix: string, date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${prefix}-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}.csv`;
}
