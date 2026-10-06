export interface TinyFishSearchRequest {
  query: string;
  purpose?: string;
  // ISO 3166-1 alpha-2 country code for geo-targeted results (e.g. 'US', 'IN', 'DE').
  // Omit for worldwide / auto-resolve. Previously hardcoded to 'us' — that was a bug.
  location?: string;
  language?: string;
  include_domains?: string;
  exclude_domains?: string;
  recency_minutes?: number;
  after_date?: string;
  before_date?: string;
  page?: number;
}

export interface TinyFishSearchResult {
  position?: number;
  site_name?: string;
  title: string;
  url: string;
  snippet: string;
  date?: string;
  published_date?: string;
  source?: string;
}

export interface TinyFishSearchResponse {
  query: string;
  results: TinyFishSearchResult[];
  total_results?: number;
  page?: number;
  timestamp?: string;
}

export interface TinyFishFetchRequest {
  urls: string[];
  format?: 'markdown' | 'text' | 'json' | 'html';
  links?: boolean;
  image_links?: boolean;
  purpose?: string;
  include_selectors?: string[];
  exclude_selectors?: string[];
  highlights?: {
    query: string;
    max_snippets?: number;
    max_characters?: number;
    include_full_page_text?: boolean;
  };
}

export interface TinyFishFetchResult {
  url: string;
  final_url?: string;
  title?: string | null;
  description?: string | null;
  text?: string;
  content?: string;
  links?: string[];
  language?: string | null;
}

export interface TinyFishFetchResponse {
  results: TinyFishFetchResult[];
  errors?: Array<{ url: string; error: string; status?: number }>;
}

export interface TinyFishAgentRequest {
  url: string;
  goal: string;
  output_schema?: Record<string, unknown>;
  browser_profile?: 'lite' | 'stealth';
  proxy_config?: {
    enabled: boolean;
    type?: 'tinyfish' | 'custom';
    country_code?: string;
  };
}

export interface TinyFishAgentResponse {
  run_id?: string | null;
  status?: string;
  result: unknown;
  url?: string;
  timestamp?: string;
  error?: unknown;
  steps?: string[];
}
