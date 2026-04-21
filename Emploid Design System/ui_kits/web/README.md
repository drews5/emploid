# Emploid Web UI Kit

Interactive recreation of the Emploid web app. 4 screens:

- **Home / Search** — hero with squiggle underline, product preview (browser window mock), stats strip, 3-step process, comparison table vs. typical job boards.
- **Jobs (Browse)** — sidebar filters + result cards with Listing Trust Score rings, signal chips, direct apply links.
- **Tracker** — stage counters + table of applications.
- **About** — student-built story, approach, direct-link promise, CTA.

## Components
- `Primitives.jsx` — TrustRing, SignalChip, SourceLink, MetaPill, buttons, inputs.
- `Chrome.jsx` — Nav, Footer.
- `HomePage.jsx`, `JobsPage.jsx`, `TrackerPage.jsx`, `AboutPage.jsx`.
- `data.jsx` — shared mock job data.

## Source of truth
Built from the Next.js codebase in `emploid-app/` (app router, Tailwind). This recreation is cosmetic — not production code.
