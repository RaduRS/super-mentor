import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type TimeInterval = { startMinutes: number; endMinutes: number }

export function dayOfWeekFromDateOnly(dateOnly: string): number | null {
  const match = dateOnly.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  const yyyy = Number(match[1])
  const mm = Number(match[2])
  const dd = Number(match[3])
  if (!Number.isFinite(yyyy) || !Number.isFinite(mm) || !Number.isFinite(dd)) {
    return null
  }
  const date = new Date(Date.UTC(yyyy, mm - 1, dd))
  const day = date.getUTCDay()
  return Number.isFinite(day) ? day : null
}

export function parseTimeToMinutes(value: string | null | undefined): number | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  if (!trimmed) return null
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/)
  if (!match) return null
  const hh = Number(match[1])
  const mm = Number(match[2])
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null
  return hh * 60 + mm
}

export function minutesToTime(minutes: number): string {
  const safe = Math.max(0, Math.min(24 * 60, Math.round(minutes)))
  const hh = String(Math.floor(safe / 60) % 24).padStart(2, "0")
  const mm = String(safe % 60).padStart(2, "0")
  return `${hh}:${mm}`
}

function clampInterval(interval: TimeInterval): TimeInterval | null {
  const start = Math.max(0, Math.min(24 * 60, interval.startMinutes))
  const end = Math.max(0, Math.min(24 * 60, interval.endMinutes))
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null
  if (end <= start) return null
  return { startMinutes: start, endMinutes: end }
}

export function mergeIntervals(intervals: TimeInterval[]): TimeInterval[] {
  const normalized = intervals
    .map(clampInterval)
    .filter(Boolean) as TimeInterval[]
  if (!normalized.length) return []
  const sorted = [...normalized].sort(
    (a, b) => a.startMinutes - b.startMinutes || a.endMinutes - b.endMinutes
  )
  const merged: TimeInterval[] = []
  for (const next of sorted) {
    const prev = merged[merged.length - 1]
    if (!prev || next.startMinutes > prev.endMinutes) {
      merged.push({ ...next })
      continue
    }
    prev.endMinutes = Math.max(prev.endMinutes, next.endMinutes)
  }
  return merged
}

export function subtractIntervals(params: {
  container: TimeInterval
  blocked: TimeInterval[]
}): TimeInterval[] {
  const container = clampInterval(params.container)
  if (!container) return []
  const blocked = mergeIntervals(params.blocked)
    .map((b) => ({
      startMinutes: Math.max(container.startMinutes, b.startMinutes),
      endMinutes: Math.min(container.endMinutes, b.endMinutes),
    }))
    .map(clampInterval)
    .filter(Boolean) as TimeInterval[]

  if (!blocked.length) return [container]

  const free: TimeInterval[] = []
  let cursor = container.startMinutes
  for (const b of blocked) {
    if (b.startMinutes > cursor) {
      free.push({ startMinutes: cursor, endMinutes: b.startMinutes })
    }
    cursor = Math.max(cursor, b.endMinutes)
  }
  if (cursor < container.endMinutes) {
    free.push({ startMinutes: cursor, endMinutes: container.endMinutes })
  }
  return free
}

export function computeFreeTimeWindows(params: {
  busy: Array<{ startTime: string | null; endTime: string | null }>
  rangeStartTime: string
  rangeEndTime: string
}): Array<{ startTime: string; endTime: string }> {
  const rangeStart = parseTimeToMinutes(params.rangeStartTime)
  const rangeEnd = parseTimeToMinutes(params.rangeEndTime)
  if (rangeStart === null || rangeEnd === null || rangeEnd <= rangeStart) return []

  const busyIntervals: TimeInterval[] = []
  for (const item of params.busy) {
    const start = parseTimeToMinutes(item.startTime)
    const end = parseTimeToMinutes(item.endTime)
    if (start === null || end === null) continue
    if (end > start) {
      busyIntervals.push({ startMinutes: start, endMinutes: end })
    } else if (end < start) {
      busyIntervals.push({ startMinutes: start, endMinutes: 24 * 60 })
      busyIntervals.push({ startMinutes: 0, endMinutes: end })
    }
  }

  const free = subtractIntervals({
    container: { startMinutes: rangeStart, endMinutes: rangeEnd },
    blocked: busyIntervals,
  })

  return free.map((w) => ({
    startTime: minutesToTime(w.startMinutes),
    endTime: minutesToTime(w.endMinutes),
  }))
}
