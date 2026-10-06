import { NextRequest, NextResponse } from 'next/server';
import { TinyFishClient } from '@/lib/tinyfish/client';
import { extractJobsViaAgent, searchExactJobs, type ExactJobHit } from '@/lib/tinyfish/exact-jobs';
import { countryName } from '@/lib/countries';
import { calculateMatchScore } from '@/lib/matching/engine';
import type { Job, JobSearchRequestBody, UserPreferences } from '@/types/job';

const DEFAULT_PREFERENCES: UserPreferences = {
  roles: ['Software Engineer', 'Full Stack Developer', 'Frontend Engineer'],
  locations: ['Remote', 'San Francisco'],
  keywords: ['React', 'TypeScript', 'Node.js'],
  seniority: ['mid', 'senior'],
  visa_sponsorship: false,
  job_types: ['full-time'],
  exclude_keywords: [],
};

export async function POST(request: NextRequest) {
  try {
    const body: JobSearchRequestBody = await request.json();
    const {
      query,
      location,
      country,
      language,
      seniority,
      visa_sponsorship,
      api_key,
      preferences,
      deep,
    } = body;

    if (!api_key) {
      return NextResponse.json(
        { error: 'TinyFish API key is required. Add it in Settings.' },
        { status: 401 }
      );
    }

    if (!query?.trim()) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    // Initialize TinyFish client with user's API key
    const tinyfish = new TinyFishClient(api_key);

    // `location` is free text (any city/country worldwide, or "Remote").
    // `country` is an ISO code (US, IN, DE…). When the location box is empty,
    // the selected country doubles as the location text — otherwise the query
    // would contain no geography and the dropdown would be a no-op.
    const locationText = location?.trim() ?? '';
    const countryCode =
      country && country.toUpperCase() !== 'WORLDWIDE' ? country.toUpperCase() : undefined;
    const effectiveLocation = locationText || countryName(countryCode);

    // Saved preferences drive match scoring; fall back to defaults.
    const activePreferences: UserPreferences = {
      ...DEFAULT_PREFERENCES,
      ...preferences,
      roles:
        preferences?.roles?.length ? preferences.roles : DEFAULT_PREFERENCES.roles,
      locations: effectiveLocation
        ? [effectiveLocation]
        : preferences?.locations?.length
          ? preferences.locations
          : DEFAULT_PREFERENCES.locations,
      seniority: seniority
        ? [seniority]
        : preferences?.seniority?.length
          ? preferences.seniority
          : DEFAULT_PREFERENCES.seniority,
      visa_sponsorship: visa_sponsorship ?? preferences?.visa_sponsorship ?? false,
    };

    // Exact-listings pipeline: ATS-restricted search (deep links) + broad search
    // expanded via batched Fetch(links:true). Every hit has a direct posting URL,
    // so Apply lands on the listing — not a portal search page.
    // (Search+Fetch are free; Agent deep-scrape runs only when deep=true.)
    const outcome = await searchExactJobs(tinyfish, query, {
      locationText: effectiveLocation,
      countryCode,
      ...(language ? { language } : {}),
    });

    const hits: ExactJobHit[] = outcome.hits;

    // Opt-in Agent deep scan for JS-heavy boards Fetch couldn't expand.
    // Paid (wallet) and slow — capped at 2 boards, failures are non-fatal.
    let deepScanned = 0;
    if (deep && outcome.agentCandidates.length > 0) {
      const settled = await Promise.allSettled(
        outcome.agentCandidates.map((url) =>
          extractJobsViaAgent(tinyfish, url, query.trim(), effectiveLocation)
        )
      );
      const seen = new Set(hits.map((h) => h.application_url));
      for (const result of settled) {
        if (result.status !== 'fulfilled') continue;
        deepScanned += 1;
        for (const hit of result.value) {
          if (seen.has(hit.application_url)) continue;
          seen.add(hit.application_url);
          hits.push(hit);
        }
      }
    }

    // Transform exact hits into Job objects
    const jobsWithScores: Job[] = hits
      .map((hit, index) => {
        const job: Job = {
          id: `job-${index}-${Date.now()}`,
          title: hit.title || 'Untitled Position',
          company: hit.company || 'Unknown Company',
          location: hit.location || effectiveLocation || 'Not specified',
          type: 'full-time',
          seniority: (seniority as Job['seniority']) || 'mid',
          remote:
            hit.location?.toLowerCase().includes('remote') ||
            hit.description?.toLowerCase().includes('remote') ||
            effectiveLocation.toLowerCase() === 'remote' ||
            false,
          description: hit.description || '',
          requirements: [],
          skills: extractSkills(`${hit.title} ${hit.description}`) || [],
          application_url: hit.application_url,
          source: hit.source || 'web',
          posted_at: new Date(),
          scraped_at: new Date(),
          content_hash: '',
        };

        const matchResult = calculateMatchScore(job, activePreferences);

        return {
          ...job,
          match_score: matchResult.score,
        };
      })
      .sort((a, b) => (b.match_score || 0) - (a.match_score || 0));

    return NextResponse.json({
      jobs: jobsWithScores,
      total: jobsWithScores.length,
      query,
      location: effectiveLocation || undefined,
      deep,
      deepScanned,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Job search error:', error);

    if (error instanceof Error && error.message.includes('TinyFish')) {
      const statusMatch = error.message.match(/TinyFish \w+ API error: (\d+)/);
      const status = statusMatch ? parseInt(statusMatch[1], 10) : 500;

      if (status === 401) {
        return NextResponse.json(
          {
            error:
              'Invalid or missing TinyFish API key. Get a key at https://agent.tinyfish.ai/api-keys and save it in Settings. The key is sent as the X-API-Key header.',
          },
          { status: 401 }
        );
      }
      if (status === 429) {
        return NextResponse.json(
          { error: 'TinyFish rate limit exceeded. Wait a minute and try again.' },
          { status: 429 }
        );
      }
      if (status === 400) {
        return NextResponse.json(
          { error: 'Invalid search request. Check your query and try again.' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'TinyFish API error. Check your key in Settings and try again.' },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to search jobs. Please try again.' },
      { status: 500 }
    );
  }
}

function extractSkills(snippet?: string): string[] {
  if (!snippet) return [];

  // Common tech skills to look for
  const techSkills = [
    'React', 'TypeScript', 'JavaScript', 'Node.js', 'Python', 'Java',
    'Go', 'Rust', 'AWS', 'Docker', 'Kubernetes', 'GraphQL', 'REST',
    'MongoDB', 'PostgreSQL', 'Redis', 'Next.js', 'Vue', 'Angular',
    'React Native', 'Flutter', 'Swift', 'Kotlin', 'TensorFlow',
  ];

  const found: string[] = [];
  for (const skill of techSkills) {
    if (snippet.toLowerCase().includes(skill.toLowerCase())) {
      found.push(skill);
    }
  }

  return found;
}
