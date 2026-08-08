// Availability model for the time rail.
//
// Slots are 30 minutes. Availability is generated from a seeded sequence keyed
// on the date, so it is stable within a day and different between days — there
// is no real booking API yet (see design/handoff.md, open task 1).

import { ADDRESS, DAY, HRS, MONTH, PHONE_DISPLAY, SHORT, type Service } from './data'

export type SlotState = 'open' | 'taken' | 'passed'

export interface Slot {
  id: string
  /** minutes from midnight */
  m: number
  /** HH:MM */
  t: string
  st: SlotState
  /** how many consecutive open slots start here (including this one) */
  run?: number
}

export interface DayModel {
  k: string
  dow: number
  date: Date
  isToday: boolean
  past: boolean
  closed: boolean
  slots: Slot[]
  openCount: number
  short: string
  dnum: number
  /** closing time in minutes from midnight, 0 when closed */
  end: number
  head: string
  long: string
}

export const pad = (n: number) => (n < 10 ? '0' : '') + n
export const hm = (m: number) => pad(Math.floor(m / 60)) + ':' + pad(m % 60)

/**
 * Wrap a run in explicit LTR isolates. Every string mixing digits, ₪, – or :
 * needs this or bidi reordering renders it backwards. This has broken twice.
 */
export const ltr = (s: string) => '⁦' + s + '⁩'

export const dateKey = (d: Date) =>
  d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate()

export const midnight = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate())

/** FNV-1a seed into a small xorshift PRNG, so a date always yields the same day. */
export function rng(str: string): () => number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  let a = h >>> 0
  return function () {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Price string, always bidi-isolated. */
export function disp(s: Service): string {
  if (s.k === 'r') return ltr('₪' + s.a + '–₪' + s.b)
  if (s.k === 'o') return 'מ־' + ltr('₪' + s.a)
  return ltr('₪' + s.a)
}

export function shape(s: Service): string {
  return s.k === 'f' ? 'מחיר קבוע' : s.k === 'r' ? 'טווח מחירים' : 'מחיר פתוח'
}

export function buildDay(d: Date, now: Date, busyness: number): DayModel {
  const dow = d.getDay()
  const hrs = HRS[dow]
  const k = dateKey(d)
  const isToday = k === dateKey(now)
  const past = midnight(d) < midnight(now)
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const busy = Math.max(0.2, Math.min(0.85, busyness))

  const slots: Slot[] = []
  if (hrs) {
    const r = rng(k)
    let prev: boolean = false
    for (let m = hrs[0] * 60; m < hrs[1] * 60; m += 30) {
      // A taken slot makes the next one likelier to be taken, so the book
      // clusters into blocks the way a real day does.
      const taken: boolean = r() < (prev ? Math.min(0.92, busy + 0.16) : busy - 0.14)
      prev = taken
      let st: SlotState = taken ? 'taken' : 'open'
      if (past || (isToday && m < nowMin + 15)) st = 'passed'
      slots.push({ id: k + '-' + m, m, t: hm(m), st })
    }
    let run = 0
    for (let i = slots.length - 1; i >= 0; i--) {
      run = slots[i].st === 'open' ? run + 1 : 0
      slots[i].run = run
    }
  }

  return {
    k,
    dow,
    date: d,
    isToday,
    past,
    closed: !hrs,
    slots,
    openCount: slots.filter(s => s.st === 'open').length,
    short: SHORT[dow],
    dnum: d.getDate(),
    end: hrs ? hrs[1] * 60 : 0,
    head: (isToday ? 'היום · ' : '') + 'יום ' + DAY[dow],
    long: 'יום ' + DAY[dow] + ', ' + d.getDate() + ' ב' + MONTH[d.getMonth()],
  }
}

export function buildWeek(offset: number, now: Date, busyness: number): DayModel[] {
  const sun = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - now.getDay() + offset * 7
  )
  const out: DayModel[] = []
  for (let i = 0; i < 7; i++) {
    out.push(
      buildDay(new Date(sun.getFullYear(), sun.getMonth(), sun.getDate() + i), now, busyness)
    )
  }
  return out
}

export interface OpenStatus {
  open: boolean
  label: string
  time: string
}

export function status(now: Date): OpenStatus {
  const dow = now.getDay()
  const hrs = HRS[dow]
  const min = now.getHours() * 60 + now.getMinutes()
  if (hrs && min >= hrs[0] * 60 && min < hrs[1] * 60) {
    return { open: true, label: 'פתוח עכשיו · עד ', time: pad(hrs[1]) + ':00' }
  }
  if (hrs && min < hrs[0] * 60) {
    return { open: false, label: 'סגור · נפתח היום ב־', time: pad(hrs[0]) + ':00' }
  }
  for (let i = 1; i <= 7; i++) {
    const d = (dow + i) % 7
    const next = HRS[d]
    if (next) {
      return {
        open: false,
        label: 'סגור · נפתח ' + (i === 1 ? 'מחר' : 'ביום ' + DAY[d]) + ' ב־',
        time: pad(next[0]) + ':00',
      }
    }
  }
  return { open: false, label: 'סגור', time: '' }
}

export const nameOk = (n: string) => String(n || '').trim().length >= 2

export function phoneOk(p: string): boolean {
  const d = String(p || '').replace(/\D/g, '')
  return d.length >= 9 && d.length <= 10 && d.charAt(0) === '0'
}

export function fmtPhone(p: string): string {
  const d = String(p || '').replace(/\D/g, '')
  if (d.length === 10) return d.slice(0, 3) + '-' + d.slice(3, 6) + '-' + d.slice(6)
  if (d.length === 9) return d.slice(0, 2) + '-' + d.slice(2, 5) + '-' + d.slice(5)
  return String(p || '')
}

/** A downloadable .ics for the booked appointment. */
export function icsHref(
  sel: { k: string; m: number } | null,
  chosen: Service | null
): string {
  if (!sel || !chosen) return ''
  const p = sel.k.split('-')
  const start = new Date(+p[0], +p[1] - 1, +p[2], Math.floor(sel.m / 60), sel.m % 60, 0)
  const end = new Date(start.getTime() + chosen.m * 60000)
  const f = (d: Date) =>
    d.getFullYear() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    'T' +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    '00'
  const body = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//daniel-salon//he',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    'UID:' + start.getTime() + '@daniel-salon',
    'DTSTAMP:' + f(new Date()),
    'DTSTART;TZID=Asia/Jerusalem:' + f(start),
    'DTEND;TZID=Asia/Jerusalem:' + f(end),
    'SUMMARY:' + chosen.n + ' — דניאל עיצוב שיער',
    'LOCATION:' + ADDRESS,
    'DESCRIPTION:טלפון: ' + PHONE_DISPLAY,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
  return 'data:text/calendar;charset=utf-8,' + encodeURIComponent(body)
}
