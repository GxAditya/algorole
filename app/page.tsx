'use client';

import { useState } from 'react';
import { Search, MapPin, Briefcase, Settings, AlertCircle, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import JobList from '@/components/jobs/job-list';
import Header from '@/components/layout/header';
import type { Job } from '@/types/job';
import { COUNTRY_NAMES } from '@/lib/countries';
import { getStoredPreferences } from '@/lib/storage';

// ISO country codes for TinyFish geo-targeting. Worldwide = no restriction.
const SEARCH_REGIONS = [
  { value: 'WORLDWIDE', label: 'Worldwide' },
  ...Object.entries(COUNTRY_NAMES).map(([value, label]) => ({ value, label })),
];

const QUICK_LOCATIONS = [
  'Remote',
  'Bangalore, India',
  'London, UK',
  'Berlin, Germany',
  'Toronto, Canada',
  'Singapore',
  'Sydney, Australia',
  'San Francisco, US',
  'New York, US',
];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [country, setCountry] = useState('WORLDWIDE');
  const [seniority, setSeniority] = useState('');
  const [visaSponsorship, setVisaSponsorship] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasApiKey] = useState(
    () => typeof window !== 'undefined' && !!localStorage.getItem('tinyfish_api_key')
  );
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchedLocation, setSearchedLocation] = useState<string | null>(null);
  const [deepScan, setDeepScan] = useState(false);
  const [deepScanned, setDeepScanned] = useState<number | null>(null);

  // Effective geography: typed location wins, otherwise the region dropdown.
  const effectiveLocation =
    location.trim() ||
    (country !== 'WORLDWIDE' ? COUNTRY_NAMES[country] ?? country : '');

  const handleSearch = async () => {
    setSearchError(null);

    if (!searchQuery.trim()) {
      setSearchError('Enter a role or keyword to search (e.g. "Software Engineer").');
      return;
    }

    const apiKey = localStorage.getItem('tinyfish_api_key');
    if (!apiKey) {
      setSearchError('Please add your TinyFish API key in Settings first.');
      return;
    }

    setIsSearching(true);
    setHasSearched(false);
    setDeepScanned(null);
    try {
      const response = await fetch('/api/jobs/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery.trim(),
          location: location.trim() || undefined,
          country: country === 'WORLDWIDE' ? undefined : country,
          seniority: seniority || undefined,
          visa_sponsorship: visaSponsorship,
          preferences: getStoredPreferences() ?? undefined,
          deep: deepScan,
          api_key: apiKey,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setSearchError(data.error || `Search failed (HTTP ${response.status}).`);
        setJobs([]);
        return;
      }
      setJobs(data.jobs || []);
      setSearchedLocation(data.location || effectiveLocation || null);
      setDeepScanned(typeof data.deepScanned === 'number' ? data.deepScanned : null);
      setHasSearched(true);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchError('Search failed. Check your connection and API key, then try again.');
      setJobs([]);
      setSearchedLocation(null);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      <Header />

      {/* Hero Search Interface */}
      <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto">
          {/* API Key Warning */}
          {!hasApiKey && (
            <div className="mb-8 p-4 border-2 border-primary/20 bg-primary/5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-primary" />
                <div className="text-sm">
                  <p className="font-medium">Add your TinyFish API key to get started</p>
                  <p className="text-muted-foreground">Your key stays on your device</p>
                </div>
              </div>
              <a href="/settings">
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </a>
            </div>
          )}

          {/* Conversational Headline */}
          <h1 className="text-5xl font-bold tracking-tight mb-3 text-center">
            What role are you targeting?
          </h1>
          <p className="text-muted-foreground text-lg text-center mb-12">
            We&apos;ll find matches across company career pages and job portals
          </p>

          {/* Search Box */}
          <div className="space-y-4">
            {/* Main Search Input */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Software Engineer at Remote companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="h-14 pl-12 pr-4 text-base border-2 focus:border-primary"
              />
            </div>

            {/* Location: free text for anywhere in the world */}
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Location — city, country, or Remote (e.g. Bangalore, India)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="h-12 pl-12 pr-4 text-base border-2 focus:border-primary"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {QUICK_LOCATIONS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setLocation(preset)}
                  className="text-xs border border-border rounded-full px-3 py-1 text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>

            {/* Inline Filters */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Search region (TinyFish geo-targeting) */}
              <div className="flex-1 min-w-[200px]">
                <Select value={country} onValueChange={(value) => setCountry(value || 'WORLDWIDE')}>
                  <SelectTrigger className="h-11 border-2">
                    <Globe className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Search region" />
                  </SelectTrigger>
                  <SelectContent>
                    {SEARCH_REGIONS.map((region) => (
                      <SelectItem key={region.value} value={region.value}>
                        {region.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Seniority Filter */}
              <div className="flex-1 min-w-[200px]">
                <Select value={seniority} onValueChange={(value) => setSeniority(value || '')}>
                  <SelectTrigger className="h-11 border-2">
                    <Briefcase className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Seniority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entry">Entry Level</SelectItem>
                    <SelectItem value="mid">Mid Level</SelectItem>
                    <SelectItem value="senior">Senior</SelectItem>
                    <SelectItem value="lead">Lead / Principal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Visa Toggle */}
              <Button
                variant={visaSponsorship ? 'default' : 'outline'}
                onClick={() => setVisaSponsorship(!visaSponsorship)}
                className="h-11 border-2"
              >
                Visa Sponsorship
              </Button>

              {/* Deep scan Toggle (paid Agent runs) */}
              <Button
                variant={deepScan ? 'default' : 'outline'}
                onClick={() => setDeepScan(!deepScan)}
                title="Also scrape JS-heavy job boards with the TinyFish Agent. Paid (wallet) and takes minutes."
                className="h-11 border-2"
              >
                Deep scan
              </Button>

              {/* Search Button */}
              <Button
                onClick={handleSearch}
                disabled={isSearching}
                className="h-11 px-8"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {effectiveLocation
                ? `Searching jobs in ${effectiveLocation}.`
                : 'Searching worldwide. Pick a region or type a location to narrow it down.'}
              {deepScan
                ? ' Deep scan on: JS-heavy boards are scraped with the paid Agent (slow).'
                : ''}
            </p>

            {/* Error display — previously swallowed, which is why searches "errored" silently */}
            {searchError && (
              <div className="p-4 border-2 border-destructive/30 bg-destructive/5 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Search failed</p>
                  <p className="text-muted-foreground">{searchError}</p>
                </div>
              </div>
            )}
          </div>

          {/* Results Section */}
          {hasSearched && jobs.length === 0 && !searchError && (
            <div className="mt-16 text-center">
              <h2 className="text-2xl font-semibold mb-2">No matches found</h2>
              <p className="text-muted-foreground">
                Try a different role, location, or search region.
              </p>
            </div>
          )}
          {jobs.length > 0 && (
            <div className="mt-16">
              <div className="mb-8">
                <h2 className="text-3xl font-semibold">
                  {jobs.length} matches found
                  {searchedLocation ? ` in ${searchedLocation}` : ''}
                </h2>
                {deepScanned !== null && deepScanned > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Deep scan checked {deepScanned} extra board{deepScanned === 1 ? '' : 's'}.
                  </p>
                )}
              </div>
              <JobList jobs={jobs} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
