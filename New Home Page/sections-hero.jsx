// Emploid v2 — Nav + Hero + Source Strip

const NavBar = () => {
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);
  return (
    <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
      <div className="container nav-inner">
        <a className="nav-logo" href="#">
          <img src="assets/logoicon.svg" alt="Emploid" />
          <span className="nav-logo-word">emploid</span>
        </a>
        <div className="nav-links">
          {['Search', 'Browse Jobs', 'Tracker', 'About'].map((t, i) => (
            <a key={t} className={`nav-link ${i === 0 ? 'active' : ''}`}>{t}</a>
          ))}
        </div>
        <div className="nav-right">
          <button className="nav-login">Log in</button>
          <button className="btn btn-primary" style={{ padding: '9px 20px', fontSize: 14 }}>Early Access</button>
        </div>
      </div>
    </nav>
  );
};

const HeroSection = () => (
  <section className="hero">
    <div className="container hero-content">
      <div className="hero-badge">
        <span className="hero-badge-dot"></span>
        Stop applying to ghost jobs
      </div>
      <h1>
        Find jobs that are<br />
        <span className="hero-highlight">actually hiring.</span>
      </h1>
      <p className="hero-sub">
        Over 40% of online job postings are "ghost jobs." Emploid scans 6+ job boards, scores every listing for trust, and routes you straight to the employer.
      </p>
      <div className="hero-actions">
        <button className="btn btn-primary btn-lg">Browse Jobs</button>
        <button className="btn btn-secondary btn-lg">Upload Resume</button>
      </div>
    </div>

    <div className="hero-visual">
      {/* Floating source badges */}
      <div className="hero-float hero-float-1" style={{ fontWeight: 700 }}>LinkedIn</div>
      <div className="hero-float hero-float-2" style={{ fontWeight: 700 }}>Indeed</div>
      <div className="hero-float hero-float-3" style={{ fontWeight: 700 }}>Handshake</div>
      <div className="hero-float hero-float-4" style={{ fontWeight: 700 }}>Glassdoor</div>

      {/* Floating trust badges */}
      <div className="hero-float-trust ft-1">
        <TrustRing score={92} size={32} />
        <div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>High Trust</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Verified listing</div>
        </div>
      </div>
      <div className="hero-float-trust ft-2">
        <TrustRing score={23} size={32} />
        <div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Low Trust</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Ghost risk</div>
        </div>
      </div>

      {/* Main mockup */}
      <div className="hero-mockup">
        <div className="mockup-bar">
          <div className="mockup-dots"><span></span><span></span><span></span></div>
          <div className="mockup-url">emploid.com/search</div>
          <div style={{ width: 80 }}></div>
        </div>
        <div className="mockup-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
            background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: '8px 8px 8px 14px' }}>
            <SearchIcon size={18} />
            <span style={{ flex: 1, fontSize: 14, color: 'var(--text-muted)' }}>Software Engineer, Minneapolis</span>
            <span style={{ background: 'var(--orange-500)', color: '#fff', padding: '7px 16px',
              borderRadius: 'var(--radius-pill)', fontSize: 13, fontWeight: 600 }}>Search</span>
          </div>
          <div className="pv-list">
            {JOBS.slice(0, 4).map(j => (
              <div key={j.id} className="pv-card">
                <div>
                  <div className="pv-title">{j.title}</div>
                  <div className="pv-meta">
                    {j.company} · {j.location.split(',')[0]} · <span style={{ fontWeight: 700, color:
                      j.source === 'LinkedIn' ? 'var(--source-linkedin)' :
                      j.source === 'Indeed' ? 'var(--source-indeed)' :
                      j.source === 'Handshake' ? 'var(--source-handshake)' :
                      j.source === 'Glassdoor' ? 'var(--source-glassdoor)' : 'var(--text-muted)'
                    }}>via {j.source}</span>
                  </div>
                  <div className="pv-tags">
                    <span>{fmtSalary(j.salaryLow, j.salaryHigh)}</span>
                    <span>{j.work}</span>
                    <span>{j.type}</span>
                  </div>
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
    </div>
  </section>
);

const SourceStrip = () => (
  <section className="source-strip reveal">
    <div className="container">
      <p className="source-strip-label">Aggregating listings from</p>
      <div className="source-logos">
        {[
          { name: 'LinkedIn', c: 'var(--source-linkedin)' },
          { name: 'Indeed', c: 'var(--source-indeed)' },
          { name: 'Handshake', c: 'var(--source-handshake)' },
          { name: 'Glassdoor', c: 'var(--source-glassdoor)' },
          { name: 'Company Career Pages', c: 'var(--text-muted)' },
        ].map(s => (
          <span key={s.name} className="source-pill" style={{ color: s.c }}>{s.name}</span>
        ))}
      </div>
    </div>
  </section>
);

Object.assign(window, { NavBar, HeroSection, SourceStrip });
