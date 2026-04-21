// Emploid — Home (Search) page
const HomePage = ({ onNavigate }) => (
  <section className="page active">
    <section className="hero">
      <div className="container hero-grid">
        <div className="hero-copy">
          <h1>
            <span className="hero-line">Find jobs</span>
            <span className="hero-line">that are</span>
            <span className="hero-line hero-squiggle-line"><span className="hero-squiggle-text">actually hiring.</span></span>
          </h1>
          <p className="hero-sub">Over 40% of online job postings are "ghost jobs" — listings for roles that aren't really open. We scan thousands of postings across every major job board to filter out the fakes, so you only spend time on real opportunities.</p>
          <div className="hero-search-stack">
            <div className="hero-search">
              <span className="hero-search-icon"><SearchIcon /></span>
              <input className="input" placeholder="Role, company, or keyword (e.g., Marketing, Target)" />
              <button className="btn btn-primary hero-search-btn" onClick={() => onNavigate('jobs')}>Search</button>
              <div className="hero-upload-wrap"><button className="btn btn-secondary hero-upload-btn">Upload Resume</button></div>
            </div>
          </div>
        </div>
        <div className="hero-preview">
          <div className="browser-window">
            <div className="browser-bar">
              <div className="browser-dots"><span /><span /><span /></div>
              <div className="browser-address">emploid.com/search</div>
            </div>
            <div className="browser-body">
              <div className="preview-header">
                <p className="preview-kicker">Product preview</p>
                <h2>Every result shows a Listing Trust Score before you click apply.</h2>
              </div>
              <div className="preview-list">
                {JOBS.slice(0, 5).map(j => {
                  const tone = j.score >= 70 ? 'tone-high' : j.score >= 40 ? 'tone-mid' : 'tone-low';
                  return (
                    <div key={j.id} className="preview-job-card">
                      <div className="preview-job-main">
                        <h3>{j.title}</h3>
                        <p><span className="preview-card-company">{j.company} · {j.location.split(',')[0]} · <SourceLink source={j.source} /></span></p>
                        <div className="preview-job-meta"><span>{fmtSalary(j.salaryLow, j.salaryHigh)}</span><span>{j.work}</span><span>{j.type}</span></div>
                      </div>
                      <div className="preview-trust">
                        <TrustRing score={j.score} size={30} />
                        <div className={`preview-trust-label ${tone}`}>{trustLabel(j.score)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="stats-strip">
      <div className="container stats-strip-inner">
        <div className="stats-inline">
          <span><strong className="mono">12,000+</strong> listings scanned</span>
          <span className="stats-divider" />
          <span><strong className="mono">6</strong> job boards indexed</span>
          <span className="stats-divider" />
          <span><strong className="mono squiggle-wrap">43%</strong> flagged as low trust</span>
        </div>
      </div>
    </section>

    <section className="process-section">
      <div className="container">
        <div className="section-heading">
          <p className="section-kicker">How it actually works</p>
          <h2>One search, a clearer signal, and a direct path to the employer.</h2>
        </div>
        <div className="process-steps">
          {[
            { n: '01', h: 'We scan everything', p: 'One search covers every major job board and thousands of company career pages. LinkedIn, Indeed, Handshake, Glassdoor, and more.' },
            { n: '02', h: 'We score for trust', p: 'Our Listing Trust Score analyzes posting age, repost frequency, salary transparency, and hiring activity. Scores range from 0 (likely fake) to 100 (likely real).' },
            { n: '03', h: 'You apply directly', p: 'Every apply link routes straight to the employer\'s own website. No middlemen, no redirects, no third-party portals.' },
          ].map(s => (
            <article key={s.n} className="process-step">
              <div className="process-number">{s.n}</div>
              <h3>{s.h}</h3>
              <p>{s.p}</p>
            </article>
          ))}
        </div>
      </div>
    </section>

    <section className="comparison-section">
      <div className="container">
        <div className="section-heading">
          <p className="section-kicker">What you get</p>
          <h2>What you get vs. a normal job board</h2>
        </div>
        <div className="comparison-grid">
          <article className="comparison-column comparison-column-muted">
            <h3>On a typical job board</h3>
            <div className="comparison-list">
              {['Job title and description','Apply through the job board','No idea if the job is real','Salary sometimes listed','No recruiter info','Listings from one source'].map(t => (
                <div key={t} className="comparison-item"><span className="comparison-icon comparison-icon-muted">-</span><span>{t}</span></div>
              ))}
            </div>
          </article>
          <article className="comparison-column comparison-column-strong">
            <h3>On Emploid</h3>
            <div className="comparison-list">
              {['Job title, description, and trust score','Apply directly on the company\'s website','Listing Trust Score flags stale and suspicious listings','Salary shown or estimated from market data','Hiring contact identified when possible','Aggregated from 6+ job boards and career pages'].map(t => (
                <div key={t} className="comparison-item"><span className="comparison-icon comparison-icon-check">✓</span><span>{t}</span></div>
              ))}
            </div>
          </article>
        </div>
      </div>
    </section>
  </section>
);
window.HomePage = HomePage;
