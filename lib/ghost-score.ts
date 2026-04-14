// ── Types ──────────────────────────────────────────────

interface JobInput {
  posted_at?: string;
  first_seen_at?: string;
  repost_count?: number;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_is_estimate?: boolean;
  job_recruiters?: any[];
  source?: string;
  apply_url?: string;
  description?: string;
}

interface CompanyInput {
  size_range?: string;
  employee_count?: number;
  total_active_listings?: number;
}

interface ScoreFactor {
  score: number;
  weight: number;
  explanation: string;
}

export interface GhostScoreResult {
  score: number; // 0-100
  factors: {
    days_active: ScoreFactor;
    repost_frequency: ScoreFactor;
    salary_disclosed: ScoreFactor;
    hiring_manager_identified: ScoreFactor;
    company_hiring_velocity: ScoreFactor;
    application_method: ScoreFactor;
    description_quality: ScoreFactor;
    review_recency: ScoreFactor;
  };
  label: 'Verified' | 'Uncertain' | 'Likely Ghost';
}

// ── Algorithm ──────────────────────────────────────────

export function calculateGhostScore(
  job: JobInput,
  company: CompanyInput | null,
  reviews: any[] = []
): GhostScoreResult {

  // ── 1. Days Active (20%) ─────────────────────────────
  const daysActive: ScoreFactor = { score: 0, weight: 20, explanation: '' };
  const postedAt = new Date(job.posted_at || job.first_seen_at || Date.now());
  const daysSincePosted = Math.floor(
    (Date.now() - postedAt.getTime()) / (1000 * 3600 * 24)
  );

  if (daysSincePosted <= 14) {
    daysActive.score = 100;
    daysActive.explanation = `Posted ${daysSincePosted} day(s) ago — highly likely to be active.`;
  } else if (daysSincePosted > 90) {
    daysActive.score = 0;
    daysActive.explanation = `Posted ${daysSincePosted} days ago — high probability of being a ghost listing.`;
  } else {
    daysActive.score = Math.round(100 - ((daysSincePosted - 14) / 76) * 100);
    daysActive.explanation = `Posted ${daysSincePosted} days ago.`;
  }

  // ── 2. Repost Frequency (15%) ────────────────────────
  const repostFreq: ScoreFactor = { score: 0, weight: 15, explanation: '' };
  const repostCount = job.repost_count ?? 0;

  if (repostCount === 0) {
    repostFreq.score = 100;
    repostFreq.explanation = 'Never reposted — appears authentic.';
  } else if (repostCount >= 4) {
    repostFreq.score = 0;
    repostFreq.explanation = `Reposted ${repostCount} times — looks like an evergreen or ghost listing.`;
  } else {
    repostFreq.score = Math.round(100 - repostCount * 25);
    repostFreq.explanation = `Reposted ${repostCount} time(s).`;
  }

  // ── 3. Salary Disclosed (10%) ────────────────────────
  const salaryDisc: ScoreFactor = { score: 0, weight: 10, explanation: '' };

  if (job.salary_min || job.salary_max) {
    if (job.salary_is_estimate) {
      salaryDisc.score = 60;
      salaryDisc.explanation = 'Salary range is estimated (not disclosed by the employer).';
    } else {
      salaryDisc.score = 100;
      salaryDisc.explanation = 'Salary range is disclosed by the employer.';
    }
  } else {
    salaryDisc.score = 0;
    salaryDisc.explanation = 'No salary information provided.';
  }

  // ── 4. Hiring Manager Identified (10%) ───────────────
  const hmIdentified: ScoreFactor = { score: 0, weight: 10, explanation: '' };

  if (job.job_recruiters && job.job_recruiters.length > 0) {
    hmIdentified.score = 100;
    hmIdentified.explanation = `Hiring contact identified (${job.job_recruiters.length} recruiter(s) linked).`;
  } else {
    hmIdentified.score = 0;
    hmIdentified.explanation = 'No specific hiring contact associated with this posting.';
  }

  // ── 5. Company Hiring Velocity (15%) ─────────────────
  const velocity: ScoreFactor = { score: 0, weight: 15, explanation: '' };

  if (company) {
    const sizeMap: Record<string, number> = {
      '1-50': 50,
      '51-200': 200,
      '201-500': 500,
      '501-1000': 1000,
      '1001-5000': 5000,
      '5000+': 10000,
    };
    const estimatedSize = sizeMap[company.size_range ?? ''] || company.employee_count || 1000;
    const activeListings = company.total_active_listings ?? 1;
    const ratio = activeListings / estimatedSize;

    if (ratio > 0.1) {
      velocity.score = 0;
      velocity.explanation = `Suspicious: ${activeListings} openings at a ~${estimatedSize}-person company (${(ratio * 100).toFixed(1)}% ratio).`;
    } else if (ratio > 0.05) {
      velocity.score = 50;
      velocity.explanation = `Moderate hiring: ${activeListings} openings at a ~${estimatedSize}-person company.`;
    } else {
      velocity.score = 100;
      velocity.explanation = `Reasonable: ${activeListings} openings relative to ~${estimatedSize} employees.`;
    }
  } else {
    velocity.score = 50;
    velocity.explanation = 'Insufficient company data to evaluate hiring velocity.';
  }

  // ── 6. Application Method (10%) ──────────────────────
  const appMethod: ScoreFactor = { score: 0, weight: 10, explanation: '' };

  if (
    job.source === 'company_direct' ||
    (job.apply_url && !job.apply_url.includes('easy_apply') && !job.apply_url.includes('easyApply'))
  ) {
    appMethod.score = 100;
    appMethod.explanation = 'Links directly to the company careers page or ATS.';
  } else {
    appMethod.score = 0;
    appMethod.explanation = 'Uses generic Easy Apply — applications may not reach a human.';
  }

  // ── 7. Description Quality (10%) ─────────────────────
  const descQuality: ScoreFactor = { score: 0, weight: 10, explanation: '' };
  const desc = (job.description || '').toLowerCase();
  let indicators = 0;

  // Word count check
  if (desc.split(/\s+/).length > 200) indicators++;

  // Tech stack mentioned (word-boundary-aware)
  if (/\b(react|node\.?js|python|java(?:script)?|go(?:lang)?|rust|kotlin|swift|sql|aws|azure|gcp|docker|kubernetes|terraform)\b/.test(desc)) {
    indicators++;
  }

  // Team structure info
  if (/\b(team of|reporting to|you will join|cross-functional|squad)\b/.test(desc)) {
    indicators++;
  }

  // Detailed responsibilities
  if (/\b(responsibilities|what you['']ll do|day-to-day|key duties|in this role)\b/.test(desc)) {
    indicators++;
  }

  if (indicators >= 3) {
    descQuality.score = 100;
    descQuality.explanation = 'High-quality description with tech stack, team context, and specific responsibilities.';
  } else if (indicators === 0) {
    descQuality.score = 0;
    descQuality.explanation = 'Vague, brief, or boilerplate description.';
  } else {
    descQuality.score = Math.round(indicators * 33);
    descQuality.explanation = `Average description quality (${indicators}/4 specificity indicators).`;
  }

  // ── 8. Review Recency (10%) ──────────────────────────
  const reviewRecency: ScoreFactor = { score: 0, weight: 10, explanation: '' };

  if (reviews && reviews.length > 0) {
    reviewRecency.score = 100;
    reviewRecency.explanation = `${reviews.length} recent interview review(s) found — company is actively interviewing.`;
  } else {
    reviewRecency.score = 50;
    reviewRecency.explanation = 'No recent interview reviews found online.';
  }

  // ── Compute Final Score ──────────────────────────────
  const rawScore =
    daysActive.score * 0.20 +
    repostFreq.score * 0.15 +
    salaryDisc.score * 0.10 +
    hmIdentified.score * 0.10 +
    velocity.score * 0.15 +
    appMethod.score * 0.10 +
    descQuality.score * 0.10 +
    reviewRecency.score * 0.10;

  const finalScore = Math.max(0, Math.min(100, Math.round(rawScore)));

  let label: GhostScoreResult['label'] = 'Likely Ghost';
  if (finalScore >= 80) label = 'Verified';
  else if (finalScore >= 50) label = 'Uncertain';

  return {
    score: finalScore,
    label,
    factors: {
      days_active: daysActive,
      repost_frequency: repostFreq,
      salary_disclosed: salaryDisc,
      hiring_manager_identified: hmIdentified,
      company_hiring_velocity: velocity,
      application_method: appMethod,
      description_quality: descQuality,
      review_recency: reviewRecency,
    },
  };
}
