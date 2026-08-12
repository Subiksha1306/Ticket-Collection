# Techxle Internal Data Collection Portal - BRD

## 1. BUSINESS REQUIREMENT
The application is intended for Techxle users to submit information associated with a selected ticket.
The basic user flow should be:
Techxle Login -> Enter Ticket Number -> Enter Title -> Enter Detailed Description -> Attach Documents / Images -> Submit -> Store Data in Database -> Allow viewing/editing -> Create a new version whenever edited -> Never permanently delete submitted data.

## 2. CORE REQUIREMENTS
- Users should log in using their Techxle account (mocked via JWT for development).
- The authenticated user's identity should be stored with every submitted record (User ID, name, email, timestamp).

## 3. TICKET DATA COLLECTION
The form must contain:
1. Ticket Number (Required text input)
2. Title (Required short text)
3. Description (Required multiline text editor)
4. Attachments (Allow PDF, DOC/DOCX, Images)

## 4. DATABASE STORAGE
- Persistent storage using SQLite and Prisma ORM.

## 5. DATA MODEL
One Submission -> Multiple Versions -> One Active Version.

## 6. VERY IMPORTANT: NO DELETE
Users must NOT be given a delete option for submitted records. No permanent deletion from the database.

## 7. VERSIONING REQUIREMENT
Editing must NEVER overwrite the existing version. Instead, create a new version and mark the old one as inactive.

## 8. VERSION HISTORY UI
Create a simple version-history interface displaying all previous versions as read-only.

## 9. EDIT FLOW
When clicking Edit on the current version, load data into the form. On Save, create a new version and increment the version number.

## 10. ATTACHMENT VERSIONING
Attachments must follow the versioning model. Previous attachments remain preserved.

## 11. USER INTERFACE
- PAGE 1 — LOGIN
- PAGE 2 — HOME / SUBMISSIONS
- PAGE 3 — CREATE SUBMISSION
- PAGE 4 — SUBMISSION DETAILS
- PAGE 5 — EDIT SUBMISSION
- PAGE 6 — VERSION HISTORY

## 12. API DESIGN
- `POST /api/submissions`
- `GET /api/submissions`
- `GET /api/submissions/:id`
- `POST /api/submissions/:id/versions`
- `GET /api/submissions/:id/versions`

## 13. BACKEND VALIDATION
Validate authentication, required fields, and submission ownership.

## 14. SECURITY
Authentication, server-side validation, secure file upload handling.

## 15. FILE STORAGE
Separate file storage from database metadata. Abstracted local storage to allow future cloud migration.

## 16. AUDITABILITY
Maintain basic audit information for versions and attachments.

## 17. TECHNOLOGY STACK
- Frontend: Next.js, React, Tailwind CSS
- Backend: Next.js API Routes
- Database: SQLite with Prisma
- Authentication: JWT

## 18. PROJECT STRUCTURE
Organized into `/app`, `/components`, `/lib`, and `/prisma`.
