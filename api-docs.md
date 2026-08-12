# Techxle Portal API Documentation

All APIs require authentication. A valid `session` JWT cookie must be present in the request.

## Submissions

### 1. Get All Submissions
- **Method:** `GET`
- **Endpoint:** `/api/submissions`
- **Description:** Retrieves all submissions created by the authenticated user, including their current active version.
- **Response:** `200 OK`
  ```json
  [
    {
      "id": "cuid",
      "ticketNumber": "INC123",
      "createdAt": "date",
      "updatedAt": "date",
      "versions": [
        {
          "versionNumber": 1,
          "title": "Issue Title",
          "isActive": true
        }
      ]
    }
  ]
  ```

### 2. Create Submission
- **Method:** `POST`
- **Endpoint:** `/api/submissions`
- **Content-Type:** `multipart/form-data`
- **Payload:**
  - `ticketNumber` (string, required)
  - `title` (string, required)
  - `description` (string, required)
  - `files` (File[], optional)
- **Description:** Creates a new submission, generates Version 1, and saves uploaded attachments.
- **Response:** `200 OK`

### 3. Get Submission Details
- **Method:** `GET`
- **Endpoint:** `/api/submissions/:id`
- **Description:** Retrieves a specific submission and its current active version (with attachments).
- **Response:** `200 OK`
- **Errors:** `404 Not Found`, `403 Forbidden`

## Versions

### 4. Get Version History
- **Method:** `GET`
- **Endpoint:** `/api/submissions/:id/versions`
- **Description:** Retrieves all versions (active and inactive) for a specific submission.
- **Response:** `200 OK`

### 5. Create New Version (Edit)
- **Method:** `POST`
- **Endpoint:** `/api/submissions/:id/versions`
- **Content-Type:** `multipart/form-data`
- **Payload:**
  - `title` (string, required)
  - `description` (string, required)
  - `existingAttachments` (string/JSON array, optional)
  - `files` (File[], optional)
- **Description:** Creates a new version, marks old versions as inactive, and preserves specified existing attachments alongside newly uploaded files.
- **Response:** `200 OK`
