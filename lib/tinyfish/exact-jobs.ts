import { TinyFishClient } from './client';
import type { TinyFishSearchResult } from '@/types/tinyfish';

export interface ExactJobHit {
  title: string;
  company: string;
  location: string;
  application_url: string;
  source: string;
  description: string;
  /** true = deep link to one posting (Apply lands on the form). false = portal/search page. */
  exact: boolean;
}

interface PipelineOptions {
  locationText?: string;
  countryCode?: string;
  language?: string;
  /** How many search hits to expand via Fetch (max 10 per Fetch call). Default 8. */
  expandLimit?: number;
}

// Applicant Tracking Systems — URLs here are almost always exact postings.
const ATS_DOMAINS = [
  'boards.greenhouse.io',
  'greenhouse.io',
  'jobs.lever.co',
  'lever.co',
  'jobs.ashbyhq.com',
  'ashbyhq.com',
  'apply.workable.com',
  'workable.com',
  'jobs.workday.com',
  'myworkdayjobs.com',
  'smartrecruiters.com',
  'icims.com',
  'successfactors.com',
  'taleo.net',
  'adp.com',
  'breezy.hr',
  'workos.com',
  'wellfound.com',
  'ycombinator.com',
];

// Search-result pages (plural / query URLs) — never exact, always expand via Fetch.
const PORTAL_SEARCH_PATTERNS = [
  /indeed\.com\/jobs\?/i,
  /linkedin\.com\/jobs\/search/i,
  /glassdoor\.com\/Job\/jobs/i,
  /simplyhired\.com\/search/i,
  /ziprecruiter\.com\/jobs-search/i,
  /monster\.com\/jobs\/search/i,
  /naukri\.com\/.*-jobs/i,
  /foundit\./i,
  /wellfound\.com\/jobs\?/i,
  /ycombinator\.com\/jobs\?/i,
  /\/careers\/?(\?|#|$)/i,
  /\/jobs\/?(\?|#|$)/i,
];

// Deep-link patterns — a single posting, Apply lands on the form.
const EXACT_JOB_PATTERNS = [
  /greenhouse\.io\/.*\/jobs\/\d+/i,
  /boards\.greenhouse\.io\/.*jobs\/\d+/i,
  /lever\.co\/.*\/[a-f0-9-]{8,}/i,
  /jobs\.lever\.co\/[^/]+\/[a-f0-9-]{8,}/i,
  /ashbyhq\.com\/.*\/[a-f0-9]{8,}/i,
  /jobs\.ashbyhq\.com\/[^/]+\/[a-f0-9]+/i,
  /workable\.com\/j\/[A-Z0-9]+/i,
  /apply\.workable\.com\/[^/]+\/j\/[A-Z0-9]+/i,
  /myworkdayjobs\.com\/.*\/job\//i,
  /jobs\.workday\.com\/.*\/job\//i,
  /smartrecruiters\.com\/[^/]+\/job\//i,
  /icims\.com\/jobs\/\d+/i,
  /successfactors\.com\/.*job/i,
  /taleo\.net\/.*job/i,
  /breezy\.hr\/.*\/p\/[a-f0-9]+/i,
  /wellfound\.com\/jobs\/\d+/i,
  /ycombinator\.com\/companies\/[^/]+\/jobs\/[^/]+/i,
  /linkedin\.com\/jobs\/view\/\d+/i,
  /indeed\.com\/viewjob/i,
  /glassdoor\.com\/job-listing\/[^/]+-JV_/i,
  /naukri\.com\/job-listings-/i,
  /\/job\/[\w-]+\d{4,}/i,
  /\/jobs\/[\w-]*\d{5,}/i,
  /\/posting\/[\w-]+/i,
  /\/position\/[\w-]+/i,
  /\/opening\/[\w-]+/i,
  /\/vacancy\/[\w-]+/i,
];

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
}

export function isExactJobUrl(url: string): boolean {
  if (PORTAL_SEARCH_PATTERNS.some((re) => re.test(url))) return false;
  if (EXACT_JOB_PATTERNS.some((re) => re.test(url))) return true;
  const host = hostOf(url);
  if (ATS_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`))) {
    // ATS host but not matching a deep pattern (e.g. a board index) → not exact.
    return /\/jobs?\//i.test(url) && !/\/jobs?\/?(\?|#|$)/i.test(url);
  }
  return false;
}

function companyFromResult(result: TinyFishSearchResult): string {
  if (result.title) {
    const parts = result.title.split(' - ');
    if (parts.length > 1) return parts[0].trim();
    const at = result.title.split(' at ');
    if (at.length > 1) return at[at.length - 1].trim();
  }
  const domain = result.site_name || result.source || result.url || '';
  try {
    const host = domain.includes('://') ? new URL(domain).hostname : domain;
    return host.replace(/^www\./, '').split('.')[0] || 'Unknown Company';
  } catch {
    return domain || 'Unknown Company';
  }
}

/** Keep only <a href> links that look like exact postings, same-host preferred. */
function pickExactLinks(pageUrl: string, links: string[], limit: number): string[] {
  const pageHost = hostOf(pageUrl);
  const seen = new Set<string>();
  const exact: string[] = [];
  const fallback: string[] = [];
  for (const link of links) {
    if (!/^https?:\/\//i.test(link)) continue;
    if (seen.has(link)) continue;
    seen.add(link);
    if (!isExactJobUrl(link)) continue;
    if (hostOf(link) === pageHost) exact.push(link);
    else fallback.push(link);
    if (exact.length + fallback.length >= limit * 3) break;
  }
  return [...exact, ...fallback].slice(0, limit);
}

function titleFromFetchedText(text: string, fallback: string): string {
  const heading = text.match(/^#\s+(.+)$/m);
  if (heading) return heading[1].trim().slice(0, 120);
  return fallback;
}

export interface ExactJobSearchOutcome {
  hits: ExactJobHit[];
  /**
   * Portal/index URLs that yielded no exact links via Fetch — candidates for
   * the opt-in Agent deep scan (JS-heavy boards). Capped at 2 upstream.
   */
  agentCandidates: string[];
}

/**
 * Search → Fetch-expand pipeline for exact job listings.
 *
 * Why Search alone gives generic SEO pages: the Search API returns ranked web
 * results (title/snippet/URL) — typically portal indexes and SEO landing pages,
 * not deep posting URLs. Exact postings come from two more steps:
 *  1. `include_domains` restricted to ATS hosts (greenhouse/lever/ashby/…) so
 *     hits are already deep links.
 *  2. `Fetch` with `links: true` on portal/index pages, then keep only links
 *     matching exact-posting patterns.
 * Agent (`/v1/automation/run` + `output_schema`) is the last resort for
 * JS-heavy boards — it costs wallet money and is slow, so it stays opt-in
 * via the returned `agentCandidates`.
 */
export async function searchExactJobs(
  tinyfish: TinyFishClient,
  query: string,
  options: PipelineOptions = {}
): Promise<ExactJobSearchOutcome> {
  const { locationText = '', countryCode, language, expandLimit = 8 } = options;
  const q = locationText ? `${query.trim()} jobs ${locationText}` : `${query.trim()} jobs`;
  const purpose = `Find individual job postings with direct apply links for: ${query.trim()}${locationText ? ` in ${locationText}` : ''}`;

  // Pass 1: ATS-restricted (deep links). Pass 2: broad web (to expand via Fetch).
  const [ats, broad] = await Promise.all([
    tinyfish.search({
      query: q,
      purpose,
      ...(countryCode ? { location: countryCode } : {}),
      ...(language ? { language } : {}),
      include_domains: ATS_DOMAINS.join(','),
      recency_minutes: 43200,
    }).catch(() => ({ query: q, results: [] as TinyFishSearchResult[] })),
    tinyfish.search({
      query: q,
      purpose,
      ...(countryCode ? { location: countryCode } : {}),
      ...(language ? { language } : {}),
      recency_minutes: 43200,
    }).catch(() => ({ query: q, results: [] as TinyFishSearchResult[] })),
  ]);

  const seenUrls = new Set<string>();
  const exact: ExactJobHit[] = [];
  const toExpand: TinyFishSearchResult[] = [];

  for (const result of [...(ats.results ?? []), ...(broad.results ?? [])]) {
    if (!result.url || seenUrls.has(result.url)) continue;
    seenUrls.add(result.url);
    if (isExactJobUrl(result.url)) {
      exact.push({
        title: result.title || 'Untitled Position',
        company: companyFromResult(result),
        location: locationText || 'Not specified',
        application_url: result.url,
        source: result.site_name || result.source || hostOf(result.url),
        description: result.snippet || '',
        exact: true,
      });
    } else if (toExpand.length < expandLimit) {
      toExpand.push(result);
    }
  }

  const unresolved = new Set(toExpand.map((r) => r.url));

  // Expand portal/index pages into exact posting links (one batched Fetch, ≤10 URLs).
  if (toExpand.length > 0) {
    const fetched = await tinyfish.fetch({
      urls: toExpand.map((r) => r.url),
      format: 'markdown',
      links: true,
      purpose: `Extract direct links to individual job postings for: ${query.trim()}`,
    }).catch(() => null);

    if (fetched) {
      const failed = new Set((fetched.errors ?? []).map((e) => e.url));
      for (const page of fetched.results ?? []) {
        if (failed.has(page.url)) continue;
        const parent = toExpand.find((r) => r.url === page.url);
        const links = pickExactLinks(page.url, page.links ?? [], 4);
        const text = page.text ?? page.content ?? '';
        if (links.length > 0) unresolved.delete(page.url);
        for (const link of links) {
          if (seenUrls.has(link)) continue;
          seenUrls.add(link);
          exact.push({
            title: titleFromFetchedText(text, parent?.title || 'Job posting'),
            company: parent ? companyFromResult(parent) : hostOf(link),
            location: locationText || 'Not specified',
            application_url: link,
            source: hostOf(link),
            description: (text || parent?.snippet || '').slice(0, 500),
            exact: true,
          });
        }
      }
    }
  }

  return { hits: exact, agentCandidates: [...unresolved].slice(0, 2) };
}

/**
 * Deep extraction for one JS-heavy board via Agent API.
 * Opt-in only: draws from wallet + takes much longer than Search/Fetch (both free).
 * Note output_schema must be a top-level OBJECT with a results array (per docs).
 */
export async function extractJobsViaAgent(
  tinyfish: TinyFishClient,
  boardUrl: string,
  roleHint: string,
  locationText = ''
) {
  const agentResult = await tinyfish.runAgent({
    url: boardUrl,
    goal: `Extract the first 10 individual job listings visible on this page (do not follow pagination).
For each listing extract: title, location, department, job type, and the DIRECT url to that single job posting (not the board index).
If a cookie banner appears, close it first. Wait for listings to fully load.
Return JSON matching the schema.`,
    output_schema: {
      type: 'object',
      properties: {
        results: {
          type: 'array',
          maxItems: 10,
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
    browser_profile: 'stealth',
  });

  void roleHint;
  const result = agentResult.result as { results?: Array<Record<string, string>> } | Array<Record<string, string>> | null;
  const list = Array.isArray(result) ? result : result?.results ?? [];
  return list
    .filter((job) => job.url && isExactJobUrl(job.url))
    .map((job) => ({
      title: job.title || 'Untitled Position',
      company: hostOf(boardUrl),
      location: job.location || locationText || 'Not specified',
      application_url: job.url,
      source: hostOf(boardUrl),
      description: [job.department, job.type].filter(Boolean).join(' · '),
      exact: true as const,
    }));
}
