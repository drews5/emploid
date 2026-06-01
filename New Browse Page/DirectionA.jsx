// Direction A — "Workspace"
// In-app search workspace. Utility header (Search · live counter) + giant centered
// search + prompt chips + small community-activity rail. No marketing copy.

const PROMPT_CHIPS = [
  'Software Engineer',
  'Product Designer',
  'Remote',
  '$100k+',
  'New grad',
  'Direct apply',
  'Posted this week',
];

const ACTIVITY = [
  { query: 'Software engineer remote',     count: '2,840 live',  age: '4s ago' },
  { query: 'Product designer Minneapolis', count: '38 live',     age: '11s ago' },
  { query: 'Recruiting coordinator',       count: '760 live',    age: '32s ago' },
  { query: 'Data analyst entry-level',     count: '420 live',    age: '1m ago' },
];

const DirectionA = ({ promptCopy = 'What kind of work are you looking for?' }) => {
  const [value, setValue] = React.useState('');
  return (
    <div className="browse-page dirA-page" data-screen-label="A · Workspace">
      <BPNav />

      {/* Utility header — workspace breadcrumb */}
      <div className="dirA-utility">
        <div className="dirA-utility-title">
          <span className="h">Search</span>
          <span className="crumb">emploid.com/browse</span>
        </div>
        <div className="dirA-utility-right">
          <span className="dirA-live-dot">
            <span className="dot" />
            <span className="label">Live</span>
          </span>
          <span className="dirA-divider" />
          <span><strong style={{ color: 'var(--text-primary)' }}>12,840</strong> jobs scanned</span>
          <span className="dirA-divider" />
          <span>Across 6 boards</span>
          <span className="dirA-divider" />
          <span>Updated 12s ago</span>
        </div>
      </div>

      {/* Stage — centered search */}
      <div className="dirA-stage">
        <h2 className="dirA-prompt">{promptCopy}</h2>

        <div className="dirA-search">
          <span className="dirA-search-icon"><SearchIcon size={22} strokeWidth={2.2} /></span>
          <input
            type="text"
            placeholder="Role, company, skill…"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <span className="dirA-search-divider" />
          <span className="dirA-search-loc">
            <LocationIcon size={16} />
            <select defaultValue="Remote-friendly">
              <option>Remote-friendly</option>
              <option>Anywhere</option>
              <option>Minneapolis, MN</option>
              <option>New York, NY</option>
              <option>San Francisco, CA</option>
            </select>
            <ChevronDown size={12} />
          </span>
          <button className="dirA-search-btn">
            Search
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Prompt chips — micro suggestions */}
        <div className="dirA-chips">
          <span className="dirA-chips-label">Try</span>
          {PROMPT_CHIPS.map(c => (
            <button key={c} className="dirA-chip">
              <span className="plus"><Plus size={11} /></span>
              {c}
            </button>
          ))}
        </div>

        {/* Live activity rail */}
        <div className="dirA-activity">
          <div className="dirA-activity-head">
            <span className="label">Searched on Emploid right now</span>
            <span className="live-spec">
              <span className="dirA-live-dot"><span className="dot" /></span>
              real-time
            </span>
          </div>
          <div className="dirA-activity-list">
            {ACTIVITY.map((a, i) => (
              <div key={i} className="dirA-activity-row">
                <div className="text">
                  Someone just searched <span className="query">"{a.query}"</span>
                  <span className="meta"> · {a.count}</span>
                </div>
                <span className="age">{a.age}</span>
                <span className="go"><ArrowUpRight size={14} /></span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

window.DirectionA = DirectionA;
