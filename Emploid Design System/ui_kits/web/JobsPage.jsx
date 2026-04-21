// Emploid — Jobs (Browse) page
const JobsPage = ({ onNavigate }) => {
  const [q, setQ] = React.useState('');
  const [minTrust, setMinTrust] = React.useState(0);
  const [direct, setDirect] = React.useState(true);
  const [savedSet, setSavedSet] = React.useState(new Set());

  const filtered = JOBS.filter(j =>
    j.score >= minTrust &&
    (!q || (j.title + ' ' + j.company).toLowerCase().includes(q.toLowerCase())) &&
    (!direct || j.tags.includes('Direct Company Link'))
  );

  const toggleSave = (id) => {
    setSavedSet(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  return (
    <section className="page active">
      <div className="container jobs-shell">
        <aside className="sidebar-panel">
          <div className="filters-heading">Narrow it down</div>
          <div className="filter-group">
            <label className="filter-label">Keyword search</label>
            <input type="text" className="input" placeholder="Role, company, or keyword" value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <div className="filter-group">
            <label className="filter-label">Minimum Trust Score: {minTrust}</label>
            <input type="range" className="range-slider" min="0" max="100" value={minTrust} onChange={e => setMinTrust(+e.target.value)} />
            <div className="range-helper"><span>0 = low trust</span><span>100 = high trust</span></div>
          </div>
          <div className="filter-group">
            <label className="filter-label">Minimum salary</label>
            <select className="select"><option>Any</option><option>$60k+</option><option>$100k+</option><option>$150k+</option></select>
          </div>
          <div className="filter-group">
            <label className="filter-label">Recent Hiring Activity</label>
            <select className="select"><option>All conditions</option><option>Actively hiring</option><option>Steady</option><option>Cooling off</option></select>
          </div>
          <div className="filter-group">
            <label className="filter-label">Direct signals</label>
            <label className="switch-label"><span>Direct Company Links only</span>
              <span className="switch"><input type="checkbox" checked={direct} onChange={e => setDirect(e.target.checked)} /><span className="slider"></span></span>
            </label>
            <label className="switch-label compact"><span>Hiring contact spotted</span>
              <span className="switch"><input type="checkbox" /><span className="slider"></span></span>
            </label>
          </div>
          <div className="filter-group filter-group-last">
            <label className="filter-label">Work mode</label>
            <label className="checkbox-label"><input type="checkbox" /> Remote</label>
            <label className="checkbox-label"><input type="checkbox" defaultChecked /> Hybrid</label>
            <label className="checkbox-label"><input type="checkbox" /> On-site</label>
          </div>
        </aside>

        <div className="jobs-main">
          <div className="jobs-list-header">
            <div>
              <div className="jobs-count">{filtered.length} openings across 6 job boards</div>
              <div className="jobs-count-sub">Showing 1–{filtered.length} of {JOBS.length} matches</div>
            </div>
            <div className="jobs-header-controls">
              <label className="uppercase-label">Sort</label>
              <select className="select jobs-sort-select"><option>Relevance</option><option>Trust Score (High → Low)</option><option>Salary (High → Low)</option><option>Most Recent</option></select>
            </div>
          </div>

          <div className="jobs-list">
            {filtered.map(j => {
              const tone = trustToneClass(j.score);
              return (
                <article key={j.id} className="job-card">
                  <div className="job-card-grid">
                    <div className="job-card-content">
                      <div className="job-card-title-row"><span className="job-title">{j.title}</span></div>
                      <button className={`btn-bookmark job-bookmark-btn ${savedSet.has(j.id) ? 'saved' : ''}`} onClick={() => toggleSave(j.id)}><BookmarkIcon filled={savedSet.has(j.id)} /></button>
                      <div className="job-company-line">{j.company} · {j.location} · <SourceLink source={j.source} /></div>
                      <div className="job-meta-line">
                        <MetaPill highlight>{fmtSalary(j.salaryLow, j.salaryHigh)}</MetaPill>
                        <MetaPill>{j.work}</MetaPill>
                        <MetaPill>{j.type}</MetaPill>
                        <span className="job-posted-age">{j.posted}</span>
                      </div>
                      <div className="job-smart-tags">
                        {j.tags.map(t => {
                          const toneClass = t === 'Ghost risk' ? 'red' : t === 'Repost heavy' || t === 'Reposted' || t === 'No salary' ? 'amber' : 'green';
                          return <SignalChip key={t} tone={toneClass}>{t}</SignalChip>;
                        })}
                      </div>
                    </div>
                    <div className="job-trust-panel">
                      <TrustRing score={j.score} size={30} />
                      <div className={`job-score-status ${tone}`}>{trustLabel(j.score)}</div>
                    </div>
                  </div>
                  <div className="job-card-footer">
                    <button className="btn btn-primary job-apply-btn">Apply on {j.apply} →</button>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="pagination">
            <button className="pagination-btn text" disabled>Previous</button>
            <button className="pagination-btn active">1</button>
            <button className="pagination-btn">2</button>
            <button className="pagination-btn">3</button>
            <button className="pagination-btn">4</button>
            <button className="pagination-btn text">Next</button>
          </div>
        </div>
      </div>
    </section>
  );
};
window.JobsPage = JobsPage;
