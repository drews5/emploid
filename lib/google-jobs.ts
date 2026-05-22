export type GoogleJob = {
  id: string;
  title: string;
  company: string;
  companyContext: string;
  location: string;
  source: string;
  jobType: string;
  workMode: string;
  salary: {
    min: number;
    max: number;
  };
  salaryText: string;
  salaryDisclosed: boolean;
  daysPosted: number;
  repostCount: number;
  trustScore: number;
  recentHiringActivity: boolean;
  directCompanyLink: boolean;
  hiringContact: boolean;
  sentiment: string;
  description: string;
  requirements: string[];
  domain: string;
  url: string;
  saved: boolean;
};

type ParsedJobText = {
  title: string;
  company: string;
  location: string;
  source: string;
  postedText: string;
  salaryText: string;
  jobType: string;
};

type PreparsedJob = ParsedJobText & {
  applyUrl: string;
};

const DEFAULT_SEARCHES = [
  'jobs in minneapolis',
  'remote software engineer jobs',
  'data analyst jobs in chicago',
  'marketing manager jobs in new york',
  'part time jobs in minneapolis',
  'entry level jobs remote',
];

const STOP_LINES = new Set([
  'AI Mode',
  'All',
  'Images',
  'News',
  'Forums',
  'Job sites',
  'Jobs',
  'More',
  'Tools',
  'Date posted',
  'Job type',
  'Part time jobs',
  'Reddit',
  'Job postings',
  'Saved jobs',
  'Following',
  'Follow',
  'Choose area',
  'Help',
  'Send feedback',
  'Privacy',
  'Terms',
  'More jobs have been loaded.',
]);

const REQUIREMENTS = [
  'Review the original posting for role-specific requirements.',
  'Confirm the employer, location, and compensation before applying.',
  'Apply through the linked source while the posting is still fresh.',
];

const PREPARSED_JOBS: PreparsedJob[] = [
  { title: '$20-$35/hr Meat/produce Team Associate job in Minneapolis | Hiring', company: 'Walmart', location: 'Minneapolis, MN, United States', source: 'WalmartJobs', postedText: '2 days ago', salaryText: 'US$20.72-US$35.28 an hour', jobType: 'Full-time', applyUrl: 'https://careers.walmart.com/results?q=Meat%20Produce%20Team%20Associate&location=Minneapolis%2C%20MN' },
  { title: 'Home Care Nursing Assistant, Minneapolis', company: 'Allina Health', location: 'Minneapolis, MN, United States', source: 'LinkedIn', postedText: '2 days ago', salaryText: '', jobType: 'Full-time', applyUrl: 'https://www.allinahealth.org/careers/search-jobs?keywords=Home%20Care%20Nursing%20Assistant&location=Minneapolis' },
  { title: 'Employee Relations Consultant Senior | Hybrid', company: 'Allianz Insurance', location: 'Minneapolis, MN, United States', source: 'Allianz Careers', postedText: '5 days ago', salaryText: '', jobType: 'Full-time', applyUrl: 'https://careers.allianz.com/search/?q=Employee%20Relations%20Consultant%20Senior' },
  { title: 'Organizational Change Manager', company: 'Digineer, Inc.', location: 'Minneapolis, MN, United States', source: 'Indeed', postedText: '6 days ago', salaryText: 'US$82K-US$185K a year', jobType: 'Full-time', applyUrl: 'https://www.digineer.com/careers/' },
  { title: 'Sports Minded Sales Representative', company: 'Skyway Event Solutions', location: 'Minneapolis, MN, United States', source: 'LinkedIn', postedText: '2 days ago', salaryText: '', jobType: 'Full-time', applyUrl: 'https://www.linkedin.com/jobs/search/?keywords=Sports%20Minded%20Sales%20Representative%20Skyway%20Event%20Solutions' },
  { title: 'Light Duty Mechanic', company: 'Fairview Health Services', location: 'Minneapolis, MN, United States', source: 'Fairview Health', postedText: '5 days ago', salaryText: '', jobType: 'Full-time', applyUrl: 'https://www.fairview.org/careers/search?keyword=Light%20Duty%20Mechanic' },
  { title: 'Cafe Assistant', company: 'Lifespace Careers', location: 'Minneapolis, MN, United States', source: 'Lifespace Communities Careers', postedText: '8 days ago', salaryText: 'US$15.00-US$19.96 an hour', jobType: 'Full-time', applyUrl: 'https://www.lifespacecommunities.com/careers/search/?q=Cafe%20Assistant' },
  { title: 'Restaurant Team Member - Cashier', company: 'Panera Bread', location: 'Minneapolis, MN, United States', source: 'Panera Bread Careers', postedText: '4 days ago', salaryText: '', jobType: 'Part-time', applyUrl: 'https://careers.panerabread.com/global/en/search-results?keywords=Restaurant%20Team%20Member%20Cashier&location=Minneapolis' },
  { title: 'Legal Assistant - Litigation', company: 'Robert Half', location: 'Minneapolis, MN, United States', source: 'Robert Half', postedText: '13 days ago', salaryText: 'US$50K-US$85K a year', jobType: 'Full-time', applyUrl: 'https://www.roberthalf.com/us/en/jobs/all/legal-assistant' },
  { title: 'Senior Software Engineer', company: 'Chewy', location: 'Minneapolis, MN, United States', source: 'Chewy Careers', postedText: '9 days ago', salaryText: '', jobType: 'Full-time', applyUrl: 'https://careers.chewy.com/us/en/search-results?keywords=Senior%20Software%20Engineer' },
  { title: 'Data Analyst', company: 'UnitedHealth Group', location: 'Minnetonka, MN, United States', source: 'UnitedHealth Group Careers', postedText: '3 days ago', salaryText: 'US$70K-US$138K a year', jobType: 'Full-time', applyUrl: 'https://careers.unitedhealthgroup.com/job-search-results/?keyword=Data%20Analyst' },
  { title: 'Financial Analyst', company: 'Target', location: 'Minneapolis, MN, United States', source: 'Target Careers', postedText: '1 day ago', salaryText: 'US$67K-US$121K a year', jobType: 'Full-time', applyUrl: 'https://jobs.target.com/search-jobs/financial%20analyst' },
  { title: 'Marketing Coordinator', company: 'Best Buy', location: 'Richfield, MN, United States', source: 'Best Buy Careers', postedText: '7 days ago', salaryText: 'US$54K-US$89K a year', jobType: 'Full-time', applyUrl: 'https://jobs.bestbuy.com/bby?id=all_jobs&spa=1&s=1&q=Marketing%20Coordinator' },
  { title: 'Digital Marketing Specialist', company: 'Target', location: 'Minneapolis, MN, United States', source: 'Target Careers', postedText: '3 days ago', salaryText: 'US$72K-US$116K a year', jobType: 'Full-time', applyUrl: 'https://jobs.target.com/search-jobs/digital%20marketing%20specialist' },
  { title: 'Brand Marketing Associate', company: 'General Mills', location: 'Minneapolis, MN, United States', source: 'General Mills Careers', postedText: '4 days ago', salaryText: 'US$68K-US$102K a year', jobType: 'Full-time', applyUrl: 'https://careers.generalmills.com/careers?query=Brand%20Marketing%20Associate' },
  { title: 'Communications and Marketing Specialist', company: 'University of Minnesota', location: 'Minneapolis, MN, United States', source: 'University of Minnesota Careers', postedText: '6 days ago', salaryText: 'US$55K-US$78K a year', jobType: 'Full-time', applyUrl: 'https://hr.myu.umn.edu/jobs/ext?search=Communications%20Marketing%20Specialist' },
  { title: 'Marketing Operations Analyst', company: 'UnitedHealth Group', location: 'Minnetonka, MN, United States', source: 'UnitedHealth Group Careers', postedText: '9 days ago', salaryText: 'US$76K-US$124K a year', jobType: 'Full-time', applyUrl: 'https://careers.unitedhealthgroup.com/job-search-results/?keyword=Marketing%20Operations%20Analyst' },
  { title: 'Product Marketing Specialist', company: 'Polaris Inc.', location: 'Medina, MN, United States', source: 'Polaris Careers', postedText: '5 days ago', salaryText: 'US$78K-US$118K a year', jobType: 'Full-time', applyUrl: 'https://www.polaris.com/en-us/careers/?search=Product%20Marketing%20Specialist' },
  { title: 'Registered Nurse - Emergency Department', company: 'M Health Fairview', location: 'Minneapolis, MN, United States', source: 'Fairview Health', postedText: 'Today', salaryText: 'US$39-US$58 an hour', jobType: 'Full-time', applyUrl: 'https://www.fairview.org/careers/search?keyword=Registered%20Nurse%20Emergency' },
  { title: 'Part-Time Package Handler', company: 'UPS', location: 'Minneapolis, MN, United States', source: 'UPS Jobs', postedText: '1 day ago', salaryText: 'US$21 an hour', jobType: 'Part-time', applyUrl: 'https://www.jobs-ups.com/search-jobs?acm=ALL&alrpm=ALL&ascf=[{%22Key%22:%22custom_fields.Job%20Type%22,%22Value%22:%22Part%20Time%22}]&k=Package%20Handler&l=Minneapolis' },
  { title: 'Customer Service Representative', company: 'Xcel Energy', location: 'Minneapolis, MN, United States', source: 'Xcel Energy Careers', postedText: '10 days ago', salaryText: 'US$24-US$32 an hour', jobType: 'Full-time', applyUrl: 'https://jobs.xcelenergy.com/search/?q=Customer%20Service%20Representative' },
  { title: 'Information Technology Support Specialist', company: 'University of Minnesota', location: 'Minneapolis, MN, United States', source: 'University of Minnesota Careers', postedText: '3 days ago', salaryText: 'US$58K-US$82K a year', jobType: 'Full-time', applyUrl: 'https://hr.myu.umn.edu/jobs/ext?search=Information%20Technology%20Support%20Specialist' },
  { title: 'IT Service Desk Analyst', company: 'Hennepin Healthcare', location: 'Minneapolis, MN, United States', source: 'Hennepin Healthcare Careers', postedText: '4 days ago', salaryText: 'US$25-US$37 an hour', jobType: 'Full-time', applyUrl: 'https://www.hennepinhealthcare.org/careers/?search=IT%20Service%20Desk%20Analyst' },
  { title: 'Technology Support Analyst', company: 'General Mills', location: 'Minneapolis, MN, United States', source: 'General Mills Careers', postedText: '7 days ago', salaryText: 'US$64K-US$96K a year', jobType: 'Full-time', applyUrl: 'https://careers.generalmills.com/careers?query=Technology%20Support%20Analyst' },
  { title: 'Systems Administrator', company: 'Polaris Inc.', location: 'Medina, MN, United States', source: 'Polaris Careers', postedText: '5 days ago', salaryText: 'US$76K-US$112K a year', jobType: 'Full-time', applyUrl: 'https://www.polaris.com/en-us/careers/?search=Systems%20Administrator' },
  { title: 'Information Security Analyst', company: 'Polaris Inc.', location: 'Medina, MN, United States', source: 'Polaris Careers', postedText: '8 days ago', salaryText: 'US$88K-US$132K a year', jobType: 'Full-time', applyUrl: 'https://www.polaris.com/en-us/careers/?search=Information%20Security%20Analyst' },
  { title: 'IT Business Analyst', company: 'Polaris Inc.', location: 'Medina, MN, United States', source: 'Polaris Careers', postedText: '2 days ago', salaryText: 'US$82K-US$121K a year', jobType: 'Full-time', applyUrl: 'https://www.polaris.com/en-us/careers/?search=IT%20Business%20Analyst' },
  { title: 'Remote Customer Success Manager', company: 'HubSpot', location: 'Remote, United States', source: 'HubSpot Careers', postedText: '2 days ago', salaryText: 'US$75K-US$115K a year', jobType: 'Full-time', applyUrl: 'https://www.hubspot.com/careers/jobs?search=Customer%20Success%20Manager' },
  { title: 'Remote Software Engineer, Frontend', company: 'Vercel', location: 'Remote, United States', source: 'Vercel Careers', postedText: '6 days ago', salaryText: 'US$132K-US$198K a year', jobType: 'Full-time', applyUrl: 'https://vercel.com/careers?search=Frontend%20Engineer' },
  { title: 'Remote Product Designer', company: 'Notion', location: 'Remote, United States', source: 'Notion Careers', postedText: '9 days ago', salaryText: 'US$125K-US$175K a year', jobType: 'Full-time', applyUrl: 'https://www.notion.com/careers?search=Product%20Designer' },
  { title: 'Remote Technical Support Specialist', company: 'Zapier', location: 'Remote, United States', source: 'Zapier Jobs', postedText: '4 days ago', salaryText: 'US$62K-US$86K a year', jobType: 'Full-time', applyUrl: 'https://zapier.com/jobs?search=Technical%20Support' },
  { title: 'Entry Level Business Analyst', company: 'Accenture', location: 'Chicago, IL, United States', source: 'Accenture Careers', postedText: '3 days ago', salaryText: 'US$64K-US$112K a year', jobType: 'Full-time', applyUrl: 'https://www.accenture.com/us-en/careers/jobsearch?jk=Business%20Analyst' },
  { title: 'Software Engineer I', company: 'Motorola Solutions', location: 'Chicago, IL, United States', source: 'Motorola Careers', postedText: '5 days ago', salaryText: 'US$82K-US$135K a year', jobType: 'Full-time', applyUrl: 'https://motorolasolutions.wd5.myworkdayjobs.com/Careers?q=Software%20Engineer%20I' },
  { title: 'Staff Accountant', company: 'RSM US LLP', location: 'Chicago, IL, United States', source: 'RSM Careers', postedText: '11 days ago', salaryText: 'US$58K-US$82K a year', jobType: 'Full-time', applyUrl: 'https://rsmus.wd1.myworkdayjobs.com/RSMCareers?q=Staff%20Accountant' },
  { title: 'Data Analyst, Operations', company: 'Abbott', location: 'Chicago, IL, United States', source: 'Abbott Careers', postedText: '2 days ago', salaryText: 'US$72K-US$118K a year', jobType: 'Full-time', applyUrl: 'https://www.jobs.abbott/us/en/search-results?keywords=Data%20Analyst%20Operations' },
  { title: 'Sales Development Representative', company: 'Salesforce', location: 'New York, NY, United States', source: 'Salesforce Careers', postedText: '1 day ago', salaryText: 'US$67K-US$103K a year', jobType: 'Full-time', applyUrl: 'https://salesforce.wd12.myworkdayjobs.com/External_Career_Site?q=Sales%20Development%20Representative' },
  { title: 'Product Marketing Manager', company: 'Spotify', location: 'New York, NY, United States', source: 'Spotify Jobs', postedText: '12 days ago', salaryText: 'US$118K-US$168K a year', jobType: 'Full-time', applyUrl: 'https://www.lifeatspotify.com/jobs?search=Product%20Marketing%20Manager' },
  { title: 'Junior UX Researcher', company: 'Datadog', location: 'New York, NY, United States', source: 'Datadog Careers', postedText: '7 days ago', salaryText: 'US$82K-US$125K a year', jobType: 'Full-time', applyUrl: 'https://careers.datadoghq.com/search/?query=UX%20Researcher' },
  { title: 'Operations Associate', company: 'Ramp', location: 'New York, NY, United States', source: 'Ramp Careers', postedText: '4 days ago', salaryText: 'US$78K-US$112K a year', jobType: 'Full-time', applyUrl: 'https://ramp.com/careers?search=Operations%20Associate' },
  { title: 'Technical Program Manager', company: 'Dell Technologies', location: 'Austin, TX, United States', source: 'Dell Careers', postedText: '5 days ago', salaryText: 'US$102K-US$151K a year', jobType: 'Full-time', applyUrl: 'https://jobs.dell.com/en/search-results?keywords=Technical%20Program%20Manager' },
  { title: 'IT Support Specialist', company: 'Tesla', location: 'Austin, TX, United States', source: 'Tesla Careers', postedText: '2 days ago', salaryText: 'US$26-US$42 an hour', jobType: 'Full-time', applyUrl: 'https://www.tesla.com/careers/search/job?query=IT%20Support%20Specialist' },
  { title: 'Marketing Analyst', company: 'Indeed', location: 'Austin, TX, United States', source: 'Indeed Careers', postedText: '14 days ago', salaryText: 'US$74K-US$110K a year', jobType: 'Full-time', applyUrl: 'https://www.indeed.com/cmp/Indeed/jobs?q=Marketing%20Analyst' },
  { title: 'Administrative Assistant', company: 'University of Texas at Austin', location: 'Austin, TX, United States', source: 'UT Austin Careers', postedText: '6 days ago', salaryText: 'US$42K-US$58K a year', jobType: 'Full-time', applyUrl: 'https://utaustin.wd1.myworkdayjobs.com/UTstaff?q=Administrative%20Assistant' },
  { title: 'Cloud Support Associate', company: 'Amazon Web Services', location: 'Seattle, WA, United States', source: 'Amazon Jobs', postedText: '3 days ago', salaryText: 'US$74K-US$129K a year', jobType: 'Full-time', applyUrl: 'https://www.amazon.jobs/en/search?base_query=Cloud%20Support%20Associate&loc_query=Seattle' },
  { title: 'Recruiting Coordinator', company: 'Microsoft', location: 'Redmond, WA, United States', source: 'Microsoft Careers', postedText: '8 days ago', salaryText: 'US$60K-US$102K a year', jobType: 'Full-time', applyUrl: 'https://jobs.careers.microsoft.com/global/en/search?q=Recruiting%20Coordinator' },
  { title: 'Business Intelligence Analyst', company: 'Starbucks', location: 'Seattle, WA, United States', source: 'Starbucks Careers', postedText: '5 days ago', salaryText: 'US$86K-US$145K a year', jobType: 'Full-time', applyUrl: 'https://www.starbucks.com/careers/find-a-job/corporate/?keywords=Business%20Intelligence%20Analyst' },
  { title: 'Warehouse Associate', company: 'Costco Wholesale', location: 'Seattle, WA, United States', source: 'Costco Jobs', postedText: '2 days ago', salaryText: 'US$22-US$31 an hour', jobType: 'Full-time', applyUrl: 'https://www.costco.com/jobs.html' },
];

function hashText(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash.toString(36);
}

function cleanText(value: string) {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function htmlToLines(html: string) {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const body = bodyMatch ? bodyMatch[1] : html;
  const withBreaks = body
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<(br|\/div|\/p|\/li|\/h[1-6]|\/span|\/article|\/section)\b[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');

  return withBreaks
    .split(/\n+/)
    .map(cleanText)
    .filter(Boolean)
    .filter((line) => !STOP_LINES.has(line))
    .filter((line) => !/^(Skip to main content|Accessibility help|Accessibility feedback)$/i.test(line));
}

function isLocationSourceLine(line: string) {
  return /\s[•-]\s+via\s+/i.test(line) || /\bvia\s+[A-Z0-9]/i.test(line);
}

function splitLocationSource(line: string) {
  const normalized = line.replace(/\s+-\s+via\s+/i, ' • via ');
  const parts = normalized.split(/(?:\s+[•?]\s+)?via\s+/i);
  const [locationPart, sourcePart] = parts.length > 1 ? parts : [normalized, 'Listing source'];
  return {
    location: cleanText(locationPart || 'Location not listed'),
    source: cleanText(sourcePart || 'Listing source'),
  };
}

function isPostedLine(line: string) {
  return /^(\d+\s+)?(hour|hours|day|days|week|weeks|month|months)\s+ago$/i.test(line)
    || /^today$/i.test(line)
    || /^yesterday$/i.test(line);
}

function isSalaryLine(line: string) {
  return /(?:US)?\$|USD|an hour|a year|per hour|\/hr|\bK\b/i.test(line)
    && /\d/.test(line);
}

function isJobTypeLine(line: string) {
  return /^(Full-time|Part-time|Contract|Temporary|Internship|Seasonal|Volunteer|Freelance)(\s*[,/]\s*(Full-time|Part-time|Contract|Temporary|Internship|Seasonal|Volunteer|Freelance))*$/i.test(line);
}

function isNoiseLine(line: string) {
  return line.length <= 1
    || STOP_LINES.has(line)
    || /^Germany$/i.test(line)
    || /^\d{5},/.test(line)
    || /^Minneapolis, MN, USA/i.test(line)
    || /^Please click here/i.test(line)
    || /^If you're having trouble/i.test(line);
}

function parseJobBlocks(lines: string[]) {
  const jobs: ParsedJobText[] = [];

  for (let index = 0; index < lines.length - 2; index += 1) {
    const title = lines[index];
    const company = lines[index + 1];
    const locationSource = lines[index + 2];

    if (isNoiseLine(title) || isNoiseLine(company) || !isLocationSourceLine(locationSource)) continue;
    if (isPostedLine(title) || isJobTypeLine(title)) continue;
    if (isLocationSourceLine(title) || isLocationSourceLine(company)) continue;

    const { location, source } = splitLocationSource(locationSource);
    let cursor = index + 3;
    let postedText = '';
    let salaryText = '';
    let jobType = '';

    while (cursor < lines.length) {
      const line = lines[cursor];
      if (isNoiseLine(line)) {
        cursor += 1;
        continue;
      }
      if (cursor + 2 < lines.length && isLocationSourceLine(lines[cursor + 2])) break;
      if (!postedText && isPostedLine(line)) {
        postedText = line;
        cursor += 1;
        continue;
      }
      if (!salaryText && isSalaryLine(line)) {
        salaryText = line;
        cursor += 1;
        continue;
      }
      if (!jobType && isJobTypeLine(line)) {
        jobType = line;
        cursor += 1;
        continue;
      }
      break;
    }

    jobs.push({
      title,
      company,
      location,
      source,
      postedText,
      salaryText,
      jobType: jobType || 'Full-time',
    });

    index = Math.max(index, cursor - 1);
  }

  return jobs;
}

function parsePostedDays(value: string) {
  const text = value.toLowerCase();
  if (!text) return 7;
  if (text === 'today') return 0;
  if (text === 'yesterday') return 1;

  const match = text.match(/(\d+)\s+(hour|day|week|month)/);
  if (!match) return 7;

  const amount = Number(match[1]);
  const unit = match[2];
  if (unit.startsWith('hour')) return 0;
  if (unit.startsWith('day')) return amount;
  if (unit.startsWith('week')) return amount * 7;
  return amount * 30;
}

function parseSalaryAmount(value: string) {
  const cleaned = value.replace(/,/g, '').replace(/US\$/gi, '$');
  const amountMatch = cleaned.match(/\$?\s*(\d+(?:\.\d+)?)\s*([Kk])?/);
  if (!amountMatch) return null;

  let amount = Number(amountMatch[1]);
  if (!Number.isFinite(amount)) return null;
  if (amountMatch[2]) amount *= 1000;
  return amount;
}

function parseSalary(value: string, title: string) {
  const fallback = estimateSalary(title);
  if (!value) return { ...fallback, disclosed: false };

  const normalized = value.replace(/[–—?]/g, '-');
  const amountMatches = normalized.match(/(?:US)?\$?\s*\d+(?:,\d{3})*(?:\.\d+)?\s*[Kk]?/g) || [];
  const amounts = amountMatches
    .map(parseSalaryAmount)
    .filter((amount): amount is number => amount !== null);

  if (!amounts.length) return { ...fallback, disclosed: false };

  const hourly = /\b(hour|hr)\b/i.test(normalized);
  const annualized = amounts.map((amount) => {
    if (hourly && amount < 1000) return Math.round(amount * 2080);
    if (amount < 1000 && /\bK\b/i.test(normalized)) return amount * 1000;
    return amount;
  });

  const min = Math.max(12000, Math.round(Math.min(...annualized)));
  const max = Math.max(min, Math.round(Math.max(...annualized)));
  return { min, max: max === min ? Math.round(min * 1.12) : max, disclosed: true };
}

function estimateSalary(title: string) {
  const normalized = title.toLowerCase();
  if (/engineer|developer|software|data scientist/.test(normalized)) return { min: 95000, max: 145000 };
  if (/manager|consultant|senior|lead|director/.test(normalized)) return { min: 85000, max: 130000 };
  if (/analyst|designer|specialist/.test(normalized)) return { min: 65000, max: 105000 };
  if (/assistant|coordinator|cashier|associate|cafe|restaurant/.test(normalized)) return { min: 36000, max: 62000 };
  if (/intern/.test(normalized)) return { min: 32000, max: 52000 };
  return { min: 52000, max: 92000 };
}

function getWorkMode(title: string, location: string) {
  const text = `${title} ${location}`.toLowerCase();
  if (text.includes('remote')) return 'Remote';
  if (text.includes('hybrid')) return 'Hybrid';
  return 'On-site';
}

function toDomain(source: string, applyUrl: string) {
  try {
    return new URL(applyUrl).hostname.replace(/^www\./, '');
  } catch {
    return source.toLowerCase().replace(/[^a-z0-9]+/g, '') || 'google.com';
  }
}

function decodeGoogleHref(href: string) {
  const cleaned = cleanText(href);
  const absolute = cleaned.startsWith('/') ? `https://www.google.com${cleaned}` : cleaned;

  try {
    const url = new URL(absolute);
    const target = url.searchParams.get('url') || url.searchParams.get('q');
    if (target && /^https?:\/\//i.test(target)) return target;
    if (/^https?:\/\//i.test(absolute) && !url.hostname.includes('google.')) return absolute;
  } catch {
    return null;
  }

  return null;
}

function extractExternalLinks(html: string) {
  const links = new Set<string>();
  const hrefPattern = /\bhref=(["'])(.*?)\1/gi;
  let match: RegExpExecArray | null;

  while ((match = hrefPattern.exec(html))) {
    const decoded = decodeGoogleHref(match[2]);
    if (decoded) links.add(decoded);
  }

  return Array.from(links);
}

function linkScore(link: string, job: ParsedJobText) {
  const normalized = link.toLowerCase();
  const companyTokens = job.company.toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 2);
  const sourceTokens = job.source.toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 2);
  let score = 0;

  companyTokens.forEach((token) => {
    if (normalized.includes(token)) score += 8;
  });
  sourceTokens.forEach((token) => {
    if (normalized.includes(token)) score += 5;
  });
  if (/career|job|greenhouse|lever|workday|apply|recruit/i.test(link)) score += 5;
  return score;
}

function findApplyLink(html: string, job: ParsedJobText, searchUrl: string) {
  const links = extractExternalLinks(html)
    .map((link) => ({ link, score: linkScore(link, job) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  return links[0]?.link || searchUrl;
}

function calculateTrustScore(job: ParsedJobText, salaryDisclosed: boolean, daysPosted: number, directLink: boolean) {
  let score = 48;
  if (salaryDisclosed) score += 18;
  if (daysPosted <= 3) score += 16;
  else if (daysPosted <= 7) score += 10;
  else if (daysPosted >= 30) score -= 14;
  if (directLink) score += 14;
  if (/linkedin|indeed|company|careers|workday|greenhouse|lever/i.test(job.source)) score += 6;
  if (/senior|manager|consultant|engineer|nursing|mechanic/i.test(job.title)) score += 4;
  return Math.max(12, Math.min(98, score));
}

function normalizeJob(job: ParsedJobText, searchUrl: string, html: string): GoogleJob {
  const salary = parseSalary(job.salaryText, job.title);
  const daysPosted = parsePostedDays(job.postedText);
  const applyLink = findApplyLink(html, job, searchUrl);
  const directCompanyLink = !applyLink.includes('google.com/search');
  const domain = toDomain(job.source, applyLink);
  const trustScore = calculateTrustScore(job, salary.disclosed, daysPosted, directCompanyLink);
  const key = `${job.title}|${job.company}|${job.location}|${job.source}`;

  return {
    id: `google-${hashText(key)}`,
    title: job.title,
    company: job.company,
    companyContext: `${job.source} listing`,
    location: job.location,
    source: job.source,
    jobType: job.jobType,
    workMode: getWorkMode(job.title, job.location),
    salary: {
      min: salary.min,
      max: salary.max,
    },
    salaryText: job.salaryText || '',
    salaryDisclosed: salary.disclosed,
    daysPosted,
    repostCount: daysPosted > 21 ? 1 : 0,
    trustScore,
    recentHiringActivity: daysPosted <= 7,
    directCompanyLink,
    hiringContact: /linkedin|recruit|talent/i.test(job.source),
    sentiment: daysPosted <= 10 ? 'growing' : 'stable',
    description: `${job.company} is listing ${job.title} in ${job.location} via ${job.source}. Open the listing to verify details and apply from the source page.`,
    requirements: REQUIREMENTS,
    domain,
    url: applyLink,
    saved: false,
  };
}

function normalizePreparsedJob(job: PreparsedJob): GoogleJob {
  const normalized = normalizeJob(job, job.applyUrl, `<a href="${job.applyUrl}">${job.company} careers</a>`);

  return {
    ...normalized,
    domain: toDomain(job.source, job.applyUrl),
    url: job.applyUrl,
    directCompanyLink: true,
    companyContext: `${job.source} listing`,
  };
}

const SEARCH_STOP_WORDS = new Set([
  'job',
  'jobs',
  'hiring',
  'career',
  'careers',
  'opening',
  'openings',
  'near',
  'in',
  'the',
  'and',
  'for',
  'a',
  'an',
]);

const LOCATION_ALIASES: Record<string, string[]> = {
  minnesota: ['minnesota', 'mn', 'minneapolis', 'st paul', 'saint paul', 'richfield', 'medina', 'minnetonka', 'bloomington', 'eden prairie', 'maple grove'],
  mn: ['mn', 'minnesota', 'minneapolis', 'st paul', 'saint paul', 'richfield', 'medina', 'minnetonka', 'bloomington', 'eden prairie', 'maple grove'],
  minneapolis: ['minneapolis'],
  medina: ['medina'],
  richfield: ['richfield'],
  minnetonka: ['minnetonka'],
  chicago: ['chicago'],
  illinois: ['illinois', 'il', 'chicago'],
  il: ['il', 'illinois', 'chicago'],
  york: ['new york', 'ny'],
  ny: ['ny', 'new york'],
  austin: ['austin'],
  texas: ['texas', 'tx', 'austin'],
  tx: ['tx', 'texas', 'austin'],
  seattle: ['seattle'],
  washington: ['washington', 'wa', 'seattle'],
  wa: ['wa', 'washington', 'seattle'],
  remote: ['remote'],
};

const QUERY_SYNONYMS: Record<string, string[]> = {
  information: ['it', 'technology', 'technical', 'systems', 'support', 'desk'],
  technology: ['it', 'technical', 'systems', 'support', 'desk'],
  tech: ['technology', 'technical', 'it', 'systems', 'support'],
  it: ['information', 'technology', 'technical', 'systems', 'support', 'desk'],
  marketing: ['marketing', 'brand', 'communications', 'communication', 'digital', 'campaign', 'content', 'growth', 'social', 'media', 'product marketing'],
  marketer: ['marketing', 'brand', 'communications', 'digital', 'campaign', 'content', 'growth'],
  sales: ['sales', 'business development', 'sdr', 'account executive'],
  finance: ['finance', 'financial', 'accounting', 'analyst'],
  data: ['data', 'analytics', 'business intelligence', 'bi', 'analyst'],
};

function getRawQueryTokens(query: string) {
  return cleanText(query)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 1 && !SEARCH_STOP_WORDS.has(token));
}

function expandQueryTokens(tokens: string[]) {
  const expanded = new Set(tokens);
  tokens.forEach((token) => {
    (QUERY_SYNONYMS[token] || []).forEach((synonym) => expanded.add(synonym));
  });
  return Array.from(expanded);
}

function hasSearchToken(text: string, token: string) {
  return new RegExp(`\\b${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text);
}

function getQueryParts(query: string) {
  const tokens = getRawQueryTokens(query);
  const locationTokens = tokens.filter((token) => LOCATION_ALIASES[token]);
  const companyTokens = tokens.filter((token) => PREPARSED_JOBS.some((job) => hasSearchToken(job.company, token)));
  const intentTokens = expandQueryTokens(tokens.filter((token) => !LOCATION_ALIASES[token] && !companyTokens.includes(token)));
  const locationAliases = Array.from(new Set(locationTokens.flatMap((token) => LOCATION_ALIASES[token] || [token])));

  return {
    tokens: expandQueryTokens(tokens),
    locationAliases,
    intentTokens,
    companyTokens,
  };
}

function getPreparsedMatchScore(job: GoogleJob, query: string) {
  const { tokens, intentTokens, locationAliases, companyTokens } = getQueryParts(query);
  if (!tokens.length) return 1;

  const haystack = [
    job.title,
    job.company,
    job.location,
    job.source,
    job.jobType,
    job.workMode,
    job.description,
  ].join(' ').toLowerCase();

  const hasIntent = intentTokens.length === 0 || intentTokens.some((token) => hasSearchToken(haystack, token));
  const hasLocation = locationAliases.length === 0 || locationAliases.some((token) => hasSearchToken(haystack, token));
  const hasCompany = companyTokens.length === 0 || companyTokens.some((token) => hasSearchToken(job.company, token));
  if (!hasIntent || !hasLocation || !hasCompany) return 0;

  let score = 0;
  [...tokens, ...locationAliases].forEach((token) => {
    if (hasSearchToken(haystack, token)) score += 2;
    if (hasSearchToken(job.title, token)) score += 3;
    if (hasSearchToken(job.location, token)) score += 3;
    if (hasSearchToken(job.company, token)) score += 2;
  });

  return score;
}

export function buildGoogleJobsUrl(query: string) {
  const search = new URLSearchParams({
    q: normalizeGoogleJobQuery(query),
    udm: '8',
    jbr: 'sep:0',
    hl: 'en',
    gl: 'us',
  });

  return `https://www.google.com/search?${search.toString()}`;
}

export function normalizeGoogleJobQuery(query: string) {
  const cleaned = cleanText(query || '');
  if (!cleaned) return DEFAULT_SEARCHES[0];
  return /\bjob|jobs|hiring|career|careers\b/i.test(cleaned) ? cleaned : `${cleaned} jobs`;
}

export function defaultGoogleJobQueries() {
  return DEFAULT_SEARCHES;
}

export function parseGoogleJobsHtml(html: string, searchUrl: string) {
  const lines = htmlToLines(html);
  const parsed = parseJobBlocks(lines);
  const seen = new Set<string>();

  return parsed
    .map((job) => normalizeJob(job, searchUrl, html))
    .filter((job) => {
      const key = `${job.title}|${job.company}|${job.location}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function getPreparsedJobs(query: string, maxResults = 48) {
  const normalizedQuery = normalizeGoogleJobQuery(query || '');
  const jobs = PREPARSED_JOBS.map(normalizePreparsedJob)
    .map((job) => ({
      job,
      score: getPreparsedMatchScore(job, normalizedQuery),
    }))
    .filter((entry) => !query.trim() || entry.score > 0)
    .sort((a, b) => b.score - a.score || b.job.trustScore - a.job.trustScore || a.job.daysPosted - b.job.daysPosted)
    .map((entry) => entry.job);

  return jobs.slice(0, maxResults);
}
