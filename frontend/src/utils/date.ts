import { format as formatDate } from 'date-fns';

// Constrói ISO a partir de campos de data e hora (yyyy-MM-dd e HH:mm)
export function toIso(dateStr: string, timeStr: string): string {
  return new Date(`${dateStr}T${timeStr}:00`).toISOString();
}

// Retorna Date a partir de campos de data e hora
export function toDate(dateStr: string, timeStr: string): Date {
  return new Date(`${dateStr}T${timeStr}:00`);
}

// Verifica se dois intervalos [startA, endA] e [startB, endB] se sobrepõem (inclusive)
// Caso end seja indefinido/null, assume o próprio start (evento pontual)
export function rangesOverlap(
  startA: Date,
  endA?: Date | null,
  startB: Date,
  endB?: Date | null
): boolean {
  const aEnd = endA ?? startA;
  const bEnd = endB ?? startB;
  return startA <= bEnd && startB <= aEnd;
}

// Helper para formatar intervalo
export function formatRange(start: Date, end?: Date | null, pattern = 'dd/MM HH:mm'): string {
  const startStr = formatDate(start, pattern);
  const endStr = end ? formatDate(end, pattern) : '';
  return end ? `${startStr} - ${endStr}` : startStr;
}