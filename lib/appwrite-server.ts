import { Account, Client, Databases, ID, Query, Users } from 'node-appwrite';
import { cookies } from 'next/headers';

const endpoint = () => process.env.APPWRITE_ENDPOINT || process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '';
const projectId = () => process.env.APPWRITE_PROJECT_ID || process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
const apiKey = () => process.env.APPWRITE_API_KEY || '';
const databaseId = () => process.env.APPWRITE_DATABASE_ID || 'emploid';

export const APPWRITE_SESSION_COOKIE = () => `a_session_${projectId()}`;

const JSON_FIELDS: Record<string, Set<string>> = {
  companies: new Set(['trust_flags', 'trust_signals']),
  jobs: new Set(['ghost_factors', 'trust_flags']),
  users: new Set(['preferred_titles', 'preferred_locations']),
};

function adminClient() {
  if (!endpoint() || !projectId() || !apiKey()) throw new Error('Appwrite server environment is not configured');
  return new Client().setEndpoint(endpoint()).setProject(projectId()).setKey(apiKey());
}

function sessionClient(session?: string) {
  const client = new Client().setEndpoint(endpoint()).setProject(projectId());
  if (session) client.setSession(session);
  return client;
}

export function createAdminServices() {
  const client = adminClient();
  return { client, account: new Account(client), databases: new Databases(client), users: new Users(client) };
}

export function createSessionServices(session?: string) {
  const client = sessionClient(session);
  return { client, account: new Account(client) };
}

function serialize(table: string, payload: Record<string, any>) {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(payload || {})) {
    if (key === 'id' || key.startsWith('$') || key === 'created_at' || key === 'updated_at') continue;
    if (value === undefined) continue;
    if (JSON_FIELDS[table]?.has(key)) {
      if (value == null) {
        result[key] = null;
      } else {
        const maximum = table === 'companies' && key === 'trust_signals' ? 3000 : table === 'jobs' ? 750 : 1500;
        const encoded = JSON.stringify(value);
        result[key] = encoded.length <= maximum ? encoded : Array.isArray(value) ? '[]' : '{}';
      }
    } else if (table === 'jobs' && key === 'description' && typeof value === 'string') {
      result[key] = value.slice(0, 7000);
    } else {
      result[key] = value;
    }
  }
  return result;
}

function deserialize(table: string, row: any) {
  if (!row) return row;
  const result: Record<string, any> = { ...row, id: row.$id };
  result.created_at ??= row.$createdAt;
  result.updated_at ??= row.$updatedAt;
  for (const key of Array.from(JSON_FIELDS[table] || [])) {
    if (typeof result[key] === 'string') {
      try { result[key] = JSON.parse(result[key]); } catch { /* keep legacy text */ }
    }
  }
  return result;
}

async function hydrateRelations(databases: Databases, table: string, rows: any[], selection: string) {
  if (!rows.length) return rows;
  if (table === 'jobs' && selection.includes('companies')) {
    const ids = Array.from(new Set(rows.map((row) => row.company_id).filter(Boolean)));
    const companies = ids.length ? await databases.listDocuments({ databaseId: databaseId(), collectionId: 'companies', queries: [Query.equal('$id', ids), Query.limit(Math.min(ids.length, 100))] }) : { documents: [] };
    const byId = new Map(companies.documents.map((row: any) => [row.$id, deserialize('companies', row)]));
    rows.forEach((row) => { row.companies = byId.get(row.company_id) || null; });
  }
  if (table === 'saved_jobs' && selection.includes('jobs')) {
    const ids = Array.from(new Set(rows.map((row) => row.job_id).filter(Boolean)));
    const jobs = ids.length ? await databases.listDocuments({ databaseId: databaseId(), collectionId: 'jobs', queries: [Query.equal('$id', ids), Query.limit(Math.min(ids.length, 100))] }) : { documents: [] };
    const hydrated = await hydrateRelations(databases, 'jobs', jobs.documents.map((row: any) => deserialize('jobs', row)), selection);
    const byId = new Map(hydrated.map((row: any) => [row.id, row]));
    rows.forEach((row) => { row.jobs = byId.get(row.job_id) || null; });
  }
  if (table === 'jobs' && selection.includes('job_recruiters')) {
    const jobIds = rows.map((row) => row.id).filter(Boolean);
    const links = jobIds.length ? await databases.listDocuments({ databaseId: databaseId(), collectionId: 'job_recruiters', queries: [Query.equal('job_id', jobIds), Query.limit(100)] }) : { documents: [] };
    const recruiterIds = Array.from(new Set(links.documents.map((row: any) => row.recruiter_id).filter(Boolean)));
    const recruiters = recruiterIds.length ? await databases.listDocuments({ databaseId: databaseId(), collectionId: 'recruiters', queries: [Query.equal('$id', recruiterIds), Query.limit(100)] }) : { documents: [] };
    const recruitersById = new Map(recruiters.documents.map((row: any) => [row.$id, deserialize('recruiters', row)]));
    rows.forEach((row) => {
      row.job_recruiters = links.documents
        .filter((link: any) => link.job_id === row.id)
        .map((link: any) => ({ recruiters: recruitersById.get(link.recruiter_id) || null }));
    });
  }
  return rows;
}

type Operation = 'select' | 'insert' | 'update' | 'upsert' | 'delete';

function selectedAttributes(selection: string) {
  if (!selection || selection.includes('*')) return [];
  const fields: string[] = [];
  let depth = 0;
  let token = '';
  for (const character of selection) {
    if (character === '(') depth += 1;
    if (character === ')') depth -= 1;
    if (character === ',' && depth === 0) {
      if (token.trim() && !token.includes('(')) fields.push(token.trim());
      token = '';
    } else {
      token += character;
    }
  }
  if (token.trim() && !token.includes('(')) fields.push(token.trim());
  const attributes = fields.map((field) => field === 'id' ? '$id' : field);
  if (selection.includes('companies') && !attributes.includes('company_id')) attributes.push('company_id');
  return Array.from(new Set(attributes));
}

class AppwriteQuery implements PromiseLike<any> {
  private operation: Operation = 'select';
  private selection = '*';
  private filters: string[] = [];
  private orders: string[] = [];
  private offsetValue = 0;
  private limitValue = 25;
  private payload: any;
  private wantCount = false;
  private singleMode: 'none' | 'single' | 'maybe' = 'none';
  private conflictFields: string[] = [];
  private returnRows = false;

  constructor(private databases: Databases, private table: string) {}

  select(selection = '*', options?: { count?: string }) { this.selection = selection; this.wantCount = Boolean(options?.count); if (this.operation !== 'select') this.returnRows = true; return this; }
  insert(payload: any) { this.operation = 'insert'; this.payload = payload; return this; }
  update(payload: any) { this.operation = 'update'; this.payload = payload; return this; }
  upsert(payload: any, options?: { onConflict?: string; ignoreDuplicates?: boolean }) { this.operation = 'upsert'; this.payload = payload; this.conflictFields = options?.onConflict?.split(',').map((v) => v.trim()).filter(Boolean) || []; return this; }
  delete(_options?: { count?: string }) { this.operation = 'delete'; this.wantCount = true; return this; }
  eq(field: string, value: any) { this.filters.push(Query.equal(field === 'id' ? '$id' : field, value)); return this; }
  is(field: string, value: any) { this.filters.push(value === null ? Query.isNull(field) : Query.equal(field, value)); return this; }
  gte(field: string, value: any) { this.filters.push(Query.greaterThanEqual(field, value)); return this; }
  in(field: string, values: any[]) { this.filters.push(Query.equal(field === 'id' ? '$id' : field, values)); return this; }
  ilike(field: string, pattern: string) { this.filters.push(Query.contains(field, pattern.replace(/^%|%$/g, '').replace(/\\([%_])/g, '$1'))); return this; }
  or(expression: string) {
    const clauses = expression.split(',').map((clause) => {
      const match = clause.match(/^([a-zA-Z0-9_$]+)\.ilike\.(.*)$/);
      return match ? Query.search(match[1], match[2].replace(/^%|%$/g, '').replace(/\\([%_])/g, '$1')) : null;
    }).filter(Boolean) as string[];
    if (clauses.length) this.filters.push(Query.or(clauses));
    return this;
  }
  order(field: string, options?: { ascending?: boolean }) { const attribute = field === 'id' ? '$id' : field === 'created_at' ? '$createdAt' : field === 'updated_at' ? '$updatedAt' : field; this.orders.push(options?.ascending ? Query.orderAsc(attribute) : Query.orderDesc(attribute)); return this; }
  range(from: number, to: number) { this.offsetValue = from; this.limitValue = Math.max(1, to - from + 1); return this; }
  limit(value: number) { this.limitValue = value; return this; }
  single() { this.singleMode = 'single'; this.limitValue = Math.min(this.limitValue, 2); return this; }
  maybeSingle() { this.singleMode = 'maybe'; this.limitValue = Math.min(this.limitValue, 2); return this; }

  private async findConflictRow(payload: Record<string, any>) {
    if (!this.conflictFields.length) return null;
    const queries = this.conflictFields.map((field) => Query.equal(field, payload[field]));
    queries.push(Query.limit(1));
    const result = await this.databases.listDocuments({ databaseId: databaseId(), collectionId: this.table, queries });
    return result.documents[0] || null;
  }

  private format(rows: any[], total = rows.length, error: any = null) {
    if (this.singleMode !== 'none') {
      if (!rows.length && this.singleMode === 'single') return { data: null, error: error || new Error('Row not found'), count: 0 };
      return { data: rows[0] || null, error, count: rows.length };
    }
    return { data: rows, error, count: total };
  }

  private async execute() {
    try {
      if (this.operation === 'select') {
        const attributes = selectedAttributes(this.selection);
        const queries = [...this.filters, ...this.orders];
        if (attributes.length) queries.push(Query.select(attributes));
        queries.push(Query.limit(Math.min(this.limitValue, 100)), Query.offset(this.offsetValue));
        const result = await this.databases.listDocuments({ databaseId: databaseId(), collectionId: this.table, queries, total: this.wantCount });
        const rows = await hydrateRelations(this.databases, this.table, result.documents.map((row: any) => deserialize(this.table, row)), this.selection);
        return this.format(rows, result.total);
      }

      if (this.operation === 'insert') {
        const input = Array.isArray(this.payload) ? this.payload : [this.payload];
        const rows = [];
        for (const item of input) {
          const row = await this.databases.createDocument({ databaseId: databaseId(), collectionId: this.table, documentId: item.id || ID.unique(), data: serialize(this.table, item) });
          rows.push(deserialize(this.table, row));
        }
        return this.format(this.returnRows ? rows : rows, rows.length);
      }

      if (this.operation === 'upsert') {
        const input = Array.isArray(this.payload) ? this.payload : [this.payload];
        const rows = [];
        for (const item of input) {
          const conflict = item.id ? null : await this.findConflictRow(item);
          const rowId = item.id || conflict?.$id || ID.unique();
          const row = await this.databases.upsertDocument({ databaseId: databaseId(), collectionId: this.table, documentId: rowId, data: serialize(this.table, item) });
          rows.push(deserialize(this.table, row));
        }
        return this.format(rows, rows.length);
      }

      if (this.operation === 'update') {
        const result = await this.databases.updateDocuments({ databaseId: databaseId(), collectionId: this.table, data: serialize(this.table, this.payload), queries: this.filters });
        const rows = (result.documents || []).map((row: any) => deserialize(this.table, row));
        return this.format(rows, result.total);
      }

      const result = await this.databases.deleteDocuments({ databaseId: databaseId(), collectionId: this.table, queries: this.filters });
      return this.format([], result.total);
    } catch (error: any) {
      return this.format([], 0, { message: error.message, code: String(error.code || error.type || 'APPWRITE_ERROR') });
    }
  }

  then<TResult1 = any, TResult2 = never>(onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null) {
    return this.execute().then(onfulfilled, onrejected);
  }
}

export function mapAppwriteUser(user: any) {
  return user ? { ...user, id: user.$id, user_metadata: { name: user.name, avatar_url: user.prefs?.avatar_url }, app_metadata: { provider: user.prefs?.provider || 'email' } } : null;
}

export function setAppwriteSessionCookie(secret: string, expire: string) {
  cookies().set(APPWRITE_SESSION_COOKIE(), secret, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', expires: new Date(expire), path: '/' });
}

export function createClient() {
  const session = cookies().get(APPWRITE_SESSION_COOKIE())?.value;
  const { databases, users } = createAdminServices();
  return {
    from: (table: string) => new AppwriteQuery(databases, table),
    auth: {
      getUser: async () => {
        if (!session) return { data: { user: null }, error: null };
        try { const user = await createSessionServices(session).account.get(); return { data: { user: mapAppwriteUser(user) }, error: null }; }
        catch (error: any) { return { data: { user: null }, error: { message: error.message } }; }
      },
      signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
        try { const created = await createAdminServices().account.createEmailPasswordSession({ email, password }); setAppwriteSessionCookie(created.secret, created.expire); const user = await createSessionServices(created.secret).account.get(); return { data: { user: mapAppwriteUser(user), session: created }, error: null }; }
        catch (error: any) { return { data: { user: null, session: null }, error: { message: error.message } }; }
      },
      signUp: async ({ email, password, options }: any) => {
        try { const user = await users.create({ userId: ID.unique(), email, password, name: options?.data?.name || '' }); const created = await createAdminServices().account.createEmailPasswordSession({ email, password }); setAppwriteSessionCookie(created.secret, created.expire); return { data: { user: mapAppwriteUser(user), session: created }, error: null }; }
        catch (error: any) { return { data: { user: null, session: null }, error: { message: error.message } }; }
      },
      signOut: async () => {
        try { if (session) await createSessionServices(session).account.deleteSession({ sessionId: 'current' }); } catch { /* expired sessions are already signed out */ }
        cookies().delete(APPWRITE_SESSION_COOKIE());
        return { error: null };
      },
    },
  };
}

export function createServiceClient() {
  const { databases } = createAdminServices();
  return { from: (table: string) => new AppwriteQuery(databases, table) };
}

export type AppwriteBackendClient = ReturnType<typeof createClient>;
export type AppwriteUser = ReturnType<typeof mapAppwriteUser>;
