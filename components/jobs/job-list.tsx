'use client';

import JobCard from './job-card';
import type { Job } from '@/types/job';

interface JobListProps {
  jobs: Job[];
  /** Forwarded to each card so pages can refresh after save changes. */
  onSaveChange?: () => void;
}

export default function JobList({ jobs, onSaveChange }: JobListProps) {
  if (jobs.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground text-lg mb-2">
          No jobs found matching your criteria
        </p>
        <p className="text-sm text-muted-foreground">
          Try adjusting your filters or search terms
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} onSaveChange={onSaveChange} />
      ))}
    </div>
  );
}
