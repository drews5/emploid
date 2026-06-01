// Direction B — "Command palette"
// Centered tool panel on a grid-paper background. Pure interface, no marketing.
// Search input + visible autocomplete-style suggestions + keyboard hints.

const PALETTE_RESULTS = [
  {
    kind: 'role',
    icon: <SearchIcon size={14} strokeWidth={2.4} />,
    bg: 'var(--orange-soft)', color: 'var(--orange-500)',
    title: <>Search <span className="accent">Software Engineer</span> · Remote</>,
    meta: '2,840 live · trust 73 avg',
    count: '↵',
    selected: true,
  },
  {
    kind: 'role',
    icon: <SearchIcon size={14} strokeWidth={2.4} />,
    bg: 'var(--bg-light)', color: 'var(--text-muted)',
    title: <>Search <span className="accent">Software Engineer</span> · $150k+</>,
    meta: '1,210 live · salary disclosed',
    count: '',
    selected: false,
  },
  {
    kind: 'role',
    icon: <SearchIcon size={14} strokeWidth={2.4} />,
    bg: 'var(--bg-light)', color: 'var(--text-muted)',
    title: <>Search <span className="accent">Software Engineer</span> · New grad</>,
    meta: '430 live · 0–1 yrs experience',
    count: '',
    selected: false,
  },
];

const PALETTE_COMPANIES = [
  { name: 'Stripe',    initial: 'S', color: '#635bff', openings: 84, label: 'open roles' },
  { name: 'Anthropic', initial: 'A', color: '#cc785c', openings: 62, label: 'open roles' },
  { name: 'Vercel',    initial: 'V', color: '#000000', openings: 28, label: 'open roles' },
];

const DirectionB = () => (
  <div className="browse-page dirB-page" data-screen-label="B · Command palette">
    <BPNav />

    {/* Corner labels — quiet, ambient */}
    <span className="dirB-corner tl">
      <span className="num">12,840</span>
      Active listings
    </span>
    <span className="dirB-corner tr">
      <span className="num">6</span>
      Boards indexed
    </span>
    <span className="dirB-corner bl">
      <span className="num">43%</span>
      Flagged low trust
    </span>
    <span className="dirB-corner br">
      <span className="num">7,930</span>
      Direct-link only
    </span>

    <div className="dirB-stage">
      <div className="dirB-panel">
        {/* Search header */}
        <div className="dirB-panel-header">
          <span className="dirB-panel-search-icon"><SearchIcon size={20} strokeWidth={2.2} /></span>
          <input
            className="dirB-panel-input"
            placeholder="Search jobs, companies, skills…"
            defaultValue="software engineer"
          />
          <span className="dirB-panel-cursor" />
          <span className="dirB-kbd">⌘ K</span>
        </div>

        {/* Suggestions */}
        <div className="dirB-suggestions">
          <div className="dirB-section-label">Searches</div>
          {PALETTE_RESULTS.map((r, i) => (
            <div key={i} className={`dirB-row ${r.selected ? 'selected' : ''}`}>
              <div className="dirB-row-icon" style={{ background: r.bg, color: r.color }}>
                {r.icon}
              </div>
              <div className="dirB-row-text">
                <div className="dirB-row-title">{r.title}</div>
                <div className="dirB-row-meta">{r.meta}</div>
              </div>
              <span className="dirB-row-count">{r.count}</span>
              <span className="dirB-row-enter"><CornerEnter size={12} /></span>
            </div>
          ))}

          <div className="dirB-section-label">Companies</div>
          {PALETTE_COMPANIES.map((c) => (
            <div key={c.name} className="dirB-row">
              <div className="dirB-row-icon" style={{ background: c.color, color: '#fff', fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: 13 }}>
                {c.initial}
              </div>
              <div className="dirB-row-text">
                <div className="dirB-row-title">{c.name}</div>
                <div className="dirB-row-meta">{c.openings} {c.label}</div>
              </div>
              <span className="dirB-row-count" />
              <span className="dirB-row-enter"><CornerEnter size={12} /></span>
            </div>
          ))}
        </div>

        {/* Footer with keyboard hints */}
        <div className="dirB-panel-footer">
          <div className="hints">
            <span className="hint"><span className="dirB-kbd">↵</span> open</span>
            <span className="hint"><span className="dirB-kbd">↑</span><span className="dirB-kbd">↓</span> navigate</span>
            <span className="hint"><span className="dirB-kbd">esc</span> close</span>
          </div>
          <span className="brand">Search powered by <strong>Emploid</strong></span>
        </div>
      </div>
    </div>
  </div>
);

window.DirectionB = DirectionB;
