import type {
  TinyFishSearchRequest,
  TinyFishSearchResponse,
  TinyFishFetchRequest,
  TinyFishFetchResponse,
  TinyFishAgentRequest,
  TinyFishAgentResponse,
} from '@/types/tinyfish';

// Canonical TinyFish endpoints (see https://docs.tinyfish.ai):
// - Search: GET https://api.search.tinyfish.ai?query=...
// - Fetch:  POST https://api.fetch.tinyfish.ai  { urls: [...], format }
// - Agent:  POST https://agent.tinyfish.ai/v1/automation/run { url, goal, ... }
// Auth for all REST APIs: `X-API-Key` header (NOT `Authorization: Bearer`).
const SEARCH_API_BASE =
  process.env.TINYFISH_SEARCH_API_BASE || 'https://api.search.tinyfish.ai';
const FETCH_API_BASE =
  process.env.TINYFISH_FETCH_API_BASE || 'https://api.fetch.tinyfish.ai';
const AGENT_API_BASE =
  process.env.TINYFISH_AGENT_API_BASE || 'https://agent.tinyfish.ai';

class TinyFishClient {
  private apiKey: string;
  private searchBase: string;
  private fetchBase: string;
  private agentBase: string;

  constructor(apiKey: string, overrides?: { searchBase?: string; fetchBase?: string; agentBase?: string }) {
    if (!apiKey) {
      throw new Error('TinyFish API key is required');
    }
    this.apiKey = apiKey;
    this.searchBase = overrides?.searchBase || SEARCH_API_BASE;
    this.fetchBase = overrides?.fetchBase || FETCH_API_BASE;
    this.agentBase = overrides?.agentBase || AGENT_API_BASE;
  }

  private headers(): Record<string, string> {
    return {
      'X-API-Key': this.apiKey,
      'Content-Type': 'application/json',
    };
  }

  private async handleResponse<T>(response: Response, product: string): Promise<T> {
    if (!response.ok) {
      const body = await response.text();
      // Surface status so callers can map 401/429/etc. to user-friendly messages.
      throw new Error(`TinyFish ${product} API error: ${response.status} - ${body}`);
    }
    return response.json() as Promise<T>;
  }

  async search(params: TinyFishSearchRequest): Promise<TinyFishSearchResponse> {
    const searchParams = new URLSearchParams();
    searchParams.set('query', params.query);
    if (params.purpose) searchParams.set('purpose', params.purpose);
    // `location` is an ISO country code (US, IN, DE...). Omit for worldwide.
    if (params.location) searchParams.set('location', params.location.toUpperCase());
    if (params.language) searchParams.set('language', params.language);
    if (params.include_domains) searchParams.set('include_domains', params.include_domains);
    if (params.exclude_domains) searchParams.set('exclude_domains', params.exclude_domains);
    if (params.recency_minutes !== undefined)
      searchParams.set('recency_minutes', String(params.recency_minutes));
    if (params.after_date) searchParams.set('after_date', params.after_date);
    if (params.before_date) searchParams.set('before_date', params.before_date);
    if (params.page !== undefined) searchParams.set('page', String(params.page));

    const response = await fetch(`${this.searchBase}?${searchParams.toString()}`, {
      method: 'GET',
      headers: this.headers(),
    });

    return this.handleResponse<TinyFishSearchResponse>(response, 'Search');
  }

  async fetch(params: TinyFishFetchRequest): Promise<TinyFishFetchResponse> {
    const response = await fetch(this.fetchBase, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        urls: params.urls,
        format: params.format ?? 'markdown',
        ...(params.links !== undefined ? { links: params.links } : {}),
        ...(params.image_links !== undefined ? { image_links: params.image_links } : {}),
        ...(params.purpose ? { purpose: params.purpose } : {}),
        ...(params.include_selectors ? { include_selectors: params.include_selectors } : {}),
        ...(params.exclude_selectors ? { exclude_selectors: params.exclude_selectors } : {}),
        ...(params.highlights ? { highlights: params.highlights } : {}),
      }),
    });

    return this.handleResponse<TinyFishFetchResponse>(response, 'Fetch');
  }

  async runAgent(params: TinyFishAgentRequest): Promise<TinyFishAgentResponse> {
    const response = await fetch(`${this.agentBase}/v1/automation/run`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        url: params.url,
        goal: params.goal,
        ...(params.output_schema ? { output_schema: params.output_schema } : {}),
        ...(params.browser_profile ? { browser_profile: params.browser_profile } : {}),
        ...(params.proxy_config ? { proxy_config: params.proxy_config } : {}),
      }),
    });

    return this.handleResponse<TinyFishAgentResponse>(response, 'Agent');
  }
}

// Export class for creating instances with user-provided keys
export { TinyFishClient };
