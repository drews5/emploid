import { z } from 'zod';

// ── Auth ──────────────────────────────────────────────
export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

export const SignupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  name: z.string().min(1, 'Name is required').max(100),
});

// ── Profile ───────────────────────────────────────────
export const ProfileUpdateSchema = z.object({
  preferred_titles: z.array(z.string().max(100)).max(20).optional(),
  preferred_locations: z.array(z.string().max(100)).max(20).optional(),
  preferred_salary_min: z.number().int().min(0).max(1_000_000).optional(),
  experience_level: z.enum(['intern', 'entry', 'mid', 'senior', 'executive']).optional(),
});

// ── Jobs ──────────────────────────────────────────────
export const JobIdSchema = z.object({
  job_id: z.string().uuid('Invalid job ID'),
});

// ── Saved Jobs ────────────────────────────────────────
export const SaveJobSchema = z.object({
  job_id: z.string().uuid('Invalid job ID'),
});

export const UpdateSavedJobSchema = z.object({
  status: z.enum(['saved', 'applied', 'interview', 'offer', 'rejected']).optional(),
  notes: z.string().max(5000).optional(),
  applied_at: z.string().datetime().nullable().optional(),
});
