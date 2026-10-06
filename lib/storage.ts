import type { Application, Job, UserPreferences } from '@/types/job';

const KEYS = {
  savedJobs: 'saved_jobs',
  applications: 'job_applications',
  preferences: 'user_preferences',
} as const;

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

/** Revive ISO date strings back into Dates after JSON round-trip. */
function reviveJob(job: Job): Job {
  return {
    ...job,
    posted_at: new Date(job.posted_at),
    scraped_at: new Date(job.scraped_at),
  };
}

// --- Saved jobs ---

export function getSavedJobs(): Job[] {
  return read<Job[]>(KEYS.savedJobs, []).map(reviveJob);
}

export function isJobSaved(jobId: string): boolean {
  return getSavedJobs().some((j) => j.id === jobId);
}

/** Toggle save. Returns true if the job is now saved. */
export function toggleSaveJob(job: Job): boolean {
  const saved = getSavedJobs();
  if (saved.some((j) => j.id === job.id)) {
    write(KEYS.savedJobs, saved.filter((j) => j.id !== job.id));
    return false;
  }
  write(KEYS.savedJobs, [job, ...saved]);
  return true;
}

export function removeSavedJob(jobId: string): void {
  write(
    KEYS.savedJobs,
    getSavedJobs().filter((j) => j.id !== jobId)
  );
}

// --- Applications ---

export function getApplications(): Application[] {
  const apps = read<Application[]>(KEYS.applications, []);
  return apps.map((a) => ({
    ...a,
    applied_at: a.applied_at ? new Date(a.applied_at) : undefined,
    follow_up_date: a.follow_up_date ? new Date(a.follow_up_date) : undefined,
    job: a.job ? reviveJob(a.job) : undefined,
  }));
}

/** Create (or refresh) an application entry for a job. Defaults to `saved`. */
export function trackApplication(job: Job): Application {
  const apps = getApplications();
  const existing = apps.find((a) => a.job_id === job.id);
  if (existing) {
    const updated = { ...existing, job };
    write(
      KEYS.applications,
      apps.map((a) => (a.job_id === job.id ? updated : a))
    );
    return updated;
  }
  const entry: Application = {
    id: `app-${Date.now()}`,
    job_id: job.id,
    job,
    status: 'saved',
  };
  write(KEYS.applications, [entry, ...apps]);
  return entry;
}

export function isJobTracked(jobId: string): boolean {
  return getApplications().some((a) => a.job_id === jobId);
}

export function updateApplication(
  id: string,
  patch: Partial<Pick<Application, 'status' | 'notes' | 'applied_at' | 'follow_up_date'>>
): void {
  const apps = getApplications().map((a) => {
    if (a.id !== id) return a;
    const next = { ...a, ...patch };
    if (patch.status === 'applied' && !a.applied_at) {
      next.applied_at = new Date();
    }
    return next;
  });
  write(KEYS.applications, apps);
}

export function removeApplication(id: string): void {
  write(
    KEYS.applications,
    getApplications().filter((a) => a.id !== id)
  );
}

// --- Preferences ---

export function getStoredPreferences(): UserPreferences | null {
  return read<UserPreferences | null>(KEYS.preferences, null);
}
