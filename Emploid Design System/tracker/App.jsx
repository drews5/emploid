/* global React, ReactDOM */
const { useState, useMemo, useRef, useEffect } = React;
const APP_STAGES = window.TRACKER.STAGES;
const APP_SPARKS = window.TRACKER.SPARKS;
const { Icon, I, Sparkline, Card, DetailPanel } = window.TrackerUI;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "density": "cozy",
  "groupBy": "none",
  "colorCodedCards": true,
  "showFunnel": true
}/*EDITMODE-END*/;

const FILTERS = [
  { id:'all', label:'All apps' },
  { id:'week', label:'This week' },
  { id:'followup', label:'Needs follow-up', alert:true },
  { id:'hot', label:'Hot' },
  { id:'stall', label:'Stalled' },
];

function Funnel({ data }) {
  const counts = APP_STAGES.map(s => data.filter(d => d.stage === s.id).length);
  const [saved, applied, interview, offer, archived] = counts;
  const conv = (a, b) => a === 0 ? 0 : Math.round((b / a) * 100);
  const conversions = [
    { from:0, to:1, pct: conv(saved+applied, applied) },
    { from:1, to:2, pct: conv(applied, interview) },
    { from:2, to:3, pct: conv(interview, offer) },
  ];
  return (
    <div className="funnel-hero">
      <div className="funnel-head">
        <div>
          <div className="label">Pipeline Funnel</div>
          <h2>Your conversion, Saved → Offer</h2>
        </div>
        <div className="funnel-period">
          <button>7d</button><button className="on">30d</button><button>90d</button><button>All</button>
        </div>
      </div>
      <div className="funnel">
        {APP_STAGES.slice(0,4).map((s, i) => (
          <React.Fragment key={s.id}>
            <div className="funnel-stage">
              <div className="top"><span>{s.label}</span></div>
              <div className="count">{counts[i]}</div>
              <div className={`delta ${i===3?'up':'up'}`}>{i===0?'+3 this wk':i===1?'+2 this wk':i===2?'+1 this wk':'+1 this wk'}</div>
            </div>
            {i < 3 && (
              <div className="funnel-arrow">
                <span className="pct"><span className="emp">{conversions[i].pct}%</span></span>
                <svg width="28" height="12" viewBox="0 0 28 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M2 6h22M18 2l4 4-4 4"/>
                </svg>
              </div>
            )}
          </React.Fragment>
        ))}
        <div className="funnel-arrow"><span className="pct" style={{opacity:0.7}}>archived</span></div>
        <div className="funnel-stage" style={{opacity:0.7}}>
          <div className="top"><span>{APP_STAGES[4].label}</span></div>
          <div className="count">{counts[4]}</div>
          <div className="delta">—</div>
        </div>
      </div>
    </div>
  );
}

function Column({ stage, apps, groupBy, onDragOver, onDrop, drop, onOpen, onDragStart, onDragEnd }) {
  const grouped = useMemo(() => {
    if (groupBy === 'none') return [{ label: null, items: apps }];
    if (groupBy === 'company') {
      const m = {};
      apps.forEach(a => { (m[a.company] ||= []).push(a); });
      return Object.entries(m).sort((a,b)=>b[1].length-a[1].length).map(([label,items]) => ({label,items}));
    }
    if (groupBy === 'week') {
      const bins = { 'This week':[], 'Last week':[], 'Older':[], 'Not applied':[] };
      apps.forEach(a => {
        if (!a.applied) bins['Not applied'].push(a);
        else {
          const d = Math.round((new Date('2026-04-18') - new Date(a.applied))/86400000);
          if (d <= 7) bins['This week'].push(a);
          else if (d <= 14) bins['Last week'].push(a);
          else bins['Older'].push(a);
        }
      });
      return Object.entries(bins).filter(([,v])=>v.length).map(([label,items])=>({label,items}));
    }
    return [{ label: null, items: apps }];
  }, [apps, groupBy]);

  const spark = APP_SPARKS[stage.id];
  const delta = spark ? spark[spark.length-1] - spark[spark.length-2] : 0;
  const deltaClass = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
  const deltaLabel = delta > 0 ? `+${delta}` : delta < 0 ? `${delta}` : '0';

  return (
    <div
      className={`col ${drop ? 'drop' : ''}`}
      data-stage={stage.id}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="col-head">
        <div className="col-head-left">
          <span className="col-dot"/>
          <span className="col-title">{stage.label}</span>
          <span className="col-count">{apps.length}</span>
        </div>
        <button className="col-menu"><Icon d={I.dots}/></button>
      </div>
      <div className="col-throughput">
        <span>8w</span>
        <Sparkline data={spark} color={stage.color}/>
        <span className={`delta-pill ${deltaClass}`}>{deltaLabel}</span>
      </div>
      <div className="card-list">
        {grouped.map((g, gi) => (
          <React.Fragment key={gi}>
            {g.label && <div className="group-header">{g.label} · {g.items.length}</div>}
            {g.items.map(app => (
              <Card key={app.id} app={app} onOpen={onOpen} onDragStart={onDragStart} onDragEnd={onDragEnd}/>
            ))}
          </React.Fragment>
        ))}
        {apps.length === 0 && <div className="col-empty">No apps here yet.<br/>Drag a card over, or quick-add below.</div>}
      </div>
      <button className="add-card"><Icon d={I.plus} size={14}/> Add to {stage.label}</button>
    </div>
  );
}

function Toolbar({ filter, setFilter, groupBy, setGroupBy, counts }) {
  return (
    <div className="toolbar">
      <div className="tool-chips">
        {FILTERS.map(f => {
          const n = counts[f.id];
          const cls = filter === f.id ? 'chip on' : `chip ${f.alert && n>0 ? 'alert' : ''}`;
          return (
            <button key={f.id} className={cls} onClick={()=>setFilter(f.id)}>
              {f.label}{n !== undefined && <span className="num">{n}</span>}
            </button>
          );
        })}
      </div>
      <div className="tool-right">
        <div className="tool-search">
          <Icon d={I.search} size={14}/>
          <input placeholder="Search role, company, notes…"/>
        </div>
        <div className="tool-divider"/>
        <div className="group-by">
          <span>Group by</span>
          <select value={groupBy} onChange={e=>setGroupBy(e.target.value)}>
            <option value="none">None</option>
            <option value="company">Company</option>
            <option value="week">Week</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function TweaksPanel({ open, tweaks, setTweak }) {
  if (!open) return null;
  return (
    <div className="tweaks-panel open">
      <h5>Tweaks</h5>
      <div className="t-row">
        <span className="t-label">Density</span>
        <select value={tweaks.density} onChange={e=>setTweak('density',e.target.value)}>
          <option value="compact">Compact</option><option value="cozy">Cozy</option><option value="comfy">Comfy</option>
        </select>
      </div>
      <div className="t-row">
        <span className="t-label">Group by</span>
        <select value={tweaks.groupBy} onChange={e=>setTweak('groupBy',e.target.value)}>
          <option value="none">None</option><option value="company">Company</option><option value="week">Week</option>
        </select>
      </div>
      <div className="t-row">
        <span className="t-label">Funnel hero</span>
        <button className={`t-toggle ${tweaks.showFunnel?'on':''}`} onClick={()=>setTweak('showFunnel',!tweaks.showFunnel)}>{tweaks.showFunnel?'On':'Off'}</button>
      </div>
      <div className="t-row">
        <span className="t-label">Color-code cards</span>
        <button className={`t-toggle ${tweaks.colorCodedCards?'on':''}`} onClick={()=>setTweak('colorCodedCards',!tweaks.colorCodedCards)}>{tweaks.colorCodedCards?'On':'Off'}</button>
      </div>
    </div>
  );
}

function App() {
  const [apps, setApps] = useState(window.TRACKER.initial);
  const [filter, setFilter] = useState('all');
  const [tweaks, setTweaks] = useState(TWEAK_DEFAULTS);
  const [groupByUi, setGroupByUi] = useState('none');
  const effectiveGroupBy = groupByUi;
  const [dragId, setDragId] = useState(null);
  const [dropCol, setDropCol] = useState(null);
  const [detail, setDetail] = useState(null);
  const [tweaksOpen, setTweaksOpen] = useState(false);

  // edit-mode protocol
  useEffect(() => {
    const handler = e => {
      if (e.data?.type === '__activate_edit_mode') setTweaksOpen(true);
      if (e.data?.type === '__deactivate_edit_mode') setTweaksOpen(false);
    };
    window.addEventListener('message', handler);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', handler);
  }, []);

  const setTweak = (k, v) => {
    const next = { ...tweaks, [k]: v };
    setTweaks(next);
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [k]: v } }, '*');
  };

  const filtered = useMemo(() => {
    if (filter === 'all') return apps;
    if (filter === 'week') return apps.filter(a => a.applied && (new Date('2026-04-18') - new Date(a.applied))/86400000 <= 7);
    if (filter === 'followup') return apps.filter(a => a.next?.state === 'overdue' || a.next?.state === 'soon');
    if (filter === 'hot') return apps.filter(a => a.hot);
    if (filter === 'stall') return apps.filter(a => a.stall);
    return apps;
  }, [apps, filter]);

  const counts = useMemo(() => ({
    all: apps.length,
    week: apps.filter(a => a.applied && (new Date('2026-04-18') - new Date(a.applied))/86400000 <= 7).length,
    followup: apps.filter(a => a.next?.state === 'overdue').length,
    hot: apps.filter(a => a.hot).length,
    stall: apps.filter(a => a.stall).length,
  }), [apps]);

  const onDragStart = (e, app) => {
    setDragId(app.id);
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.classList.add('dragging');
  };
  const onDragEnd = e => { e.currentTarget.classList.remove('dragging'); setDragId(null); setDropCol(null); };
  const onDragOver = (stageId) => (e) => { e.preventDefault(); if (dropCol !== stageId) setDropCol(stageId); };
  const onDrop = (stageId) => (e) => {
    e.preventDefault();
    if (dragId) setApps(prev => prev.map(a => a.id === dragId ? { ...a, stage: stageId } : a));
    setDropCol(null); setDragId(null);
  };

  const onStageChange = (id, stageId) => {
    setApps(prev => prev.map(a => a.id === id ? { ...a, stage: stageId } : a));
    if (detail?.id === id) setDetail(d => ({ ...d, stage: stageId }));
  };

  return (
    <div className="shell" data-screen-label="Tracker">
      <div className="topbar">
        <div className="title-block">
          <span className="kicker-label">Portal · Application Tracker</span>
          <h1>Your pipeline, end to end.</h1>
          <div className="sub">Every app synced the moment you apply. See what's alive, what's stalling, and where to push next.</div>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-ghost"><Icon d={I.sliders}/>Views</button>
          <button className="btn btn-secondary"><Icon d={I.filter}/>Filters</button>
          <button className="btn btn-primary"><Icon d={I.plus}/>Add app</button>
        </div>
      </div>

      {tweaks.showFunnel && <Funnel data={apps}/>}

      <Toolbar filter={filter} setFilter={setFilter} groupBy={groupByUi} setGroupBy={setGroupByUi} counts={counts}/>

      <div className="board">
        {APP_STAGES.map(stage => (
          <Column
            key={stage.id}
            stage={stage}
            apps={filtered.filter(a => a.stage === stage.id)}
            groupBy={effectiveGroupBy}
            drop={dropCol === stage.id}
            onDragOver={onDragOver(stage.id)}
            onDrop={onDrop(stage.id)}
            onOpen={setDetail}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          />
        ))}
      </div>

      <DetailPanel app={detail} onClose={()=>setDetail(null)} onStageChange={onStageChange}/>
      <TweaksPanel open={tweaksOpen} tweaks={tweaks} setTweak={setTweak}/>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('app')).render(<App />);
