// Browse-page shared bits — kept minimal. Each direction styles its own search.

const SearchIcon = ({ size = 22, strokeWidth = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7.5" />
    <line x1="20.5" y1="20.5" x2="17" y2="17" />
  </svg>
);

const ArrowRight = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="13 6 19 12 13 18" />
  </svg>
);

const ArrowUpRight = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="7" y1="17" x2="17" y2="7" />
    <polyline points="8 7 17 7 17 16" />
  </svg>
);

const LocationIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const ChevronDown = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const Plus = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const CornerEnter = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="9 10 4 15 9 20" />
    <path d="M20 4v7a4 4 0 0 1-4 4H4" />
  </svg>
);

// ---- Nav (consistent across directions) ----
const BPNav = () => (
  <nav className="bp-nav">
    <a className="bp-nav-logo">
      <img src="ds/assets/logoicon.svg" alt="Emploid" />
      <span className="bp-nav-logo-word">emploid</span>
    </a>
    <div className="bp-nav-links">
      <a className="bp-nav-link">Home</a>
      <a className="bp-nav-link active">Browse Jobs</a>
      <a className="bp-nav-link">Tracker</a>
      <a className="bp-nav-link">About</a>
    </div>
    <div className="bp-nav-auth">
      <button className="bp-nav-login">Log in</button>
      <button className="bp-nav-signup">Sign up</button>
    </div>
  </nav>
);

Object.assign(window, {
  BPNav,
  SearchIcon, ArrowRight, ArrowUpRight, LocationIcon, ChevronDown, Plus, CornerEnter,
});
