type RoleFamily = {
  id: string;
  titleTerms: string[];
  aliases: string[];
  skills: string[];
};

export type JobSearchIntent = {
  raw: string;
  normalized: string;
  terms: string[];
  importantTerms: string[];
  expandedTerms: string[];
  candidateTerms: string[];
  remoteTypes: string[];
  jobTypes: string[];
  seniority: 'entry' | 'mid' | 'senior' | 'lead' | null;
  locationTerms: string[];
  roleVector: number[];
  hasSemanticSignal: boolean;
};

const STOP_WORDS = new Set([
  'a',
  'about',
  'all',
  'and',
  'any',
  'apply',
  'at',
  'best',
  'career',
  'careers',
  'find',
  'for',
  'full',
  'get',
  'hiring',
  'in',
  'job',
  'jobs',
  'me',
  'near',
  'new',
  'now',
  'open',
  'opening',
  'openings',
  'opportunity',
  'or',
  'position',
  'remote',
  'role',
  'roles',
  'the',
  'to',
  'work',
]);

const ROLE_FAMILIES: RoleFamily[] = [
  {
    id: 'software',
    titleTerms: ['software', 'engineer', 'developer', 'programmer', 'frontend', 'front-end', 'backend', 'back-end', 'fullstack', 'full-stack', 'web', 'mobile', 'ios', 'android', 'platform'],
    aliases: ['coding', 'code', 'programming', 'swe', 'dev', 'app', 'applications'],
    skills: ['javascript', 'typescript', 'react', 'next', 'node', 'python', 'java', 'c#', 'c++', 'go', 'golang', 'ruby', 'php', 'sql', 'api', 'kubernetes', 'aws', 'azure', 'gcp'],
  },
  {
    id: 'data',
    titleTerms: ['data', 'analyst', 'analytics', 'scientist', 'science', 'bi', 'business intelligence', 'warehouse', 'etl', 'insights'],
    aliases: ['analysis', 'reporting', 'dashboards', 'metrics'],
    skills: ['sql', 'python', 'tableau', 'powerbi', 'power bi', 'looker', 'excel', 'r', 'dbt', 'snowflake'],
  },
  {
    id: 'ai',
    titleTerms: ['machine learning', 'ml', 'ai', 'artificial intelligence', 'model', 'research scientist', 'nlp', 'computer vision'],
    aliases: ['llm', 'deep learning', 'neural', 'genai', 'generative'],
    skills: ['pytorch', 'tensorflow', 'python', 'rag', 'langchain', 'cuda', 'modeling'],
  },
  {
    id: 'design',
    titleTerms: ['designer', 'design', 'product designer', 'ux', 'ui', 'visual', 'brand', 'researcher', 'content strategist'],
    aliases: ['creative', 'user experience', 'user interface'],
    skills: ['figma', 'prototype', 'wireframe', 'research', 'accessibility', 'adobe'],
  },
  {
    id: 'product',
    titleTerms: ['product', 'product manager', 'program manager', 'project manager', 'strategy', 'roadmap', 'owner'],
    aliases: ['pm', 'product management', 'program management'],
    skills: ['roadmap', 'experimentation', 'stakeholder', 'launch', 'jira', 'agile'],
  },
  {
    id: 'sales',
    titleTerms: ['sales', 'account executive', 'account manager', 'business development', 'sdr', 'bdr', 'revenue', 'partnerships'],
    aliases: ['selling', 'quota', 'closing', 'pipeline'],
    skills: ['salesforce', 'crm', 'prospecting', 'outbound', 'negotiation'],
  },
  {
    id: 'marketing',
    titleTerms: ['marketing', 'growth', 'demand generation', 'content', 'communications', 'social media', 'brand', 'seo', 'lifecycle'],
    aliases: ['marketer', 'campaigns', 'copywriting'],
    skills: ['hubspot', 'marketo', 'analytics', 'email', 'ads', 'sem'],
  },
  {
    id: 'customer',
    titleTerms: ['customer success', 'customer support', 'support', 'technical support', 'implementation', 'solutions consultant', 'solutions engineer'],
    aliases: ['client success', 'customer service', 'help desk', 'service desk'],
    skills: ['zendesk', 'intercom', 'troubleshooting', 'onboarding', 'saas'],
  },
  {
    id: 'operations',
    titleTerms: ['operations', 'coordinator', 'specialist', 'logistics', 'supply chain', 'planner', 'inventory', 'procurement'],
    aliases: ['ops', 'operator', 'process'],
    skills: ['excel', 'erp', 'forecasting', 'vendor', 'process improvement'],
  },
  {
    id: 'finance',
    titleTerms: ['finance', 'financial analyst', 'accounting', 'accountant', 'controller', 'fp&a', 'investment', 'payroll', 'revenue analyst'],
    aliases: ['numbers', 'budget', 'bookkeeping'],
    skills: ['excel', 'quickbooks', 'netsuite', 'forecasting', 'audit', 'gaap'],
  },
  {
    id: 'people',
    titleTerms: ['human resources', 'hr', 'people operations', 'recruiter', 'recruiting', 'talent', 'sourcer', 'benefits'],
    aliases: ['people', 'hiring', 'recruitment'],
    skills: ['workday', 'greenhouse', 'ats', 'sourcing', 'employee relations'],
  },
  {
    id: 'healthcare',
    titleTerms: ['nurse', 'rn', 'medical assistant', 'clinical', 'healthcare', 'patient', 'therapist', 'pharmacy', 'care'],
    aliases: ['medical', 'hospital', 'clinic'],
    skills: ['bls', 'cpr', 'emr', 'epic', 'patient care'],
  },
  {
    id: 'retail',
    titleTerms: ['retail', 'cashier', 'store', 'associate', 'barista', 'server', 'restaurant', 'shift lead', 'warehouse', 'driver', 'delivery'],
    aliases: ['hourly', 'part time', 'part-time', 'food service'],
    skills: ['pos', 'inventory', 'customer service', 'forklift'],
  },
  {
    id: 'security',
    titleTerms: ['security', 'cybersecurity', 'information security', 'soc', 'risk', 'compliance', 'trust and safety'],
    aliases: ['cyber', 'infosec'],
    skills: ['siem', 'splunk', 'incident response', 'iam', 'soc2', 'iso'],
  },
];

const SENIORITY_TERMS = {
  entry: ['entry', 'junior', 'jr', 'associate', 'intern', 'internship', 'new grad', 'graduate', 'level 1', 'i'],
  mid: ['mid', 'midlevel', 'intermediate', 'level 2', 'ii'],
  senior: ['senior', 'sr', 'staff', 'principal', 'level 3', 'iii', 'level 4', 'iv'],
  lead: ['lead', 'manager', 'director', 'head', 'vp', 'chief'],
};

export function sanitizeJobSearchInput(value: string | null) {
  return String(value || '')
    .replace(/[^a-zA-Z0-9\s@.+#,$/-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160);
}

export function analyzeJobSearchQuery(value: string | null): JobSearchIntent {
  const raw = sanitizeJobSearchInput(value);
  const normalized = normalizeText(raw);
  const terms = tokenize(normalized);
  const importantTerms = terms.filter((term) => !STOP_WORDS.has(term));
  const locationTerms = extractLocationTerms(normalized);
  const remoteTypes = extractRemoteTypes(normalized);
  const jobTypes = extractJobTypes(normalized);
  const seniority = extractSeniority(normalized);
  const roleVector = vectorize(normalized);
  const expandedTerms = expandTerms(normalized, importantTerms, roleVector, seniority);
  const candidateTerms = [
    ...importantTerms,
    ...expandedTerms,
    ...locationTerms,
    ...remoteTypes,
  ]
    .map(cleanTerm)
    .filter((term) => term.length >= 2 && !STOP_WORDS.has(term));

  return {
    raw,
    normalized,
    terms,
    importantTerms,
    expandedTerms: unique(expandedTerms).slice(0, 28),
    candidateTerms: unique(candidateTerms).slice(0, 24),
    remoteTypes,
    jobTypes,
    seniority,
    locationTerms,
    roleVector,
    hasSemanticSignal: importantTerms.length > 0 || remoteTypes.length > 0 || jobTypes.length > 0,
  };
}

export function scoreSemanticJobMatch(job: any, intent: JobSearchIntent) {
  const title = normalizeText(job?.title || '');
  const company = normalizeText(job?.companies?.name || job?.company_name || '');
  const location = normalizeText(job?.location || '');
  const description = normalizeText(stripHtml(job?.description || ''));
  const haystack = `${title} ${company} ${location} ${description}`;
  const jobVector = vectorize(`${title} ${description}`);
  const roleSimilarity = cosine(intent.roleVector, jobVector);
  let score = roleSimilarity * 105;

  if (intent.normalized && title === intent.normalized) score += 140;
  if (intent.normalized && title.startsWith(intent.normalized)) score += 95;
  if (intent.normalized && title.includes(intent.normalized)) score += 75;
  if (intent.normalized && company === intent.normalized) score += 120;
  if (intent.normalized && company.includes(intent.normalized)) score += 80;

  for (const term of intent.importantTerms) {
    if (title.includes(term)) score += 20;
    if (company.includes(term)) score += 18;
    if (location.includes(term)) score += 8;
    if (description.includes(term)) score += 4;
  }

  for (const term of intent.expandedTerms) {
    const normalizedTerm = normalizeText(term);
    if (!normalizedTerm || intent.importantTerms.includes(normalizedTerm)) continue;
    if (title.includes(normalizedTerm)) score += 13;
    if (description.includes(normalizedTerm)) score += 3;
  }

  if (intent.locationTerms.length) {
    const locationHits = intent.locationTerms.filter((term) => location.includes(term)).length;
    score += Math.min(28, locationHits * 9);
  }

  if (intent.remoteTypes.length) {
    const remoteType = String(job?.remote_type || '').toLowerCase();
    if (intent.remoteTypes.includes(remoteType)) score += 38;
    else score -= 42;
  }

  if (intent.jobTypes.length) {
    const jobType = String(job?.job_type || '').toLowerCase();
    if (intent.jobTypes.includes(jobType)) score += 28;
    else score -= 16;
  }

  score += seniorityScore(intent.seniority, title);
  score += Math.min(24, Math.max(0, Number(job?.ghost_score || 0)) / 4);
  score += recencyScore(job?.posted_at || job?.first_seen_at);

  return Math.round(score * 100) / 100;
}

export function buildSemanticSearchFilter(intent: JobSearchIntent, helpers: {
  ilikePattern: (value: string) => string;
}) {
  const clauses = new Set<string>();
  const terms = intent.candidateTerms
    .filter((term) => term.length >= 2)
    .slice(0, 18);

  for (const term of terms) {
    const pattern = helpers.ilikePattern(term);
    clauses.add(`title.ilike.${pattern}`);
    clauses.add(`location.ilike.${pattern}`);
  }

  return Array.from(clauses).join(',');
}

function expandTerms(normalized: string, importantTerms: string[], vector: number[], seniority: JobSearchIntent['seniority']) {
  const terms = new Set<string>();

  importantTerms.forEach((term) => terms.add(term));

  ROLE_FAMILIES.forEach((family, index) => {
    if (vector[index] <= 0) return;
    family.titleTerms.slice(0, 8).forEach((term) => terms.add(term));
    family.aliases.slice(0, 5).forEach((term) => terms.add(term));
    family.skills.slice(0, 8).forEach((term) => terms.add(term));
  });

  if (seniority === 'entry') ['junior', 'associate', 'entry', 'intern', 'new grad'].forEach((term) => terms.add(term));
  if (seniority === 'senior') ['senior', 'staff', 'principal', 'lead'].forEach((term) => terms.add(term));
  if (seniority === 'lead') ['lead', 'manager', 'director', 'head'].forEach((term) => terms.add(term));

  if (/\bcoding\b|\bprogramming\b|\bdeveloper\b/.test(normalized)) {
    ['software engineer', 'frontend', 'backend', 'fullstack', 'web developer'].forEach((term) => terms.add(term));
  }
  if (/\bhelp desk\b|\bit support\b/.test(normalized)) {
    ['technical support', 'service desk', 'it specialist'].forEach((term) => terms.add(term));
  }

  return Array.from(terms).map(cleanTerm).filter(Boolean);
}

function vectorize(value: string) {
  const text = normalizeText(value);
  return ROLE_FAMILIES.map((family) => {
    let weight = 0;
    for (const term of family.titleTerms) {
      if (containsTerm(text, term)) weight += term.includes(' ') ? 2.6 : 2.1;
    }
    for (const term of family.aliases) {
      if (containsTerm(text, term)) weight += term.includes(' ') ? 2.2 : 1.7;
    }
    for (const term of family.skills) {
      if (containsTerm(text, term)) weight += term.includes(' ') ? 1.5 : 1.1;
    }
    return weight;
  });
}

function cosine(a: number[], b: number[]) {
  let dot = 0;
  let aMag = 0;
  let bMag = 0;
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    const left = a[index] || 0;
    const right = b[index] || 0;
    dot += left * right;
    aMag += left * left;
    bMag += right * right;
  }
  if (!aMag || !bMag) return 0;
  return dot / (Math.sqrt(aMag) * Math.sqrt(bMag));
}

function extractRemoteTypes(value: string) {
  const types = new Set<string>();
  if (/\bremote\b|\bwork from home\b|\bwfh\b/.test(value)) types.add('remote');
  if (/\bhybrid\b/.test(value)) types.add('hybrid');
  if (/\bonsite\b|\bon site\b|\bin office\b|\boffice\b/.test(value)) types.add('onsite');
  return Array.from(types);
}

function extractJobTypes(value: string) {
  const types = new Set<string>();
  if (/\bpart time\b|\bpart-time\b/.test(value)) types.add('part-time');
  if (/\bcontract\b|\bcontractor\b|\btemporary\b|\btemp\b/.test(value)) types.add('contract');
  if (/\bintern\b|\binternship\b/.test(value)) types.add('internship');
  if (/\bfull time\b|\bfull-time\b/.test(value)) types.add('full-time');
  return Array.from(types);
}

function extractSeniority(value: string): JobSearchIntent['seniority'] {
  if (SENIORITY_TERMS.lead.some((term) => containsTerm(value, term))) return 'lead';
  if (SENIORITY_TERMS.senior.some((term) => containsTerm(value, term))) return 'senior';
  if (SENIORITY_TERMS.entry.some((term) => containsTerm(value, term))) return 'entry';
  if (SENIORITY_TERMS.mid.some((term) => containsTerm(value, term))) return 'mid';
  return null;
}

function extractLocationTerms(value: string) {
  const match = value.match(/\b(?:in|near|around)\s+([a-z0-9\s,.-]{2,48})$/);
  const locationText = match?.[1] || '';
  return tokenize(locationText).filter((term) => !STOP_WORDS.has(term)).slice(0, 6);
}

function seniorityScore(seniority: JobSearchIntent['seniority'], title: string) {
  if (!seniority) return 0;
  const titleSeniority = extractSeniority(title);
  if (!titleSeniority) return seniority === 'entry' ? 6 : 0;
  if (titleSeniority === seniority) return 26;
  if (seniority === 'entry' && (titleSeniority === 'senior' || titleSeniority === 'lead')) return -42;
  if (seniority === 'senior' && titleSeniority === 'entry') return -20;
  return -8;
}

function recencyScore(value: string | null | undefined) {
  if (!value) return 0;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 0;
  const daysOld = Math.max(0, Math.round((Date.now() - date.getTime()) / 86400000));
  return Math.max(0, 16 - Math.min(16, daysOld / 3));
}

function stripHtml(value: string) {
  return String(value || '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeText(value: string) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9+#.,\s/-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(value: string) {
  return normalizeText(value)
    .split(/\s+/)
    .map(cleanTerm)
    .filter((term) => term.length >= 2);
}

function cleanTerm(value: string) {
  return String(value || '').toLowerCase().replace(/^[^a-z0-9+#]+|[^a-z0-9+#]+$/g, '');
}

function containsTerm(text: string, term: string) {
  const normalizedTerm = normalizeText(term);
  if (!normalizedTerm) return false;
  if (normalizedTerm.includes(' ')) return text.includes(normalizedTerm);
  return new RegExp(`(^|[^a-z0-9+#])${escapeRegExp(normalizedTerm)}([^a-z0-9+#]|$)`).test(text);
}

function unique(values: string[]) {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const value of values) {
    const key = cleanTerm(value);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    output.push(key);
  }
  return output;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
