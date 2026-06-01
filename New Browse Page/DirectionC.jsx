// Direction C — "Zen prompt"
// Almost-empty page. One question, one huge search bar, a tight chip row.
// A single stat line at the very bottom edge. Maximum focus.

const ZEN_CHIPS = [
  'Engineering',
  'Design',
  'Operations',
  'Marketing',
  'Finance',
  'Data',
];

const DirectionC = ({ promptCopy = 'What are you looking for?' }) => {
  const [value, setValue] = React.useState('');
  // Pull final word (or last 2 words) for the scribble accent
  const parts = promptCopy.trim().replace(/[?.!]+$/, '').split(' ');
  const tailLen = parts.length >= 4 ? 2 : 1;
  const head = parts.slice(0, parts.length - tailLen).join(' ');
  const tail = parts.slice(parts.length - tailLen).join(' ');
  const punct = (promptCopy.match(/[?.!]+$/) || [''])[0];
  return (
    <div className="browse-page dirC-page" data-screen-label="C · Zen prompt">
      <BPNav />

      <div className="dirC-stage">
        <h2 className="dirC-question">
          {head} <span className="scribble">{tail}{punct}</span>
        </h2>

        <div className="dirC-search">
          <span className="dirC-search-icon"><SearchIcon size={26} strokeWidth={2.4} /></span>
          <input
            type="text"
            placeholder="Role, company, skill, or location"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <button className="dirC-search-btn">
            Search
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="dirC-chips">
          <span className="lbl">or browse by</span>
          {ZEN_CHIPS.map(c => (
            <button key={c} className="dirC-chip">{c}</button>
          ))}
        </div>
      </div>

      <div className="dirC-bottom">
        <span><span className="pulse-mini" /> Live</span>
        <span className="divider" />
        <span><strong>12,840</strong> jobs scanned</span>
        <span className="divider" />
        <span><strong>6</strong> boards indexed</span>
        <span className="divider" />
        <span><strong>43%</strong> flagged as low trust</span>
        <span className="divider" />
        <span>Updated 12s ago</span>
      </div>
    </div>
  );
};

window.DirectionC = DirectionC;
