// Tracker data
const STAGES = [
  { id: 'saved', label: 'Saved', color: '#8da0b6' },
  { id: 'applied', label: 'Applied', color: '#2164f3' },
  { id: 'interview', label: 'Interview', color: '#1f7a42' },
  { id: 'offer', label: 'Offer', color: '#c85b24' },
  { id: 'archived', label: 'Archived', color: '#c4919a' },
];

const COMPANY_TINTS = {
  'Stripe': '#635bff', 'Linear': '#5e6ad2', 'Figma': '#f24e1e', 'Notion': '#191919',
  'Vercel': '#000000', 'Ramp': '#ffe066', 'Anthropic': '#d97757', 'Scale AI': '#4d1fc8',
  'Databricks': '#ff3621', 'Cloudflare': '#f6821f', 'Plaid': '#111111', 'Airtable': '#fcb400',
  'Datadog': '#632ca6', 'Coinbase': '#0052ff', 'Snowflake': '#29b5e8',
};

const initial = [
  { id:'a1', role:'Junior Product Designer', company:'Linear', stage:'offer',  trust:94, salary:'$110k–$140k', location:'Remote · US', applied:'2026-03-21', next:{label:'Sign by Apr 22', due:'2026-04-22', state:'soon'}, notes:'Offer verbal. Waiting on written. Manager: Karri Saarinen.', hot:true },
  { id:'a2', role:'Associate PM, Growth',    company:'Stripe',  stage:'interview', trust:91, salary:'$135k–$160k', location:'SF · Hybrid', applied:'2026-03-28', next:{label:'Onsite Apr 19', due:'2026-04-19', state:'soon'}, notes:'Round 3: onsite loop. Practice Fermi sizing.' },
  { id:'a3', role:'Product Analyst',         company:'Ramp',    stage:'interview', trust:88, salary:'$120k', location:'NYC', applied:'2026-04-01', next:{label:'Case study Apr 20', due:'2026-04-20', state:'soon'}, notes:'SQL case. 48h turnaround.' },
  { id:'a4', role:'Associate Designer',      company:'Figma',   stage:'interview', trust:86, salary:'$115k–$135k', location:'SF · Hybrid', applied:'2026-03-25', next:{label:'Recruiter call Apr 21', due:'2026-04-21', state:'soon'}, notes:'Portfolio review went well. Next: hiring manager.' },
  { id:'a5', role:'Jr Frontend Engineer',    company:'Vercel',  stage:'applied', trust:92, salary:'$125k', location:'Remote · Global', applied:'2026-04-05', next:{label:'Follow up Apr 19', due:'2026-04-19', state:'overdue'}, notes:'Silent 13 days. Sent nudge to recruiter.', stall:true },
  { id:'a6', role:'Data Scientist, New Grad',company:'Databricks',stage:'applied', trust:81, salary:'$140k', location:'Mountain View', applied:'2026-04-08', next:{label:'Wait · assessment link', due:'2026-04-25', state:'normal'} },
  { id:'a7', role:'Product Designer I',      company:'Notion',  stage:'applied', trust:89, salary:'$120k–$145k', location:'Remote · US/CA', applied:'2026-04-11', next:{label:'Follow up Apr 22', due:'2026-04-22', state:'normal'} },
  { id:'a8', role:'Software Engineer, Bkend',company:'Plaid',   stage:'applied', trust:84, salary:'$135k', location:'NYC · Hybrid', applied:'2026-04-02', next:{label:'Refer check overdue', due:'2026-04-16', state:'overdue'}, stall:true },
  { id:'a9', role:'Growth Designer',         company:'Airtable',stage:'applied', trust:76, salary:'$115k', location:'SF', applied:'2026-04-09', next:{label:'Follow up Apr 23', due:'2026-04-23', state:'normal'} },
  { id:'a10', role:'Associate Product Mgr',  company:'Cloudflare',stage:'saved', trust:87, salary:'$130k', location:'Austin · Hybrid', applied:null, next:{label:'Apply by Apr 20', due:'2026-04-20', state:'soon'}, notes:'Ask Priya for referral first.' },
  { id:'a11', role:'Brand Designer, New Grad',company:'Anthropic',stage:'saved', trust:90, salary:'$120k', location:'SF', applied:null, next:{label:'Apply this week', due:'2026-04-22', state:'normal'}, notes:'Tailor portfolio: longform editorial.' },
  { id:'a12', role:'Data Analyst',           company:'Snowflake',stage:'saved', trust:78, salary:'$105k', location:'Denver', applied:null, next:{label:'Decide by Apr 25', due:'2026-04-25', state:'normal'} },
  { id:'a13', role:'Business Analyst',       company:'Coinbase', stage:'saved', trust:66, salary:'$110k', location:'Remote · US', applied:null, next:{label:'Check trust score', due:null, state:'normal'}, notes:'Mid trust — reposted 4x. Verify before applying.' },
  { id:'a14', role:'UX Researcher I',        company:'Datadog',  stage:'archived', trust:72, salary:'$115k', location:'NYC', applied:'2026-02-28', next:{label:'Closed', due:null, state:'normal'}, notes:'Rejected after round 2. Thin feedback.' },
  { id:'a15', role:'Marketing Analyst',      company:'Scale AI', stage:'archived', trust:60, salary:'$95k', location:'SF', applied:'2026-02-10', next:{label:'Ghosted', due:null, state:'normal'}, notes:'No response in 60+ days. Trust score was 60.' },
];

// Throughput sparklines (last 8 weeks)
const SPARKS = {
  saved:    [2,3,4,2,5,3,4,4],
  applied:  [1,2,3,2,4,3,5,5],
  interview:[0,0,1,1,2,2,3,3],
  offer:    [0,0,0,0,0,1,1,1],
  archived: [1,1,2,2,1,2,1,2],
};

window.TRACKER = { STAGES, COMPANY_TINTS, initial, SPARKS };
