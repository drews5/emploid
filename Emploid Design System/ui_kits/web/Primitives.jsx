// Emploid UI Kit — shared primitives
// Exports: SignalChip, SourceLink, TrustRing, MetaPill, Kicker, Button, Input, Select, Switch

const TrustRing = ({ score = 82, size = 32 }) => {
  const tone = score >= 70 ? { c: '#1f7a42' } : score >= 40 ? { c: '#b8611b' } : { c: '#b33a3a' };
  const c = 2 * Math.PI * 16;
  const off = c * (1 - score / 100);
  return (
    <div style={{ position: 'relative', width: size, height: size, flex: 'none' }}>
      <svg viewBox="0 0 36 36" width={size} height={size}>
        <circle cx="18" cy="18" r="16" fill="none" stroke="#d7e0ea" strokeWidth="3" />
        <circle cx="18" cy="18" r="16" fill="none" stroke={tone.c} strokeWidth="3"
          strokeDasharray={c} strokeDashoffset={off}
          transform="rotate(-90 18 18)" strokeLinecap="round" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: size <= 32 ? 10 : 14, color: 'var(--text-primary)' }}>
        {score}
      </div>
    </div>
  );
};

const trustLabel = (score) => score >= 70 ? 'High Trust' : score >= 40 ? 'Review Carefully' : 'Low Trust';
const trustToneClass = (score) => score >= 70 ? 'tone-high' : score >= 40 ? 'tone-mid' : 'tone-low';

const SignalChip = ({ tone = 'green', children }) => (
  <span className={`signal-chip ${tone}`}>{children}</span>
);

const SourceLink = ({ source }) => {
  const map = { LinkedIn: '#0a66c2', Indeed: '#2164f3', Handshake: '#ff7043', Glassdoor: '#0caa41', 'Company Direct': '#5d7088' };
  return <span style={{ fontWeight: 700, color: map[source] || '#5d7088' }}>via {source}</span>;
};

const MetaPill = ({ highlight, children }) => (
  <span className={`meta-pill ${highlight ? 'meta-pill-highlight' : ''}`}>{children}</span>
);

const Kicker = ({ children }) => <span className="kicker">{children}</span>;

const Button = ({ variant = 'primary', size, children, onClick, type = 'button', style }) => {
  const cls = `btn btn-${variant} ${size === 'lg' ? 'btn-lg' : ''}`;
  return <button type={type} className={cls} onClick={onClick} style={style}>{children}</button>;
};

const Input = (props) => <input className="input" {...props} />;
const Select = (props) => <select className="select" {...props}>{props.children}</select>;

const Switch = ({ checked, onChange }) => (
  <span className="switch">
    <input type="checkbox" checked={checked} onChange={(e) => onChange?.(e.target.checked)} readOnly={!onChange} />
    <span className="slider" />
  </span>
);

const SearchIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const BookmarkIcon = ({ filled }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

Object.assign(window, { TrustRing, trustLabel, trustToneClass, SignalChip, SourceLink, MetaPill, Kicker, Button, Input, Select, Switch, SearchIcon, BookmarkIcon });
