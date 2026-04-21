// Emploid — Nav + Footer
const Nav = ({ page, onNavigate }) => {
  const tabs = [
    { id: 'home', label: 'Search' },
    { id: 'jobs', label: 'Browse Jobs' },
    { id: 'tracker', label: 'Tracker' },
    { id: 'about', label: 'About' },
  ];
  return (
    <nav className="nav" id="main-nav">
      <div className="container nav-inner">
        <a className="nav-logo" onClick={() => onNavigate('home')}>
          <img src="../../assets/logoicon.svg" alt="Emploid" />
          <span className="nav-logo-word">emploid</span>
        </a>
        <div className="nav-links">
          {tabs.map(t => (
            <a key={t.id} className={`nav-link ${page === t.id ? 'active' : ''}`} onClick={() => onNavigate(t.id)}>{t.label}</a>
          ))}
        </div>
        <div className="nav-auth">
          <button className="nav-login" type="button">Log in</button>
          <button className="btn btn-secondary" type="button">Early Access</button>
        </div>
      </div>
    </nav>
  );
};

const Footer = ({ onNavigate }) => (
  <footer>
    <div className="container footer-inner">
      <div className="footer-grid">
        <div>
          <div className="footer-brand-logo">
            <img src="../../assets/logoicon.svg" alt="Emploid" />
            <span className="footer-brand-word">emploid</span>
          </div>
          <p className="footer-brand-desc">Job searching, minus the guesswork.</p>
        </div>
        <div className="footer-col">
          <h5>Platform Utilities</h5>
          <span className="footer-link" onClick={() => onNavigate('jobs')}>Database Query</span>
          <span className="footer-link" onClick={() => onNavigate('tracker')}>Application Tracker</span>
          <span className="footer-link" onClick={() => onNavigate('home')}>Listing Trust Score Engine</span>
          <span className="footer-link" onClick={() => onNavigate('about')}>Methodology</span>
        </div>
        <div className="footer-col">
          <h5>Legal</h5>
          <span className="footer-link">Privacy Policy</span>
          <span className="footer-link">Terms of Service</span>
        </div>
      </div>
      <div className="footer-bottom">© 2026 Emploid. Built at the Carlson School of Management.</div>
    </div>
  </footer>
);

Object.assign(window, { Nav, Footer });
