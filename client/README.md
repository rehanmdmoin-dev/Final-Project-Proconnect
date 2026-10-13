  # ProConnect Client

ProConnect is the frontend for a role-based recruitment platform that connects job seekers, recruiters, and administrators in one workflow. This app is built with Next.js, Redux Toolkit, Tailwind CSS, and a centralized API layer for cookie-based authentication and role-aware dashboards.

## Project Role Summary

### 1. Job Seeker
- Browse jobs and view detailed job pages
- Save jobs and track application progress
- Manage profile, resume, skills, education, and experience
- Monitor pipeline stages such as Applied, Under Review, Shortlisted, Interview, and Selected
- Access personal dashboard and application history

### 2. Recruiter
- View and manage the jobs they posted
- Review applicants and job-specific candidate activity
- Track applications and decide hiring stages
- Connect with candidates and manage social/network activity
- Access a recruiter-specific dashboard and company/job workflows

### 3. Admin
- Manage users, verify recruiters, and moderate account status
- Review and moderate jobs submitted to the platform
- Inspect platform reports and support actions
- Monitor overall platform health and content quality

## Project Overview

This frontend is built around a modern job marketplace experience with a strong emphasis on role-based access, smooth user flows, and clean pipeline-driven UI design.

The core stack includes:
- Next.js 16 (App Router)
- React 19
- TypeScript
- Redux Toolkit
- Tailwind CSS v4
- Axios for API communication
- React Hook Form + Yup for forms
- Sonner for notifications

The app is designed to integrate with a backend API where all authentication, user data, jobs, applications, social activity, and admin administration are managed.

## Key Application Features

- Role-based authentication and route protection
- Job search and detail pages
- Application pipeline tracking
- Saved jobs and user profile management
- Social feed, network, and notifications
- Admin moderation screens for users and jobs
- Token refresh handling with cookie-based sessions
- Responsive layout with role-aware navigation

## Project Setup

### Prerequisites
- Node.js 18+
- npm
- A running backend API for ProConnect

### Install dependencies

```bash
npm install
```

### Environment configuration
Create a `.env.local` file in the client folder:

```bash
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

If your backend runs on a different host or port, update the value accordingly.

### Run the app

```bash
npm run dev
```

The app typically runs at:

```bash
http://localhost:3000
```

### Run backend first
This frontend expects the ProConnect backend to be running before the UI is usable. In a typical setup from the project root:

```bash
cd ../server
npm install
npm run dev
```

If the backend supports seeding:

```bash
npm run seed
```

## Default Demo Accounts
The seeded backend usually provides test accounts with the same password:

```bash
Password@123
```

| Role | Email |
| --- | --- |
| Job seeker | `aarav@example.test` |
| Recruiter | `priya@nimbus.test` |
| Admin | `admin@proconnect.test` |

## Project Structure

```text
client/
├── api/
│   ├── axios.ts
│   └── endpoints.ts
├── app/
│   ├── admin/
│   ├── applications/
│   ├── dashboard/
│   ├── feed/
│   ├── jobs/
│   ├── login/
│   ├── network/
│   ├── notifications/
│   ├── profile/
│   ├── register/
│   ├── reset-password/
│   ├── verify-email/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── auth/
│   ├── jobs/
│   ├── layout/
│   └── ui/
├── lib/
├── redux/
│   ├── slice/
│   └── store/
├── .env.local
├── next.config.ts
├── package.json
├── proxy.ts
├── tsconfig.json
├── postcss.config.mjs
└── README.md
```

## Role-Wise API and Feature Structure

### Authentication APIs
Defined in `api/endpoints.ts` under `ep.auth`:
- `register`
- `verifyEmail`
- `resendVerification`
- `login`
- `logout`
- `me`
- `forgot`
- `reset`
- `changePassword`

These routes are used by the authentication slice to handle signup, login, email verification, password reset, and session hydration.

### User Profile APIs
Under `ep.users`:
- `me`
- `byId(id)`
- `profileImage`
- `resume`
- `experience`
- `experienceId(id)`
- `education`
- `educationId(id)`
- `skills`
- `skillId(id)`
- `savedJobs`
- `candidateSearch`

These endpoints support profile and job seeker data management.

### Company and Jobs APIs
Under `ep.companies` and `ep.jobs`:
- company listing and details
- follow/unfollow action
- job listing, detail, status updates, save, apply
- recruiters can manage their own jobs and applicants

### Application APIs
Under `ep.applications`:
- `mine`
- `stats`
- `byId(id)`
- `status`
- `withdraw`

This drives the application tracker and pipeline flow for job seekers and recruiters.

### Connections and Social APIs
Under `ep.connections` and `ep.posts`:
- send/accept/reject connections
- pending requests
- feed posts
- post likes and comments
- network and activity data

### Notifications and Interviews
Under `ep.notifications` and `ep.interviews`:
- unread counts
- mark individual or all notifications as read
- interview creation and retrieval

### Admin APIs
Under `ep.admin`:
- analytics overview
- manage users and statuses
- verify recruiters
- moderate jobs
- review reports and resolution actions

This is the admin control layer for platform governance and moderation.

## Redux Architecture

The app centralizes state management in the `redux/slice` folder:

- `authSlice.ts` — login, logout, registration, session hydration, role data
- `jobSlice.ts` — jobs, job detail, saved jobs, candidate-related actions
- `applicationSlice.ts` — applications and dashboard pipeline state
- `socialSlice.ts` — network, posts, feed, notifications, connections

The global store is created in `redux/store/store.ts` and wrapped by the app provider in `redux/store/provider.tsx`.

## Route Protection and Session Handling

Important behavior in this project:

- Protected routes are managed through `proxy.ts`, not `middleware.ts`
- The app checks for cookie-based auth tokens before allowing access to dashboard and core application sections
- `api/axios.ts` contains a transparent token refresh flow
- If a request receives `401`, the app attempts a refresh once and retries the original request
- Failed refresh attempts redirect users back to `/login`

## Design Notes

The interface follows a recruitment-flow-first concept, where the application pipeline is a visual story of progress. This is reflected in the UI through a pipeline rail that emphasizes where a candidate stands in the process rather than displaying flat summary statistics alone.

## Important Development Notes

- This is a frontend repository only; it depends on a backend API for real data and authentication
- The app expects cookie-based authentication, so browser cookies must be enabled
- Many roles and screen states are gated by `user.role` and route checks
- Response shapes from the backend should be aligned with Redux slice expectations
- If a UI list appears empty, check if the backend returns the expected `data` payload shape

## Useful Commands

```bash
npm install
npm run dev
npm run build
npm run lint
```

## Summary

ProConnect Client is a role-aware recruitment platform frontend that supports job seekers, recruiters, and admins through a cohesive dashboard and workflow system. The frontend is built to be API-driven, state-centralized, and secure through cookie-based auth, route guards, and structured API abstractions.

