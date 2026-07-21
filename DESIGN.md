# Spendcheck design system

Single source of truth for visual decisions. Tokens live in `src/index.css`
(Tailwind v4 CSS-first config — there is no `tailwind.config.js`; all theme
values are defined via plain CSS custom properties + a single `@theme inline`
block that maps them to Tailwind's utility namespaces).

Direction: **expressive**, not minimal. Real hierarchy jumps, visible
elevation on the one thing per screen that matters, motion that responds to
state changes — restrained to a a small, deliberate set of moments rather than
applied everywhere.

## Typography

Two roles, unchanged from before this pass — kept intentionally to two,
not three, since this is a dense personal utility app, not a marketing site:

- **Outfit** (`--font-sans`) — all UI text, labels, headings.
- **System mono** (`--font-mono`) — amounts, UTRs, dates-as-data. Already used
  consistently wherever a number needs to look like *data* rather than prose.

New named sizes (`--text-*` in the `@theme inline` block), extending
Tailwind's scale at both ends rather than replacing it — body/label text
stays on stock `text-sm`/`text-xs`:

| Token | Size | Use |
|---|---|---|
| `text-2xs` | 11px | Dense metadata smaller than `text-xs` (UTRs, timestamps in tight rows) — replaces the ad hoc `text-[10px]`/`text-[11px]` arbitrary values scattered around the codebase |
| `text-display` | 30px | Section-level stat numbers (StatCard values, MetricCard amounts, loan progress %) |
| `text-hero` | 44px | The one true hero number per screen (NetHeroCard, and nowhere else) |

## Color

Established in the previous pass, documented here as the reference:

- `--primary` — deep emerald (`#1f9d73` light / `#2dd4a0` dark). The brand
  color; also "positive" semantic (income, on-track progress).
- `--destructive` — rust (`#c2410c` light / `#e5836f` dark). Spend/negative
  amounts and errors. Deliberately not a generic alert-red — reads as "money
  spent," not "something broke."
- `--success` — reinforces positive amounts alongside `--primary`.
- `--accent-warm` — gold (`#f0a940` light / `#f2b34d` dark). **Reserved
  exclusively** for "something good just happened" moments: streaks,
  milestones, loan payoff, the frog priority marker. Never used for default
  UI chrome — that's what keeps it legible as a distinct signal.
- `--category-*` / `--amort-*` — fixed, colorblind-validated sets for the
  category breakdown and loan amortization charts. **Do not modify** without
  re-running the palette validation this pass didn't touch.

## Elevation

- `shadow-card` — a touch more lift than shadcn's stock `shadow-sm`, for
  standard cards.
- `shadow-hero` — a soft primary-tinted glow, reserved for exactly one
  element per screen that should visually lead: `NetHeroCard`, an active
  Pomodoro session. Elevation is a hierarchy signal, not decoration — most
  cards stay on `shadow-card` or no shadow.

## Radius

`--radius: 0.625rem` (was `0.5rem`) — a touch softer, matching Outfit's
rounded geometric letterforms. `radius-2xl` added for hero-level cards.

## Spacing

No new spacing tokens — Tailwind's default 4px-based scale is not itself the
"generic" problem; inconsistent ad hoc usage is. Conventions to apply
consistently in Phase 3:

- Section gap (between major blocks on a screen): `gap-6`
- Card internal padding: `p-5` to `p-6`
- Dense list row (Transactions, Focus tasks): `px-3 py-2.5`
- Tap targets: minimum `size-11` (44px) on any real interactive control,
  already established in the mobile-optimization pass — carry forward.

## Motion

- **GSAP** (already a dependency, added last pass) is reserved for
  state-change and data-viz moments: bar/progress fills, streak/celebration
  pop-ins, the frog-hop, task-complete pop, entrance staggers, the Pomodoro
  ring. Not for hover/press feedback — that stays CSS.
- **CSS transitions** handle all hover/active/focus feedback (`transition-*`,
  `active:scale-*`), as already used throughout.
- Every animation is gated on `prefers-reduced-motion` — via
  `gsap.matchMedia()` for GSAP-driven motion, `motion-reduce:` for CSS.
  Non-negotiable, not a nice-to-have.
- Duration convention: 150–300ms for micro-feedback, up to 600ms for
  entrances/count-ups. Ease-out for things appearing, no elastic/bounce
  outside the frog-hop and streak pop (their one deliberately playful beat).

## What's out of scope for this pass

- Data models, Supabase schema, business logic — untouched.
- The validated `--category-*`/`--amort-*` chart palettes — untouched.
- `src/components/ui/table.tsx` — dead code (nothing imports it since Loans
  moved to a card list); removed rather than restyled.
