import { NextResponse } from 'next/server';
import { z } from 'zod';
import { assistant, ASSISTANT_MODEL, parseAssistantJson } from '@/lib/assistant';

export const dynamic = 'force-dynamic';

const ResumeParseRequest = z.object({
  text: z.string().min(40).max(24000),
  fileName: z.string().optional(),
});

type ResumeProfile = {
  summary: string;
  focusRoles: string[];
  skills: string[];
  seniorityLevel: 'junior' | 'mid' | 'senior';
  yearsExperience: number;
  preferredWorkModes: string[];
  preferredLocations: string[];
  workModes: string[];
  locations: string[];
  chips: string[];
  fileName?: string;
};

const resumeProfileSchema = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    focusRoles: { type: 'array', items: { type: 'string' } },
    skills: { type: 'array', items: { type: 'string' } },
    seniorityLevel: { type: 'string', enum: ['junior', 'mid', 'senior'] },
    yearsExperience: { type: 'number' },
    preferredWorkModes: { type: 'array', items: { type: 'string' } },
    preferredLocations: { type: 'array', items: { type: 'string' } },
    workModes: { type: 'array', items: { type: 'string' } },
    locations: { type: 'array', items: { type: 'string' } },
    chips: { type: 'array', items: { type: 'string' } },
  },
  required: [
    'summary',
    'focusRoles',
    'skills',
    'seniorityLevel',
    'yearsExperience',
    'preferredWorkModes',
    'preferredLocations',
    'workModes',
    'locations',
    'chips',
  ],
  additionalProperties: false,
} as const;

function normalizeProfile(profile: ResumeProfile, fileName?: string): ResumeProfile {
  const workModes = (profile.preferredWorkModes?.length ? profile.preferredWorkModes : profile.workModes || []).slice(0, 3);
  const locations = (profile.preferredLocations?.length ? profile.preferredLocations : profile.locations || []).slice(0, 4);
  const focusRoles = (profile.focusRoles || []).filter(Boolean).slice(0, 4);
  const skills = (profile.skills || []).filter(Boolean).slice(0, 10);
  const chips = (profile.chips?.length ? profile.chips : [...focusRoles, ...workModes, ...locations.slice(0, 1), ...skills.slice(0, 2)])
    .filter(Boolean)
    .filter((value, index, array) => array.indexOf(value) === index)
    .slice(0, 6);

  return {
    ...profile,
    fileName,
    focusRoles,
    skills,
    preferredWorkModes: workModes,
    preferredLocations: locations,
    workModes,
    locations,
    chips,
    summary: profile.summary || focusRoles.join(' + ') || 'Resume profile',
    yearsExperience: Number.isFinite(profile.yearsExperience) ? Math.max(0, Math.round(profile.yearsExperience)) : 0,
  };
}

export async function POST(req: Request) {
  const parsed = ResumeParseRequest.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Send raw resume text between 40 and 24000 characters.' }, { status: 400 });
  }

  if (!process.env.ASSISTANT_API_KEY && !process.env[['G', 'ROQ_API_KEY'].join('')]) {
    return NextResponse.json({ error: 'Resume parsing is not configured.' }, { status: 503 });
  }

  try {
    const completion = await assistant.chat.completions.create({
      model: ASSISTANT_MODEL,
      temperature: 0.15,
      max_completion_tokens: 900,
      messages: [
        {
          role: 'system',
          content: [
            'You parse resumes for Emploid, a job search app focused on trustworthy job listings.',
            'Return a compact JSON profile that can be used for semantic job matching.',
            'Infer transferable skills and role families from the resume text. Do not invent degrees, employers, or certifications.',
            'Use workModes and locations as aliases of preferredWorkModes and preferredLocations for compatibility with the existing client.',
            `Return only valid JSON matching this schema: ${JSON.stringify(resumeProfileSchema)}.`,
          ].join(' '),
        },
        {
          role: 'user',
          content: `Resume text:\n${parsed.data.text}`,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const profile = parseAssistantJson<ResumeProfile>(completion.choices?.[0]?.message?.content, {
      summary: 'Resume profile',
      focusRoles: [],
      skills: [],
      seniorityLevel: 'junior',
      yearsExperience: 0,
      preferredWorkModes: [],
      preferredLocations: [],
      workModes: [],
      locations: [],
      chips: [],
    });

    return NextResponse.json(normalizeProfile(profile, parsed.data.fileName));
  } catch (error) {
    console.error('[RESUME_PARSE_ERROR]', error);
    return NextResponse.json({ error: 'Could not parse the resume right now.' }, { status: 502 });
  }
}
