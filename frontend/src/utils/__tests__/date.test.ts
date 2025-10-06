import { describe, it, expect } from 'vitest';
import { toIso, toDate, rangesOverlap, formatRange } from '@/utils/date';

describe('utils/date', () => {
  it('toIso deve construir ISO correto a partir de yyyy-MM-dd e HH:mm', () => {
    const iso = toIso('2024-05-10', '13:45');
    const expected = toDate('2024-05-10', '13:45').toISOString();
    expect(iso).toBe(expected);
  });

  it('toDate deve construir Date correto a partir de yyyy-MM-dd e HH:mm', () => {
    const d = toDate('2024-05-10', '13:45');
    expect(d instanceof Date).toBe(true);
    expect(d.getMonth()).toBe(4); // Maio é 4 zero-based
    expect(d.getDate()).toBe(10);
    expect(d.getHours()).toBe(13);
    expect(d.getMinutes()).toBe(45);
  });

  it('rangesOverlap deve detectar sobreposição inclusive', () => {
    const aStart = new Date('2024-01-01T10:00:00Z');
    const aEnd = new Date('2024-01-01T11:00:00Z');
    const bStart = new Date('2024-01-01T11:00:00Z');
    const bEnd = new Date('2024-01-01T12:00:00Z');
    expect(rangesOverlap(aStart, aEnd, bStart, bEnd)).toBe(true); // toque no limite
  });

  it('rangesOverlap deve considerar sobreposição para eventos pontuais no mesmo horário', () => {
    const startA = new Date('2024-01-01T10:00:00Z');
    const startB = new Date('2024-01-01T10:00:00Z');
    expect(rangesOverlap(startA, startB, undefined, undefined)).toBe(true);
  });

  it('rangesOverlap não deve considerar sobreposição para eventos pontuais com horários diferentes', () => {
    const startA = new Date('2024-01-01T10:00:00Z');
    const startB = new Date('2024-01-01T10:30:00Z');
    expect(rangesOverlap(startA, startB, undefined, undefined)).toBe(false);
  });

  it('formatRange deve formatar corretamente com padrão default', () => {
    const start = new Date('2024-01-01T10:00:00Z');
    const end = new Date('2024-01-01T11:30:00Z');
    const formatted = formatRange(start, end);
    // O valor depende do timezone do ambiente; apenas valida presença do separador e estrutura "dd/MM HH:mm - dd/MM HH:mm"
    expect(formatted).toMatch(/^\d{2}\/\d{2} \d{2}:\d{2} - \d{2}\/\d{2} \d{2}:\d{2}$/);
  });

  it('formatRange deve formatar apenas início quando end é null/undefined', () => {
    const start = new Date('2024-01-01T10:00:00Z');
    const formatted = formatRange(start, undefined);
    expect(formatted).toMatch(/^\d{2}\/\d{2} \d{2}:\d{2}$/);
  });
});