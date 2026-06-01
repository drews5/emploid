// Emploid Home — Data + helpers
const JOBS = [
  { id: 1, title: 'Financial Analyst', company: 'Target', location: 'Minneapolis, MN', source: 'LinkedIn',
    salaryLow: 75000, salaryHigh: 90000, work: 'Hybrid', type: 'Full-time', posted: '2d ago', score: 88 },
  { id: 2, title: 'Senior Financial Planning and Strategy Analyst', company: 'Northwestern Mutual', location: 'Minneapolis, MN', source: 'LinkedIn',
    salaryLow: 120000, salaryHigh: 145000, work: 'Remote', type: 'Full-time', posted: '1d ago', score: 91 },
  { id: 3, title: 'Marketing Manager', company: 'Best Buy', location: 'Minneapolis, MN', source: 'Handshake',
    salaryLow: 85000, salaryHigh: 102000, work: 'Hybrid', type: 'Full-time', posted: '5d ago', score: 54 },
  { id: 4, title: 'Operations Coordinator', company: 'Peloton', location: 'New York, NY', source: 'Glassdoor',
    salaryLow: 58000, salaryHigh: 68000, work: 'On-site', type: 'Full-time', posted: '3w ago', score: 22 },
  { id: 5, title: 'Software Engineer', company: 'Google', location: 'Chicago, IL', source: 'Company Direct',
    salaryLow: 135000, salaryHigh: 168000, work: 'Hybrid', type: 'Full-time', posted: '4d ago', score: 85 },
  { id: 6, title: 'Recruiting Coordinator', company: 'Adobe', location: 'San Jose, CA', source: 'Handshake',
    salaryLow: 68000, salaryHigh: 82000, work: 'Hybrid', type: 'Full-time', posted: '1d ago', score: 92 },
  { id: 7, title: 'Data Analyst', company: 'Stripe', location: 'Seattle, WA', source: 'Company Direct',
    salaryLow: 110000, salaryHigh: 140000, work: 'Remote', type: 'Full-time', posted: '3d ago', score: 78 },
  { id: 8, title: 'Product Manager', company: 'Airbnb', location: 'San Francisco, CA', source: 'Indeed',
    salaryLow: 145000, salaryHigh: 185000, work: 'Hybrid', type: 'Full-time', posted: '6d ago', score: 35 },
];

const TRACKER_JOBS = [
  { role: 'UX Designer', company: 'Figma', stage: 'Interview', date: 'May 18', score: 94 },
  { role: 'Product Analyst', company: 'Stripe', stage: 'Applied', date: 'May 15', score: 87 },
  { role: 'Marketing Coord.', company: 'HubSpot', stage: 'Saved', date: 'May 20', score: 76 },
  { role: 'Software Engineer', company: 'Notion', stage: 'Offer', date: 'May 12', score: 91 },
];

const fmtSalary = (a, b) => `$${Math.round(a/1000)}k–$${Math.round(b/1000)}k`;
const trustLabel = (s) => s >= 70 ? 'High Trust' : s >= 40 ? 'Review Carefully' : 'Low Trust';
const trustTone = (s) => s >= 70 ? 'tone-high' : s >= 40 ? 'tone-mid' : 'tone-low';

Object.assign(window, { JOBS, TRACKER_JOBS, fmtSalary, trustLabel, trustTone });
