import type { Job, UserPreferences } from '@/types/job';

interface MatchResult {
  score: number;
  reasons: string[];
}

export function calculateMatchScore(job: Job, preferences: UserPreferences): MatchResult {
  let score = 0;
  const reasons: string[] = [];
  const maxScore = 100;

  // Role matching (0-30 points)
  const roleMatch = preferences.roles.some((role) =>
    job.title.toLowerCase().includes(role.toLowerCase())
  );
  if (roleMatch) {
    score += 30;
    reasons.push('Role matches your preferences');
  }

  // Location matching (0-20 points)
  const locationMatch = preferences.locations.some((loc) => {
    const jobLoc = job.location.toLowerCase();
    const prefLoc = loc.toLowerCase();
    
    // Exact match
    if (jobLoc.includes(prefLoc) || prefLoc.includes(jobLoc)) return true;
    
    // Remote check
    if (prefLoc === 'remote' && job.remote) return true;
    
    return false;
  });
  if (locationMatch) {
    score += 20;
    reasons.push('Location matches');
  }

  // Seniority matching (0-15 points)
  if (job.seniority && preferences.seniority.includes(job.seniority)) {
    score += 15;
    reasons.push('Seniority level matches');
  }

  // Skills/keywords matching (0-20 points)
  const matchedKeywords = preferences.keywords.filter((keyword) => {
    const lowerKeyword = keyword.toLowerCase();
    return (
      job.title.toLowerCase().includes(lowerKeyword) ||
      job.description.toLowerCase().includes(lowerKeyword) ||
      job.skills?.some((skill) => skill.toLowerCase().includes(lowerKeyword))
    );
  });
  
  if (matchedKeywords.length > 0) {
    const keywordScore = Math.min((matchedKeywords.length / preferences.keywords.length) * 20, 20);
    score += keywordScore;
    reasons.push(`${matchedKeywords.length} skill(s) matched: ${matchedKeywords.join(', ')}`);
  }

  // Visa sponsorship (0-10 points)
  if (preferences.visa_sponsorship && job.visa_sponsorship) {
    score += 10;
    reasons.push('Offers visa sponsorship');
  }

  // Job type matching (0-5 points)
  if (job.type && preferences.job_types.includes(job.type)) {
    score += 5;
    reasons.push('Job type matches');
  }

  // Penalize excluded keywords
  const hasExcluded = preferences.exclude_keywords.some((excluded) => {
    const lowerExcluded = excluded.toLowerCase();
    return job.title.toLowerCase().includes(lowerExcluded);
  });
  
  if (hasExcluded) {
    score = Math.max(score - 20, 0);
    reasons.push('Contains excluded keywords');
  }

  return {
    score: Math.min(score, maxScore),
    reasons,
  };
}

export function rankJobs(jobs: Job[], preferences: UserPreferences): Job[] {
  const jobsWithScores = jobs.map((job) => {
    const matchResult = calculateMatchScore(job, preferences);
    return {
      ...job,
      match_score: matchResult.score,
      match_reasons: matchResult.reasons,
    };
  });

  // Sort by match score descending
  return jobsWithScores.sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
}

export function filterJobs(jobs: Job[], preferences: UserPreferences): Job[] {
  return jobs.filter((job) => {
    // Filter by visa sponsorship if required
    if (preferences.visa_sponsorship && !job.visa_sponsorship) {
      return false;
    }

    // Filter by job type
    if (preferences.job_types.length > 0 && job.type) {
      if (!preferences.job_types.includes(job.type)) {
        return false;
      }
    }

    // Filter by salary minimum
    if (preferences.salary_min && job.salary) {
      if (job.salary.min < preferences.salary_min) {
        return false;
      }
    }

    return true;
  });
}
