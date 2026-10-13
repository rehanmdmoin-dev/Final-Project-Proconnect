# ProConnect API

Backend service for **ProConnect**, a job-search and professional-networking platform. It provides the REST API used by the ProConnect client for job discovery and applications, recruiter workflows, professional profiles, company pages, networking, messaging, notifications, interviews, and platform administration.

## Project overview

The server is built with Node.js, Express, and MongoDB (through Mongoose). It uses JWT access and refresh tokens for authentication, role-based authorization for protected operations, Joi request validation, Cloudinary for uploaded assets, and Nodemailer for transactional email.

### Application roles

| Role | Main responsibilities |
| --- | --- |
| `jobseeker` | Maintain a professional profile and resume, search and save jobs, submit and track applications, connect with other users, and use social and messaging features. |
| `recruiter` | Create/manage companies and job listings, review applicants, update application status and notes, and schedule interviews. |
| `admin` | Moderate users, companies, jobs, posts, and reports; access platform analytics. Admin access is granted only on routes that explicitly allow it. It is not implicitly granted access to every recruiter or jobseeker-only route. |

New accounts are registered as `jobseeker` by default; registration may select `recruiter`. Admin accounts are not created through public registration.

## Requirements

- Node.js LTS and npm
- A MongoDB instance (local or hosted)
- Cloudinary credentials for profile images, resumes, company logos, and post media
- SMTP credentials for verification, password-reset, application, and interview emails

Cloudinary and email integrations are required for their respective features. Configure credentials before using those features.

## Setup

1. Open a terminal in this `server` directory.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the server root and set the variables below. Use your own local/deployment credentials; do not commit `.env`.

   ```dotenv
   PORT=5001
   NODE_ENV=development
   CLIENT_URL=http://localhost:3000

   MONGO_URI=mongodb://127.0.0.1:27017/proconnect

   JWT_ACCESS_SECRET=replace-with-a-long-random-secret
   JWT_REFRESH_SECRET=replace-with-a-different-long-random-secret
   JWT_ACCESS_EXPIRES=15m
   JWT_REFRESH_EXPIRES=7d

   CLOUDINARY_CLOUD_NAME=
   CLOUDINARY_API_KEY=
   CLOUDINARY_API_SECRET=

   EMAIL_HOST=
   EMAIL_PORT=587
   EMAIL_USER=
   EMAIL_PASS=
   EMAIL_FROM=

   RATE_LIMIT_WINDOW_MINUTES=15
   RATE_LIMIT_MAX_REQUESTS=300
   ```

   `PORT`, `CLIENT_URL`, token lifetimes, and rate-limit values have defaults in the application. `EMAIL_FROM` falls back to `EMAIL_USER`; email uses port `587` when no port is supplied. Use strong, unique JWT secrets and keep all credentials outside source control.

4. Start MongoDB and run the API:

   ```bash
   npm run dev
   ```

   The server listens on port `5001` by default. Check `http://localhost:5001/` for the health response.

### Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the API with Nodemon for local development. |
| `npm start` | Start the API with Node.js. |
| `npm run seed` | Run the database seed script in `src/utils/seed.js`. Review that script and target database before running it. |

## API conventions

- API routes are prefixed with `/api`; the root `GET /` health check is not.
- Send JSON request bodies with `Content-Type: application/json`, except multipart upload endpoints.
- Protected routes accept an access token in `Authorization: Bearer YOUR_ACCESS_TOKEN` or the `accessToken` cookie. Refresh tokens are handled through the auth endpoints and cookies.
- Successful responses use `{ "success": true, "message": "...", "data": ... }` where applicable. Errors use `{ "success": false, "message": "...", "errors": [...] }` where validation details apply.
- List endpoints that use pagination accept `page` and `limit`; defaults are page `1` and limit `10`, with a maximum limit of `100`.
- The API applies security headers, CORS (from `CLIENT_URL`), JSON body limits, no-store cache headers for `/api`, and rate limiting. Login/password-reset and email-verification endpoints have additional limits.

## API reference by role and feature

`Public` means no access token is required. `Authenticated` means a signed-in user of any role, subject to resource ownership checks. `Recruiter/Admin`, `Jobseeker`, and `Admin` identify explicit role requirements.

### Authentication — `/api/auth`

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/register` | Public | Register a jobseeker or recruiter. |
| `POST` | `/verify-email` | Public | Verify an email address. |
| `POST` | `/resend-verification` | Public | Resend email verification. |
| `POST` | `/login` | Public | Authenticate and receive tokens. |
| `POST` | `/refresh-token` | Public | Refresh the access token. |
| `POST` | `/forgot-password` | Public | Request a password-reset email. |
| `POST` | `/reset-password` | Public | Set a new password using a reset token. |
| `POST` | `/logout` | Public | Clear/revoke the current refresh session. |
| `GET` | `/me` | Authenticated | Get the current account. |
| `PATCH` | `/change-password` | Authenticated | Change the current password. |

### Jobseeker workflows

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/users/me` | Authenticated | Get own profile. |
| `PATCH` | `/api/users/me` | Authenticated | Update own profile. |
| `POST` | `/api/users/me/profile-image` | Authenticated | Upload a profile image (`image` multipart field). |
| `POST` | `/api/users/me/resume` | Authenticated | Upload a resume (`resume` multipart field). |
| `DELETE` | `/api/users/me/resume` | Authenticated | Delete own resume. |
| `POST` | `/api/users/me/experience` | Authenticated | Add an experience entry. |
| `PATCH`, `DELETE` | `/api/users/me/experience/:entryId` | Authenticated | Update or delete an experience entry. |
| `POST` | `/api/users/me/education` | Authenticated | Add an education entry. |
| `PATCH`, `DELETE` | `/api/users/me/education/:entryId` | Authenticated | Update or delete an education entry. |
| `POST` | `/api/users/me/certifications` | Authenticated | Add a certification. |
| `PATCH`, `DELETE` | `/api/users/me/certifications/:entryId` | Authenticated | Update or delete a certification. |
| `POST` | `/api/users/me/skills` | Authenticated | Add a skill. |
| `PATCH`, `DELETE` | `/api/users/me/skills/:entryId` | Authenticated | Update or delete a skill. |
| `GET` | `/api/users/saved-jobs` | Authenticated | List saved jobs. |
| `POST` | `/api/jobs/:jobId/save` | Jobseeker | Save a job. |
| `DELETE` | `/api/jobs/:jobId/save` | Jobseeker | Unsave a job. |
| `POST` | `/api/jobs/:jobId/apply` | Jobseeker | Apply to a job. |
| `GET` | `/api/applications/my` | Jobseeker | List own applications. |
| `PATCH` | `/api/applications/:id/withdraw` | Jobseeker | Withdraw an application. |

### Recruiter workflows

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/users/candidates/search` | Recruiter/Admin | Search candidate profiles. |
| `GET` | `/api/companies/my` | Recruiter/Admin | List own companies. |
| `POST` | `/api/companies` | Recruiter/Admin | Create a company. |
| `PATCH` | `/api/companies/:id` | Recruiter/Admin | Update a company. |
| `POST` | `/api/companies/:id/logo` | Recruiter/Admin | Upload a company logo (`logo` multipart field). |
| `DELETE` | `/api/companies/:id` | Recruiter/Admin | Delete a company. |
| `GET` | `/api/jobs/my` | Recruiter/Admin | List own jobs. |
| `POST` | `/api/jobs` | Recruiter/Admin | Create a job. |
| `PATCH` | `/api/jobs/:id` | Recruiter/Admin | Update a job. |
| `PATCH` | `/api/jobs/:id/status` | Recruiter/Admin | Change a job's status. |
| `DELETE` | `/api/jobs/:id` | Recruiter/Admin | Delete a job. |
| `GET` | `/api/jobs/:jobId/applicants` | Recruiter/Admin | List applicants for a job. |
| `PATCH` | `/api/applications/:id/status` | Recruiter/Admin | Update an application status. |
| `PATCH` | `/api/applications/:id/notes` | Recruiter/Admin | Update recruiter notes on an application. |
| `POST` | `/api/interviews` | Recruiter/Admin | Schedule an interview. |
| `PATCH` | `/api/interviews/:id` | Recruiter/Admin | Update an interview. |
| `DELETE` | `/api/interviews/:id` | Recruiter/Admin | Cancel an interview. |

### Shared professional-network features

These routes are available to authenticated users unless otherwise noted. Resource ownership and relationship checks may further restrict individual operations.

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/users/:id` | Public (optional auth) | View a public profile. |
| `GET` | `/api/companies` | Public (optional auth) | Browse companies. |
| `GET` | `/api/companies/:id` | Public (optional auth) | View a company. |
| `GET` | `/api/companies/:id/followers` | Authenticated | List company followers. |
| `POST`, `DELETE` | `/api/companies/:id/follow` | Authenticated | Follow or unfollow a company. |
| `GET` | `/api/jobs` | Public (optional auth) | Browse jobs. |
| `GET` | `/api/jobs/:id` | Public (optional auth) | View a job. |
| `GET` | `/api/connections` | Authenticated | List connections. |
| `GET` | `/api/connections/pending` | Authenticated | List pending connection requests. |
| `POST` | `/api/connections/:userId` | Authenticated | Send a connection request. |
| `PATCH` | `/api/connections/:id/accept` | Authenticated | Accept a connection request. |
| `PATCH` | `/api/connections/:id/reject` | Authenticated | Reject a connection request. |
| `PATCH` | `/api/connections/:userId/block` | Authenticated | Block a user. |
| `DELETE` | `/api/connections/:id` | Authenticated | Remove a connection. |
| `GET` | `/api/posts/feed` | Authenticated | View the personalized feed. |
| `GET` | `/api/posts/user/:userId` | Public (optional auth) | View a user's posts. |
| `POST` | `/api/posts` | Authenticated | Create a post; optional media upload uses the `media` multipart field. |
| `GET`, `PATCH`, `DELETE` | `/api/posts/:id` | Public for `GET`; Authenticated for changes | View, edit, or delete a post. |
| `POST` | `/api/posts/:id/like` | Authenticated | Toggle a post like. |
| `GET`, `POST` | `/api/posts/:id/comments` | Public for `GET`; Authenticated for `POST` | List or add comments. |
| `DELETE` | `/api/posts/comments/:commentId` | Authenticated | Delete a comment subject to ownership/authorization. |
| `POST` | `/api/messages` | Authenticated | Send a message. |
| `GET` | `/api/messages` | Authenticated | List conversations. |
| `GET` | `/api/messages/unread-count` | Authenticated | Get unread message count. |
| `GET` | `/api/conversations` | Authenticated | List conversations. |
| `GET` | `/api/conversations/:id/messages` | Authenticated | Get messages in a conversation. |
| `PATCH` | `/api/conversations/:id/read` | Authenticated | Mark a conversation as read. |
| `GET` | `/api/notifications` | Authenticated | List notifications. |
| `GET` | `/api/notifications/unread-count` | Authenticated | Get unread notification count. |
| `PATCH` | `/api/notifications/:id/read` | Authenticated | Mark a notification as read. |
| `PATCH` | `/api/notifications/read-all` | Authenticated | Mark all notifications as read. |
| `DELETE` | `/api/notifications/:id` | Authenticated | Delete a notification. |
| `GET` | `/api/applications/stats` | Authenticated | Get application statistics scoped by the controller. |
| `GET` | `/api/applications/:id` | Authenticated | View an application subject to ownership/authorization. |
| `GET` | `/api/interviews` | Authenticated | List interviews scoped to the signed-in user. |
| `GET` | `/api/interviews/:id` | Authenticated | View an interview subject to ownership/authorization. |
| `POST` | `/api/reports` | Authenticated | Submit a report about a platform resource. |
| `GET` | `/api/reports/my` | Authenticated | List reports submitted by the current user. |

### Admin — `/api/admin`

All admin routes require authentication and the `admin` role.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/analytics` | Get platform analytics. |
| `GET` | `/users` | List users. |
| `PATCH`, `DELETE` | `/users/:id/status`, `/users/:id` | Change user status or delete a user. |
| `PATCH` | `/users/:id/verify` | Verify a user. |
| `GET` | `/companies` | List companies. |
| `PATCH` | `/companies/:id/verification` | Change company verification status. |
| `GET` | `/jobs` | List jobs for moderation. |
| `PATCH`, `DELETE` | `/jobs/:id/moderate`, `/jobs/:id` | Moderate or remove a job. |
| `GET` | `/reports` | List submitted reports. |
| `PATCH` | `/reports/:id` | Resolve or dismiss a report. |
| `DELETE` | `/posts/:id` | Remove a post. |

## Project structure

```text
server/
├── src/
│   ├── app.js                 # Express app, middleware, and route mounting
│   ├── server.js              # Environment loading, database connection, listener
│   ├── config/                # MongoDB, Cloudinary, and mail configuration
│   ├── controllers/           # Request handlers and business logic
│   ├── middleware/            # Authentication, role checks, validation, uploads, errors
│   ├── models/                # Mongoose schemas and collections
│   ├── routes/                # REST endpoint definitions
│   ├── services/              # Email, notification, and asset-upload services
│   ├── utils/                 # Errors, responses, tokens, pagination, and seed script
│   └── validators/            # Joi request schemas
├── uploads/                   # Temporary files during Cloudinary uploads
├── .env                       # Local secrets/configuration (not committed)
├── package.json
└── README.md
```

### Main data models

`User`, `Company`, `Job`, `Application`, `SavedJob`, `Connection`, `Post`, `Like`, `Comment`, `Conversation`, `Message`, `Notification`, `Interview`, and `Report`. Profile experience, education, certifications, and skills are embedded in the user document; higher-volume relationships use separate collections.

## Uploads and external services

- Image uploads accept JPEG, PNG, WebP, and GIF. Resumes accept PDF, DOC, and DOCX.
- Uploads are limited to 5 MB, temporarily written under `uploads/`, then sent to Cloudinary.
- Email is sent through the configured SMTP host for account verification, password reset, application events, and interview invitations.
- The API creates `uploads/` if it does not already exist.

## Security and operational notes

- Keep `.env` and all production secrets private; rotate any credential that has been exposed.
- Use HTTPS in production and configure `CLIENT_URL` to the exact trusted client origin.
- The API defaults to development logging outside production. Error responses do not include stack traces in production.
- The server exits if it cannot connect to MongoDB; check `MONGO_URI` and database availability if startup fails.
