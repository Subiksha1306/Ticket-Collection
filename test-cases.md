# Test Cases

## 1. Authentication
1. **Navigate to `/` without logging in:** Verify redirection to `/login`.
2. **Login with invalid credentials:** Verify error message "Invalid credentials".
3. **Login with `admin@techxle.com` and `password123`:** Verify successful login and redirection to dashboard.
4. **Click "Sign out":** Verify session is destroyed and redirected to login.

## 2. Submission Creation
1. **Click "Create New Submission" from Dashboard:** Verify navigation to `/submissions/new`.
2. **Submit empty form:** Verify browser/frontend validation blocks submission.
3. **Fill form and upload files:** Enter Ticket `INC-001`, Title `Test 1`, Description `Desc`, and attach a file. Submit.
4. **Verify Creation:** Verify redirection to submission details page and ensure the ticket number, title, description, and attached files are visible.

## 3. Immutability & Versioning
1. **Click "Edit" on `INC-001`:** Verify form is pre-filled.
2. **Modify Data:** Change the Title to `Test 1 Edited`. Attach a second file.
3. **Save New Version:** Submit the form.
4. **Verify Details:** Verify the new Title is displayed and the version badge says `v2`. Ensure both the old and new files are listed under attachments.
5. **View History:** Click "View History". Verify that `v2 (Active)` and `v1` are both listed.
6. **Verify Immutability:** Verify that `v1` in the history still shows the original Title (`Test 1`) and only the first attached file.

## 4. Security
1. **Access Control:** Log in as User A, copy a submission URL. Log out, log in as User B, and attempt to access the URL. Verify `403 Forbidden` or redirection.
2. **No Delete:** Verify there are no "Delete" buttons anywhere in the UI. Send a manual `DELETE /api/submissions/:id` request via Postman and verify `404` or `405 Method Not Allowed`.
