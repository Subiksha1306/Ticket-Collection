# NOTES

## Assumptions & Design Choices
- **Authentication**: Built a generic JWT-in-cookie auth system inside `src/lib/auth.ts`. 
  - **SSO Integration Point**: The `setSession` function in `src/lib/auth.ts` is explicitly commented as the integration point for real Techxle SSO. Once you have real OAuth/SAML tokens, you can bypass the local `bcrypt` check and directly call `setSession(userId)`.
- **Database & Storage Architecture**: 
  - The SQLite database is running via Prisma. The schema is highly portable because it avoids SQLite-specific types (e.g., uses standard String/DateTime). 
  - **Swap to Postgres**: To migrate to Postgres, simply update `provider = "sqlite"` to `provider = "postgresql"` in `prisma/schema.prisma` and update the `DATABASE_URL` in `.env`.
  - **Storage Abstraction**: File uploads are routed through a single `storage.upload` method in `src/lib/storage.ts`. To migrate to S3 or Blob storage, you only need to rewrite that single function to upload a buffer to the cloud and return the public URL, leaving the business logic in API routes completely untouched.
- **Versioning Strategy**: 
  - Implemented the exact spec: absolutely no `DELETE` operations or API routes exist in the codebase.
  - Edits create a new entry with `version + 1` and mark the previous one `inactive`.
  - Attachments are structurally copied over to new versions (the metadata is duplicated in the DB pointing to the same file path) so historical versions keep their exact snapshot of attachments.

## Running the App
- Seed User: `admin@techxle.com` / `password`
