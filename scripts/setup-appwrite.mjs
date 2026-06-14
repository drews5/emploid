import 'dotenv/config';
import { Client, Databases } from 'node-appwrite';

const endpoint = process.env.APPWRITE_ENDPOINT;
const projectId = process.env.APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const databaseId = process.env.APPWRITE_DATABASE_ID || 'emploid';

if (!endpoint || !projectId || !apiKey) {
  throw new Error('APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, and APPWRITE_API_KEY are required');
}

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const databases = new Databases(client);

const s = (key, size = 255, required = false, xdefault) => ({ key, type: 'string', size, required, ...(xdefault === undefined ? {} : { default: xdefault }) });
const i = (key, required = false, xdefault) => ({ key, type: 'integer', required, ...(xdefault === undefined ? {} : { default: xdefault }) });
const f = (key, required = false, xdefault) => ({ key, type: 'double', required, ...(xdefault === undefined ? {} : { default: xdefault }) });
const b = (key, required = false, xdefault) => ({ key, type: 'boolean', required, ...(xdefault === undefined ? {} : { default: xdefault }) });
const d = (key, required = false) => ({ key, type: 'datetime', required });
const text = (key, size, required = false) => ({ key, type: 'string', size, required });
const index = (key, columns, type = 'key', orders, lengths) => ({ key, type, columns, ...(orders ? { orders } : {}), ...(lengths ? { lengths } : {}) });

const definitions = [
  {
    id: 'companies',
    name: 'Companies',
    columns: [
      s('name', 500, true), s('slug', 255, true), s('logo_url', 2048), s('industry', 255), s('size_range', 50),
      i('employee_count'), i('founded_year'), s('hq_location', 500), s('website', 2048), s('careers_page_url', 2048),
      f('glassdoor_rating'), s('glassdoor_url', 2048), f('avg_ghost_score'), i('total_active_listings', false, 0),
      i('hiring_velocity_90d', false, 0), d('last_layoff_date'), i('last_layoff_count'), f('trust_score', false, 0.6),
      i('observation_count', false, 0), d('last_crawled_at'), s('canonical_key', 500),
    ],
    text: [text('trust_flags', 1500), text('trust_signals', 3000)],
    indexes: [index('slug_unique', ['slug'], 'unique'), index('canonical_key_idx', ['canonical_key']), index('trust_score_idx', ['trust_score'])],
  },
  {
    id: 'jobs',
    name: 'Jobs',
    columns: [
      s('title', 500, true), s('company_id', 36, true), s('location', 500), s('remote_type', 32),
      i('salary_min'), i('salary_max'), b('salary_is_estimate', false, false), s('source', 100), s('source_url', 2048),
      s('apply_url', 2048, true), s('experience_level', 50), s('job_type', 50), i('ghost_score'), s('ghost_label', 50),
      d('posted_at'), d('first_seen_at'), d('last_seen_at'), d('last_edited_at'), i('repost_count', false, 0),
      b('is_active', false, true), s('source_provider', 100), s('source_job_id', 500), s('external_source', 128),
      s('description_hash', 255), f('company_trust_score'), s('canonical_company_key', 255),
    ],
    text: [text('description', 7000), text('ghost_factors', 750), text('trust_flags', 750)],
    indexes: [
      index('company_idx', ['company_id']), index('active_idx', ['is_active']), index('provider_idx', ['source_provider']),
      index('provider_job_idx', ['source_provider', 'source_job_id']), index('source_url_idx', ['source_url'], 'key', undefined, [255]),
      index('remote_idx', ['remote_type']), index('job_type_idx', ['job_type']), index('experience_idx', ['experience_level']),
      index('ghost_idx', ['ghost_score']), index('salary_idx', ['salary_max']), index('posted_idx', ['posted_at']),
      index('title_search', ['title'], 'fulltext'), index('location_search', ['location'], 'fulltext'),
    ],
  },
  {
    id: 'users',
    name: 'User Profiles',
    columns: [
      s('email', 500, true), s('name', 500), b('is_pro', false, false), s('stripe_customer_id', 255),
      i('preferred_salary_min'), s('experience_level', 50), s('avatar_url', 4096), s('auth_provider', 50, false, 'email'),
      d('last_sign_in_at'),
    ],
    text: [text('preferred_titles', 2000), text('preferred_locations', 2000)],
    indexes: [index('email_unique', ['email'], 'unique'), index('stripe_customer_idx', ['stripe_customer_id'])],
  },
  {
    id: 'saved_jobs',
    name: 'Saved Jobs',
    columns: [s('user_id', 36, true), s('job_id', 36, true), s('status', 32, false, 'saved'), d('applied_at')],
    text: [text('notes', 5000)],
    indexes: [index('user_idx', ['user_id']), index('job_idx', ['job_id']), index('user_job_unique', ['user_id', 'job_id'], 'unique')],
  },
  {
    id: 'application_tracker',
    name: 'Application Tracker',
    columns: [
      s('user_id', 36, true), s('external_job_id', 200, true), s('role', 500, true), s('company', 500, true),
      s('source', 120), s('stage', 32, false, 'saved'), i('trust_score'), s('salary', 120), s('location', 500),
      s('listing_url', 2048), d('applied_at'), d('last_activity_at'),
    ],
    text: [text('notes', 5000)],
    indexes: [index('tracker_user_idx', ['user_id']), index('tracker_unique', ['user_id', 'external_job_id'], 'unique')],
  },
  {
    id: 'recruiters',
    name: 'Recruiters',
    columns: [s('company_id', 36), s('name', 500, true), s('title', 500), s('linkedin_url', 2048), s('email', 500), s('source', 255)],
    text: [],
    indexes: [index('recruiter_company_idx', ['company_id'])],
  },
  {
    id: 'job_recruiters',
    name: 'Job Recruiters',
    columns: [s('job_id', 36, true), s('recruiter_id', 36, true)],
    text: [],
    indexes: [index('job_recruiter_unique', ['job_id', 'recruiter_id'], 'unique'), index('job_recruiter_job_idx', ['job_id'])],
  },
  {
    id: 'crawl_runs',
    name: 'Crawl Runs',
    columns: [d('started_at'), d('finished_at'), s('source', 100), i('jobs_seen', false, 0), i('jobs_new', false, 0), i('jobs_updated', false, 0), i('jobs_deactivated', false, 0), i('errors', false, 0)],
    text: [text('notes', 5000)],
    indexes: [index('crawl_source_idx', ['source'])],
  },
  {
    id: 'jsearch_usage',
    name: 'JSearch Usage',
    columns: [s('usage_date', 10, true), i('request_count', false, 0)],
    text: [],
    indexes: [index('jsearch_date_unique', ['usage_date'], 'unique')],
  },
  {
    id: 'adzuna_usage',
    name: 'Adzuna Usage',
    columns: [s('usage_date', 10, true), i('request_count', false, 0)],
    text: [],
    indexes: [index('adzuna_date_unique', ['usage_date'], 'unique')],
  },
];

async function ignoreConflict(action) {
  try {
    return await action();
  } catch (error) {
    if (error?.code !== 409) throw error;
    return null;
  }
}

async function createAttribute(collectionId, attribute) {
  const common = { databaseId, collectionId, key: attribute.key, required: attribute.required };
  if (attribute.type === 'string') return databases.createStringAttribute({ ...common, size: attribute.size, xdefault: attribute.default });
  if (attribute.type === 'integer') return databases.createIntegerAttribute({ ...common, xdefault: attribute.default });
  if (attribute.type === 'double') return databases.createFloatAttribute({ ...common, xdefault: attribute.default });
  if (attribute.type === 'boolean') return databases.createBooleanAttribute({ ...common, xdefault: attribute.default });
  if (attribute.type === 'datetime') return databases.createDatetimeAttribute(common);
  throw new Error(`Unsupported Appwrite attribute type: ${attribute.type}`);
}

async function waitForAttributes(collectionId) {
  for (let attempt = 0; attempt < 90; attempt += 1) {
    const collection = await databases.getCollection({ databaseId, collectionId });
    const pending = collection.attributes.filter((attribute) => !['available', 'failed'].includes(attribute.status));
    const failed = collection.attributes.filter((attribute) => attribute.status === 'failed');
    if (failed.length) throw new Error(`${collectionId} attributes failed: ${failed.map((attribute) => `${attribute.key}: ${attribute.error}`).join(', ')}`);
    if (!pending.length) return;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`Timed out waiting for ${collectionId} attributes`);
}

await ignoreConflict(() => databases.create({ databaseId, name: 'Emploid', enabled: true }));

for (const definition of definitions) {
  await ignoreConflict(() => databases.createCollection({
    databaseId,
    collectionId: definition.id,
    name: definition.name,
    documentSecurity: false,
    enabled: true,
  }));

  let collection = await databases.getCollection({ databaseId, collectionId: definition.id });
  const existingAttributes = new Set(collection.attributes.map((attribute) => attribute.key));
  for (const attribute of [...definition.columns, ...definition.text]) {
    if (existingAttributes.has(attribute.key)) continue;
    await ignoreConflict(() => createAttribute(definition.id, attribute));
  }

  await waitForAttributes(definition.id);

  collection = await databases.getCollection({ databaseId, collectionId: definition.id });
  const existingIndexes = new Set(collection.indexes.map((collectionIndex) => collectionIndex.key));
  for (const collectionIndex of definition.indexes) {
    if (existingIndexes.has(collectionIndex.key)) continue;
    await ignoreConflict(() => databases.createIndex({
      databaseId,
      collectionId: definition.id,
      key: collectionIndex.key,
      type: collectionIndex.type,
      attributes: collectionIndex.columns,
      orders: collectionIndex.orders,
      lengths: collectionIndex.lengths,
    }));
  }

  console.log(`Configured ${definition.id}`);
}

console.log(`Appwrite database ${databaseId} is ready.`);
