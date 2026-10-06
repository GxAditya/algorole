'use client';

import { useState } from 'react';
import { Bookmark, BookmarkCheck, ExternalLink, MapPin, Clock, DollarSign, ClipboardList, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { isJobSaved, isJobTracked, toggleSaveJob, trackApplication } from '@/lib/storage';
import type { Job } from '@/types/job';

interface JobCardProps {
  job: Job;
  /** Called after save state changes so parent pages (Saved) can refresh. */
  onSaveChange?: () => void;
}

export default function JobCard({ job, onSaveChange }: JobCardProps) {
  const [saved, setSaved] = useState(() => isJobSaved(job.id));
  const [tracked, setTracked] = useState(() => isJobTracked(job.id));
  const timeAgo = getTimeAgo(new Date(job.posted_at));
  const salaryDisplay = job.salary
    ? `${formatSalary(job.salary.min)}–${formatSalary(job.salary.max)}`
    : null;

  const handleToggleSave = () => {
    setSaved(toggleSaveJob(job));
    onSaveChange?.();
  };

  const handleTrack = () => {
    trackApplication(job);
    setTracked(true);
  };

  return (
    <Card className="p-6 border-2 border-border hover:border-primary transition-colors">
      {/* Job Title - Primary Hierarchy */}
      <h3 className="text-xl font-semibold mb-1 tracking-tight">
        {job.title}
      </h3>

      {/* Company & Location - Secondary */}
      <div className="flex items-center gap-2 text-muted-foreground mb-3">
        <span className="font-medium">{job.company}</span>
        <span className="text-border">·</span>
        <span className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {job.location}
        </span>
        {job.type && (
          <>
            <span className="text-border">·</span>
            <span className="capitalize">{job.type.replace('-', ' ')}</span>
          </>
        )}
      </div>

      {/* Match Score - Visual Progress */}
      {job.match_score !== undefined && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">Match Score</span>
            <span className="text-sm font-mono">{job.match_score}%</span>
          </div>
          <Progress 
            value={job.match_score} 
            className="h-2 bg-muted"
          />
        </div>
      )}

      {/* Skills Tags - Not Pills */}
      {job.skills && job.skills.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {job.skills.slice(0, 5).map((skill) => (
            <Badge 
              key={skill} 
              variant="outline"
              className="font-mono text-xs border-border"
            >
              {skill}
            </Badge>
          ))}
        </div>
      )}

      {/* Metadata Line - Subtle */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="flex items-center gap-4 text-sm text-muted-foreground font-mono">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeAgo}
          </span>
          {salaryDisplay && (
            <span className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {salaryDisplay}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggleSave}
            title={saved ? 'Remove from saved' : 'Save job'}
            className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {saved ? (
              <BookmarkCheck className="h-4 w-4 text-primary" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
            {saved ? 'Saved' : 'Save'}
          </button>
          <button
            type="button"
            onClick={handleTrack}
            disabled={tracked}
            title={tracked ? 'Already in your tracker' : 'Track application'}
            className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-60"
          >
            {tracked ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <ClipboardList className="h-4 w-4" />
            )}
            {tracked ? 'Tracked' : 'Track'}
          </button>
          <a
            href={job.application_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Apply
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </Card>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  }
  
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    return `${hours}h ago`;
  }
  
  const days = Math.floor(seconds / 86400);
  return `${days}d ago`;
}

function formatSalary(amount: number): string {
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}k`;
  }
  return amount.toString();
}
