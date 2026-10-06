export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  department?: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  seniority: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  visa_sponsorship?: boolean;
  remote: boolean;
  description: string;
  requirements: string[];
  skills: string[];
  application_url: string;
  source: string;
  posted_at: Date;
  scraped_at: Date;
  content_hash: string;
  match_score?: number;
}

export interface UserPreferences {
  roles: string[];
  locations: string[];
  keywords: string[];
  seniority: string[];
  visa_sponsorship: boolean;
  job_types: string[];
  salary_min?: number;
  exclude_keywords: string[];
}

export interface SearchFilters {
  query?: string;
  /** Free-text location: any city, region, country, or "Remote" — worldwide. */
  location?: string;
  /** ISO 3166-1 alpha-2 country code for search geo-targeting (e.g. 'US', 'IN'). Omit/'WORLDWIDE' for global. */
  country?: string;
  language?: string;
  seniority?: string;
  visa_sponsorship?: boolean;
  remote?: boolean;
  job_type?: string;
}

export interface JobSource {
  id: string;
  name: string;
  url: string;
  type: 'portal' | 'company';
  last_scraped?: Date;
}

export interface JobSearchRequestBody extends SearchFilters {
  api_key?: string;
  /** Full saved preferences — drives match scoring. Falls back to defaults. */
  preferences?: UserPreferences;
  /** Opt-in Agent deep scan of JS-heavy boards (paid, slow). Default false. */
  deep?: boolean;
}

export interface Application {
  id: string;
  job_id: string;
  /** Embedded job snapshot so the tracker works without refetching. */
  job?: Job;
  status: 'saved' | 'applied' | 'interviewing' | 'offer' | 'rejected';
  applied_at?: Date;
  notes?: string;
  follow_up_date?: Date;
}
