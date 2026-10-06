'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/header';
import JobList from '@/components/jobs/job-list';
import { Button } from '@/components/ui/button';
import { getSavedJobs } from '@/lib/storage';
import type { Job } from '@/types/job';

export default function SavedPage() {
  const [saved, setSaved] = useState<Job[]>(() => getSavedJobs());

  const refresh = () => setSaved(getSavedJobs());

  return (
    <div className="min-h-screen bg-background font-sans">
      <Header />
      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold tracking-tight mb-2">Saved Jobs</h1>
        <p className="text-muted-foreground text-lg mb-12">
          {saved.length > 0
            ? `${saved.length} job${saved.length === 1 ? '' : 's'} bookmarked`
            : 'Jobs you save will show up here'}
        </p>

        {saved.length > 0 ? (
          <JobList jobs={saved} onSaveChange={refresh} />
        ) : (
          <div className="text-center py-16 border-2 border-dashed border-border">
            <p className="text-muted-foreground text-lg mb-4">
              Nothing saved yet
            </p>
            <Link href="/">
              <Button>Search jobs</Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
