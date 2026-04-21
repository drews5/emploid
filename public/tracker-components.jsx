/* global React */
const { useEffect, useMemo, useRef, useState } = React;
const TR_STAGES = window.TRACKER.STAGES;
const TR_COMPANY_TINTS = window.TRACKER.COMPANY_TINTS;

const TRACKER_BOARD_STORAGE_KEY = 'emploid-tracker-board-v2';
const TRACKER_LEGACY_STORAGE_KEY = 'emploid-tracker-applications-v1';
const PERIOD_OPTIONS = [
  { id: '7', label: '7d', days: 7 },
  { id: '30', label: '30d', days: 30 },
  { id: '90', label: '90d', days: 90 },
  { id: 'all', label: 'All', days: Infinity },
];
function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

const todayStr = getTodayString();
const today = new Date(todayStr);

function daysBetween(a, b) {
  if (!a || !b) return null;
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}

function fmtDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function trackerSafeParseJSON(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (_error) {
    return fallback;
  }
}

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function createAppId(app) {
  return [
    slugify(app.company || 'company'),
    slugify(app.role || 'role'),
    String(Date.now()).slice(-6),
  ].join('-');
}

function buildListingUrl(app) {
  if (app.listingUrl && app.listingUrl.includes('page=jobs')) return app.listingUrl;
  const query = encodeURIComponent([app.role, app.company].filter(Boolean).join(' '));
  return `/index.html?page=jobs&q=${query}`;
}

function buildDefaultTags(app) {
  const tags = [];
  if (app.location) tags.push(app.location);
  if (app.salary) tags.push(app.salary);
  if (app.hot) tags.push('Hot role');
  if (app.stall) tags.push('Stalled');
  return tags.slice(0, 4);
}

function normalizeStage(stage) {
  if (!stage) return 'saved';
  const value = String(stage).toLowerCase();
  if (value === 'saved') return 'saved';
  if (value === 'applied' || value === 'reviewing') return 'applied';
  if (value === 'interview') return 'interview';
  if (value === 'offer') return 'offer';
  if (value === 'rejected' || value === 'archived') return 'rejected';
  return 'saved';
}

function normalizeApp(raw) {
  const normalized = {
    id: raw.id || createAppId(raw),
    role: raw.role || raw.title || 'Untitled role',
    company: raw.company || 'Unknown company',
    source: raw.source || 'Direct',
    stage: normalizeStage(raw.stage),
    trust: typeof raw.trust === 'number' ? raw.trust : raw.trustScore || 72,
    salary: raw.salary || 'Comp not listed',
    location: raw.location || 'Location not listed',
    applied: raw.applied || null,
    updatedAt: raw.updatedAt || raw.applied || todayStr,
    notes: raw.notes || '',
    hot: Boolean(raw.hot),
    stall: Boolean(raw.stall),
    listingUrl: buildListingUrl(raw),
    tags: Array.isArray(raw.tags) && raw.tags.length ? raw.tags.slice(0, 5) : buildDefaultTags(raw),
  };

  if (!normalized.applied && normalized.stage !== 'saved') {
    normalized.applied = normalized.updatedAt || todayStr;
  }

  return normalized;
}

function legacyDaysAgoToDate(daysAgo) {
  if (typeof daysAgo !== 'number') return todayStr;
  const date = new Date(todayStr);
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

function fromLegacyApplication(legacy) {
  const stage = legacy.status === 'archived' ? 'rejected' : normalizeStage(legacy.stage);
  const notes = [legacy.lastActivity, legacy.nextAction]
    .filter(Boolean)
    .join(' ')
    .trim();

  return normalizeApp({
    id: legacy.id,
    role: legacy.role,
    company: legacy.company,
    source: legacy.source,
    stage,
    trust: legacy.trustScore,
    salary: legacy.salary,
    location: legacy.location,
    applied: legacyDaysAgoToDate(legacy.appliedDaysAgo),
    updatedAt: todayStr,
    notes,
    hot: Boolean(legacy.hot),
    stall: Boolean(legacy.stall),
    listingUrl: legacy.listingUrl,
    tags: legacy.tags,
  });
}

function loadTrackerBoard(initialApps) {
  const defaults = (initialApps || []).map(normalizeApp);

  const saved = trackerSafeParseJSON(window.localStorage.getItem(TRACKER_BOARD_STORAGE_KEY), null);
  if (Array.isArray(saved) && saved.length) {
    const merged = saved.map(normalizeApp);
    defaults.forEach((defaultApp) => {
      const exists = merged.some((app) => app.id === defaultApp.id || (app.company === defaultApp.company && app.role === defaultApp.role));
      if (!exists) merged.push(defaultApp);
    });
    return enforceExclusiveFlags(merged);
  }

  const legacy = trackerSafeParseJSON(window.localStorage.getItem(TRACKER_LEGACY_STORAGE_KEY), null);
  if (Array.isArray(legacy) && legacy.length) {
    const merged = legacy.map(fromLegacyApplication);
    defaults.forEach((defaultApp) => {
      const exists = merged.some((app) => app.id === defaultApp.id || (app.company === defaultApp.company && app.role === defaultApp.role));
      if (!exists) merged.push(defaultApp);
    });
    return enforceExclusiveFlags(merged);
  }

  return enforceExclusiveFlags(defaults);
}

function saveTrackerBoard(apps) {
  window.localStorage.setItem(TRACKER_BOARD_STORAGE_KEY, JSON.stringify(enforceExclusiveFlags(apps)));
}

function enforceExclusiveFlags(apps) {
  let seenHot = false;
  let seenStall = false;

  return apps.map((app) => {
    const next = { ...app };

    if (next.hot) {
      if (seenHot) next.hot = false;
      else seenHot = true;
    }

    if (next.stall) {
      if (seenStall) next.stall = false;
      else seenStall = true;
    }

    return next;
  });
}

function withinPeriod(app, periodId) {
  const period = PERIOD_OPTIONS.find((item) => item.id === periodId);
  if (!period || period.days === Infinity) return true;
  const reference = app.updatedAt || app.applied;
  if (!reference) return false;
  const age = daysBetween(reference, todayStr);
  return age !== null && age <= period.days;
}

function isHotApp(app) {
  return Boolean(app.hot);
}

function isStalledApp(app) {
  return Boolean(app.stall);
}

function matchesSearch(app, query) {
  if (!query) return true;
  const needle = query.trim().toLowerCase();
  if (!needle) return true;

  return [
    app.role,
    app.company,
    app.location,
    app.salary,
    app.notes,
    app.source,
    (app.tags || []).join(' '),
  ]
    .join(' ')
    .toLowerCase()
    .includes(needle);
}

function sortApps(apps, sortBy) {
  return [...apps].sort((left, right) => {
    if (sortBy === 'trust') {
      return right.trust - left.trust || (right.updatedAt || '').localeCompare(left.updatedAt || '');
    }
    if (sortBy === 'company') {
      return left.company.localeCompare(right.company) || right.trust - left.trust;
    }
    if (sortBy === 'recent') {
      return (right.updatedAt || '').localeCompare(left.updatedAt || '') || right.trust - left.trust;
    }

    const leftPriority = (isHotApp(left) ? 0 : 2) + (isStalledApp(left) ? 0 : 1);
    const rightPriority = (isHotApp(right) ? 0 : 2) + (isStalledApp(right) ? 0 : 1);
    if (leftPriority !== rightPriority) return leftPriority - rightPriority;
    return right.trust - left.trust || (right.updatedAt || '').localeCompare(left.updatedAt || '');
  });
}

const Icon = ({ d, size = 16, stroke = 2 }) => (
  <svg className="icon" width={size} height={size} viewBox="0 0 24 24" strokeWidth={stroke}>
    <g dangerouslySetInnerHTML={{ __html: d }} />
  </svg>
);

const I = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  filter: '<path d="M3 6h18M7 12h10M10 18h4"/>',
  dots: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
  arrow: '<path d="m5 12h14M13 6l6 6-6 6"/>',
  map: '<path d="M12 22s8-7.58 8-12a8 8 0 1 0-16 0c0 4.42 8 12 8 12z"/><circle cx="12" cy="10" r="3"/>',
  dollar: '<path d="M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  close: '<path d="M18 6L6 18M6 6l12 12"/>',
  sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  flame: '<path d="M12 3s3 2.4 3 5.1c0 1.8-1 2.7-2.4 3.9-1.2 1-2.1 1.9-2.1 3.6A3.5 3.5 0 0 0 14 19c1.9 0 3.5-1.6 3.5-3.5 0-4.3-3.2-6.9-5.5-12.5z"/><path d="M8.5 14.5A4.5 4.5 0 0 0 13 21a4.5 4.5 0 0 0 4.5-4.5"/>',
  pause: '<path d="M9 5h3v14H9zM15 5h3v14h-3z"/>',
  external: '<path d="M14 5h5v5"/><path d="M10 14 19 5"/><path d="M19 14v5H5V5h5"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
};

function TrustRing({ score, size = 34 }) {
  const band = score >= 85 ? 'high' : score >= 70 ? 'mid' : 'low';
  const radius = 15;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className={`trust-ring ${band}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 34 34">
        <circle className="track" cx="17" cy="17" r={radius} />
        <circle className="fill" cx="17" cy="17" r={radius} strokeDasharray={circumference} strokeDashoffset={offset} />
      </svg>
      <div className="num">{score}</div>
    </div>
  );
}

function Sparkline({ data, color = '#c85b24' }) {
  const width = 60;
  const height = 18;
  const max = Math.max(...data, 1);
  const step = width / (data.length - 1);
  const points = data
    .map((value, index) => `${index === 0 ? 'M' : 'L'}${(index * step).toFixed(1)},${(height - (value / max) * height).toFixed(1)}`)
    .join(' ');

  return (
    <svg className="sparkline" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <path d={points} stroke={color} />
    </svg>
  );
}

function CompanyMark({ name }) {
  const tint = TR_COMPANY_TINTS[name] || '#94a3b8';
  const initial = name ? name[0] : '?';
  const textColor = ['#ffe066', '#fcb400'].includes(tint) ? '#111' : '#fff';
  return <span className="logo-square" style={{ background: tint, color: textColor }}>{initial}</span>;
}

function FlagPill({ kind, active }) {
  if (!active) return null;
  return <span className={`flag-pill ${kind}`}>{kind === 'hot' ? 'Hot' : 'Stalled'}</span>;
}

function Card({ app, onOpen, onDragStart, onDragEnd }) {
  const age = app.applied ? daysBetween(app.applied, todayStr) : null;
  const hot = isHotApp(app);
  const stalled = isStalledApp(app);

  return (
    <div
      className={`card ${stalled ? 'overdue' : ''} ${hot ? 'hot' : ''}`}
      draggable
      onDragStart={(event) => onDragStart(event, app)}
      onDragEnd={onDragEnd}
      onClick={() => onOpen(app.id)}
    >
      <div className="card-labels">
        <FlagPill kind="hot" active={hot} />
        <FlagPill kind="stall" active={stalled} />
      </div>
      <div className="card-top">
        <div className="card-titles">
          <div className="role">{app.role}</div>
          <div className="company"><CompanyMark name={app.company} />{app.company}</div>
        </div>
        <TrustRing score={app.trust} />
      </div>
      <div className="card-meta">
        <span className="m"><Icon d={I.dollar} size={11} />{app.salary}</span>
        <span className="m"><Icon d={I.map} size={11} />{app.location}</span>
      </div>
      <div className="card-foot">
        <div className="applied-age">
          {app.applied ? <><strong>{age}d</strong> since update</> : <span style={{ fontStyle: 'italic' }}>Saved for later</span>}
        </div>
        <span className="next-action-inline">{app.stage}</span>
      </div>
    </div>
  );
}

function Toolbar({ filter, setFilter, groupBy, setGroupBy, counts, search, setSearch, sortBy, setSortBy }) {
  const filters = [
    { id: 'all', label: 'All' },
    { id: 'week', label: 'This week' },
    { id: 'hot', label: 'Hot' },
    { id: 'stall', label: 'Stalled' },
  ];

  return (
    <div className="toolbar">
      <div className="tool-chips">
        {filters.map((item) => (
          <button
            key={item.id}
            className={filter === item.id ? 'chip on' : 'chip'}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
            <span className="num">{counts[item.id] || 0}</span>
          </button>
        ))}
      </div>
      <div className="tool-right">
        <div className="tool-search">
          <Icon d={I.search} size={14} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search role, company, notes..."
          />
        </div>
        <div className="tool-divider" />
        <div className="group-by">
          <span>Group by</span>
          <select value={groupBy} onChange={(event) => setGroupBy(event.target.value)}>
            <option value="none">None</option>
            <option value="company">Company</option>
            <option value="week">Recency</option>
          </select>
        </div>
        <div className="group-by">
          <span>Sort</span>
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            <option value="priority">Priority</option>
            <option value="recent">Recently updated</option>
            <option value="trust">Highest trust</option>
            <option value="company">Company A-Z</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function Funnel({ data, period, setPeriod }) {
  const visible = data.filter((app) => withinPeriod(app, period));
  const counts = TR_STAGES.map((stage) => visible.filter((app) => app.stage === stage.id).length);
  const saved = counts[0] + counts[1];
  const applied = counts[1];
  const interview = counts[2];
  const offer = counts[3];

  const conversions = [
    saved ? Math.round((applied / saved) * 100) : 0,
    applied ? Math.round((interview / applied) * 100) : 0,
    interview ? Math.round((offer / interview) * 100) : 0,
  ];

  return (
    <div className="funnel-hero">
      <div className="funnel-head">
        <div>
          <div className="label">Pipeline Funnel</div>
          <h2>Your conversion, saved to offer</h2>
        </div>
        <div className="funnel-period">
          {PERIOD_OPTIONS.map((option) => (
            <button
              key={option.id}
              className={period === option.id ? 'on' : ''}
              onClick={() => setPeriod(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <div className="funnel">
        {TR_STAGES.map((stage, index) => (
          <React.Fragment key={stage.id}>
            <div className={`funnel-stage ${stage.id === 'rejected' ? 'rejected' : ''}`}>
              <div className="top"><span>{stage.label}</span></div>
              <div className="count">{counts[index]}</div>
            </div>
            {index < TR_STAGES.length - 1 && (
              <div className="funnel-arrow">
                {index < conversions.length && <span className="pct"><span className="emp">{conversions[index]}%</span></span>}
                <svg width="28" height="12" viewBox="0 0 28 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M2 6h22M18 2l4 4-4 4" />
                </svg>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function ColumnMenu({ stage, apps, menuOpen, onToggle, onAdd, onSetSortBy, onSetFilter }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;
    function handlePointer(event) {
      if (ref.current && !ref.current.contains(event.target)) onToggle(false);
    }
    document.addEventListener('mousedown', handlePointer);
    return () => document.removeEventListener('mousedown', handlePointer);
  }, [menuOpen, onToggle]);

  return (
    <div className="tracker-menu-wrap" ref={ref}>
      <button className="col-menu" onClick={() => onToggle(!menuOpen)} aria-label={`Open ${stage.label} menu`}>
        <Icon d={I.dots} />
      </button>
      {menuOpen && (
        <div className="tracker-menu">
          <button onClick={onAdd}>Add to {stage.label}</button>
          <button onClick={() => { onSetSortBy('recent'); onToggle(false); }}>Sort by recent</button>
          <button onClick={() => { onSetSortBy('trust'); onToggle(false); }}>Sort by trust</button>
          <button onClick={() => { onSetSortBy('company'); onToggle(false); }}>Sort by company</button>
          {apps.some(isHotApp) && <button onClick={() => { onSetFilter('hot'); onToggle(false); }}>Show hot only</button>}
          {apps.some(isStalledApp) && <button onClick={() => { onSetFilter('stall'); onToggle(false); }}>Show stalled only</button>}
        </div>
      )}
    </div>
  );
}

function Column({ stage, apps, groupBy, drop, onDragOver, onDrop, onOpen, onDragStart, onDragEnd, menuOpen, setMenuOpen, onAddToStage, onSetSortBy, onSetFilter }) {
  const grouped = useMemo(() => {
    if (groupBy === 'none') return [{ label: null, items: apps }];
    if (groupBy === 'company') {
      const map = {};
      apps.forEach((app) => {
        if (!map[app.company]) map[app.company] = [];
        map[app.company].push(app);
      });
      return Object.entries(map)
        .sort((left, right) => right[1].length - left[1].length)
        .map(([label, items]) => ({ label, items }));
    }
    if (groupBy === 'week') {
      const bins = { 'This week': [], 'Last two weeks': [], Older: [], 'Not applied': [] };
      apps.forEach((app) => {
        if (!app.applied) {
          bins['Not applied'].push(app);
          return;
        }
        const age = daysBetween(app.applied, todayStr);
        if (age <= 7) bins['This week'].push(app);
        else if (age <= 14) bins['Last two weeks'].push(app);
        else bins.Older.push(app);
      });
      return Object.entries(bins)
        .filter(([, items]) => items.length)
        .map(([label, items]) => ({ label, items }));
    }
    return [{ label: null, items: apps }];
  }, [apps, groupBy]);

  return (
    <div className={`col ${drop ? 'drop' : ''}`} data-stage={stage.id} onDragOver={onDragOver} onDrop={onDrop}>
      <div className="col-head">
        <div className="col-head-left">
          <span className="col-dot" />
          <span className="col-title">{stage.label}</span>
          <span className="col-count">{apps.length}</span>
        </div>
        <ColumnMenu
          stage={stage}
          apps={apps}
          menuOpen={menuOpen}
          onToggle={setMenuOpen}
          onAdd={onAddToStage}
          onSetSortBy={onSetSortBy}
          onSetFilter={onSetFilter}
        />
      </div>
      <div className="card-list">
        {grouped.map((group, index) => (
          <React.Fragment key={`${stage.id}-${index}`}>
            {group.label && <div className="group-header">{group.label} - {group.items.length}</div>}
            {group.items.map((app) => (
              <Card
                key={app.id}
                app={app}
                onOpen={onOpen}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
              />
            ))}
          </React.Fragment>
        ))}
        {apps.length === 0 && <div className="col-empty">No applications here yet. Add one or drag a card into this stage.</div>}
      </div>
      <button className="add-card" onClick={onAddToStage}><Icon d={I.plus} size={14} />Add to {stage.label}</button>
    </div>
  );
}

function ComposerModal({ open, draft, onClose, onChange, onSubmit }) {
  if (!open) return null;

  return (
    <div className="tracker-modal-backdrop" onClick={onClose}>
      <div className="tracker-modal" onClick={(event) => event.stopPropagation()}>
        <div className="tracker-modal-head">
          <div>
            <div className="label">Add Application</div>
            <h3>Capture a real listing</h3>
          </div>
          <button className="detail-close" onClick={onClose}><Icon d={I.close} /></button>
        </div>
        <form className="tracker-form" onSubmit={onSubmit}>
          <label>
            <span>Role</span>
            <input value={draft.role} onChange={(event) => onChange('role', event.target.value)} placeholder="Product Designer" required />
          </label>
          <label>
            <span>Company</span>
            <input value={draft.company} onChange={(event) => onChange('company', event.target.value)} placeholder="Figma" required />
          </label>
          <label>
            <span>Stage</span>
            <select value={draft.stage} onChange={(event) => onChange('stage', event.target.value)}>
              {TR_STAGES.map((stage) => <option key={stage.id} value={stage.id}>{stage.label}</option>)}
            </select>
          </label>
          <label>
            <span>Emploid listing URL</span>
            <input value={draft.listingUrl} onChange={(event) => onChange('listingUrl', event.target.value)} placeholder="/index.html?page=jobs&q=Product%20Designer%20Figma" />
          </label>
          <label>
            <span>Location</span>
            <input value={draft.location} onChange={(event) => onChange('location', event.target.value)} placeholder="Remote · US" />
          </label>
          <label>
            <span>Salary</span>
            <input value={draft.salary} onChange={(event) => onChange('salary', event.target.value)} placeholder="$120k-$145k" />
          </label>
          <label>
            <span>Trust score</span>
            <input type="number" min="0" max="100" value={draft.trust} onChange={(event) => onChange('trust', event.target.value)} />
          </label>
          <label>
            <span>Applied date</span>
            <input type="date" value={draft.applied} onChange={(event) => onChange('applied', event.target.value)} />
          </label>
          <label className="full">
            <span>Notes</span>
            <textarea value={draft.notes} onChange={(event) => onChange('notes', event.target.value)} placeholder="Follow-up, recruiter notes, or prep reminders..." rows="4" />
          </label>
          <label className="tracker-check">
            <input type="checkbox" checked={Boolean(draft.hot)} onChange={(event) => onChange('hot', event.target.checked)} />
            <span>Mark as hot</span>
          </label>
          <label className="tracker-check">
            <input type="checkbox" checked={Boolean(draft.stall)} onChange={(event) => onChange('stall', event.target.checked)} />
            <span>Mark as stalled</span>
          </label>
          <div className="tracker-form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Add application</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DetailPanel({ app, onClose, onStageChange, onToggleFlag, onOpenListing }) {
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    setStatusMenuOpen(false);
  }, [app && app.id]);

  useEffect(() => {
    if (!statusMenuOpen) return undefined;
    function handlePointer(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) setStatusMenuOpen(false);
    }
    document.addEventListener('mousedown', handlePointer);
    return () => document.removeEventListener('mousedown', handlePointer);
  }, [statusMenuOpen]);

  if (!app) return null;

  const hot = isHotApp(app);
  const stalled = isStalledApp(app);
  const trustTone = app.trust >= 85 ? 'High Trust' : app.trust >= 70 ? 'Review Carefully' : 'Low Trust';

  return (
    <>
      <div className="detail-backdrop open" onClick={onClose} />
      <div className="detail-panel open">
        <div className="detail-head">
          <div>
            <div className="detail-company-row"><CompanyMark name={app.company} />{app.company}</div>
            <div className="detail-role-title">{app.role}</div>
            <div className="detail-trust-row">
              <TrustRing score={app.trust} size={40} />
              <div>
                <div className="detail-trust-label">{trustTone}</div>
                <div className="detail-trust-sub">Listing Trust Score</div>
              </div>
            </div>
          </div>
          <button className="detail-close" onClick={onClose}><Icon d={I.close} /></button>
        </div>
        <div className="detail-body">
          <div className="detail-section">
            <h4>Status</h4>
            <div className="detail-chip-row">
              {TR_STAGES.map((stage) => (
                <button
                  key={stage.id}
                  className={`chip ${stage.id === app.stage ? 'on' : ''}`}
                  onClick={() => onStageChange(app.id, stage.id)}
                >
                  {stage.label}
                </button>
              ))}
            </div>
            <div className="detail-chip-row detail-chip-row-flags">
              <button className={`flag-action ${hot ? 'on hot' : ''}`} onClick={() => onToggleFlag(app.id, 'hot')}>
                <Icon d={I.flame} size={13} />{hot ? 'Hot' : 'Mark hot'}
              </button>
              <button className={`flag-action ${stalled ? 'on stalled' : ''}`} onClick={() => onToggleFlag(app.id, 'stall')}>
                <Icon d={I.pause} size={11} />{stalled ? 'Stalled' : 'Mark stalled'}
              </button>
            </div>
          </div>
          <div className="detail-section">
            <h4>Details</h4>
            <div className="detail-row"><div className="k">Source</div><div className="v">{app.source}</div></div>
            <div className="detail-row"><div className="k">Salary</div><div className="v">{app.salary}</div></div>
            <div className="detail-row"><div className="k">Location</div><div className="v">{app.location}</div></div>
            <div className="detail-row"><div className="k">Date applied</div><div className="v">{fmtDate(app.applied)}</div></div>
            <div className="detail-row"><div className="k">Last touched</div><div className="v">{fmtDate(app.updatedAt)}</div></div>
            <div className="detail-row" style={{ borderBottom: 0 }}><div className="k">Signals</div><div className="v">{app.tags.join(', ') || 'No extra signals yet'}</div></div>
          </div>
          <div className="detail-section">
            <h4>Notes</h4>
            <div className="detail-notes">{app.notes || 'No notes yet. Use the tracker to capture follow-ups, prep, and context.'}</div>
          </div>
        </div>
        <div className="detail-foot">
          <button className="btn btn-primary detail-primary" onClick={() => onOpenListing(app)}>
            Open listing <Icon d={I.external} />
          </button>
          <div className="tracker-menu-wrap detail-status-wrap" ref={menuRef}>
            <button className="btn btn-secondary" onClick={() => setStatusMenuOpen(!statusMenuOpen)}>
              Update status <Icon d={I.chevron} size={12} />
            </button>
            {statusMenuOpen && (
              <div className="tracker-menu tracker-menu-up">
                {TR_STAGES.map((stage) => (
                  <button
                    key={stage.id}
                    onClick={() => {
                      onStageChange(app.id, stage.id);
                      setStatusMenuOpen(false);
                    }}
                  >
                    Move to {stage.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

window.TrackerUI = {
  TRACKER_BOARD_STORAGE_KEY,
  TRACKER_LEGACY_STORAGE_KEY,
  PERIOD_OPTIONS,
  Icon,
  I,
  Sparkline,
  Card,
  Column,
  Toolbar,
  Funnel,
  ComposerModal,
  DetailPanel,
  CompanyMark,
  TrustRing,
  todayStr,
  today,
  daysBetween,
  fmtDate,
  normalizeApp,
  loadTrackerBoard,
  saveTrackerBoard,
  enforceExclusiveFlags,
  withinPeriod,
  isHotApp,
  isStalledApp,
  matchesSearch,
  sortApps,
  buildListingUrl,
};
