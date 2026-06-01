// Emploid v2 — Perks + Comparison + CTA + Footer

const PerksSection = () => {
  const perks = [
    { icon: <ShieldIcon />, color: 'orange', title: 'Ghost job detection', desc: 'Our algorithm flags stale, reposted, and suspicious listings so you skip the fakes.' },
    { icon: <LinkIcon />, color: 'green', title: 'Direct company links', desc: 'Every apply button routes to the employer\'s own career page. No third-party redirects.' },
    { icon: <LayersIcon />, color: 'navy', title: '6+ boards, one search', desc: 'LinkedIn, Indeed, Handshake, Glassdoor, and company career pages in one query.' },
    { icon: <DollarIcon />, color: 'orange', title: 'Salary transparency', desc: 'Salaries shown or estimated from market data. No more guessing what a role pays.' },
    { icon: <EyeIcon />, color: 'green', title: 'Hiring activity signals', desc: 'See if a company is actively hiring, has slowed down, or is repost-heavy.' },
    { icon: <BarChartIcon />, color: 'navy', title: 'Application tracker', desc: 'Track every application across boards. Know what\'s active, stalled, or needs follow-up.' },
  ];
  return (
    <section className="perks reveal">
      <div className="container">
        <div className="section-head" style={{ textAlign: 'center', marginBottom: 48 }}>
          <p className="section-kicker">Why emploid</p>
          <h2 style={{ maxWidth: 520, margin: '0 auto' }}>Built different from every other job board.</h2>
          <p className="section-sub" style={{ maxWidth: 480, margin: '14px auto 0' }}>We don't accept payments to boost listings. We don't sell your data. We built this because job searching shouldn't feel like a part-time job.</p>
        </div>
        <div className="perks-grid">
          {perks.map((p, i) => (
            <div key={i} className="perk-card">
              <div className={`perk-icon ${p.color}`}>{p.icon}</div>
              <h3>{p.title}</h3>
              <p>{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const ComparisonSection = () => {
  const left = [
    'Job title and description',
    'Apply through the job board',
    'No idea if the job is real',
    'Salary sometimes listed',
    'No recruiter info',
    'Listings from one source',
  ];
  const right = [
    'Job title, description, and trust score',
    'Apply directly on the company\'s website',
    'Trust Score flags stale and suspicious listings',
    'Salary shown or estimated from market data',
    'Hiring contact identified when possible',
    'Aggregated from 6+ job boards and career pages',
  ];
  return (
    <section className="comparison reveal">
      <div className="container">
        <div className="section-head" style={{ textAlign: 'center', marginBottom: 48 }}>
          <p className="section-kicker">The difference</p>
          <h2 style={{ maxWidth: 560, margin: '0 auto' }}>What you get vs. a normal job board</h2>
        </div>
        <div className="comp-grid">
          <article className="comp-col muted">
            <h3>On a typical job board</h3>
            <div className="comp-list">
              {left.map(t => (
                <div key={t} className="comp-item">
                  <span className="comp-icon neg">–</span>
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </article>
          <article className="comp-col strong">
            <span className="comp-badge">RECOMMENDED</span>
            <h3>On Emploid</h3>
            <div className="comp-list">
              {right.map(t => (
                <div key={t} className="comp-item">
                  <span className="comp-icon pos">✓</span>
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
};

const CTABand = () => (
  <section className="cta-band">
    <div className="container">
      <h2>Ready to find jobs that are real?</h2>
      <p>Join thousands of job seekers who stopped wasting time on ghost listings and started applying smarter.</p>
      <div className="cta-row">
        <input type="email" placeholder="Enter your email" />
        <button className="btn btn-primary btn-lg">Early Access</button>
      </div>
    </div>
  </section>
);

const SiteFooter = () => (
  <footer className="site-footer">
    <div className="container">
      <div className="footer-grid">
        <div>
          <div className="footer-logo">
            <img src="assets/logoicon.svg" alt="Emploid" />
            <span>emploid</span>
          </div>
          <p className="footer-tagline">Job searching, minus the guesswork.</p>
        </div>
        <div className="footer-col">
          <h5>Platform</h5>
          <a className="footer-link" href="#">Database Query</a>
          <a className="footer-link" href="#">Application Tracker</a>
          <a className="footer-link" href="#">Trust Score Engine</a>
          <a className="footer-link" href="#">Methodology</a>
        </div>
        <div className="footer-col">
          <h5>Legal</h5>
          <a className="footer-link" href="#">Privacy Policy</a>
          <a className="footer-link" href="#">Terms of Service</a>
        </div>
      </div>
      <div className="footer-bottom">
        © 2026 Emploid. Built at the Carlson School of Management.
      </div>
    </div>
  </footer>
);

Object.assign(window, { PerksSection, ComparisonSection, CTABand, SiteFooter });
