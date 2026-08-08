'use client'

// דניאל עיצוב שיער — customer homepage.
//
// The schedule is the hero: one vertical time rail, ruled like an appointment
// book. An open time is a solid tappable block, a taken time is a thin rule.
// Ported from the design component in design/Daniel Salon Homepage.dc.html —
// read design/design-plan.md before changing anything visual.

import { Component } from 'react'
import {
  ADDRESS,
  BIZ_NAME,
  CITY,
  DAY,
  DEMO_PASS,
  DEMO_USER,
  GMAPS,
  GROUPS,
  HRS,
  PHONE,
  PHONE_DISPLAY,
  SERVICES,
  STREET,
  STREET_NO,
  WA_BASE,
  WAZE,
  type Service,
} from '@/lib/salon/data'
import {
  buildDay,
  buildWeek,
  disp,
  fmtPhone,
  hm,
  icsHref,
  ltr,
  midnight,
  nameOk,
  pad,
  phoneOk,
  shape,
  status,
  type DayModel,
  type Slot,
} from '@/lib/salon/schedule'
import './salon.css'

const AUTH_KEY = 'ds-client-authed'
const IDENT_KEY = 'ds-client-ident'
const A11Y_KEY = 'ds-a11y'

interface Row {
  isHourRule?: boolean
  isNow?: boolean
  isSel?: boolean
  isOpen?: boolean
  isShort?: boolean
  isTaken?: boolean
  isPassed?: boolean
  t?: string
  gt?: string
  range?: string
  h?: string
  label?: string
  aria?: string
  select?: () => void
}

interface Selection {
  k: string
  m: number
  t: string
  run: number
  dayLong: string
  dayShort: string
  runLabel: string
}

interface A11yPrefs {
  /** text size step: 0 normal, 1 large, 2 huge */
  fs: number
  /** contrast: 0 normal, 1 dark, 2 light */
  hc: number
  /** highlight links */
  hl: boolean
  /** readable font */
  rf: boolean
  /** no animation */
  na: boolean
}

const A11Y_DEFAULTS: A11yPrefs = { fs: 0, hc: 0, hl: false, rf: false, na: false }

export interface SalonHomeProps {
  /** "HH:MM" — moves the clock, for previewing the late-night state */
  demoTime?: string
  busyness?: number
  wideDays?: number
  showPhotoSlot?: boolean
}

interface SalonHomeState {
  week: number
  dayIdx: number
  sel: Selection | null
  svc: number
  filt: number
  done: boolean
  cols: number
  tick: number
  authed: boolean
  u: string
  p: string
  authErr: boolean
  cname: string
  cphone: string
  idEdit: boolean
  a11yOpen: boolean
  stmt: boolean
  a11y: A11yPrefs
}

export default class SalonHome extends Component<SalonHomeProps, SalonHomeState> {
  state: SalonHomeState = {
    week: 0, dayIdx: -1, sel: null, svc: -1, filt: -1, done: false, cols: 1, tick: 0,
    authed: false, u: '', p: '', authErr: false,
    cname: '', cphone: '', idEdit: false, a11yOpen: false, stmt: false,
    a11y: A11Y_DEFAULTS,
  }

  private fit?: () => void
  private onKey?: (e: KeyboardEvent) => void
  private timer?: ReturnType<typeof setInterval>
  private scaleQ = 0
  private didScale = false
  private hadSel = false
  private reducedMotion = false
  private lastFocus: string | null = null

  // ---------- lifecycle ----------

  componentDidMount() {
    this.fit = () => {
      const w = window.innerWidth
      const wide = Math.max(3, Math.min(7, this.props.wideDays ?? 7))
      const c = w >= 1180 ? wide : w >= 700 ? 3 : 1
      if (c !== this.state.cols) this.setState({ cols: c })
    }
    this.fit()
    window.addEventListener('resize', this.fit)

    // If this whole week is already spent, open on next week instead of an
    // empty rail.
    const nw = this.now()
    const w0 = buildWeek(0, nw, this.busyness())
    if (!w0.some(d => !d.closed && !d.past && d.openCount > 0)) {
      this.setState({ week: 1, dayIdx: -1 })
    }

    try {
      if (window.localStorage.getItem(AUTH_KEY) === '1') this.setState({ authed: true })
    } catch {}

    this.timer = setInterval(() => this.setState(s => ({ tick: s.tick + 1 })), 60000)

    try {
      this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    } catch {
      this.reducedMotion = false
    }

    let loaded = false
    try {
      const raw = window.localStorage.getItem(A11Y_KEY)
      if (raw) {
        loaded = true
        this.setState({ a11y: { ...A11Y_DEFAULTS, ...JSON.parse(raw) } }, () => {
          this.syncA11y()
          this.queueScale()
        })
      }
    } catch {}
    if (!loaded) this.syncA11y()

    try {
      const id = JSON.parse(window.localStorage.getItem(IDENT_KEY) || 'null')
      if (id && id.n) this.setState({ cname: id.n, cphone: id.p || '' })
    } catch {}

    this.onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (this.state.stmt) return this.setState({ stmt: false })
      if (this.state.a11yOpen) return this.setState({ a11yOpen: false })
      if (this.state.sel) return this.setState({ sel: null, svc: -1, done: false })
    }
    document.addEventListener('keydown', this.onKey)
  }

  componentDidUpdate() {
    // Move focus into the sheet when it opens, and back to the slot that
    // opened it when it closes.
    if (this.state.sel && !this.hadSel) {
      setTimeout(() => document.getElementById('bkClose')?.focus(), 40)
    }
    if (!this.state.sel && this.hadSel) {
      const lbl = this.lastFocus
      this.lastFocus = null
      setTimeout(() => {
        let t: HTMLElement | null = lbl
          ? document.querySelector<HTMLElement>('[aria-label="' + lbl.replace(/"/g, '') + '"]')
          : null
        if (!t) t = document.getElementById('rail')
        if (t) {
          try {
            if (!t.hasAttribute('tabindex') && t.tagName !== 'BUTTON' && t.tagName !== 'A') {
              t.setAttribute('tabindex', '-1')
            }
            t.focus()
          } catch {}
        }
      }, 40)
    }
    this.hadSel = !!this.state.sel

    const lock = !!this.state.sel || this.state.stmt
    try {
      document.body.style.overflow = lock ? 'hidden' : ''
    } catch {}
    this.queueScale()
  }

  componentWillUnmount() {
    if (this.fit) window.removeEventListener('resize', this.fit)
    if (this.onKey) document.removeEventListener('keydown', this.onKey)
    if (this.timer) clearInterval(this.timer)
    try {
      document.body.style.overflow = ''
      // Leave the rest of the site alone when navigating away.
      const r = document.documentElement
      for (const a of ['data-ds-fs', 'data-ds-hc', 'data-ds-hl', 'data-ds-rf', 'data-ds-na']) {
        r.removeAttribute(a)
      }
    } catch {}
  }

  // ---------- accessibility preferences ----------

  private syncA11y() {
    const a = this.state.a11y
    try {
      const r = document.documentElement
      r.setAttribute('data-ds-fs', String(a.fs))
      r.setAttribute('data-ds-hc', String(a.hc))
      r.setAttribute('data-ds-hl', a.hl ? '1' : '0')
      r.setAttribute('data-ds-rf', a.rf ? '1' : '0')
      r.setAttribute('data-ds-na', a.na ? '1' : '0')
      window.localStorage.setItem(A11Y_KEY, JSON.stringify(a))
    } catch {}
  }

  private setA11y(patch: Partial<A11yPrefs>) {
    this.setState(
      s => ({ a11y: { ...s.a11y, ...patch } }),
      () => {
        this.syncA11y()
        this.queueScale()
      }
    )
  }

  private queueScale() {
    if (this.scaleQ) return
    this.scaleQ = window.setTimeout(() => {
      this.scaleQ = 0
      this.scaleText()
    }, 16)
  }

  /**
   * Text size is a multiplier over each element's own computed size, because
   * the page is set in absolute pixels — a root font-size change would not
   * move it. The original size is stashed on the element so "רגיל" restores it.
   */
  private scaleText() {
    const f = [1, 1.15, 1.3][this.state.a11y.fs] || 1
    if (f === 1 && !this.didScale) return
    let els: NodeListOf<HTMLElement>
    try {
      els = document.body.querySelectorAll<HTMLElement>('*')
    } catch {
      return
    }
    for (let i = 0; i < els.length; i++) {
      const el = els[i]
      if (el.tagName === 'SVG' || el.tagName === 'STYLE' || el.tagName === 'SCRIPT') continue
      const stored = el.getAttribute('data-ds-fs-base')
      let base: number
      if (stored === null) {
        base = parseFloat(window.getComputedStyle(el).fontSize) || 0
        if (!base) continue
        el.setAttribute('data-ds-fs-base', String(base))
        el.setAttribute('data-ds-fs-inline', el.style.fontSize || '')
      } else {
        base = parseFloat(stored)
      }
      el.style.fontSize =
        f === 1
          ? el.getAttribute('data-ds-fs-inline') || ''
          : Math.round(base * f * 100) / 100 + 'px'
    }
    this.didScale = f !== 1
  }

  // ---------- clock & availability ----------

  private busyness() {
    const b = this.props.busyness ?? 0.55
    return Math.max(0.2, Math.min(0.85, b))
  }

  private now(): Date {
    const d = new Date()
    const t = String(this.props.demoTime || '').trim()
    if (/^\d{1,2}:\d{2}$/.test(t)) {
      const p = t.split(':')
      d.setHours(+p[0], +p[1], 0, 0)
    }
    return d
  }

  /** How many consecutive 30-minute slots the active filter needs. */
  private need() {
    const i = this.state.filt
    return i >= 0 ? Math.ceil(SERVICES[i].m / 30) : 1
  }

  private fits(d: DayModel) {
    const need = this.need()
    return d.slots.filter(s => s.st === 'open' && (s.run || 0) >= need).length
  }

  /**
   * Collapse a day's slots into rail rows: taken and passed runs become one
   * thin rule each, hour boundaries get a hairline, and "now" gets a marker.
   */
  private rows(d: DayModel, now: Date): Row[] {
    const out: Row[] = []
    const sel = this.state.sel
    const svcI = this.state.svc
    const need = this.need()
    const nowMin = now.getHours() * 60 + now.getMinutes()
    let nowPlaced = !d.isToday
    let i = 0

    while (i < d.slots.length) {
      const s: Slot = d.slots[i]

      if (!nowPlaced && s.st !== 'passed') {
        out.push({ isNow: true, t: ltr(hm(nowMin)) })
        nowPlaced = true
      }

      if (s.st === 'taken' || s.st === 'passed') {
        const st = s.st
        let j = i
        while (j < d.slots.length && d.slots[j].st === st) j++
        const n = j - i
        const endM = d.slots[j - 1].m + 30
        out.push({
          isTaken: st === 'taken',
          isPassed: st === 'passed',
          t: s.t,
          gt: s.t,
          range: n > 1 ? ltr(s.t + '–' + hm(endM)) : ltr(s.t),
          h: Math.min(44 + (n - 1) * 11, 110) + 'px',
        })
        i = j
        continue
      }

      const isSel = !!(sel && sel.k === d.k && sel.m === s.m)
      if (s.m % 60 === 0 && out.length > 0) out.push({ isHourRule: true, t: s.t })
      const gt = s.m % 60 === 0 && out.length > 0 ? '' : s.t

      if (isSel) {
        const n = svcI >= 0 ? Math.min(Math.ceil(SERVICES[svcI].m / 30), s.run || 1) : 1
        out.push({
          isSel: true,
          t: s.t,
          gt,
          h: n * 44 + (n - 1) * 3 + 'px',
          range: n > 1 ? ltr(s.t + '–' + hm(s.m + n * 30)) : ltr(s.t),
          label: svcI >= 0 ? SERVICES[svcI].n : 'נבחר',
          select: () => this.pick(d, s),
        })
        i += n
        continue
      }

      if (need > 1 && (s.run || 0) < need) {
        out.push({ isShort: true, t: s.t, gt, label: 'חלון קצר מדי' })
        i += 1
        continue
      }

      out.push({
        isOpen: true,
        t: s.t,
        gt,
        label: 'פנוי',
        aria: 'קביעת תור ל' + d.head.replace('היום · ', '') + ' בשעה ' + s.t,
        select: () => this.pick(d, s),
      })
      i += 1
    }

    if (!nowPlaced && d.isToday && nowMin < d.end) {
      out.push({ isNow: true, t: ltr(hm(nowMin)) })
    }
    return out
  }

  // ---------- actions ----------

  private pick(day: DayModel, s: Slot) {
    const now = this.now()
    this.lastFocus = 'קביעת תור ל' + day.head.replace('היום · ', '') + ' בשעה ' + s.t
    const sun = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
    const diff = Math.round((midnight(day.date).getTime() - sun.getTime()) / 86400000)
    const runMin = (s.run || 1) * 30
    // Keep the filtered service only if it still fits this window.
    const keep =
      this.state.filt >= 0 && SERVICES[this.state.filt].m <= runMin ? this.state.filt : -1

    this.setState({
      week: Math.floor(diff / 7),
      dayIdx: ((diff % 7) + 7) % 7,
      svc: keep,
      done: false,
      sel: {
        k: day.k,
        m: s.m,
        t: s.t,
        run: s.run || 1,
        dayLong: day.long,
        dayShort: day.isToday ? 'היום' : day.long,
        runLabel:
          runMin >= 120
            ? 'אחרי השעה הזאת פנויות עוד ' + runMin / 60 + ' שעות רצוף'
            : runMin >= 60
              ? 'יש כאן ' + runMin + ' דקות רצוף'
              : 'יש כאן חלון של ' + runMin + ' דקות',
      },
    })
  }

  private setFilter(i: number) {
    this.setState(st => ({ filt: st.filt === i ? -1 : i, sel: null, svc: -1, done: false }))
  }

  private clearSel = () => this.setState({ sel: null, svc: -1, done: false })

  private saveIdent() {
    try {
      window.localStorage.setItem(
        IDENT_KEY,
        JSON.stringify({ n: this.state.cname.trim(), p: this.state.cphone.trim() })
      )
    } catch {}
  }

  private login = () => {
    const u = this.state.u.trim()
    const p = this.state.p.trim()
    if (u === DEMO_USER && p === DEMO_PASS) {
      try {
        window.localStorage.setItem(AUTH_KEY, '1')
      } catch {}
      this.setState({ authed: true, u: '', p: '', authErr: false })
      return
    }
    this.setState({ authErr: true })
  }

  private logout = () => {
    try {
      window.localStorage.setItem(AUTH_KEY, '0')
    } catch {}
    this.setState({ authed: false, u: '', p: '', authErr: false })
  }

  // ---------- render ----------

  render() {
    const now = this.now()
    const a = this.state.a11y
    const cols = this.state.cols
    const busy = this.busyness()
    const week = buildWeek(this.state.week, now, busy)
    const filt = this.state.filt
    const need = this.need()
    const authed = this.state.authed
    const mask = (s: Service) => (authed ? disp(s) : '···')
    const count = (d: DayModel) => (filt >= 0 ? this.fits(d) : d.openCount)

    // Which day the narrow layout is showing.
    let di = this.state.dayIdx
    if (di < 0) {
      di = this.state.week === 0 ? now.getDay() : 0
      if (!week[di] || count(week[di]) === 0) {
        for (let i = 0; i < 7; i++) {
          if (count(week[i]) > 0 && !week[i].past) {
            di = i
            break
          }
        }
      }
    }
    di = Math.max(0, Math.min(6, di))

    const n = Math.min(cols, 7)
    const start = n >= 7 ? 0 : Math.max(0, Math.min(7 - n, di))
    const railDays = (n >= 7 ? week : week.slice(start, start + n)).map(d => {
      const c = count(d)
      return {
        head: d.head,
        closed: d.closed,
        k: d.k,
        few: !d.closed && c > 0 && c <= 2,
        some: !d.closed && c > 2,
        none: !d.closed && c === 0,
        countLabel: d.closed
          ? 'סגור'
          : c === 0
            ? d.past
              ? 'עבר'
              : filt >= 0
                ? 'אין חלון מתאים'
                : 'אין שעות פנויות'
            : c === 1
              ? 'נותרה שעה אחת'
              : c === 2
                ? 'נותרו 2'
                : c + ' שעות פנויות',
        rows: this.rows(d, now),
      }
    })

    const strip = week.map((d, i) => {
      const c = count(d)
      const live = !d.closed && c > 0
      return {
        key: d.k,
        short: d.short,
        dnum: d.dnum,
        isSel: i === di && live,
        pickable: !(i === di && live) && live,
        dead: d.closed || c === 0,
        few: c > 0 && c <= 2,
        some: c > 2,
        chipCount: d.closed
          ? 'סגור'
          : c === 0
            ? d.past
              ? 'עבר'
              : filt >= 0
                ? 'לא מתאים'
                : 'מלא'
            : c === 1
              ? 'נותרה 1'
              : c === 2
                ? 'נותרו 2'
                : c + ' פנויות',
        select: () => this.setState({ dayIdx: i }),
      }
    })

    // The above-fold answer: the next four bookable windows, starting today.
    const hits: { t: string; day: string; select: () => void }[] = []
    for (let off = 0; off < 14 && hits.length < 4; off++) {
      const d = buildDay(
        new Date(now.getFullYear(), now.getMonth(), now.getDate() + off),
        now,
        busy
      )
      for (let j = 0; j < d.slots.length && hits.length < 4; j++) {
        const s = d.slots[j]
        if (s.st !== 'open' || (s.run || 0) < need) continue
        hits.push({
          t: s.t,
          day: off === 0 ? 'היום' : off === 1 ? 'מחר' : 'יום ' + DAY[d.dow],
          select: () => this.pick(d, s),
        })
      }
    }
    const first = hits[0]
    const firstIsToday = !!first && first.day === 'היום'
    const st = status(now)
    const svcName = filt >= 0 ? SERVICES[filt].n : ''
    const todayDay = buildDay(now, now, busy)
    const th = HRS[now.getDay()]

    const headline = !first
      ? filt >= 0
        ? 'אין חלון פנוי ל' + svcName + ' בשבועיים הקרובים — כתבו לדניאל'
        : 'אין שעות פנויות בשבועיים הקרובים — כתבו לדניאל'
      : filt >= 0
        ? firstIsToday
          ? svcName + ' — הכי מוקדם היום'
          : 'ל' + svcName + ' — הכי מוקדם'
        : firstIsToday
          ? 'פנוי היום, ' + todayDay.head.replace('היום · ', '')
          : first.day === 'מחר'
            ? 'היום נסגר. הכי מוקדם — מחר'
            : 'הכי מוקדם'

    const sel = this.state.sel
    const svcIdx = this.state.svc
    const chosen = svcIdx >= 0 ? SERVICES[svcIdx] : null
    const maxMin = sel ? sel.run * 30 : 0

    // Only services that actually fit the run starting at the picked slot.
    const sheetGroups = GROUPS.map((g, gi) => ({
      name: g,
      items: SERVICES.map((s, i) => ({ s, i }))
        .filter(x => x.s.g === gi && x.s.m <= maxMin)
        .map(x => ({
          key: x.i,
          name: x.s.n,
          priceFull: mask(x.s),
          min: x.s.m,
          chosen: x.i === svcIdx,
          select: () => this.setState({ svc: x.i }),
        })),
    })).filter(g => g.items.length > 0)
    const tightCount = SERVICES.filter(s => s.m > maxMin).length

    const okN = nameOk(this.state.cname)
    const okP = phoneOk(this.state.cphone)
    const identSaved = okN && okP && !this.state.idEdit
    const ready = svcIdx >= 0 && okN && okP

    const selRange = sel
      ? chosen
        ? ltr(sel.t + '–' + hm(sel.m + Math.min(Math.ceil(chosen.m / 30), sel.run) * 30))
        : ltr(sel.t)
      : ''
    const doneLine = sel && chosen ? (authed ? chosen.n + ' · ' + disp(chosen) : chosen.n) : ''
    const waText =
      sel && chosen
        ? 'שלום דניאל, קבעתי תור: ' + sel.dayLong + ' · ' + sel.t + ' · ' + chosen.n +
          (okN ? ' · על שם ' + this.state.cname.trim() : '') +
          (okP ? ' · ' + fmtPhone(this.state.cphone) : '')
        : 'שלום דניאל, אני רוצה לקבוע תור'

    const weekLabel =
      this.state.week === 0
        ? 'השבוע'
        : this.state.week === 1
          ? 'השבוע הבא'
          : 'בעוד ' + this.state.week + ' שבועות'
    const weekRange =
      week[0].dnum + '.' + (week[0].date.getMonth() + 1) + '–' +
      week[6].dnum + '.' + (week[6].date.getMonth() + 1)

    const groups = GROUPS.map((g, gi) => ({
      name: g,
      items: SERVICES.map((s, i) => ({ s, i })).filter(x => x.s.g === gi),
    }))

    const isWide = cols >= 7
    const showGutter = cols < 7
    const railCols = cols === 1 ? '1fr' : 'repeat(' + Math.min(cols, 7) + ',minmax(0,1fr))'
    const rowCols = showGutter ? '46px 1fr' : '1fr'
    const sheetAnim =
      this.reducedMotion || a.na ? 'none' : 'ds-sheet-up 200ms ease-out both'
    const liveMsg = this.state.done
      ? 'התור נשמר. פרטי התור מוצגים בחלון האישור.'
      : filt >= 0
        ? 'סינון פעיל — ' + svcName
        : ''

    const stop = (e: React.MouseEvent) => e.stopPropagation()

    const gutter = (cls: string, content: React.ReactNode) =>
      showGutter ? <p className={'ds-gutter ' + cls}>{content}</p> : null

    return (
      <div className="ds-root" dir="rtl" lang="he">
        <a href="#rail" className="ds-skip ds-control">דלגו לרשימת השעות</a>
        <p aria-live="polite" className="ds-sr">{liveMsg}</p>

        <header className="ds-header">
          <div className="ds-header-row">
            <p className="ds-addr-line">{CITY} · {STREET} <bdi>{STREET_NO}</bdi></p>
            {isWide && (
              <div className="ds-contact-row">
                <a href={`tel:${PHONE}`} className="ds-ulink ds-control">
                  טלפון <bdi dir="ltr">{PHONE_DISPLAY}</bdi>
                </a>
                <a href={WA_BASE} className="ds-ulink ds-control">וואטסאפ</a>
                {!authed && (
                  <a href="#signin" className="ds-ulink ds-ulink--accent ds-control">כניסה</a>
                )}
                {authed && (
                  <button type="button" onClick={this.logout} className="ds-logout">יציאה</button>
                )}
              </div>
            )}
          </div>

          <h1 className="ds-h1">{BIZ_NAME}</h1>

          <div className="ds-status-row">
            <span className={'ds-dot ' + (st.open ? 'ds-dot--open' : 'ds-dot--shut')} />
            <p className="ds-status-text">
              {st.label}
              <bdi style={{ fontVariantNumeric: 'tabular-nums' }}>{st.time}</bdi>
            </p>
          </div>

          <p className="ds-lead">
            כיסא אחד, ספר אחד. השעות שפנויות אצל דניאל מופיעות כאן בזמן אמת — בוחרים שעה, וזה נסגר.
          </p>
        </header>

        <main>
          <section aria-label="התור הפנוי הקרוב" className="ds-sec ds-sec--plate">
            <div className="ds-plate">
              <div className="ds-plate-head">
                <p className="ds-plate-headline">{headline}</p>
                <p className="ds-plate-clock">
                  מתעדכן בזמן אמת ·{' '}
                  <bdi style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {pad(now.getHours()) + ':' + pad(now.getMinutes())}
                  </bdi>
                </p>
              </div>

              {first && (
                <div>
                  <div className="ds-plate-big-row">
                    <bdi className="ds-plate-big">{first.t}</bdi>
                    <p className="ds-plate-bigday">{firstIsToday ? 'היום' : first.day}</p>
                  </div>

                  <button type="button" onClick={first.select} className="ds-cta ds-plate-cta">
                    קבעו את השעה הזאת
                  </button>

                  {hits.length > 1 && (
                    <div className="ds-alt-row">
                      <span className="ds-alt-or">או</span>
                      {hits.slice(1).map((c, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={c.select}
                          className="ds-alt-btn ds-ghost ds-ghost--paper"
                        >
                          <bdi className="ds-alt-t">{c.t}</bdi>
                          <span className="ds-alt-day">{c.day}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <p className="ds-plate-note">
                {firstIsToday
                  ? 'לחיצה על שעה פותחת קביעת תור'
                  : 'השעות של היום כבר נלקחו או עברו'}{' '}
                · <a href="#rail">כל השעות של השבוע</a>
              </p>
              <p className="ds-plate-note ds-plate-note--tight">
                אין שעה שמתאימה? <a href={WA_BASE}>כתבו לדניאל</a>
              </p>
            </div>
          </section>

          <section id="rail" className="ds-sec ds-sec--rail">
            <div className="ds-comb" />

            <h2 className="ds-h2" style={{ maxWidth: '24ch' }}>הכיסא, שעה־שעה</h2>
            <p className="ds-body" style={{ maxWidth: '54ch' }}>
              בלוק מלא = השעה פנויה, לוחצים וקובעים. קו דק = השעה נלקחה. הזמן יורד מלמעלה למטה, כמו ביומן.
            </p>

            <div className="ds-filter">
              <div className="ds-filter-head">
                <p className="ds-filter-q">בשביל מה אתם באים? נסנן את השעות לפי המשך.</p>
                {filt >= 0 && (
                  <button
                    type="button"
                    onClick={() => this.setFilter(filt)}
                    className="ds-filter-clear ds-ghost"
                  >
                    נקו סינון ✕
                  </button>
                )}
              </div>
              <div className="ds-chiprow">
                {SERVICES.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => this.setFilter(i)}
                    aria-pressed={filt === i}
                    className={'ds-chip ' + (filt === i ? 'ds-on' : 'ds-ghost ds-ghost--deep')}
                  >
                    {s.n}
                    <bdi className="ds-chip-min">{s.m} דק׳</bdi>
                  </button>
                ))}
              </div>
              {filt >= 0 && (
                <p className="ds-filter-label">
                  מוצגות רק שעות שיש אחריהן {SERVICES[filt].m} דקות רצוף — מספיק ל{svcName}.
                </p>
              )}
            </div>

            <div className="ds-weekbar">
              <p className="ds-weeklabel">
                {weekLabel} <bdi dir="ltr" className="ds-weekrange">{weekRange}</bdi>
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  aria-label="שבוע קודם"
                  onClick={() => this.setState(s => ({ week: Math.max(0, s.week - 1), dayIdx: -1 }))}
                  className="ds-navbtn ds-ghost"
                >
                  ›
                </button>
                <button
                  type="button"
                  aria-label="שבוע הבא"
                  onClick={() => this.setState(s => ({ week: Math.min(3, s.week + 1), dayIdx: -1 }))}
                  className="ds-navbtn ds-ghost"
                >
                  ‹
                </button>
              </div>
            </div>

            {showGutter && (
              <div className="ds-strip">
                {strip.map(d =>
                  d.dead ? (
                    <div key={d.key} className="ds-day ds-day--dead">
                      <span className="ds-day-short">{d.short}</span>
                      <bdi className="ds-day-num">{d.dnum}</bdi>
                      <span className="ds-day-count">{d.chipCount}</span>
                    </div>
                  ) : (
                    <button
                      key={d.key}
                      type="button"
                      onClick={d.select}
                      className={'ds-day ' + (d.isSel ? 'ds-on' : 'ds-ghost ds-ghost--deep')}
                    >
                      <span className="ds-day-short">{d.short}</span>
                      <bdi className="ds-day-num">{d.dnum}</bdi>
                      {d.isSel ? (
                        <span className="ds-day-count">{d.chipCount}</span>
                      ) : d.few ? (
                        <span className="ds-day-count ds-day-count--few">
                          <span className="ds-few-tick" />
                          {d.chipCount}
                        </span>
                      ) : (
                        <span className="ds-day-count ds-day-count--muted">{d.chipCount}</span>
                      )}
                    </button>
                  )
                )}
              </div>
            )}

            <div className="ds-railgrid" style={{ gridTemplateColumns: railCols }}>
              {railDays.map(d => (
                <div key={d.k}>
                  <div className="ds-dayhead">
                    <p className="ds-dayname">{d.head}</p>
                    <p className={'ds-daycount' + (d.few ? ' ds-daycount--few' : '')}>
                      {d.few && <span className="ds-few-dot" />}
                      {d.countLabel}
                    </p>
                  </div>

                  {d.closed && (
                    <div className="ds-closed-plate">
                      <p>שבת · סגור</p>
                    </div>
                  )}

                  <div className="ds-rows">
                    {d.rows.map((r, ri) => {
                      if (r.isHourRule) {
                        return (
                          <div
                            key={ri}
                            className="ds-row ds-row--hour"
                            style={{ gridTemplateColumns: rowCols }}
                          >
                            {gutter('ds-gutter--hour', <bdi>{r.t}</bdi>)}
                            <span className="ds-hairline" />
                          </div>
                        )
                      }
                      if (r.isNow) {
                        return (
                          <div
                            key={ri}
                            className="ds-row ds-row--now"
                            style={{ gridTemplateColumns: rowCols }}
                          >
                            {gutter('ds-gutter--now', 'עכשיו')}
                            <div className="ds-now">
                              <span className="ds-now-dot" />
                              <span className="ds-now-line" />
                              <bdi className="ds-now-t">{r.t}</bdi>
                            </div>
                          </div>
                        )
                      }
                      if (r.isSel) {
                        return (
                          <div
                            key={ri}
                            className="ds-row ds-row--sel"
                            style={{ gridTemplateColumns: rowCols }}
                          >
                            {gutter('ds-gutter--sel', <bdi>{r.gt}</bdi>)}
                            <button
                              type="button"
                              onClick={r.select}
                              aria-pressed="true"
                              className="ds-slot-sel ds-on"
                              style={{ minHeight: r.h }}
                            >
                              <bdi className="ds-slot-sel-range">{r.range}</bdi>
                              <span className="ds-slot-sel-label">✓ {r.label}</span>
                            </button>
                          </div>
                        )
                      }
                      if (r.isOpen) {
                        return (
                          <div
                            key={ri}
                            className="ds-row ds-row--slot"
                            style={{ gridTemplateColumns: rowCols }}
                          >
                            {gutter('', <bdi>{r.gt}</bdi>)}
                            <button
                              type="button"
                              onClick={r.select}
                              aria-label={r.aria}
                              className="ds-slot ds-cta"
                            >
                              <bdi className="ds-slot-t">{r.t}</bdi>
                              <span className="ds-slot-label">{r.label}</span>
                            </button>
                          </div>
                        )
                      }
                      if (r.isShort) {
                        return (
                          <div
                            key={ri}
                            className="ds-row ds-row--slot"
                            style={{ gridTemplateColumns: rowCols }}
                          >
                            {gutter('', <bdi>{r.gt}</bdi>)}
                            <div className="ds-slot-short">
                              <bdi className="ds-slot-short-t">{r.t}</bdi>
                              <span style={{ flex: 1 }} />
                              <span className="ds-slot-short-label">{r.label}</span>
                            </div>
                          </div>
                        )
                      }
                      // taken / passed
                      return (
                        <div
                          key={ri}
                          className="ds-row ds-row--block"
                          style={{ gridTemplateColumns: rowCols, minHeight: r.h }}
                        >
                          {gutter('', <bdi>{r.gt}</bdi>)}
                          <div className="ds-block" style={{ minHeight: r.h }}>
                            <span className={r.isTaken ? 'ds-rule-solid' : 'ds-rule-dashed'} />
                            <span className="ds-block-label">
                              {r.isTaken ? 'תפוס' : 'עבר'} <bdi>{r.range}</bdi>
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section id="prices" className="ds-sec ds-sec--far">
            <div className="ds-comb" />

            <h2 className="ds-h2" style={{ maxWidth: '26ch' }}>כמה זה עולה, כל עשרת השירותים</h2>
            <p className="ds-body" style={{ maxWidth: '56ch' }}>
              שלוש צורות מחיר, וכל אחת כתובה כמו שהיא: מחיר קבוע הוא סופי; טווח ומחיר פתוח נסגרים
              איתך על הכיסא לפני שדניאל מתחיל. לחיצה על שירות מסננת את השעות למעלה.
            </p>

            {authed && (
              <div className="ds-legend">
                <p><bdi dir="ltr">₪70</bdi> — קבוע</p>
                <p><bdi dir="ltr">₪80–₪120</bdi> — טווח</p>
                <p>מ־<bdi dir="ltr">₪250</bdi> — מחיר פתוח</p>
              </div>
            )}

            {!authed && (
              <div id="signin" className="ds-signin">
                <p className="ds-signin-h">המחירים פתוחים ללקוחות רשומים</p>
                <p className="ds-signin-p">
                  קביעת התור פתוחה לכולם. כדי לראות את המחירון — היכנסו פעם אחת, והדפדפן יזכור אתכם.
                </p>
                <div className="ds-fields">
                  <label style={{ display: 'block' }}>
                    <span className="ds-field-label">שם משתמש</span>
                    <input
                      type="text"
                      className="ds-input"
                      value={this.state.u}
                      onChange={e => this.setState({ u: e.target.value, authErr: false })}
                      onKeyDown={e => { if (e.key === 'Enter') this.login() }}
                      autoComplete="username"
                      placeholder="1"
                    />
                  </label>
                  <label style={{ display: 'block' }}>
                    <span className="ds-field-label">סיסמה</span>
                    <input
                      type="password"
                      className="ds-input"
                      value={this.state.p}
                      onChange={e => this.setState({ p: e.target.value, authErr: false })}
                      onKeyDown={e => { if (e.key === 'Enter') this.login() }}
                      autoComplete="current-password"
                      placeholder="1"
                    />
                  </label>
                </div>
                <button type="button" onClick={this.login} className="ds-cta ds-signin-cta">
                  כניסה וצפייה במחירון
                </button>
                <p className="ds-autherr">
                  {this.state.authErr ? 'שם משתמש או סיסמה שגויים.' : ''}
                </p>
                <p className="ds-signin-hint">
                  להדגמה: שם משתמש <bdi style={{ fontWeight: 700 }}>{DEMO_USER}</bdi>, סיסמה{' '}
                  <bdi style={{ fontWeight: 700 }}>{DEMO_PASS}</bdi>.
                </p>
              </div>
            )}

            <div className="ds-pricegrid">
              {groups.map(g => (
                <div key={g.name}>
                  <h3 className="ds-h3">{g.name}</h3>
                  {g.items.map(x => (
                    <button
                      key={x.i}
                      type="button"
                      aria-pressed={filt === x.i}
                      onClick={() => {
                        this.setFilter(x.i)
                        try {
                          window.location.hash = 'rail'
                        } catch {}
                      }}
                      className={'ds-pricerow' + (filt === x.i ? ' ds-pricerow--on' : '')}
                    >
                      <div>
                        <p className="ds-svcname">{x.s.n}</p>
                        <p className="ds-svcmeta">
                          <bdi>{x.s.m}</bdi> דק׳ ·{' '}
                          {filt === x.i ? 'מציג שעות מתאימות' : shape(x.s)}
                        </p>
                      </div>
                      <p className="ds-price">{mask(x.s)}</p>
                    </button>
                  ))}
                </div>
              ))}
            </div>

            <p className="ds-pay">מזומן וכרטיס אשראי, במקום.</p>
          </section>

          <section className="ds-sec ds-sec--far">
            <div className="ds-comb" />
            <div className="ds-split">
              <div>
                <h2 className="ds-h2">דניאל. כיסא אחד.</h2>
                <p className="ds-about-p">
                  ספר אחד, כיסא אחד: מי שקובעים איתו תור הוא מי שחותך. אין תחלופה ואין &rdquo;מי פנוי
                  עכשיו&ldquo;. גברים, נשים, ילדים, תספורת ראשונה, זקן ושעווה — הכול על אותו כיסא
                  ב{STREET} <bdi>{STREET_NO}</bdi>.
                </p>
              </div>
              {this.props.showPhotoSlot !== false && (
                <div className="ds-photo">
                  <p>
                    photo slot · 4:5
                    <br />
                    דניאל בעבודה — צילום אמיתי
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="ds-sec ds-sec--far">
            <div className="ds-comb" />
            <h2 className="ds-h2">איפה זה, ומתי פתוח</h2>

            <div className="ds-split ds-split--map">
              <div>
                <p className="ds-addr-big">
                  {STREET} <bdi>{STREET_NO}</bdi>, {CITY}
                </p>
                <div className="ds-navlinks">
                  <a href={WAZE} className="ds-navlink ds-ghost ds-ghost--deep ds-control">
                    ניווט בוויז
                  </a>
                  <a href={GMAPS} className="ds-navlink ds-ghost ds-ghost--deep ds-control">
                    מפות גוגל
                  </a>
                </div>
              </div>

              <div>
                <div className="ds-hours">
                  <p className="ds-hours-day">ראשון–חמישי</p>
                  <p className="ds-hours-time"><bdi dir="ltr">09:00–18:00</bdi></p>
                  <p className="ds-hours-day">שישי</p>
                  <p className="ds-hours-time"><bdi dir="ltr">09:00–14:00</bdi></p>
                  <p className="ds-hours-day">שבת</p>
                  <p className="ds-hours-closed">סגור</p>
                </div>
                <p className="ds-todayline">
                  {th
                    ? 'היום, יום ' + DAY[now.getDay()] + ' — ' +
                      ltr(pad(th[0]) + ':00–' + pad(th[1]) + ':00')
                    : 'היום שבת — סגור'}
                </p>
              </div>
            </div>

            <div className="ds-policy">
              <p>לקוח שלא הגיע לתור יחויב במחיר מלא. לביטול, אנא הודיעו מראש.</p>
              <p>כיסא אחד — שעה שנשמרה לך היא שעה שדניאל לא נותן לאף אחד אחר.</p>
              <a href="#rail" className="ds-cta ds-policy-cta ds-control">קבע תור אצל דניאל</a>
            </div>
          </section>
        </main>

        <footer className="ds-footer">
          <p>
            {BIZ_NAME} · {ADDRESS} ·{' '}
            <a href={`tel:${PHONE}`} style={{ fontWeight: 600 }}>
              <bdi dir="ltr">{PHONE_DISPLAY}</bdi>
            </a>
          </p>
        </footer>

        {sel && (
          <div className="ds-scrim" onClick={this.clearSel}>
            <div
              onClick={stop}
              role="dialog"
              aria-modal="true"
              aria-labelledby="bkTitle"
              className="ds-sheet"
              style={{ animation: sheetAnim }}
            >
              <div className="ds-sheet-head">
                <div style={{ minWidth: 0 }}>
                  <p className="ds-sheet-day">{sel.dayLong}</p>
                  <bdi id="bkTitle" className="ds-sheet-time">{selRange}</bdi>
                  <p className="ds-sheet-run">{sel.runLabel}</p>
                </div>
                <button
                  type="button"
                  id="bkClose"
                  onClick={this.clearSel}
                  aria-label="סגירת קביעת התור"
                  className="ds-close ds-ghost"
                >
                  ✕
                </button>
              </div>

              {!this.state.done && (
                <>
                  <div className="ds-sheet-body">
                    <div className="ds-ident">
                      {identSaved ? (
                        <div className="ds-ident-known">
                          <p className="ds-ident-line">
                            התור על שם {this.state.cname.trim()} · {ltr(fmtPhone(this.state.cphone))}
                          </p>
                          <button
                            type="button"
                            onClick={() => this.setState({ idEdit: true })}
                            className="ds-ident-edit ds-ghost"
                          >
                            שינוי
                          </button>
                        </div>
                      ) : (
                        <div>
                          <p className="ds-ident-q">
                            על שם מי לרשום? הפרטים נשמרים בדפדפן שלכם לפעם הבאה.
                          </p>
                          <div className="ds-ident-fields">
                            <label style={{ display: 'block' }}>
                              <span className="ds-field-label">שם מלא</span>
                              <input
                                type="text"
                                className="ds-input ds-input--sheet"
                                value={this.state.cname}
                                onChange={e => this.setState({ cname: e.target.value })}
                                autoComplete="name"
                                placeholder="ישראל ישראלי"
                              />
                            </label>
                            <label style={{ display: 'block' }}>
                              <span className="ds-field-label">טלפון נייד</span>
                              <input
                                type="tel"
                                dir="ltr"
                                inputMode="tel"
                                className="ds-input ds-input--sheet ds-input--tel"
                                value={this.state.cphone}
                                onChange={e => this.setState({ cphone: e.target.value })}
                                autoComplete="tel"
                                placeholder="052-000-0000"
                              />
                            </label>
                          </div>
                        </div>
                      )}
                    </div>

                    {sheetGroups.map(g => (
                      <div key={g.name} className="ds-svcgroup">
                        <p className="ds-svcgroup-name">{g.name}</p>
                        <div className="ds-svclist">
                          {g.items.map(v => (
                            <button
                              key={v.key}
                              type="button"
                              onClick={v.select}
                              aria-pressed={v.chosen}
                              className={'ds-svcbtn' + (v.chosen ? ' ds-svcbtn--on' : '')}
                            >
                              <span className="ds-svcmark" />
                              <span className="ds-svctext">
                                <span>{v.name}</span>
                                <span className="ds-svcdur"><bdi>{v.min}</bdi> דק׳</span>
                              </span>
                              <span className="ds-svcprice">{v.priceFull}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}

                    {tightCount > 0 && (
                      <p className="ds-tight">
                        {tightCount === 1
                          ? 'שירות אחד נוסף דורש רצף ארוך יותר מהחלון הזה.'
                          : tightCount + ' שירותים נוספים דורשים רצף ארוך יותר מהחלון הזה.'}
                      </p>
                    )}
                    {!authed && (
                      <p className="ds-sheet-locked">
                        המחירים מוצגים ללקוחות רשומים —{' '}
                        <a href="#signin" onClick={this.clearSel}>כניסה</a>.
                      </p>
                    )}
                  </div>

                  <div className="ds-sheet-foot">
                    {chosen && (
                      <div className="ds-chosen">
                        <p className="ds-chosen-name">
                          {chosen.n}{' '}
                          <span className="ds-chosen-meta"><bdi>{chosen.m} דק׳</bdi></span>
                        </p>
                        <p className="ds-chosen-price">{mask(chosen)}</p>
                      </div>
                    )}
                    {ready ? (
                      <button
                        type="button"
                        className="ds-cta ds-confirm"
                        onClick={() => {
                          this.saveIdent()
                          this.setState({ done: true, idEdit: false })
                        }}
                      >
                        קבעו את התור
                      </button>
                    ) : (
                      <div className="ds-notready">
                        {svcIdx < 0
                          ? 'בחרו שירות כדי להמשיך'
                          : !okN
                            ? 'הוסיפו שם מלא כדי לאשר'
                            : 'הוסיפו מספר טלפון נייד כדי לאשר'}
                      </div>
                    )}
                    <p className="ds-fineprint">
                      לקוח שלא הגיע לתור יחויב במחיר מלא. לביטול, אנא הודיעו מראש.
                    </p>
                  </div>
                </>
              )}

              {this.state.done && (
                <div className="ds-done">
                  <p className="ds-done-h">התור נשמר על שמך.</p>
                  <p className="ds-done-line">{doneLine}</p>
                  <div className="ds-done-actions">
                    <a
                      href={WA_BASE + '?text=' + encodeURIComponent(waText)}
                      className="ds-cta ds-done-wa ds-control"
                    >
                      שלחו אישור לדניאל
                    </a>
                    <a
                      href={icsHref(sel, chosen)}
                      download="daniel-tor.ics"
                      className="ds-strong ds-done-ics ds-control"
                    >
                      הוסיפו ליומן
                    </a>
                    <button type="button" onClick={this.clearSel} className="ds-done-close ds-ghost">
                      סגירה
                    </button>
                  </div>
                  <p className="ds-done-note">
                    לקוח שלא הגיע לתור יחויב במחיר מלא. לביטול, אנא הודיעו מראש.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {this.state.stmt && (
          <div className="ds-modal-scrim" onClick={() => this.setState({ stmt: false })}>
            <div
              onClick={stop}
              role="dialog"
              aria-modal="true"
              aria-labelledby="stmtTitle"
              className="ds-modal"
            >
              <div className="ds-modal-head">
                <p id="stmtTitle" className="ds-modal-title">הצהרת נגישות</p>
                <button
                  type="button"
                  onClick={() => this.setState({ stmt: false })}
                  aria-label="סגירת הצהרת הנגישות"
                  className="ds-close ds-ghost"
                >
                  ✕
                </button>
              </div>
              <p style={{ margin: '10px 0 0' }}>
                האתר של {BIZ_NAME} נבנה כך שיהיה שמיש לכל אדם, לפי התקן הישראלי ת״י{' '}
                <bdi>5568</bdi> ברמה <bdi dir="ltr">AA</bdi> ובהתאם לתקנות שוויון זכויות לאנשים עם
                מוגבלות (התאמות נגישות לשירות).
              </p>
              <p className="ds-modal-sub">מה נעשה באתר</p>
              <ul>
                <li>ניגודיות טקסט של <bdi dir="ltr">5:1</bdi> ומעלה בכל טקסט; זמינות מסומנת בצורה ובמילים, לא רק בצבע.</li>
                <li>ניווט מלא במקלדת עם סימון פוקוס בולט, ומקש <bdi dir="ltr">Esc</bdi> לסגירת חלונות.</li>
                <li>כל שדה עם תווית, כל כפתור עם שם נגיש, ואזור הודעות חי לקורא מסך.</li>
                <li>אזורי לחיצה של <bdi>44</bdi> פיקסלים לפחות, וקישור דילוג לתוכן.</li>
                <li>תפריט נגישות: הגדלת טקסט, ניגודיות כהה או בהירה, הדגשת קישורים, גופן קריא ועצירת אנימציות. ההגדרות נשמרות בדפדפן.</li>
                <li>כיבוד העדפת המערכת להפחתת תנועה.</li>
              </ul>
              <p className="ds-modal-sub">מגבלות ידועות</p>
              <p style={{ margin: 0 }}>
                שירותי הניווט החיצוניים (וייז, מפות גוגל) והוואטסאפ אינם בשליטתנו ונגישותם באחריות
                מפעיליהם.
              </p>
              <p className="ds-modal-sub">נתקלתם בבעיה?</p>
              <p style={{ margin: 0 }}>
                רכז הנגישות הוא דניאל —{' '}
                <a href={`tel:${PHONE}`} style={{ fontWeight: 700 }}>
                  <bdi dir="ltr">{PHONE_DISPLAY}</bdi>
                </a>{' '}
                או <a href={WA_BASE} style={{ fontWeight: 700 }}>וואטסאפ</a>. נטפל בפנייה בהקדם.
              </p>
              <p className="ds-modal-stamp">ההצהרה עודכנה באוגוסט <bdi>2026</bdi>.</p>
            </div>
          </div>
        )}

        <div className="ds-dock">
          {this.state.a11yOpen && (
            <div id="a11yPanel" role="dialog" aria-label="הגדרות נגישות" className="ds-a11y-panel">
              <p className="ds-a11y-h">נגישות</p>

              <p className="ds-a11y-sub">גודל טקסט</p>
              <div className="ds-a11y-grid3">
                {['רגיל', 'גדול', 'ענק'].map((name, i) => (
                  <button
                    key={name}
                    type="button"
                    aria-pressed={a.fs === i}
                    onClick={() => this.setA11y({ fs: i })}
                    className={'ds-opt ' + (a.fs === i ? 'ds-on' : 'ds-ghost ds-ghost--deep')}
                  >
                    {name}
                  </button>
                ))}
              </div>

              <p className="ds-a11y-sub">ניגודיות</p>
              <div className="ds-a11y-grid3">
                {['רגיל', 'כהה', 'בהיר'].map((name, i) => (
                  <button
                    key={name}
                    type="button"
                    aria-pressed={a.hc === i}
                    onClick={() => this.setA11y({ hc: i })}
                    className={'ds-opt ' + (a.hc === i ? 'ds-on' : 'ds-ghost ds-ghost--deep')}
                  >
                    {name}
                  </button>
                ))}
              </div>

              <div className="ds-toggles">
                {([
                  { name: 'הדגשת קישורים', on: a.hl, toggle: () => this.setA11y({ hl: !a.hl }) },
                  { name: 'גופן קריא', on: a.rf, toggle: () => this.setA11y({ rf: !a.rf }) },
                  { name: 'עצירת אנימציות', on: a.na, toggle: () => this.setA11y({ na: !a.na }) },
                ]).map(t => (
                  <button
                    key={t.name}
                    type="button"
                    aria-pressed={t.on}
                    onClick={t.toggle}
                    className={'ds-toggle ' + (t.on ? 'ds-on' : 'ds-ghost ds-ghost--deep')}
                  >
                    {t.name}
                    <span className="ds-toggle-state">{t.on ? 'פעיל ✓' : 'כבוי'}</span>
                  </button>
                ))}
              </div>

              <div className="ds-a11y-actions">
                <button
                  type="button"
                  onClick={() => this.setA11y(A11Y_DEFAULTS)}
                  className="ds-a11y-reset ds-strong"
                >
                  איפוס
                </button>
                <button
                  type="button"
                  onClick={() => this.setState({ stmt: true, a11yOpen: false })}
                  className="ds-a11y-stmt ds-ghost"
                >
                  הצהרת נגישות
                </button>
              </div>
              <p className="ds-a11y-keys">
                ניווט במקלדת: <bdi dir="ltr">Tab</bdi> להתקדם, <bdi dir="ltr">Enter</bdi> לבחירה,{' '}
                <bdi dir="ltr">Esc</bdi> לסגירה. ההגדרות נשמרות בדפדפן.
              </p>
            </div>
          )}

          <div className="ds-fabrow">
            <button
              type="button"
              aria-expanded={this.state.a11yOpen}
              aria-controls="a11yPanel"
              aria-label={this.state.a11yOpen ? 'סגירת תפריט נגישות' : 'פתיחת תפריט נגישות'}
              onClick={() => this.setState(s => ({ a11yOpen: !s.a11yOpen }))}
              className={
                'ds-fab ' + (this.state.a11yOpen ? 'ds-on ds-fab--close' : 'ds-cta')
              }
            >
              {this.state.a11yOpen ? (
                '✕'
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  width="28"
                  height="28"
                  aria-hidden="true"
                  focusable="false"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <circle cx="12" cy="4.2" r="1.9" fill="currentColor" stroke="none" />
                  <path d="M4.6 8.4h14.8" />
                  <path d="M12 8.4v6" />
                  <path d="M12 14.4l-3.3 6" />
                  <path d="M12 14.4l3.3 6" />
                </svg>
              )}
            </button>
          </div>

          {showGutter && (
            <div className="ds-bar">
              <div className="ds-bar-inner">
                <a href={`tel:${PHONE}`} className="ds-bar-link ds-control">
                  <span className="ds-bar-cap">התקשרו</span>
                  <bdi dir="ltr" className="ds-bar-val ds-bar-val--tel">{PHONE_DISPLAY}</bdi>
                </a>
                <a href={WA_BASE} className="ds-bar-link ds-control">
                  <span className="ds-bar-cap">כתבו</span>
                  <span className="ds-bar-val">וואטסאפ</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }
}
