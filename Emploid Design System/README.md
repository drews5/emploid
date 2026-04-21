# Emploid Design System

> Find jobs that are actually hiring.

Emploid is a job-search web app built by five students at the Carlson School of Management (IBUS 3055). It aggregates listings from 6+ job boards (LinkedIn, Indeed, Handshake, Glassdoor, company career pages, etc.) and scores each one with a proprietary **Listing Trust Score** (0–100) that estimates whether a job is "real" or a ghost listing. Applies always route directly to the employer — no middlemen, no dark patterns, no pay-to-boost.

The product is a single web app with four primary surfaces:
- **Search (Home)** — hero search + product preview + "How it works" + comparison vs. normal job boards
- **Browse Jobs** — filtered job list (trust, salary, hiring activity, work mode) with a detail modal
- **Tracker** — application tracker with stage slider and weekly reply-momentum chart
- **About** — origin story + team

## Sources used to build this system

- **Codebase** — `emploid-app/` (local mount, read-only). Key files:
  - `emploid-app/public/index.html` — all four pages in a single SPA
  - `emploid-app/public/style.css` — source of truth for tokens, components (~3200 lines)
  - `emploid-app/public/main.js` — interaction logic
  - `emploid-app/public/images/` — logoicon.svg, ghost-pixel.svg, emploid-wordmark.svg
  - `emploid-app/public/fonts/` — Filson Pro, Satoshi (woff)
- **Screenshots** — three product captures: Home, Browse Jobs, About (for layout/tone reference)
- **Uploaded assets** — `logoicon.svg`, `emploid-wordmark.svg`, `ghost-pixel.svg`
- **GitHub** — `drews5/emploid` (not imported — local mount was sufficient)

---

## Index

| File / folder | Purpose |
|---|---|
| `README.md` | This file — product context, content + visual foundations, iconography |
| `colors_and_type.css` | CSS vars for color + type tokens, `@font-face` declarations, semantic classes |
| `fonts/` | Filson Pro (display) + Satoshi (body) woff files |
| `assets/` | Logos, wordmark, ghost-pixel mascot, favicon, social icons sprite |
| `preview/` | Small HTML cards that populate the Design System tab (tokens, type, components) |
| `ui_kits/web/` | High-fidelity recreation of the Emploid web app (Home, Browse Jobs, Tracker, About) |
| `SKILL.md` | Agent-skill manifest for invoking this system in Claude Code |

UI kits: **Web app** (`ui_kits/web/`) — the only product. Mobile designs are not in scope; the site is responsive.

---

## CONTENT FUNDAMENTALS

### Voice

Emploid writes like a frustrated insider who's seen through the job-board game and is telling you, plainly, how to beat it. Confident, a little cynical, but never preachy. Direct. No marketing fluff. No em-dashes to soften — when the product says "ghost job," it calls it a ghost job.

### Person

**Second-person ("you"), with clear first-person plural ("we") for the product/team.**
- "You end up spending hours crafting cover letters for roles that were never truly open."
- "We built Emploid to fix this."
- "We don't accept payments to boost listings."

The team ("we built this") is always visible — this is intentionally a scrappy, student-built product, not a faceless corporate SaaS.

### Tone spectrum

- **Hero / about copy** — Plainspoken manifesto. Short declarative sentences. Opinionated. Example: *"The modern job hunt is broken."* / *"If a listing looks fake, we'll tell you."*
- **Product chrome** — Neutral, UI-functional. Example: *"Narrow it down"* (filter heading), *"Scanning job boards..."* (loading), *"Know what's active, what's stalled, and what needs a follow-up next."* (tracker sub)
- **Micro-copy / chips** — Tight, active verbs. Example: *"Direct Company Link"*, *"Actively Hiring"*, *"Repost heavy"*, *"Salary transparent"*

### Casing

- **Headings (h1, h2):** Sentence case. *"Find jobs that are actually hiring."* Not Title Case.
- **Proper product nouns:** Title Case — *Listing Trust Score*, *Application Tracker*, *Resume Match*, *Early Access*, *Direct Company Link*, *High Trust*.
- **Kickers / eyebrow labels:** ALL CAPS with `letter-spacing: 0.08em` and orange color. *"HOW IT ACTUALLY WORKS"*, *"OUR ORIGIN"*, *"THE TEAM"*.
- **Buttons:** Title Case — *"Upload Resume"*, *"Log in"*, *"Early Access"*, *"Browse Jobs"*.
- **Chip labels:** Title Case — *"Green light: Active hiring"*, *"High Trust"*, *"Review carefully"*.

### Punctuation + style

- **Straight quotes for jargon:** *ghost jobs* appears in double quotes — `"ghost jobs"` — flagged as industry terminology the reader may not know.
- **Em-dashes** appear in long-form copy for rhythm: *"Our search algorithm prioritizes role relevance, salary transparency, and Listing Trust Score — in that order."*
- **Contractions encouraged.** *"shouldn't"*, *"we'll"*, *"don't"* — conversational register.
- **Numerals over words** for stats: *"12,000+ listings scanned"*, *"43% flagged as low trust"*, *"6 job boards indexed"*. Thousands formatted with commas.
- **Periods on short sentences** in manifesto copy. *"No ads. No dark patterns."*

### Emoji / unicode

- **No emoji** in UI or copy. None.
- **Unicode used purposefully as functional glyphs:**
  - `✓` (U+2713) for checkmarks in the comparison list (styled inside an orange-soft circle)
  - `-` (hyphen) for negative/absent items in the "typical job board" comparison
  - `→` (U+2192) appears on CTAs ("Apply on stripe.com/careers →") — inline chevron feel without an icon font

### Numbers + stats

Always concrete, never vague. *"Over 40% of online job postings are 'ghost jobs'"*, not "many". *"Scores range from 0 (likely fake) to 100 (likely real)"*. This precision is itself part of the brand voice.

### Representative copy samples

- Hero H1: **"Find jobs that are actually hiring."**
- About H1: **"We built this because job searching shouldn't feel like a part-time job."**
- Tracker H1: **"Application Tracker"** — section kicker: *"PORTAL"*
- Stats strip: *"12,000+ listings scanned · 6 job boards indexed · 43% flagged as low trust"*
- Filter heading: *"Narrow it down"*
- Loading state: *"Scanning job boards..."*
- Empty state copy tone: plain, actionable, never cute.

---

## VISUAL FOUNDATIONS

Emploid's aesthetic sits between **editorial trust-publication** and **indie-ish product marketing** — think *data-driven consumer app with a manifesto*. It is not a Silicon Valley gradient deck; it's closer to a student newspaper that happens to ship software. Warm orange punches over deep navy and cool paper backgrounds.

### Color philosophy

- **Two-pole palette: warm orange + deep navy, on cool paper.**
  - Primary CTA + accent: **`#c85b24` orange-500** (Emploid's signature color; appears on all primary buttons, section kickers, ring fills, active pagination, accent borders)
  - Hero / footer / tracker company marks: **navy `#0c1728`–`#122035`** gradient surfaces with radial orange glows at 10% / 82%
  - App chrome background: **`#f5f7fb` cool-off-white paper**, with a slightly cooler **`#edf3fa`** for nested / sidebar panels
- **Semantic trust palette:**
  - High Trust → **green `#1f7a42`** on soft `#ecf8f0`
  - Mid / "Review Carefully" → **orange `#b8611b`** on `#fff3e7`
  - Low Trust → **red `#b33a3a`** on `#fff0f0`
- **Source pills** carry the actual brand color of the job board (LinkedIn blue `#0a66c2`, Indeed `#2164f3`, Handshake `#ff7043`, Glassdoor `#0caa41`). Subtle but instantly recognizable.
- **No blue-purple gradients.** **No pastel rainbow.** **No dark-mode support** — the app is a single warm-on-cool light theme. Dark surfaces are reserved for hero, tracker callout, footer, and company-mark chips.

### Typography

- **Display: Filson Pro** — Heavy (900) and Bold (700). Used for all headings, stat numbers, and logo wordmark. Tight tracking (-0.04em on H1, -0.03em on H2) gives it editorial weight.
- **Body: Satoshi** — Regular (400), Medium (500), Bold (700). Line-height 1.6 for body; 1.04 for headings.
- **Mono: system mono stack** (`ui-monospace, SFMono-Regular, Menlo`) used sparingly — stat numbers in the strip (`.mono` class), `.browser-address` chip in the hero preview.
- **Scale:**
  - H1 `clamp(2.8rem, 5vw, 4.6rem)` — massive, newspaper-front-page size
  - H2 `clamp(2rem, 3.4vw, 3rem)`
  - H3 `1.15rem`
  - Body `1rem`
  - Kicker `0.76rem uppercase 700 letter-spacing:0.08em` (always orange)
- **Signature type treatment:** the word "actually hiring" in the hero is wrapped in `.emp-underline` — a gradient orange bar (`#ffbe7f → #f3a05a`) underneath, tight under the baseline. This underline is Emploid's signature visual mark.

### Backgrounds

- **No hand-drawn illustrations. No photography as background.** The design relies on solid color + subtle radial glows.
- **Hero / dark sections** use a layered background:
  ```
  radial-gradient at 82% 16% of rgba(255,190,127,0.18) 26rem +
  radial-gradient at 10% 18% of rgba(200,91,36,0.18)   24rem +
  linear-gradient 145deg, navy-950 → navy-900 → navy-800
  ```
  This "ember-in-the-dark" effect is the brand's most distinctive background.
- **Light sections** use flat `#f5f7fb` or a very soft vertical fade (`#f9fbff → #eef3fb → #f5f7fb`).
- **Tracker callout card** — solid warm orange gradient (`#c65a21 → #aa4717`), white text, used as a spot of color inside a light layout.
- **No full-bleed photography.** No stock imagery. No generative illustration.
- **Pixel-art ghost mascot** (`ghost-pixel.svg`) is a rare playful asset, tied to the "ghost job" concept. Reserved for empty states, 404, and content moments — never in chrome.

### Corner radii

- Chips / pills / nav items / buttons → **fully pill** (`999px`)
- Cards (job cards, process steps, filter sidebar) → **`8px`**–**`12px`** (`--radius`, `--radius-md`)
- Larger panels (comparison columns, tracker cards, modals) → **`16px`**–**`20px`** (`--radius-lg`)
- Resume upload modal → **`24px`** (`--radius-xl`) — the biggest radius, used to feel soft/friendly on an intrusive action
- **Rule:** interactive elements → fully round. Containers → softly round (8–12px). Focal moments → 16–24px.

### Shadows + elevation

Three-tier system, all keyed to navy (not black) for a cooler, more expensive feel:
- **`--shadow-sm`** `0 10px 24px rgba(8,17,31,0.06)` — default card rest
- **`--shadow-md`** `0 18px 40px rgba(8,17,31,0.08)` — hover lift
- **`--shadow-lg`** `0 28px 64px rgba(8,17,31,0.18)` — modals, hero preview window
- **`--shadow-cta`** `0 14px 26px rgba(200,91,36,0.20)` — primary buttons only, uses orange not navy

No hard/black shadows. No inner shadows except on the dark tracker company-mark chip (`inset 0 1px 0 rgba(255,255,255,0.12)` for a subtle top-light).

### Borders

- Standard card border: **`1px solid rgba(188, 201, 216, 0.7-0.9)`** — a cool slate (`#bcc9d8`) at reduced opacity.
- Stronger border for inputs: **`rgba(188, 201, 216, 0.8)`** solid.
- Chip borders are tinted to match fill: green chips get `#b8dfc5`, amber `#f4cf7f`, etc.
- **No colored-left-border accent cards.** We explicitly avoid that pattern.

### Transparency + blur

Used purposefully, not decoratively:
- **Sticky nav** → `rgba(255,255,255,0.96) + backdrop-filter: blur(16px)` so it lifts off the page on scroll.
- **Modal overlays** → `rgba(8,17,31,0.72) + backdrop-filter: blur(8px)` — warm navy haze, not pure black.
- **Hero browser-window preview** → `rgba(255,255,255,0.08) + backdrop-filter: blur(16px)` — translucent glass over the navy gradient.
- **Dark tooltips** (upload hint) → `rgba(8,17,31,0.94)` — near-opaque navy.

### Animation + interaction

- **Global timing:** `--transition: 180ms ease` for hover/state. Faster feels jumpy; slower feels sluggish.
- **Button hover:** `transform: translateY(-1px)` + color shift. Never scale, never bounce.
- **Card hover:** `translateY(-2px)` + upgrade from `shadow-sm` to `shadow-md` + border-color nudge.
- **Press state:** on primary buttons, the orange deepens to `--orange-600`; no shrink/scale.
- **Page transitions:** `pageFade` keyframe — `opacity 0 → 1 + translateY(6px → 0)` over 180ms. Gentle.
- **Stage slider sweep** on tracker progress: `trackerStageSweep` 620ms — a warm orange sheen slides left→right when a stage advances. Celebration without confetti.
- **Page-modal open:** `resumeUploadModalIn` 220ms `cubic-bezier(0.22, 1, 0.36, 1)` — `opacity 0 + translateY(16px) + scale(0.98) → 1`.
- **No bounces. No spring physics. No auto-playing hero animations.** The brand is trust; movement is functional only.

### Hover + focus states

- **Link/nav-link hover:** `background: var(--bg-light)` (cool paper) + text darkens to `--text-primary`.
- **Active nav pill:** orange-tinted background `rgba(200,91,36,0.12)` with dark text.
- **Primary button hover:** deeper orange (`--orange-600`) + `translateY(-1px)`.
- **Secondary button hover:** bg shifts to `--bg-light`, border darkens to `--border-strong`.
- **Input focus:** `border-color: var(--orange-500)` + `box-shadow: 0 0 0 4px rgba(200,91,36,0.14)` — orange focus ring, never blue.
- **Bookmark button:** on hover/saved → fills with `--orange-soft` and `--orange-500` icon color.

### Layout rules

- **Max content width `1200px`**, centered, 24px gutter.
- **Sticky nav at `68px`**, blurred on scroll with a subtle shadow added (`.scrolled` class).
- **Grid patterns:**
  - Hero: 2-col `1fr 440-520px` (copy + browser-preview card)
  - Jobs: 2-col `250px 1fr` (sticky sidebar + job list)
  - Tracker header: 2-col `1fr 360-430px` (copy + 2×2 summary card grid)
  - Comparison: 2-col equal (typical board vs Emploid)
  - Process steps: 3-col with a dotted orange connector line at `top: 32px`
- **Vertical rhythm:** major sections are `padding: 64px 0`. Dense product sections `padding: 24px–40px`.
- **Min tap target:** `min-height: 44px` on buttons, `46px` on inputs — accessibility-minded.

### Cards

- **Standard product card:** white bg, `1px rgba(188,201,216,0.7-0.9)` border, `--shadow-sm`, `8–16px` radius.
- **Summary card variants** (tracker) use accent fills for rhythm:
  - `accent-soft` — white → cool blue gradient
  - `accent-orange` — soft orange gradient (`#fff4ec → #ffe5d3`)
  - `accent-navy` — dark navy gradient with white text
  - `accent-green` — soft green gradient
- **Comparison card** uses two backgrounds side by side — one `--bg-light` (the "typical"), one `--bg-white` (Emploid). Negative vs positive.

### Trust Score ring

The **Listing Trust Score ring** is the single most iconic visual element. A circular SVG progress ring:
- Track: `#d7e0ea` at `stroke-width: 3`
- Fill: semantic color (green / orange / red) at `stroke-width: 3`
- Value number inside, in Filson Pro bold, centered
- Two sizes: `30px` (inline) and `72px` (modal detail)
- Always accompanied by a label — "High Trust" / "Review Carefully" / "Low Trust" — in the matching semantic color

### Protection gradients

On the dark hero, the browser-window preview uses a subtle white glass (`rgba(255,255,255,0.08)`) to separate content from the orange-glow background. No gradient scrims. No vignettes. If text needs to be legible over imagery, we use a solid navy panel — not a gradient.

### Don'ts (explicit)

- ✗ No blue/purple gradients (the app has zero of them)
- ✗ No emoji in UI
- ✗ No colored-left-border cards
- ✗ No hand-drawn SVG illustrations (the ghost-pixel mascot is the only decorative character asset, and it's pixel art)
- ✗ No rounded-corner screenshots with drop shadow as a stand-in for real UI
- ✗ No gradient text / rainbow text
- ✗ No Inter / Roboto / system-ui as the primary family — always Filson + Satoshi

---

## ICONOGRAPHY

Emploid uses **inline SVGs**, small and consistent. No icon font, no Lucide/Heroicons CDN, no Font Awesome. Icons are authored as **1-1.5px stroked line icons** at **16–22px** render size, using `currentColor` so they inherit from the parent.

### In the codebase

- **Logo mark** — `assets/logoicon.svg` — the "Emploid C with three dots and a square counter". Primary mark; appears in nav, footer, favicon. Rendered at 22px in chrome, scales up for hero.
- **Wordmark** — `assets/emploid-wordmark.svg` — full "emploid" wordmark (rarely used; nav uses icon + separate CSS text so the wordmark can follow type color).
- **Ghost-pixel mascot** — `assets/ghost-pixel.svg` — a pixel-art ghost, brand's playful nod to "ghost jobs". Reserve for 404 page, empty states, and content moments. Do not use in navigation or primary CTAs.
- **Favicon** — `assets/favicon.svg` — compact orange mark.
- **Social sprite** — `assets/social-icons.svg` — `<symbol>` sprite with `#bluesky-icon`, `#discord-icon`, `#github-icon`, `#x-icon`, `#social-icon`, `#documentation-icon`. Used with `<svg><use href="#x-icon"/></svg>`.
- **Inline utility icons** (search, bookmark, LinkedIn, caret, check) are hand-authored in place inside `index.html`/`main.js`. They follow this recipe:
  ```html
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" stroke-width="2"
       stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <!-- paths -->
  </svg>
  ```
- **Check/minus in comparison list** are rendered as unicode glyphs (`✓`, `-`) inside a styled circle — not SVG. This is intentional: it keeps the circle crisp at any size and colorable via CSS.
- **Source-brand icons** (LinkedIn, Indeed, Handshake, Glassdoor) are NOT drawn — instead, the job-board name renders as a colored text link (`.source-linkedin` etc.) in bold.

### Recommended usage

- Use `currentColor` + `stroke` based icons with `stroke-linecap: round`, `stroke-linejoin: round`. Never filled silhouettes.
- Render at `16px` (in chips), `20px` (in buttons/search), `22px` (in nav logo).
- Pair icons with text 90% of the time — icon-only buttons are reserved for bookmark and modal-close.

### Substitutions + flags for the user

- **Filson Pro** is a licensed typeface (Process Type Foundry). The woff files in `fonts/filson/` are copied from the existing codebase. **If you ship this outside the existing Emploid licensing, replace Filson Pro.** Closest Google Fonts match: **Manrope** (extra-bold 800) or **Plus Jakarta Sans** (extra-bold 800). Manrope's geometry is closer.
- **Satoshi** is from Indian Type Foundry and has a free weight-restricted license. Bundled woffs are included. Closest Google Fonts match: **Inter** (400/500/700) — slightly wider, but works as a drop-in.
- No icon substitutions needed — the system already ships complete.

> **ACTION for the user:** If this system will ship on a public site under a new license, confirm Filson Pro + Satoshi licensing, or I'll swap in Manrope + Inter as drop-ins and regenerate the CSS.
