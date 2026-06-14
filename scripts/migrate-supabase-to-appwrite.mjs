import { createClient } from '@supabase/supabase-js';
import { Client, Databases } from 'node-appwrite';

const sourceUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const sourceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const endpoint = process.env.APPWRITE_ENDPOINT;
const projectId = process.env.APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const databaseId = process.env.APPWRITE_DATABASE_ID || 'emploid';

if (!sourceUrl || !sourceKey || !endpoint || !projectId || !apiKey) {
  throw new Error('Supabase source and Appwrite destination environment variables are required');
}

const source = createClient(sourceUrl, sourceKey, { auth: { persistSession: false } });
const destination = new Databases(new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey));

const companyFields = [
  'id', 'name', 'slug', 'logo_url', 'industry', 'size_range', 'employee_count', 'founded_year', 'hq_location',
  'website', 'careers_page_url', 'glassdoor_rating', 'glassdoor_url', 'avg_ghost_score', 'total_active_listings',
  'hiring_velocity_90d', 'last_layoff_date', 'last_layoff_count', 'trust_score', 'trust_flags', 'trust_signals',
  'observation_count', 'last_crawled_at', 'canonical_key',
];

const jobFields = [
  'id', 'title', 'company_id', 'location', 'remote_type', 'salary_min', 'salary_max', 'salary_is_estimate',
  'description', 'source', 'source_url', 'apply_url', 'experience_level', 'job_type', 'ghost_score', 'ghost_factors',
  'ghost_label', 'posted_at', 'first_seen_at', 'last_seen_at', 'repost_count', 'is_active', 'source_provider',
  'source_job_id', 'external_source', 'description_hash', 'last_edited_at', 'trust_flags', 'company_trust_score',
  'canonical_company_key',
];

const stringLimits = {
  companies: { name: 500, slug: 255, logo_url: 2048, industry: 255, size_range: 50, hq_location: 500, website: 2048, careers_page_url: 2048, glassdoor_url: 2048, canonical_key: 500 },
  jobs: { title: 500, company_id: 36, location: 500, remote_type: 32, description: 7000, source: 100, source_url: 2048, apply_url: 2048, experience_level: 50, job_type: 50, ghost_label: 50, source_provider: 100, source_job_id: 500, external_source: 128, description_hash: 255, canonical_company_key: 255 },
};

const jsonLimits = {
  companies: { trust_flags: 1500, trust_signals: 3000 },
  jobs: { ghost_factors: 750, trust_flags: 750 },
};

function fitJson(value, max) {
  if (value == null) return null;
  const encoded = JSON.stringify(value);
  if (encoded.length <= max) return encoded;
  return Array.isArray(value) ? '[]' : '{}';
}

function normalizeDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function prepare(table, row) {
  const data = { $id: row.id };
  for (const [key, value] of Object.entries(row)) {
    if (key === 'id' || value === undefined) continue;
    const maxJson = jsonLimits[table]?.[key];
    const maxString = stringLimits[table]?.[key];
    if (maxJson) data[key] = fitJson(value, maxJson);
    else if (maxString && typeof value === 'string') data[key] = value.slice(0, maxString);
    else if (key.endsWith('_at') || key.endsWith('_date')) data[key] = normalizeDate(value);
    else data[key] = value;
  }
  return data;
}

async function writeBatches(collectionId, documents, batchSize = 100) {
  for (let start = 0; start < documents.length; start += batchSize) {
    await destination.upsertDocuments({ databaseId, collectionId, documents: documents.slice(start, start + batchSize) });
  }
}

async function migrateCompanies() {
  let moved = 0;
  for (let start = 0; ; start += 1000) {
    const { data, error } = await source.from('companies').select(companyFields.join(',')).range(start, start + 999);
    if (error) throw error;
    if (!data?.length) break;
    await writeBatches('companies', data.map((row) => prepare('companies', row)));
    moved += data.length;
    console.log(`Companies: ${moved}`);
    if (data.length < 1000) break;
  }
  return moved;
}

async function migrateJobs() {
  let moved = 0;
  for (let start = 0; ; start += 500) {
    const { data, error } = await source.from('jobs').select(jobFields.join(',')).eq('is_active', true).order('id').range(start, start + 499);
    if (error) throw error;
    if (!data?.length) break;
    await writeBatches('jobs', data.map((row) => prepare('jobs', row)), 50);
    moved += data.length;
    console.log(`Jobs: ${moved}`);
    if (data.length < 500) break;
  }
  return moved;
}

const companies = await migrateCompanies();
const jobs = await migrateJobs();
console.log(JSON.stringify({ companies, jobs }));
