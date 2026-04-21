// Emploid — Tracker page
const TRACKED = [
  { id: 1, title: 'Recruiting Coordinator', company: 'Adobe', stage: 'Applied', score: 88, source: 'Handshake', date: 'Apr 12' },
  { id: 2, title: 'Software Engineer', company: 'Stripe', stage: 'Interview', score: 90, source: 'Company Direct', date: 'Apr 10' },
  { id: 3, title: 'Financial Analyst', company: 'Stripe', stage: 'Saved', score: 86, source: 'Company Direct', date: 'Apr 14' },
  { id: 4, title: 'Recruiting Coordinator', company: 'UnitedHealth Group', stage: 'Applied', score: 82, source: 'Indeed', date: 'Apr 08' },
  { id: 5, title: 'Business Operations Manager', company: 'Stripe', stage: 'Offer', score: 74, source: 'Company Direct', date: 'Mar 30' },
  { id: 6, title: 'Customer Success Manager', company: 'Adobe', stage: 'Archived', score: 29, source: 'Handshake', date: 'Apr 02' },
];

const STAGES = ['Saved', 'Applied', 'Interview', 'Offer', 'Archived'];

const TrackerPage = () => {
  const [stage, setStage] = React.useState('All');
  const filtered = stage === 'All' ? TRACKED : TRACKED.filter(t => t.stage === stage);
  const counts = STAGES.reduce((a, s) => ({ ...a, [s]: TRACKED.filter(t => t.stage === s).length }), {});

  return (
    <section className="page active">
      <div className="container tracker-shell">
        <div className="tracker-header">
          <div>
            <p className="section-kicker">Application Tracker</p>
            <h2 className="tracker-title">Everything you've applied to, in one place.</h2>
          </div>
          <button className="btn btn-secondary">Export CSV</button>
        </div>

        <div className="tracker-stats">
          {STAGES.map(s => (
            <button key={s} className={`tracker-stat ${stage === s ? 'active' : ''}`} onClick={() => setStage(s === stage ? 'All' : s)}>
              <div className="tracker-stat-count mono">{counts[s]}</div>
              <div className="tracker-stat-label">{s}</div>
            </button>
          ))}
        </div>

        <table className="tracker-table">
          <thead>
            <tr>
              <th>Role</th>
              <th>Stage</th>
              <th>Trust</th>
              <th>Source</th>
              <th>Applied</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => (
              <tr key={t.id}>
                <td>
                  <div className="tracker-role">{t.title}</div>
                  <div className="tracker-company">{t.company}</div>
                </td>
                <td><span className={`stage-pill stage-${t.stage.toLowerCase()}`}>{t.stage}</span></td>
                <td><TrustRing score={t.score} size={28} /></td>
                <td><SourceLink source={t.source} /></td>
                <td className="mono tracker-date">{t.date}</td>
                <td><button className="btn-icon">•••</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
window.TrackerPage = TrackerPage;
