# Techxle Data Collection Portal

A lightweight internal web application for Techxle to collect, store, and version ticket-related information and attachments.

## Prerequisites
- Node.js 20+
- npm

## Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure you have the following configured:
- `DATABASE_URL`: Connection string for SQLite (`file:./dev.db`)
- `JWT_SECRET`: Secret key for JWT authentication.

## Database Setup
Run the Prisma migrations and generate the client:
```bash
npx prisma db push
npx prisma generate
```

Seed the database with the default admin user:
```bash
npx tsx prisma/seed.ts
```
**Default Credentials:**
- Email: `admin@techxle.com`
- Password: `password123`

## Running Locally
Start the development server:
```bash
npm run dev
```
Access the application at [http://localhost:3000](http://localhost:3000).

## Authentication Setup
The application currently uses an isolated development authentication mode. The logic is abstracted in `src/lib/auth.ts`. 
To migrate to Techxle/Microsoft SSO, replace the `encrypt`, `decrypt`, and `createSession` implementations in `lib/auth.ts` with your OAuth/OIDC provider logic.

## File Storage Setup
Files are stored locally in `public/uploads` for development. The storage abstraction is located in `src/lib/storage.ts`.
To migrate to AWS S3 or Azure Blob Storage, update the `saveFile` function in `lib/storage.ts` to push buffers to your cloud provider.

## Project Structure
- `/src/app`: Next.js App Router (Pages & API Routes)
- `/src/components`: Reusable React components (SubmissionForm)
- `/src/lib`: Core abstractions (auth, db, storage)
- `/prisma`: Database schema and configuration
- `/public/uploads`: Local file storage directory

## Running Tests
Refer to `test-cases.md` for the manual end-to-end testing protocol. Automated tests can be added later using Jest or Playwright.
