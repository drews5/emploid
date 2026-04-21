/* global React, ReactDOM */
const { useState, useMemo, useRef, useEffect } = React;
const APP_STAGES = window.TRACKER.STAGES;
const { Icon, I, Card, DetailPanel } = window.TrackerUI;

const VISIBLE_STAGES = APP_STAGES.filter(s => s.id !== 'rejected');

const FILTERS = [
  { id:'all', label:'All' },
  { id:'week', label:'This week' },
  { id:'hot', label:'Hot' },
  { id:'stall', label:'Stalled' },
];

function Funnel({ data }) {
  const counts = APP_STAGES.map(s => data.filter(d => d.stage === s.id).length);
  const [saved, applied, interview, offer, rejected] = counts;
  const conv = (a, b) => a === 0 ? 0 : Math.round((b / a) * 100);
  const conversions = [
    { from:0, to:1, pct: conv(saved+applied, applied) },
    { from:1, to:2, pct: conv(applied, interview) },
    { from:2, to:3, pct: conv(interview, offer) },
  ];
  return (
    <div className="funnel-hero">
      <div className="funnel">
        {APP_STAGES.map((s, i) => (
          <React.Fragment key={s.id}>
            <div className={`funnel-stage ${s.id === 'rejected' ? 'rejected' : ''}`}>
              <div className="top"><span>{s.label}</span></div>
              <div className="count">{counts[i]}</div>
            </div>
            {i < APP_STAGES.length - 1 && (
              <div className="funnel-arrow">
                {i < 3 && (
                  <span className="pct"><span className="emp">{conversions[i]?.pct || 0}%</span></span>
                )}
                <svg width="28" height="12" viewBox="0 0 28 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M2 6h22M18 2l4 4-4 4"/>
                </svg>
              </div>
            )}
          </React.Fragment>
        ))}
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
      <button className="add-card"><Icon d={I.plus} size={14}/> Add</button>
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
          <input placeholder="Search role, company…"/>
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

function App() {
  const [apps, setApps] = useState(window.TRACKER.initial);
  const [filter, setFilter] = useState('all');
  const [groupByUi, setGroupByUi] = useState('none');
  const effectiveGroupBy = groupByUi;
  const [dragId, setDragId] = useState(null);
  const [dropCol, setDropCol] = useState(null);
  const [detail, setDetail] = useState(null);

  const filtered = useMemo(() => {
    if (filter === 'all') return apps;
    if (filter === 'week') return apps.filter(a => a.applied && (new Date('2026-04-18') - new Date(a.applied))/86400000 <= 7);
    if (filter === 'hot') return apps.filter(a => a.hot);
    if (filter === 'stall') return apps.filter(a => a.stall);
    return apps;
  }, [apps, filter]);

  const counts = useMemo(() => ({
    all: apps.filter(a => a.stage !== 'rejected').length,
    week: apps.filter(a => a.applied && (new Date('2026-04-18') - new Date(a.applied))/86400000 <= 7).length,
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
          <h1>Application Tracker</h1>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-primary"><Icon d={I.plus}/>Add</button>
        </div>
      </div>

      <Funnel data={apps}/>

      <Toolbar filter={filter} setFilter={setFilter} groupBy={groupByUi} setGroupBy={setGroupByUi} counts={counts}/>

      <div className="board">
        {VISIBLE_STAGES.map(stage => (
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
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('tracker-app-root')).render(<App />);
