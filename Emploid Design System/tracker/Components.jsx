/* global React, ReactDOM */
const { useState, useMemo, useRef, useEffect } = React;
const TR_STAGES = window.TRACKER.STAGES;
const TR_COMPANY_TINTS = window.TRACKER.COMPANY_TINTS;

const todayStr = '2026-04-18';
const today = new Date(todayStr);
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);
const fmtDate = s => s ? new Date(s).toLocaleDateString('en-US',{month:'short',day:'numeric'}) : '—';

const Icon = ({ d, size=16, stroke=2 }) => (
  <svg className="icon" width={size} height={size} viewBox="0 0 24 24" strokeWidth={stroke}>
    <g dangerouslySetInnerHTML={{__html:d}}/>
  </svg>
);
const I = {
  search:'<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  filter:'<path d="M3 6h18M7 12h10M10 18h4"/>',
  dots:'<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
  arrow:'<path d="m5 12h14M13 6l6 6-6 6"/>',
  map:'<path d="M12 22s8-7.58 8-12a8 8 0 1 0-16 0c0 4.42 8 12 8 12z"/><circle cx="12" cy="10" r="3"/>',
  dollar:'<path d="M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  bell:'<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9zM10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  close:'<path d="M18 6L6 18M6 6l12 12"/>',
  sliders:'<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
};

function TrustRing({ score, size=34 }) {
  const band = score >= 85 ? 'high' : score >= 70 ? 'mid' : 'low';
  const r = 15, c = 2 * Math.PI * r;
  const off = c - (score / 100) * c;
  return (
    <div className={`trust-ring ${band}`} style={{width:size,height:size}}>
      <svg viewBox="0 0 34 34"><circle className="track" cx="17" cy="17" r={r}/><circle className="fill" cx="17" cy="17" r={r} strokeDasharray={c} strokeDashoffset={off}/></svg>
      <div className="num">{score}</div>
    </div>
  );
}

function Sparkline({ data, color='#c85b24' }) {
  const w = 60, h = 18;
  const max = Math.max(...data, 1);
  const step = w / (data.length - 1);
  const pts = data.map((v,i) => `${i===0?'M':'L'}${(i*step).toFixed(1)},${(h - (v/max)*h).toFixed(1)}`).join(' ');
  return <svg className="sparkline" width={w} height={h} viewBox={`0 0 ${w} ${h}`}><path d={pts} stroke={color} /></svg>;
}

function CompanyMark({ name }) {
  const tint = TR_COMPANY_TINTS[name] || '#94a3b8';
  const initial = name[0];
  const textColor = ['#ffe066','#fcb400'].includes(tint) ? '#111' : '#fff';
  return <span className="logo-square" style={{background:tint, color:textColor}}>{initial}</span>;
}

function Card({ app, onOpen, onDragStart, onDragEnd }) {
  const age = app.applied ? daysBetween(app.applied, todayStr) : null;
  const overdue = app.next?.state === 'overdue';
  return (
    <div
      className={`card ${overdue ? 'overdue' : ''} ${app.hot ? 'hot' : ''}`}
      draggable
      onDragStart={e => onDragStart(e, app)}
      onDragEnd={onDragEnd}
      onClick={() => onOpen(app)}
    >
      {app.stall && <div className="card-stall">Stalled</div>}
      <div className="card-top">
        <div className="card-titles">
          <div className="role">{app.role}</div>
          <div className="company"><CompanyMark name={app.company}/>{app.company}</div>
        </div>
        <TrustRing score={app.trust}/>
      </div>
      <div className="card-meta">
        <span className="m"><Icon d={I.dollar} size={11}/>{app.salary}</span>
        <span className="m"><Icon d={I.map} size={11}/>{app.location}</span>
      </div>
      <div className="card-foot">
        <div className="applied-age">
          {app.applied ? <><strong>{age}d</strong> since applied</> : <span style={{fontStyle:'italic'}}>Not yet applied</span>}
        </div>
        {app.next && <span className={`next-action ${app.next.state}`}><Icon d={I.clock} size={11}/>{app.next.label}</span>}
      </div>
    </div>
  );
}

function DetailPanel({ app, onClose, onStageChange }) {
  if (!app) return null;
  return (
    <>
      <div className={`detail-backdrop ${app ? 'open' : ''}`} onClick={onClose}/>
      <div className={`detail-panel ${app ? 'open' : ''}`}>
        <div className="detail-head">
          <div>
            <div style={{display:'flex',alignItems:'center',gap:8,fontSize:12,color:'#5d7088',fontWeight:600,marginBottom:6}}>
              <CompanyMark name={app.company}/>{app.company}
            </div>
            <div style={{fontFamily:'var(--font-heading)',fontWeight:900,fontSize:22,letterSpacing:'-0.02em',lineHeight:1.15,color:'#0d1726',marginBottom:8}}>{app.role}</div>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <TrustRing score={app.trust} size={40}/>
              <div>
                <div style={{fontSize:11,fontWeight:800,letterSpacing:'0.1em',textTransform:'uppercase',color: app.trust>=85?'var(--score-high)':app.trust>=70?'var(--score-mid)':'var(--score-low)'}}>
                  {app.trust>=85?'High Trust':app.trust>=70?'Review carefully':'Low Trust'}
                </div>
                <div style={{fontSize:12,color:'#5d7088',marginTop:2}}>Listing Trust Score</div>
              </div>
            </div>
          </div>
          <button className="detail-close" onClick={onClose}><Icon d={I.close}/></button>
        </div>
        <div className="detail-body">
          <div className="detail-section">
            <h4>Stage</h4>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {TR_STAGES.map(s => (
                <button key={s.id} className="chip" style={s.id===app.stage?{background:s.color,color:'#fff',borderColor:s.color}:{}} onClick={()=>onStageChange(app.id, s.id)}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div className="detail-section">
            <h4>Details</h4>
            <div className="detail-row"><div className="k">Salary</div><div className="v">{app.salary}</div></div>
            <div className="detail-row"><div className="k">Location</div><div className="v">{app.location}</div></div>
            <div className="detail-row"><div className="k">Date applied</div><div className="v">{fmtDate(app.applied)}</div></div>
            <div className="detail-row"><div className="k">Days since</div><div className="v">{app.applied?daysBetween(app.applied, todayStr)+' days':'—'}</div></div>
            <div className="detail-row"><div className="k">Next action</div><div className="v">{app.next?.label || '—'}</div></div>
            <div className="detail-row" style={{borderBottom:'0'}}><div className="k">Due</div><div className="v">{fmtDate(app.next?.due)}</div></div>
          </div>
          {app.notes && <div className="detail-section">
            <h4>Notes</h4>
            <div className="detail-notes">{app.notes}</div>
          </div>}
        </div>
        <div className="detail-foot">
          <button className="btn btn-primary" style={{flex:1}}>Open listing →</button>
          <button className="btn btn-secondary">Log activity</button>
        </div>
      </div>
    </>
  );
}

window.TrackerUI = { Icon, I, TrustRing, Sparkline, CompanyMark, Card, DetailPanel, todayStr, today, daysBetween, fmtDate };
