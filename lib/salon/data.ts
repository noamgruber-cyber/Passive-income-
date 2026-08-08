// דניאל עיצוב שיער — business constants.
// Source of truth for the design: design/design-plan.md.
// Nothing here is user-configurable; the salon has one chair and one barber.

export type PriceKind = 'f' | 'r' | 'o' // fixed / range / open ("from")

export interface Service {
  /** service name */
  n: string
  /** duration in minutes */
  m: number
  /** price shape */
  k: PriceKind
  /** price, or low end of a range */
  a: number
  /** high end of a range (kind 'r' only) */
  b?: number
  /** index into GROUPS */
  g: number
}

export const DAY = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
export const SHORT = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']
export const MONTH = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
]

/** Opening hours by Date.getDay() — 0 = Sunday. null = closed. */
export const HRS: ([number, number] | null)[] = [
  [9, 18], [9, 18], [9, 18], [9, 18], [9, 18], [9, 14], null,
]

export const GROUPS = ['תספורות', 'זקן ושעווה', 'צבע וגוונים']

export const SERVICES: Service[] = [
  { n: 'תספורת גבר/ילד', m: 30, k: 'f', a: 70, g: 0 },
  { n: 'תספורת גבר + זקן', m: 30, k: 'f', a: 80, g: 0 },
  { n: 'תספורת אישה', m: 30, k: 'o', a: 120, g: 0 },
  { n: 'תספורת בת/נערה', m: 30, k: 'r', a: 80, b: 120, g: 0 },
  { n: 'תספורת ראשונה לילד', m: 30, k: 'f', a: 100, g: 0 },
  { n: 'תספורת תקנית לחיילים', m: 30, k: 'f', a: 60, g: 0 },
  { n: 'עיצוב זקן', m: 15, k: 'f', a: 50, g: 1 },
  { n: 'שעווה לאוזניים, אף וגבות', m: 10, k: 'f', a: 50, g: 1 },
  { n: 'צבע', m: 60, k: 'r', a: 100, b: 200, g: 2 },
  { n: 'גוונים לשיער קצר', m: 120, k: 'o', a: 250, g: 2 },
]

export const BIZ_NAME = 'דניאל עיצוב שיער'
export const STREET = 'רוטשילד'
export const STREET_NO = '48'
export const CITY = 'מזכרת בתיה'
export const ADDRESS = `${STREET} ${STREET_NO}, ${CITY}`
export const PHONE = '0526186458'
export const PHONE_DISPLAY = '052-618-6458'
export const WA_BASE = 'https://wa.me/972526186458'
export const WAZE = `https://waze.com/ul?q=${STREET} ${STREET_NO} ${CITY}&navigate=yes`
export const GMAPS = `https://www.google.com/maps/search/?api=1&query=${STREET}+${STREET_NO}+${CITY}`

/** Demo credentials for the price-list gate. Stand-in only — there is no server. */
export const DEMO_USER = '1'
export const DEMO_PASS = '1'
