# AlgoScore - Development Tasks

## Project Overview
Build a TinyFish-powered job and internship finder that aggregates live openings from company careers pages and job portals, matches them to user preferences (role, location, seniority, visa), and keeps results fresh. Uses TinyFish AI for intelligent web scraping and data extraction.

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 16 (App Router) + React 19 + TypeScript
- **UI Library**: ShadCN UI + Tailwind CSS + Radix UI primitives
- **State Management**: React Query (TanStack Query) for server state
- **Backend**: Next.js API Routes + Node.js
- **Web Scraping**: TinyFish Search API + Fetch API + Agent API
- **Database**: PostgreSQL + Prisma ORM
- **AI Integration**: TinyFish AI + Optional LLM for ranking/matching
- **Deployment**: Vercel (frontend) + Railway/Render (backend)

### Key Features
1. User preference management (role, location, keywords, visa status, seniority)
2. Multi-source job aggregation via TinyFish APIs
3. Intelligent job matching and ranking
4. Deduplication engine
5. Real-time search with filters
6. Job alerts and notifications
7. Application tracking

---

## Development Phases

### Phase 1: Foundation & Infrastructure (Week 1)

#### Task 1.1: Project Setup
- [ ] Initialize Next.js 16 project with TypeScript
- [ ] Configure Tailwind CSS and ShadCN UI
- [ ] Set up ESLint, Prettier, and Husky for code quality
- [ ] Configure environment variables (.env.local)
- [ ] Set up folder structure following Next.js best practices

**Files to create:**
```
algorole/
├── src/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── hooks/
│   ├── types/
│   └── utils/
├── public/
├── prisma/
├── .env.local
└── .env.example
```

#### Task 1.2: Database Schema Design
- [ ] Design Prisma schema for jobs, users, preferences
- [ ] Set up PostgreSQL database (local or cloud)
- [ ] Create initial migration
- [ ] Add seed data for testing

**Prisma Schema Models:**
```prisma
- User
- UserPreferences
- Job
- JobSource
- Application
- SearchHistory
```

#### Task 1.3: TinyFish API Integration Layer
- [ ] Create TinyFish client wrapper
- [ ] Implement Search API integration
- [ ] Implement Fetch API integration
- [ ] Implement Agent API integration
- [ ] Add error handling and retry logic
- [ ] Create TypeScript types for API responses

**Files to create:**
- `src/lib/tinyfish/client.ts`
- `src/lib/tinyfish/search.ts`
- `src/lib/tinyfish/fetch.ts`
- `src/lib/tinyfish/agent.ts`
- `src/types/tinyfish.ts`

---

### Phase 2: Core Backend Features (Week 2)

#### Task 2.1: Job Aggregation Pipeline
- [ ] Create job scraper service using TinyFish Agent API
- [ ] Define target job sources (LinkedIn, Indeed, company career pages)
- [ ] Implement goal prompts for different job boards
- [ ] Build extraction schemas for job listings
- [ ] Add concurrent scraping with rate limiting
- [ ] Store raw scraped data

**Example TinyFish Agent Goals:**
```
"Navigate to careers page, extract all job listings with title, 
location, department, job type, and application link. Return as JSON array."
```

#### Task 2.2: Data Normalization & Deduplication
- [ ] Create normalization layer for job data
- [ ] Implement deduplication algorithm (title + company + location)
- [ ] Build fuzzy matching for duplicate detection
- [ ] Add job hashing for tracking changes
- [ ] Update database with normalized jobs

**Deduplication Strategy:**
- Generate content hash (title + company + location + description snippet)
- Check for existing jobs with same hash
- Mark duplicates instead of deleting (for historical tracking)

#### Task 2.3: Job Matching Engine
- [ ] Create matching algorithm based on user preferences
- [ ] Implement scoring system for job relevance
- [ ] Add filters: location, role, seniority, visa sponsorship
- [ ] Build keyword matching (skills, technologies)
- [ ] Store match scores in database

**Matching Criteria:**
- Location match (exact, remote, or flexible)
- Role/Title similarity
- Seniority level alignment
- Visa sponsorship availability
- Skills keyword matching
- Salary range (if available)

#### Task 2.4: API Endpoints
- [ ] Create RESTful API routes
- [ ] Implement job search endpoint
- [ ] Add user preferences endpoints
- [ ] Build job details endpoint
- [ ] Create application tracking endpoints
- [ ] Add pagination and filtering support

**API Routes:**
```
POST   /api/jobs/search
GET    /api/jobs/:id
POST   /api/user/preferences
GET    /api/user/preferences
POST   /api/applications
GET    /api/applications
```

---

### Phase 3: Frontend UI Development (Week 3)

#### Task 3.1: Core UI Components (Using ShadCN UI)
- [ ] Set up ShadCN UI component library
- [ ] Create layout components (Header, Sidebar, Footer)
- [ ] Build job card component
- [ ] Create job list component with infinite scroll
- [ ] Build search bar with autocomplete
- [ ] Design filter panel component
- [ ] Create job details modal/page

**UI Components to Build:**
```tsx
<JobCard />
<JobList />
<SearchBar />
<FilterPanel />
<JobDetailsModal />
<LocationSelector />
<RoleSelector />
<SenioritySelector />
```

#### Task 3.2: User Preferences Page
- [ ] Build preferences form
- [ ] Create multi-step onboarding wizard
- [ ] Add location selection with autocomplete
- [ ] Implement role/keyword tags input
- [ ] Add seniority level selector
- [ ] Include visa sponsorship toggle
- [ ] Save preferences to backend

#### Task 3.3: Job Search & Results Page
- [ ] Create search page layout
- [ ] Implement search with filters
- [ ] Build results grid/list view
- [ ] Add sorting options (relevance, date, salary)
- [ ] Implement pagination/infinite scroll
- [ ] Add "Save Job" functionality
- [ ] Create "Apply" button with external link

#### Task 3.4: Job Details View
- [ ] Build detailed job view page
- [ ] Display all job information
- [ ] Show match score with preference highlights
- [ ] Add similar jobs recommendations
- [ ] Include application tracking
- [ ] Add share functionality

#### Task 3.5: Dashboard & Application Tracker
- [ ] Create user dashboard
- [ ] Show saved jobs
- [ ] Track application status
- [ ] Display recent searches
- [ ] Add statistics/analytics cards

---

### Phase 4: Advanced Features (Week 4)

#### Task 4.1: Job Alerts System
- [ ] Create scheduled job for fetching new listings
- [ ] Compare with previous fetch to detect new jobs
- [ ] Match new jobs against user preferences
- [ ] Send email notifications for new matches
- [ ] Add in-app notification system
- [ ] Create alert preferences settings

#### Task 4.2: Application Tracking
- [ ] Build application status management
- [ ] Add notes and reminders
- [ ] Track application timeline
- [ ] Set follow-up dates
- [ ] Export applications to CSV

#### Task 4.3: Smart Features
- [ ] Implement job recommendations based on history
- [ ] Add "Similar Jobs" suggestions
- [ ] Build trending jobs section
- [ ] Create salary insights (if data available)
- [ ] Add company insights

#### Task 4.4: Performance Optimization
- [ ] Implement caching strategy (Redis or in-memory)
- [ ] Add loading states and skeletons
- [ ] Optimize images and assets
- [ ] Implement service worker for offline support
- [ ] Add PWA manifest

---

### Phase 5: Testing & Deployment (Week 5)

#### Task 5.1: Testing
- [ ] Write unit tests for core functions
- [ ] Add integration tests for API routes
- [ ] Create E2E tests for critical user flows
- [ ] Test TinyFish API integration
- [ ] Performance testing for job scraping

#### Task 5.2: Documentation
- [ ] Write API documentation
- [ ] Create user guide
- [ ] Document TinyFish integration patterns
- [ ] Add inline code comments
- [ ] Create deployment guide

#### Task 5.3: Deployment
- [ ] Set up production database
- [ ] Configure environment variables
- [ ] Deploy backend to Railway/Render
- [ ] Deploy frontend to Vercel
- [ ] Set up CI/CD pipeline
- [ ] Configure monitoring and logging

#### Task 5.4: Post-Launch
- [ ] Monitor error rates
- [ ] Track API usage and costs
- [ ] Gather user feedback
- [ ] Optimize based on usage patterns
- [ ] Plan iteration improvements

---

## Technical Specifications

### TinyFish API Usage Patterns (corrected — see https://docs.tinyfish.ai)

Auth for all REST calls is the `X-API-Key` header (not `Authorization: Bearer`).

#### Search API - Job Discovery (GET, free)
```typescript
// Search for job listings on the web — note: GET with query params,
// `location` is an ISO country code, there is no `max_results` param.
const results = await tinyfish.search({
  query: "software engineer jobs San Francisco",
  purpose: "Find career pages with job listings",
  location: "US",
  recency_minutes: 43200, // 30 days
});

// Restrict to ATS hosts so hits are exact postings, not portal indexes:
const atsResults = await tinyfish.search({
  query: "software engineer jobs",
  purpose: "Find individual job postings with direct apply links",
  include_domains: "boards.greenhouse.io,jobs.lever.co,jobs.ashbyhq.com",
  recency_minutes: 43200,
});
```

#### Agent API - Scraping Career Pages (paid, opt-in)
```typescript
// Scrape company career page. Top-level output_schema must be an OBJECT
// with a results array (a bare array is rejected with 400).
const jobs = await tinyfish.runAgent({
  url: "https://company.com/careers",
  goal: "Extract all job listings with title, location, department, job type, and application link. Return JSON matching the schema.",
  output_schema: {
    type: "object",
    properties: {
      results: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            location: { type: "string" },
            url: { type: "string" },
          },
          required: ["title", "url"],
        },
      },
    },
    required: ["results"],
  },
});
```

#### Fetch API - Job Details (POST, free)
```typescript
// Get full job description. Takes `urls` (max 10), not a single `url`.
// `links: true` returns all <a href> links for expanding index pages.
const details = await tinyfish.fetch({
  urls: ["https://company.com/jobs/12345"],
  format: "markdown",
  links: true,
});
```

### Job Data Schema

```typescript
interface Job {
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
}
```

### User Preferences Schema

```typescript
interface UserPreferences {
  roles: string[]; // ["Software Engineer", "Full Stack Developer"]
  locations: string[]; // ["San Francisco", "Remote"]
  keywords: string[]; // ["React", "TypeScript", "Node.js"]
  seniority: string[]; // ["entry", "mid", "senior"]
  visa_sponsorship: boolean;
  job_types: string[]; // ["full-time", "internship"]
  salary_min?: number;
  exclude_keywords: string[]; // ["senior", "lead"]
}
```

---

## Development Workflow

### Git Branching Strategy
```
main (production)
  └── develop
        ├── feature/backend-setup
        ├── feature/job-scraper
        ├── feature/frontend-ui
        └── feature/user-preferences
```

### Commit Message Convention
```
feat: add job scraping pipeline
fix: deduplication algorithm bug
docs: update API documentation
style: format job card component
refactor: optimize search performance
test: add integration tests for matching engine
```

### Environment Variables Required
```bash
# TinyFish API
TINYFISH_API_KEY=your_key_here

# Database
DATABASE_URL=postgresql://...

# Auth (optional for MVP)
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=http://localhost:3000

# Notifications (optional)
SENDGRID_API_KEY=your_key_here
```

---

## Risk Mitigation

### Technical Risks
1. **TinyFish API Rate Limits**: Implement caching and intelligent fetching
2. **Scraping Failures**: Add fallback sources and retry logic
3. **Duplicate Jobs**: Build robust deduplication with fuzzy matching
4. **Performance**: Use pagination, caching, and background jobs

### Business Risks
1. **Job Source Changes**: Monitor and update scraping logic regularly
2. **API Costs**: Implement efficient caching and fetch only when needed
3. **Data Quality**: Add validation and normalization layers

---

## Success Metrics

### MVP Success Criteria
- [ ] Successfully scrape jobs from 5+ different job sources
- [ ] Return results in < 3 seconds for search queries
- [ ] Achieve 90%+ accuracy in job matching
- [ ] Deduplicate jobs with 95%+ accuracy
- [ ] Support at least 100 concurrent users

### Key Performance Indicators
- Number of jobs scraped per day
- User engagement (searches, saves, applications)
- Job match accuracy
- Application success rate
- Page load time < 2s
- API response time < 500ms

---

## Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| Phase 1 | Week 1 | Project setup, database, TinyFish integration |
| Phase 2 | Week 2 | Scraping pipeline, matching engine, APIs |
| Phase 3 | Week 3 | Frontend UI, search, preferences, dashboard |
| Phase 4 | Week 4 | Alerts, tracking, smart features, optimization |
| Phase 5 | Week 5 | Testing, deployment, documentation |

**Total Duration**: 5 weeks

---

## Next Steps

1. Review and approve this task plan
2. Set up development environment
3. Obtain TinyFish API key
4. Begin Phase 1 implementation
5. Set up regular check-ins to track progress

---

## Resources

### Documentation
- [TinyFish API Docs](https://tinyfish.mintlify.app/)
- [Next.js Documentation](https://nextjs.org/docs)
- [ShadCN UI](https://ui.shadcn.com/)
- [Prisma Documentation](https://www.prisma.io/docs)

### Reference Projects
- [AI Job Agent Example](https://github.com/Ayush-2703/ai_job_agent)
- [Job Board Aggregator](https://github.com/Feashliaa/job-board-aggregator)

### Design Inspiration
- Indeed.com
- LinkedIn Jobs
- Wellfound (AngelList)
- Levels.fyi
