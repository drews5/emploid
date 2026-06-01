// Emploid v2 — Product Showcase + Feature Split + Stats

const ProductShowcase = () => {
  const [tab, setTab] = React.useState(0);
  const tabs = ['Trust Scores', 'Direct Apply', 'Application Tracker'];
  const panels = [
    {
      h: 'Every listing scored before you click apply.',
      p: 'Our Listing Trust Score analyzes posting age, repost frequency, salary transparency, and hiring activity to estimate if a job is real.',
      checks: ['Scores from 0 (likely fake) to 100 (likely real)', 'Visual trust ring on every search result', 'Filter by trust level to skip ghost listings'],
    },
    {
      h: 'Apply on the company\'s own site. Always.',
      p: 'Every apply link routes straight to the employer\'s career page. No middlemen, no recruiter spam, no third-party portals.',
      checks: ['Direct links to employer career pages', 'See the hiring company before you click', 'No pay-to-boost or dark patterns'],
    },
    {
      h: 'Track every application in one place.',
      p: 'Know what\'s active, what\'s stalled, and what needs a follow-up. One board that works across every job source.',
      checks: ['Saved, Applied, Interview, Offer stages', 'Weekly reply momentum at a glance', 'Works across all job boards you use'],
    },
  ];

  const TrustMockup = () => (
    <div className="showcase-mockup">
      <div className="mini-bar"><div className="mini-dots"><span></span><span></span><span></span></div></div>
      <div className="mini-body">
        <div className="pv-list">
          {JOBS.slice(0, 3).map(j => (
            <div key={j.id} className="pv-card">
              <div>
                <div className="pv-title">{j.title}</div>
                <div className="pv-meta">{j.company} · {j.location.split(',')[0]}</div>
                <div className="pv-tags"><span>{fmtSalary(j.salaryLow, j.salaryHigh)}</span><span>{j.work}</span></div>
              </div>
              <div className="pv-trust">
                <TrustRing score={j.score} size={30} />
                <div className={`pv-trust-label ${trustTone(j.score)}`}>{trustLabel(j.score)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const ApplyMockup = () => (
    <div className="showcase-mockup">
      <div className="mini-bar"><div className="mini-dots"><span></span><span></span><span></span></div></div>
      <div className="mini-body" style={{ padding: 20 }}>
        {JOBS.slice(4, 7).map((j, i) => (
          <div key={j.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '14px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{j.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{j.company} · {j.location}</div>
            </div>
            <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--orange-500)',
              display: 'flex', alignItems: 'center', gap: 4 }}>
              Apply →
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const TrackerMockup = () => (
    <div className="showcase-mockup">
      <div className="mini-bar"><div className="mini-dots"><span></span><span></span><span></span></div></div>
      <div className="mini-body" style={{ padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
          {[
            { n: 4, l: 'Saved', bg: 'var(--gray-soft)', c: 'var(--gray-text)' },
            { n: 2, l: 'Interviewing', bg: 'var(--score-high-soft)', c: 'var(--score-high)' },
            { n: 6, l: 'Applied', bg: '#e0ecfb', c: '#1e4d94' },
            { n: 1, l: 'Offer', bg: 'var(--orange-soft)', c: 'var(--orange-500)' },
          ].map(s => (
            <div key={s.l} style={{ background: s.bg, borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: 22, color: s.c }}>{s.n}</div>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: s.c, opacity: 0.8, marginTop: 2 }}>{s.l}</div>
            </div>
          ))}
        </div>
        {TRACKER_JOBS.map((j, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 0', borderBottom: i < TRACKER_JOBS.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{j.role}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{j.company}</div>
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
              padding: '3px 10px', borderRadius: 999,
              background: j.stage === 'Interview' ? 'var(--score-high-soft)' : j.stage === 'Applied' ? '#e0ecfb' : j.stage === 'Offer' ? 'var(--orange-500)' : 'var(--gray-soft)',
              color: j.stage === 'Interview' ? 'var(--score-high)' : j.stage === 'Applied' ? '#1e4d94' : j.stage === 'Offer' ? '#fff' : 'var(--gray-text)',
            }}>{j.stage}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const mockups = [<TrustMockup />, <ApplyMockup />, <TrackerMockup />];

  return (
    <section className="showcase reveal">
      <div className="container">
        <div className="section-head">
          <p className="section-kicker">The product</p>
          <h2>Everything you need to search smarter.</h2>
          <p className="section-sub">One platform that aggregates, scores, and connects you directly to real opportunities.</p>
        </div>
        <div className="showcase-tabs">
          {tabs.map((t, i) => (
            <button key={t} className={`showcase-tab ${tab === i ? 'active' : ''}`} onClick={() => setTab(i)}>{t}</button>
          ))}
        </div>
        <div className="showcase-content">
          {panels.map((p, i) => (
            <div key={i} className={`showcase-panel ${tab === i ? 'active' : ''}`}>
              <div className="showcase-panel-grid">
                <div className="showcase-copy">
                  <h3>{p.h}</h3>
                  <p>{p.p}</p>
                  <div className="showcase-checks">
                    {p.checks.map((c, ci) => (
                      <div key={ci} className="showcase-check-item">
                        <span className="showcase-check-icon">✓</span>
                        <span>{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>{mockups[i]}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const FeatureSplit = () => (
  <section className="feature-split reveal">
    <div className="container">
      <div className="feature-split-grid">
        <div className="feature-split-card">
          <p className="card-kicker">Trust scoring</p>
          <h3>Know if a job is real before you apply.</h3>
          <p>Our Listing Trust Score analyzes posting age, repost frequency, salary transparency, and hiring activity. Scores range from 0 to 100.</p>
          <div className="feature-split-visual">
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 32, padding: '20px 0' }}>
              <div style={{ textAlign: 'center' }}>
                <TrustRing score={92} size={72} />
                <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: 'var(--score-high)' }}>High Trust</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Likely real</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <TrustRing score={54} size={72} />
                <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: 'var(--score-mid)' }}>Review Carefully</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Mixed signals</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <TrustRing score={18} size={72} />
                <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: 'var(--score-low)' }}>Low Trust</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Ghost risk</div>
              </div>
            </div>
          </div>
        </div>
        <div className="feature-split-card">
          <p className="card-kicker">Application tracker</p>
          <h3>One board across every job source.</h3>
          <p>Track saved, applied, interview, and offer stages. See weekly reply momentum and know what needs a follow-up.</p>
          <div className="feature-split-visual">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {TRACKER_JOBS.map((j, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: '#fff', borderRadius: 8, padding: '10px 14px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <TrustRing score={j.score} size={24} />
                    <div>
                      <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{j.role}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{j.company} · {j.date}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                    padding: '3px 10px', borderRadius: 999,
                    background: j.stage === 'Interview' ? 'var(--score-high-soft)' : j.stage === 'Applied' ? '#e0ecfb' : j.stage === 'Offer' ? 'var(--orange-500)' : 'var(--gray-soft)',
                    color: j.stage === 'Interview' ? 'var(--score-high)' : j.stage === 'Applied' ? '#1e4d94' : j.stage === 'Offer' ? '#fff' : 'var(--gray-text)',
                  }}>{j.stage}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const StatsBand = () => (
  <section className="stats-band reveal">
    <div className="container">
      <div className="stats-row">
        <div className="stat-block">
          <div className="stat-num">12,000<span className="accent">+</span></div>
          <div className="stat-desc">Listings scanned across major job boards</div>
        </div>
        <div className="stat-block">
          <div className="stat-num">6<span className="accent">+</span></div>
          <div className="stat-desc">Job boards indexed in every single search</div>
        </div>
        <div className="stat-block">
          <div className="stat-num">43<span className="accent">%</span></div>
          <div className="stat-desc">Flagged as low trust or ghost listings</div>
        </div>
      </div>
    </div>
  </section>
);

Object.assign(window, { ProductShowcase, FeatureSplit, StatsBand });
