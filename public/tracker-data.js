// Tracker data
const STAGES = [
  { id: 'saved', label: 'Saved', color: '#8da0b6' },
  { id: 'applied', label: 'Applied', color: '#2164f3' },
  { id: 'interview', label: 'Interview', color: '#1f7a42' },
  { id: 'offer', label: 'Offer', color: '#c85b24' },
  { id: 'rejected', label: 'Rejected', color: '#c4919a' },
];

const COMPANY_TINTS = {
  Stripe: '#635bff',
  Linear: '#5e6ad2',
  Figma: '#f24e1e',
  Notion: '#191919',
  Vercel: '#000000',
  Ramp: '#ffe066',
  Anthropic: '#d97757',
  'Scale AI': '#4d1fc8',
  Databricks: '#ff3621',
  Cloudflare: '#f6821f',
  Plaid: '#111111',
  Airtable: '#fcb400',
  Datadog: '#632ca6',
  Coinbase: '#0052ff',
  Snowflake: '#29b5e8',
};

const initial = [
  { id: 'a1', role: 'Junior Product Designer', company: 'Linear', stage: 'offer', trust: 94, salary: '$110k-$140k', location: 'Remote / US', applied: '2026-03-21', notes: 'Offer verbal. Waiting on written. Manager: Karri Saarinen.', hot: true, listingUrl: '/browse?job=tracker-linear-jpd&q=Junior%20Product%20Designer%20Linear' },
  { id: 'a2', role: 'Associate PM, Growth', company: 'Stripe', stage: 'interview', trust: 91, salary: '$135k-$160k', location: 'SF / Hybrid', applied: '2026-03-28', notes: 'Round 3: onsite loop. Practice Fermi sizing.', listingUrl: '/browse?job=tracker-stripe-growth-pm&q=Associate%20PM%2C%20Growth%20Stripe' },
  { id: 'a3', role: 'Product Analyst', company: 'Ramp', stage: 'interview', trust: 88, salary: '$120k', location: 'NYC', applied: '2026-04-01', notes: 'SQL case. 48h turnaround.', listingUrl: '/browse?job=tracker-ramp-product-analyst&q=Product%20Analyst%20Ramp' },
  { id: 'a4', role: 'Associate Designer', company: 'Figma', stage: 'interview', trust: 86, salary: '$115k-$135k', location: 'SF / Hybrid', applied: '2026-03-25', notes: 'Portfolio review went well. Next: hiring manager.', listingUrl: '/browse?job=tracker-figma-associate-designer&q=Associate%20Designer%20Figma' },
  { id: 'a5', role: 'Jr Frontend Engineer', company: 'Vercel', stage: 'applied', trust: 92, salary: '$125k', location: 'Remote / Global', applied: '2026-04-05', notes: 'Silent 13 days. Sent nudge to recruiter.', stall: true, listingUrl: '/browse?job=tracker-vercel-frontend&q=Jr%20Frontend%20Engineer%20Vercel' },
  { id: 'a6', role: 'Data Scientist, New Grad', company: 'Databricks', stage: 'applied', trust: 81, salary: '$140k', location: 'Mountain View', applied: '2026-04-08', listingUrl: '/browse?job=tracker-databricks-ds&q=Data%20Scientist%2C%20New%20Grad%20Databricks' },
  { id: 'a7', role: 'Product Designer I', company: 'Notion', stage: 'applied', trust: 89, salary: '$120k-$145k', location: 'Remote / US-CA', applied: '2026-04-11', listingUrl: '/browse?job=tracker-notion-product-designer&q=Product%20Designer%20I%20Notion' },
  { id: 'a8', role: 'Software Engineer, Backend', company: 'Plaid', stage: 'applied', trust: 84, salary: '$135k', location: 'NYC / Hybrid', applied: '2026-04-02', listingUrl: '/browse?job=tracker-plaid-backend&q=Software%20Engineer%2C%20Backend%20Plaid' },
  { id: 'a9', role: 'Growth Designer', company: 'Airtable', stage: 'applied', trust: 76, salary: '$115k', location: 'SF', applied: '2026-04-09', listingUrl: '/browse?job=tracker-airtable-growth-designer&q=Growth%20Designer%20Airtable' },
  { id: 'a10', role: 'Associate Product Manager', company: 'Cloudflare', stage: 'saved', trust: 87, salary: '$130k', location: 'Austin / Hybrid', applied: null, notes: 'Ask Priya for referral first.', listingUrl: '/browse?job=tracker-cloudflare-apm&q=Associate%20Product%20Manager%20Cloudflare' },
  { id: 'a11', role: 'Brand Designer, New Grad', company: 'Anthropic', stage: 'saved', trust: 90, salary: '$120k', location: 'SF', applied: null, notes: 'Tailor portfolio: longform editorial.', listingUrl: '/browse?job=tracker-anthropic-brand-designer&q=Brand%20Designer%2C%20New%20Grad%20Anthropic' },
  { id: 'a12', role: 'Data Analyst', company: 'Snowflake', stage: 'saved', trust: 78, salary: '$105k', location: 'Denver', applied: null, listingUrl: '/browse?job=tracker-snowflake-data-analyst&q=Data%20Analyst%20Snowflake' },
  { id: 'a13', role: 'Business Analyst', company: 'Coinbase', stage: 'saved', trust: 66, salary: '$110k', location: 'Remote / US', applied: null, notes: 'Mid trust - reposted 4x. Verify before applying.', listingUrl: '/browse?job=tracker-coinbase-business-analyst&q=Business%20Analyst%20Coinbase' },
  { id: 'a14', role: 'UX Researcher I', company: 'Datadog', stage: 'rejected', trust: 72, salary: '$115k', location: 'NYC', applied: '2026-02-28', notes: 'Rejected after round 2. Thin feedback.', listingUrl: '/browse?job=tracker-datadog-ux-researcher&q=UX%20Researcher%20I%20Datadog' },
  { id: 'a15', role: 'Marketing Analyst', company: 'Scale AI', stage: 'rejected', trust: 60, salary: '$95k', location: 'SF', applied: '2026-02-10', notes: 'No response in 60+ days. Trust score was 60.', listingUrl: '/browse?job=tracker-scale-marketing-analyst&q=Marketing%20Analyst%20Scale%20AI' },
];

window.TRACKER = { STAGES, COMPANY_TINTS, initial };
