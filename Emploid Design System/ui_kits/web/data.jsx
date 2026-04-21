// Emploid — Shared data
const JOBS = [
  { id: 1, title: 'Recruiting Coordinator', company: 'Adobe', location: 'Chicago, IL', source: 'Handshake',
    salaryLow: 68000, salaryHigh: 77000, work: 'Hybrid', type: 'Full-time', posted: '2d ago',
    score: 88, tags: ['Direct Company Link', 'Actively Hiring'],
    apply: 'adobe.com/careers' },
  { id: 2, title: 'Recruiting Coordinator', company: 'UnitedHealth Group', location: 'Chicago, IL', source: 'Indeed',
    salaryLow: 66000, salaryHigh: 74000, work: 'On-site', type: 'Full-time', posted: '1d ago',
    score: 82, tags: ['Direct Company Link', 'Actively Hiring'],
    apply: 'unitedhealthgroup.com/careers' },
  { id: 3, title: 'Business Operations Manager', company: 'Stripe', location: 'Seattle, WA', source: 'Company Direct',
    salaryLow: 135000, salaryHigh: 175000, work: 'On-site', type: 'Full-time', posted: '7d ago',
    score: 74, tags: ['Direct Company Link', 'Actively Hiring', 'Reposted'],
    apply: 'stripe.com/careers' },
  { id: 4, title: 'Software Engineer', company: 'Target', location: 'New York, NY', source: 'Glassdoor',
    salaryLow: 128000, salaryHigh: 165000, work: 'Hybrid', type: 'Contract', posted: '14d ago',
    score: 81, tags: ['Direct Company Link', 'Actively Hiring'],
    apply: 'target.com/careers' },
  { id: 5, title: 'Financial Analyst', company: 'Stripe', location: 'Minneapolis, MN', source: 'Company Direct',
    salaryLow: 92000, salaryHigh: 118000, work: 'Hybrid', type: 'Full-time', posted: '3d ago',
    score: 86, tags: ['Direct Company Link', 'Actively Hiring'],
    apply: 'stripe.com/careers' },
  { id: 6, title: 'Frontend Engineer', company: 'UnitedHealth Group', location: 'Chicago, IL', source: 'Glassdoor',
    salaryLow: 115000, salaryHigh: 145000, work: 'On-site', type: 'Contract', posted: '9d ago',
    score: 52, tags: ['Direct Company Link', 'Repost heavy'],
    apply: 'unitedhealthgroup.com/careers' },
  { id: 7, title: 'Software Engineer', company: 'Stripe', location: 'Austin, TX', source: 'Company Direct',
    salaryLow: 125000, salaryHigh: 160000, work: 'Hybrid', type: 'Full-time', posted: '2d ago',
    score: 90, tags: ['Direct Company Link', 'Actively Hiring'],
    apply: 'stripe.com/careers' },
  { id: 8, title: 'Customer Success Manager', company: 'Adobe', location: 'New York, NY', source: 'Handshake',
    salaryLow: 86000, salaryHigh: 96000, work: 'Hybrid', type: 'Full-time', posted: '5d ago',
    score: 29, tags: ['Ghost risk', 'No salary'],
    apply: 'adobe.com/careers' },
];

const fmtSalary = (a, b) => `$${Math.round(a/1000)}k–$${Math.round(b/1000)}k`;

window.JOBS = JOBS;
window.fmtSalary = fmtSalary;
