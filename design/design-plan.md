# דניאל עיצוב שיער — homepage design plan

## 1. Concept

The schedule is the hero. The organising form is one vertical **time rail** — ruled
like an appointment book, toothed like a comb — where an open time is a solid,
tappable block and a taken time is a thin rule. The rail sits above the fold as
the answer to the only question a first-time visitor has ("can I come today?"),
and it is the same component that carries the booking flow: tap a block, the rail
keeps its place, and the sheet rises over it.

**Palette source:** warm paper stock + blue ledger ink. An appointment book, not a
salon brochure. The ink blue is the only saturated colour on the page and it has
exactly one meaning: *you can have this time*. Nothing else — not a heading, not
a section, not a nav item — is allowed to wear it.

**The risk:** there is no photograph anywhere, not even below the fold, and the
first thing the visitor sees is a grid of times rather than a name over a scrim.
If the live availability is ever thin, the page looks thin. Mitigation: the
above-fold plate never shows an empty state — when today is gone it says so in
words and offers tomorrow's earliest times ("היום נסגר. הכי מוקדם — מחר"), which
is the correct answer for the late-night visitor who is the actual audience.

**Remembered by:** the rail.

## 2. Colour — 6 named values, contrast measured against text use

| Token | Hex | Role | Measured contrast |
|---|---|---|---|
| `paper` | `#F6F1E8` | page surface (warm paper) | — |
| `paper-deep` | `#EBE3D4` | inset plates: the above-fold answer, price legend | — |
| `ink` | `#1C1A17` | primary text, rules, selected state fill | **15.4:1** on paper · **13.6:1** on paper-deep |
| `ink-muted` | `#655E53` | secondary text, hour axis, taken/passed labels | **5.7:1** on paper · **5.0:1** on paper-deep |
| `open` | `#1D3FA8` | accent. Open time blocks, primary CTA, links. Nothing else | **8.0:1** on paper · paper-white `#FFFCF6` on it **8.8:1** |
| `few` | `#8F5214` | support colour, one job only: "few slots left" on a day | **5.5:1** on paper |

Hairlines and dashed rules are `rgba(28,26,23,0.16–0.34)` — decoration only, never
text. Paper-white `#FFFCF6` is used only as text/fill *on* the accent and as the
booking sheet surface.

**Availability never rides on hue alone:**

| State | Fill | Shape | Label |
|---|---|---|---|
| open | solid accent block, 44px | radius 3, full track width | time 20/700 + "פנוי" |
| selected | solid ink | 3px inset accent keyline | "✓ נבחר" |
| taken | none | 1px **solid** rule | "תפוס" |
| passed | none | 1px **dashed** rule | "עבר" |
| few left (day) | none | hollow square dot | "נותרו 2" in `few` |
| closed (Sat) | 45° hatch | dashed border | "שבת · סגור" |

## 3. Type

**Display: Frank Ruhl Libre.** The Hebrew book serif — Frank-Rühl is the face
Hebrew prose was set in for a century. It is a real typographic voice, it is
almost never used on Israeli small-business sites, and its high stroke contrast
reads as *record-keeping* next to the geometric blocks of the rail. It also
carries the numerals for prices, which is where the ledger association pays off.

**Body: Assistant.** Chosen deliberately despite being the Israeli default,
because it is the most comfortable Hebrew UI face at length and the distinction
is carried entirely by the display face. Two guards: body is never set at 400 for
UI (500/600/700 for anything functional), and Assistant never appears at display
size — every heading is Frank Ruhl Libre.

Letter-spacing is `0` everywhere. Every hierarchy device is size, weight, colour
or space — no all-caps eyebrows, no small caps, no Title Case, because Hebrew is
unicase. Times, prices and the phone number sit in `<bdi>` (`dir="ltr"` where the
run contains punctuation) with `font-variant-numeric: tabular-nums`.

| Step | Face / weight | 390px | 768px | 1440px | line-height | tracking |
|---|---|---|---|---|---|---|
| display (h1) | FRL 700 | 34 | 36 | 56 | 1.22 | 0 |
| section (h2) | FRL 700 | 25 | 25 | 34 | 1.3 | 0 |
| price | FRL 500 | 22 | 22 | 22 | 1.3 | 0 |
| lead | Assistant 400 | 18 | 18 | 18 | 1.7 | 0 |
| body | Assistant 400 | 17 | 17 | 17 | 1.7–1.75 | 0 |
| item / row | Assistant 600 | 17 | 17 | 17 | 1.45 | 0 |
| slot time | Assistant 700 | 20 | 20 | 20 | 1.25 | 0 |
| control | Assistant 700 | 19 | 19 | 19 | 1.0 | 0 |
| meta | Assistant 500/600 | 15 | 15 | 16 | 1.6 | 0 |
| micro | Assistant 500 | 13–14 | 13–14 | 13–14 | 1.6 | 0 |

Sizes are fluid via `clamp()` for the two display steps only; everything else is
fixed, because Hebrew body text does not benefit from growing on desktop. Measure
is capped at `46–56ch` on every prose block (≈45–75 characters). Nothing is set
below 13px, and 13px is used only for non-essential meta at 5.7:1.

## 4. Spacing

4px base. `4 · 8 · 10 · 14 · 18 · 22 · 26 · 36 · 40` — sections are 36–40 apart
with a comb-tick divider, inside plates 14–18, inside rows 8–10.

Rail geometry: row pitch **47px** (44px minimum tap block + 3px gap), hour gutter
**46px**, day-column gap **16px**. The dense slot grid is the tightest tap area on
the page and it still clears 44×44 with visible separation. Day chips are 62×64.
Page gutter is 18px; content column caps at 1180px.

## 5. Breakpoints

- **390 (design width)** — single column. One day of the rail at a time, chosen
  from a Sun→Sat day strip (Sunday first, i.e. rightmost). Hour axis on the
  inline-start edge. Persistent bottom bar: call + WhatsApp, both ink-outlined.
- **768** — three day columns side by side starting at the selected day; the day
  strip stays as the picker for the window; prices go two-up; bottom bar stays.
- **1440** — the whole week Sun→Sat as seven columns with the Saturday column
  present and hatched "סגור". The strip and the hour gutter drop out (each block
  carries its own time), contact moves into the header, bottom bar retires.

## 6. Token reference

```
colour
  --paper        #F6F1E8
  --paper-deep   #EBE3D4
  --paper-white  #FFFCF6   (sheet surface, text on accent)
  --ink          #1C1A17
  --ink-muted    #655E53
  --open         #1D3FA8   accent — open time + primary action only
  --open-hover   #16307E
  --few          #8F5214   support — "few left" only
  --rule         rgba(28,26,23,.16 / .20 / .26 / .34)

type
  --display  'Frank Ruhl Libre' 700   clamp(34px, 4.6vw, 56px) / 1.22
  --section  'Frank Ruhl Libre' 700   clamp(25px, 2.4vw, 34px) / 1.3
  --price    'Frank Ruhl Libre' 500   22px / 1.3   tabular-nums
  --lead     Assistant 400  18px / 1.7
  --body     Assistant 400  17px / 1.7
  --strong   Assistant 600  17px / 1.45
  --slot     Assistant 700  20px / 1.25  tabular-nums
  --control  Assistant 700  19px / 1
  --meta     Assistant 600  15px / 1.6
  --micro    Assistant 500  13-14px / 1.6
  letter-spacing: 0 everywhere

space   4 8 10 14 18 22 26 36 40
radius  3px (blocks, controls) — the only radius on the page
rail    row 44px + 3px gap · gutter 46px · column gap 16px
targets ≥ 44×44 · focus ring 3px solid (#1D3FA8 on paper, #1C1A17 on accent), offset 2px
```

## 7. Decisions taken where the brief was silent

- **Availability is generated live** from a per-date seeded sequence, so the page
  behaves like a real booking feed: stable within a day, different per day, past
  times on today collapse to "עבר" as the clock moves. Ratio is tweakable
  (`busyness`) for review.
- **Slots are 30-minute starts.** Because services run 10–120 minutes, the sheet
  measures the free run after the chosen time and marks services that cannot fit
  as "צריך רצף ארוך יותר" instead of letting someone book a 120-minute colour
  into a 30-minute gap.
- **Week navigation** goes forward up to three weeks; chevrons are mirrored
  (back `›` on the right, forward `‹` on the left).
- **The strip always shows Sunday→Saturday**, with past/full/closed days rendered
  dead rather than hidden — the week is a rail too.
- **A "booked" state is shown** after confirm with a WhatsApp hand-off message
  pre-filled, since the real system is external.
- **`demoTime` prop** lets a reviewer set the clock (e.g. `22:40`) to see the
  late-night state the audience actually arrives in.

## 8. Not built / still needed

Not built: the rest of the booking flow after confirm (name + phone capture,
SMS/WhatsApp verification, calendar file), the real availability API, cancel /
reschedule, returning-customer recognition, an actual map embed (Waze and Google
links go out instead), Hebrew ↔ Arabic/Russian alternates, analytics.

Still needed from Daniel:
1. **Photographs** — one portrait of Daniel at the chair (the marked 4:5 slot),
   and 6–8 real cuts if a work strip is ever added under the price list. No stock.
2. **Business number / invoicing name** for the footer, if required.
3. Whether **soldiers' price** needs a condition line (ID at the chair?).
4. Whether **גוונים / צבע** require a prior consultation or patch test — this
   affects whether those services can be self-booked at all.
5. Confirmation channel: SMS or WhatsApp, and the exact wording Daniel wants.
6. Cancellation window in hours for the no-show line ("מראש" is currently vague).
7. Parking / entrance detail for רוטשילד 48, if there is anything to say.


## 8. יומן דניאל — admin view (Daniel Salon Admin.dc.html)

Same paper-and-ledger system as the client page, seen from the chair.

- **Lock**: 4-digit keypad (demo code 4848), remembered in localStorage; "נעילת היומן" in the footer clears it. Keypad grid is dir="ltr" so 1-2-3 read left to right.
- **Day summary**: appointments, expected revenue (a range when the services are range-priced), sellable open minutes, next up.
- **The book**: a booked slot is a block whose height equals its duration (44px per 30 min) — name, service, time range, price. Open time stays a thin rule with a + button. A blue rule marks the current time. Blocked time is hatched.
- **Actions**: call / WhatsApp, mark הגיע / לא הגיע (no-show shows the full-charge line), cancel, and move — "העבירו לשעה אחרת" turns every open run long enough for that service into a target.
- **Manual entry**: name + service, or block the slot so it disappears from the client page.
- **Week pane** (≥1080px): per-day load bar + revenue, click to jump.

Measured at 390 / 768 / 1440: no horizontal overflow; week pane appears only at 1440.

## 9. סבב שכלול — 8 באוגוסט 2026

תשעה שינויים שהתבקשו במפורש. הפלטה, הטיפוגרפיה והגיאומטריה לא השתנו — אין צבע חדש, אין רדיוס חדש.

### דף הלקוח

1. **קיפול רצפים תפוסים.** רצף של שעות תפוסות/שעברו מתקפל לשורה אחת — "תפוס <bdi>11:00–13:30</bdi>". גובה השורה `min(44 + (n−1)·11, 110)px`, כך שמשך עדיין נקרא כמסה בלי לאכול מסך. בפועל המסילה מתקצרת בערך בחצי ביום עמוס, והשעות הפנויות עולות למעלה.
2. **הבלוק הנבחר נמתח לפי משך השירות** — `n·44 + (n−1)·3` פיקסלים, בדיוק כמו הבלוקים ביומן האדמין. אחרי בחירת שירות הבלוק בולע את המשבצות שמתחתיו ומציג טווח (`16:30–18:30`) במקום שעת התחלה.
3. **סינון לפי שירות, בשני כיוונים.** שורת צ'יפים מעל המסילה (שם + משך), *וגם* לחיצה על שורה במחירון — שתיהן קובעות את אותו `filt`. כשהסינון פעיל: שעות שאין אחריהן רצף מספיק יורדות למצב "חלון קצר מדי" (מסגרת מקווקוות, לא בלוק), הספירות בכותרות היום ובסטריפ סופרות רק חלונות מתאימים, והתשובה העליונה מחפשת את החלון המתאים הראשון.
4. **קו "עכשיו" במסילה** — נקודה + קו **בדיו**, לא בכחול. באדמין הקו כחול; בדף הלקוח הכחול שמור לזמינות בלבד, ולכן הקו כאן שחור. זו הפרשנות הנכונה לחוק, לא חריגה ממנו.
5. **התשובה העליונה היא טיפוגרפיה.** במקום ארבעה צ'יפים קטנים: השעה הקרובה ב־Frank Ruhl Libre 700 בגודל `clamp(46px, 7vw, 68px)`, שם היום לצידה, כפתור ראשי רחב, ושלוש שעות חלופיות ככפתורי מתאר קטנים. זו המיטיגציה האמיתית ל"עמוד דל" שסעיף 1 הצהיר עליו.
6. **המחירון מקובץ לשלוש קבוצות** — תספורות / זקן ושעווה / צבע וגוונים — עם כותרת Frank Ruhl 20px וקו דיו 2px מתחת. כל שורה היא כפתור שמסנן את המסילה.
7. **פסי שעה עגולה.** לפני כל שורה שמתחילה ב־`:00` נכנס קו `rgba(28,26,23,.26)` עם תווית השעה בעמודת השעות; שורת ה־`:00` עצמה כבר לא חוזרת על השעה (`gt` נפרד מ־`t`), כדי שלא תהיה כפילות.
8. **הנקודה ב"פתוח עכשיו" עברה מכחול לדיו.** סטטוס עסק אינו זמינות. גם קווי הקישור בהדר עברו לדיו עם hover כחול.
9. **טקסטורת פנקס** — ניקוב (`radial-gradient` חוזר) בשולי הלוח העליון, עם `padding-inline-start:34px` שמפנה לו מקום.

**בונוס:** כשכל השבוע הנוכחי כבר עבר (למשל בשבת), העמוד נפתח על השבוע הבא במקום להראות שבעה ימים מתים.

### יומן דניאל

תשובה לדירוג של דניאל: "לראות מי הבא בתור" ראשון, ואחריו רישום ידני, העברה, חסימה, קשר ללקוח, והכנסה.

- **לוח "הבא בתור"** מעל שורת הסיכום: שעה ב־Frank Ruhl `clamp(42px,6vw,60px)`, שם הלקוח 22/700, שירות·טווח·מחיר, ושלושה כפתורים — התקשרו (כחול, עם המספר), וואטסאפ, פתחו כרטיס. תגית מעל: "הבא בתור · בעוד 25 דק׳" / "על הכיסא עכשיו" / "הראשון ביום". תא ה"הבא בתור" הוסר משורת הסטטיסטיקה — היא ירדה מארבעה תאים לשלושה.
- **סרגל תחתון קבוע**: רשמו תור · חסמו שעה — שניהם מכוונים אוטומטית לשעה הפנויה הקרובה ומראים אותה — ועוד כפתור "עכשיו" שגולל לקו השעה הנוכחית. "חסמו שעה" פותח את המגירה במצב `blockFirst`, שבו כפתור החסימה הוא הראשי ורישום לקוח יורד מתחתיו.
- **ביטול פעולה אחרונה.** כל פעולה הרסנית — ביטול תור, סימון הגיע/לא הגיע, העברה, חסימה, פתיחה, רישום — שומרת snapshot ומציגה סרגל "בטלו פעולה" עם מסגרת דיו 2px מתחת להדר. פעולה אחת אחורה, שזה מה שצריך כשעובדים עם מספריים ביד השנייה.
- **טלפון ברישום ידני.** לקוח שנרשם בטלפון קיבל עד עכשיו רק שם, ואי אפשר היה להחזיר לו שיחה. נוסף שדה טלפון (לא חובה, `dir="ltr"`), והוא זורם לכרטיס ולכפתור ההתקשרות.
- כשהיום הנוכחי סגור (שבת), היומן נפתח על היום הבא.

### סבב 2 — כניסה למחירון ומגירת ההזמנה

- **המחירון מאחורי כניסה.** שם משתמש `1` / סיסמה `1`, חד־פעמי, נשמר ב־`localStorage` תחת `ds-client-authed`. הטופס יושב בתוך סקשן המחירון עצמו (`#signin`) — לא מודאל — עם קישור "כניסה" בהדר הרחב ו"יציאה" אחרי התחברות. לפני כניסה כל מחיר מוצג כ־`···`, מקרא צורות המחיר מוסתר, וגם המחירים במגירה והודעת הוואטסאפ מסתירים סכום. **קביעת התור עצמה פתוחה לכולם** — הגייט הוא על המחיר, לא על הזמינות.
- **מגירת ההזמנה נבנתה מחדש כמודאל.** קודם: רצועה תחתונה ברוחב 560px עם רשימת 10 שירותים בתיבת גלילה של 196px, בלי סיכום לפני אישור. עכשיו: scrim דיו `rgba(28,26,23,.44)` שסוגר בלחיצה, כרטיס עד 620px בגובה 90vh עם שלושה אזורים קבועים — כותרת (יום + טווח השעה ב־Frank Ruhl `clamp(30,5vw,40)` + אורך החלון), גוף גולל, ותחתית דביקה. השירותים מקובצים באותן שלוש קבוצות של המחירון, כל שורה 56px עם ריבוע בחירה (צורה, לא רק צבע) ומשך; שירותים שלא נכנסים בחלון **הוסרו מהרשימה** והוחלפו בשורה אחת — "N שירותים נוספים דורשים רצף ארוך יותר". התחתית מציגה סיכום — שם השירות, משך ומחיר — ורק אז את כפתור האישור.

### הערת סביבה

צילומי המסך של כלי הבדיקה מציגים טווחי שעות ומחירים הפוכים (`09:15–09:00`). זו תקלה של מנוע הצילום בלבד — בדיקה ב־DOM מראה `direction: ltr` ו־`unicode-bidi: isolate` על כל ה־`<bdi>`, כלומר הדפדפן מציג נכון. אל תתקן "באג" שרואים רק בצילום.

### סבב 3 — נגישות, זיהוי לקוח ויעילות (8 באוגוסט 2026)

- **כפתור נגישות** קבוע (עיגול כחול, אייקון האדם התקני, <bdi>54</bdi>px) בפינה התחתונה, מעל הסרגל הקבוע. פותח לוח עם: גודל טקסט (רגיל / גדול <bdi>115%</bdi> / ענק <bdi>130%</bdi>), ניגודיות (רגיל / כהה — לבן על שחור עם קישורים צהובים / בהיר — שחור על לבן), הדגשת קישורים, גופן קריא, עצירת אנימציות, איפוס, והצהרת נגישות. ההגדרות נשמרות ב־`ds-a11y` ומוחלות מחדש בטעינה.
- **המימוש**: גיליון עזר יחיד מוזרק ל־`head` פעם אחת, וכל מצב נדלק דרך `data-a11y-*` על `html` — כלומר אין דליפה לעיצוב עצמו, שנשאר inline. הגדלת טקסט נעשית בסריקת DOM שמכפילה את הגודל המחושב ושומרת את הבסיס ב־`data-a11y-fs`, כדי שגם `clamp()` יגדל ולא יישבר.
- **הצהרת נגישות** כמודאל: ת"י 5568 ברמת AA, מה נעשה, מגבלות ידועות (וייז/גוגל/וואטסאפ חיצוניים), ורכז נגישות עם טלפון.
- **תשתית נגישות בדף עצמו**: קישור דילוג לתוכן, `<main>`, `aria-live` לשינויי סינון ולאישור התור, `role="dialog"` + `aria-modal` + `aria-labelledby` לשתי המגירות, Esc לסגירה, מיקוד שנכנס למגירה וחוזר למקום, נעילת גלילת רקע, ו־`aria-label` מלא לכל בלוק שעה ("קביעת תור ליום שני בשעה 14:30").
- **שם וטלפון בקביעת התור** — בראש המגירה, לפני השירותים. נשמרים ב־`ds-client-ident`, וחוזרים בפעם הבאה כשורה אחת עם "שינוי". האישור חסום עד שיש שירות + שם + טלפון תקין, והכפתור החסום אומר מה חסר. הפרטים זורמים להודעת הוואטסאפ.
- **הוסיפו ליומן** — קובץ `.ics` נוצר בצד הלקוח (Asia/Jerusalem, משך לפי השירות) ומוצע לצד אישור הוואטסאפ.
- כניסה למחירון: `Enter` שולח, `autocomplete` על שני השדות.

### Open
- The two pages do **not** share a data source yet: the client page seeds slots per-30-minutes, the admin places whole appointments with durations. Next step is one shared `book-data.js` module both DCs read, so a block in the admin really removes the hour from the client page.
- No server, no auth beyond the local code — the keypad is a design stand-in.
- Cancellation-window copy and photos still open from section 7.
