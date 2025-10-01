import { useMemo } from 'react'
import { toIso, rangesOverlap, formatRange } from '@/utils/date'
import type { Atividade } from '@/types'

export interface ConflictDetail {
  title: string
  range: string
}

export interface ConflictWarning {
  hasConflict: boolean
  message: string
  details: ConflictDetail[]
}

export function useConflictWarning(
  formDates: { dataInicio: string; horaInicio: string; dataFim?: string; horaFim?: string },
  events: Atividade[],
  editingId: string | null
): ConflictWarning | undefined {
  return useMemo(() => {
    const { dataInicio, horaInicio, dataFim, horaFim } = formDates
    if (!dataInicio || !horaInicio) return undefined

    const startDate = new Date(toIso(dataInicio, horaInicio))
    const endDate = dataFim && horaFim ? new Date(toIso(dataFim, horaFim)) : null

    const overlapping = events.filter(
      (e) =>
        e.id !== editingId &&
        rangesOverlap(new Date(e.data_inicio), e.data_fim ? new Date(e.data_fim) : null, startDate, endDate)
    )

    if (overlapping.length === 0) {
      return { hasConflict: false, message: '', details: [] }
    }

    return {
      hasConflict: true,
      message:
        'Há eventos na mesma faixa de horário nesta regional. Você ainda pode salvar, mas considere ajustar.',
      details: overlapping.map((e) => ({
        title: e.titulo,
        range: formatRange(new Date(e.data_inicio), e.data_fim ? new Date(e.data_fim) : null),
      })),
    }
  }, [formDates.dataInicio, formDates.horaInicio, formDates.dataFim, formDates.horaFim, events, editingId])
}