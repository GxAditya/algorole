'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ExternalLink, MapPin, Trash2 } from 'lucide-react';
import Header from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getApplications,
  removeApplication,
  updateApplication,
} from '@/lib/storage';
import type { Application } from '@/types/job';

const STATUSES: Application['status'][] = [
  'saved',
  'applied',
  'interviewing',
  'offer',
  'rejected',
];

const STATUS_LABEL: Record<Application['status'], string> = {
  saved: 'Saved',
  applied: 'Applied',
  interviewing: 'Interviewing',
  offer: 'Offer',
  rejected: 'Rejected',
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>(() => getApplications());

  const refresh = () => setApplications(getApplications());

  const counts = STATUSES.reduce<Record<string, number>>((acc, status) => {
    acc[status] = applications.filter((a) => a.status === status).length;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background font-sans">
      <Header />
      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold tracking-tight mb-2">
          Applications
        </h1>
        <p className="text-muted-foreground text-lg mb-8">
          {applications.length > 0
            ? `Tracking ${applications.length} application${applications.length === 1 ? '' : 's'}`
            : 'Track a job from any card to start your pipeline'}
        </p>

        {applications.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-12">
            {STATUSES.map((status) => (
              <Badge key={status} variant="secondary" className="px-3 py-1">
                {STATUS_LABEL[status]}: {counts[status] ?? 0}
              </Badge>
            ))}
          </div>
        )}

        {applications.length > 0 ? (
          <div className="space-y-4">
            {applications.map((app) => (
              <Card key={app.id} className="p-6 border-2">
                <div className="flex items-start justify-between gap-4 mb-1">
                  <h3 className="text-xl font-semibold tracking-tight">
                    {app.job?.title ?? 'Untitled Position'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      removeApplication(app.id);
                      refresh();
                    }}
                    title="Remove from tracker"
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-4">
                  <span className="font-medium">{app.job?.company}</span>
                  <span className="text-border">·</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {app.job?.location}
                  </span>
                  {app.job && (
                    <a
                      href={app.job.application_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline ml-1"
                    >
                      Listing
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Select
                    value={app.status}
                    onValueChange={(value) => {
                      updateApplication(app.id, {
                        status: value as Application['status'],
                      });
                      refresh();
                    }}
                  >
                    <SelectTrigger className="h-10 w-[180px] border-2">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {STATUS_LABEL[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {app.applied_at && (
                    <span className="text-xs text-muted-foreground font-mono">
                      Applied {new Date(app.applied_at).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <textarea
                  placeholder="Notes (e.g. referral, follow-up date, interview prep)…"
                  defaultValue={app.notes ?? ''}
                  onBlur={(e) => {
                    if (e.target.value !== (app.notes ?? '')) {
                      updateApplication(app.id, { notes: e.target.value });
                      refresh();
                    }
                  }}
                  rows={2}
                  className="mt-4 w-full text-sm border-2 border-border bg-background p-3 focus:border-primary focus:outline-none"
                />
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed border-border">
            <p className="text-muted-foreground text-lg mb-4">
              No applications tracked yet
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
