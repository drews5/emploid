import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your_anon_key'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const COMPANIES = [
  { name: 'Vercel', slug: 'vercel', industry: 'Platform', size: '201-500', website: 'https://vercel.com', employee_count: 400, hiring_velocity_90d: 15, avg_ghost_score: 95, total_active_listings: 15 },
  { name: 'Dropbox', slug: 'dropbox', industry: 'Cloud Storage', size: '1001-5000', website: 'https://dropbox.com', employee_count: 3100, hiring_velocity_90d: 40, avg_ghost_score: 85, total_active_listings: 40 },
  { name: 'Retool', slug: 'retool', industry: 'Developer Tools', size: '201-500', website: 'https://retool.com', employee_count: 350, hiring_velocity_90d: 20, avg_ghost_score: 90, total_active_listings: 20 },
  { name: 'Slack', slug: 'slack', industry: 'Collaboration', size: '5000+', website: 'https://slack.com', employee_count: 5500, hiring_velocity_90d: 90, avg_ghost_score: 88, total_active_listings: 90 },
  { name: 'Netflix', slug: 'netflix', industry: 'Entertainment', size: '5000+', website: 'https://netflix.com', employee_count: 12000, hiring_velocity_90d: 120, avg_ghost_score: 92, total_active_listings: 120 },
  { name: 'Airbnb', slug: 'airbnb', industry: 'Travel', size: '5000+', website: 'https://airbnb.com', employee_count: 6800, hiring_velocity_90d: 60, avg_ghost_score: 85, total_active_listings: 60 },
  { name: 'Stripe', slug: 'stripe', industry: 'Fintech', size: '5000+', website: 'https://stripe.com', employee_count: 7000, hiring_velocity_90d: 200, avg_ghost_score: 96, total_active_listings: 200 },
  { name: 'Shopify', slug: 'shopify', industry: 'E-commerce', size: '5000+', website: 'https://shopify.com', employee_count: 10000, hiring_velocity_90d: 150, avg_ghost_score: 80, total_active_listings: 150 },
  { name: 'Tesla', slug: 'tesla', industry: 'Automotive', size: '5000+', website: 'https://tesla.com', employee_count: 120000, hiring_velocity_90d: 500, avg_ghost_score: 75, total_active_listings: 500 },
  { name: 'Linear', slug: 'linear', industry: 'Project Management', size: '1-50', website: 'https://linear.app', employee_count: 50, hiring_velocity_90d: 5, avg_ghost_score: 98, total_active_listings: 5 }
]

const TITLES = ['Senior Software Engineer', 'Product Manager', 'UX Designer', 'Data Scientist', 'Engineering Manager']
const LOCATIONS = ['San Francisco, CA', 'New York, NY', 'Remote', 'London, UK', 'Austin, TX']

async function seed() {
  console.log('Seeding companies...')
  const { data: companies, error: compErr } = await supabase
    .from('companies')
    .insert(COMPANIES)
    .select()

  if (compErr || !companies) {
    console.error('Error seeding companies:', compErr)
    return
  }

  console.log('Seeding recruiters...')
  const recruiters = companies.map(c => ({
    company_id: c.id,
    name: 'Jane Doe ' + c.name,
    title: 'Technical Recruiter',
    email: 'jane.doe@' + c.slug + '.com'
  }))
  
  const { data: recs, error: recErr } = await supabase
    .from('recruiters')
    .insert(recruiters)
    .select()

  if (recErr || !recs) {
    console.error('Error seeding recruiters:', recErr)
    return
  }

  console.log('Seeding jobs...')
  const jobs = []
  for (let i = 0; i < 150; i++) {
    const comp = companies[Math.floor(Math.random() * companies.length)]
    const title = TITLES[Math.floor(Math.random() * TITLES.length)]
    const daysAgo = Math.floor(Math.random() * 100)
    const d = new Date()
    d.setDate(d.getDate() - daysAgo)

    const isGhost = Math.random() < 0.3 // 30% likely ghost
    const isUncertain = !isGhost && Math.random() < 0.43 // 30% uncertain

    let score = 90
    if (isGhost) score = Math.floor(Math.random() * 49)
    else if (isUncertain) score = Math.floor(Math.random() * 29) + 50
    else score = Math.floor(Math.random() * 21) + 80

    jobs.push({
      title,
      company_id: comp.id,
      location: LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)],
      remote_type: Math.random() > 0.5 ? 'remote' : 'hybrid',
      salary_min: 100000 + Math.floor(Math.random() * 50000),
      salary_max: 160000 + Math.floor(Math.random() * 80000),
      description: 'We are seeking an experienced ' + title + ' to join our fast-growing team at ' + comp.name + '.\n\nResponsibilities:\n- Build scalable systems using React and Node.js\n- Mentor junior developers\n- Lead architectural decisions\n- Collaborate cross-functionally',
      requirements: [
        '5+ years of professional experience',
        'Strong proficiency in TypeScript and React',
        'Experience with cloud infrastructure (AWS/GCP/Azure)',
        'Excellent communication and collaboration skills'
      ],
      source: 'company_direct',
      apply_url: 'https://careers.' + comp.slug + '.com/jobs/' + Math.floor(Math.random() * 100000),
      experience_level: 'senior',
      job_type: 'full-time',
      ghost_score: score,
      ghost_factors: { "days_active": { score: score } },
      posted_at: d.toISOString(),
      repost_count: isGhost ? Math.floor(Math.random() * 5) + 1 : 0
    })
  }

  const { data: insertedJobs, error: jobErr } = await supabase
    .from('jobs')
    .insert(jobs)
    .select()

  if (jobErr || !insertedJobs) {
    console.error('Error seeding jobs:', jobErr)
    return
  }

  console.log('Mapping recruiters to jobs...')
  const jrs = []
  for (const j of insertedJobs) {
    if (j.ghost_score > 60) {
      const rec = recs.find(r => r.company_id === j.company_id)
      if (rec) {
        jrs.push({ job_id: j.id, recruiter_id: rec.id })
      }
    }
  }
  
  const { error: jrErr } = await supabase.from('job_recruiters').insert(jrs)
  if (jrErr) console.error('Error linking recruiters:', jrErr)

  console.log('Seeding complete! 10 companies, 150 jobs, 10 recruiters.')
}

seed().catch(console.error)
