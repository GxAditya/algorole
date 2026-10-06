import { TinyFishClient } from './client';
import type { Job } from '@/types/job';

export interface JobSearchOptions {
  /** Free-text location: city, region, country, or "Remote". Works worldwide. */
  location?: string;
  /** ISO 3166-1 alpha-2 country code for geo-targeting (e.g. 'US', 'IN', 'DE'). Omit for worldwide. */
  country?: string;
  language?: string;
}

export async function searchJobs(
  tinyfish: TinyFishClient,
  query: string,
  locationOrOptions?: string | JobSearchOptions
): Promise<Partial<Job>[]> {
  try {
    const options: JobSearchOptions =
      typeof locationOrOptions === 'string'
        ? { location: locationOrOptions }
        : locationOrOptions ?? {};

    const locationText = options.location?.trim() ?? '';
    const searchResults = await tinyfish.search({
      query: locationText ? `${query} jobs ${locationText}` : `${query} jobs`,
      purpose: 'Find job listings from career pages and job portals',
      // Only send a country code when the user picked one — otherwise search worldwide.
      ...(options.country ? { location: options.country.toUpperCase() } : {}),
      ...(options.language ? { language: options.language } : {}),
      recency_minutes: 43200, // 30 days
    });

    // Extract structured job data from search results.
    // Real API returns { title, url, snippet, site_name, position }.
    const jobs: Partial<Job>[] = (searchResults.results ?? []).map((result) => ({
      title: result.title,
      source: result.site_name || result.source,
      application_url: result.url,
      description: result.snippet,
    }));

    return jobs;
  } catch (error) {
    console.error('Job search failed:', error);
    throw error;
  }
}

export async function scrapeCompanyCareerPage(
  tinyfish: TinyFishClient,
  companyUrl: string
): Promise<Partial<Job>[]> {
  try {
    const agentResult = await tinyfish.runAgent({
      url: companyUrl,
      goal: `Navigate to the careers or jobs page. Extract all job listings with the following information:
        - Job title
        - Location (city, state/country, or remote)
        - Department/team
        - Job type (full-time, part-time, contract, internship)
        - Application URL
        
        Return JSON matching the schema.`,
      // Top-level must be an OBJECT with a results array (per TinyFish docs).
      output_schema: {
        type: 'object',
        properties: {
          results: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                location: { type: 'string' },
                department: { type: 'string', nullable: true },
                type: { type: 'string', nullable: true },
                url: { type: 'string' },
              },
              required: ['title', 'url'],
            },
          },
        },
        required: ['results'],
      },
    });

    const raw = agentResult.result as
      | { results?: Partial<Job>[] }
      | Partial<Job>[]
      | null;
    const jobs = Array.isArray(raw) ? raw : raw?.results ?? [];
    return (Array.isArray(jobs) ? jobs : []).map((job) => ({
      ...job,
      source: companyUrl,
      scraped_at: new Date(),
    }));
  } catch (error) {
    console.error(`Failed to scrape ${companyUrl}:`, error);
    throw error;
  }
}

export async function fetchJobDetails(
  tinyfish: TinyFishClient,
  jobUrl: string
): Promise<string> {
  try {
    const result = await tinyfish.fetch({
      urls: [jobUrl],
      format: 'markdown',
    });

    const first = result.results?.[0];
    return first?.text ?? first?.content ?? '';
  } catch (error) {
    console.error(`Failed to fetch job details from ${jobUrl}:`, error);
    throw error;
  }
}

export function generateContentHash(job: Partial<Job>): string {
  const content = [
    job.title,
    job.company,
    job.location,
    job.description?.substring(0, 100),
  ]
    .filter(Boolean)
    .join('|');
  
  // Simple hash function (in production, use a proper crypto hash)
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}
