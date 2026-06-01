// Emploid — Shared primitives
const TrustRing = ({ score = 82, size = 30 }) => {
  const c = 2 * Math.PI * 16;
  const off = c * (1 - score / 100);
  const color = score >= 70 ? '#1f7a42' : score >= 40 ? '#b8611b' : '#b33a3a';
  return (
    <div style={{ position: 'relative', width: size, height: size, flex: 'none' }}>
      <svg viewBox="0 0 36 36" width={size} height={size}>
        <circle cx="18" cy="18" r="16" fill="none" stroke="#d7e0ea" strokeWidth="3" />
        <circle cx="18" cy="18" r="16" fill="none" stroke={color} strokeWidth="3"
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

const SearchIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const SourceLink = ({ source }) => {
  const map = { LinkedIn: '#0a66c2', Indeed: '#2164f3', Handshake: '#ff7043', Glassdoor: '#0caa41', 'Company Direct': '#5d7088' };
  return <span style={{ fontWeight: 700, color: map[source] || '#5d7088' }}>via {source}</span>;
};

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const LinkIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const LayersIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);

const BarChartIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const EyeIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);

const DollarIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);

// Mini job card used in previews
const PreviewJobCard = ({ job }) => {
  const tone = trustTone(job.score);
  return (
    <div className="preview-job-card">
      <div className="preview-job-main">
        <h3>{job.title}</h3>
        <p>{job.company} · {job.location.split(',')[0]} · <SourceLink source={job.source} /></p>
        <div className="preview-job-meta">
          <span>{fmtSalary(job.salaryLow, job.salaryHigh)}</span>
          <span>{job.work}</span>
          <span>{job.type}</span>
        </div>
      </div>
      <div className="preview-trust">
        <TrustRing score={job.score} size={30} />
        <div className={`preview-trust-label ${tone}`}>{trustLabel(job.score)}</div>
      </div>
    </div>
  );
};

Object.assign(window, {
  TrustRing, SearchIcon, SourceLink, CheckIcon, PreviewJobCard,
  ShieldIcon, LinkIcon, LayersIcon, BarChartIcon, EyeIcon, DollarIcon, ArrowRightIcon
});
