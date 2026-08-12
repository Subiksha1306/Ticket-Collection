-- Enable Storage extension if not already
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('ticket-attachments', 'ticket-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
-- Subiksha, as Manager, can: Can view authorized employee attachments. Can upload attachments when creating/editing authorized submissions.
-- Admin can: Can view authorized attachments across the application. Can upload attachments.
-- Employee: Can upload attachments to own submissions. Can view attachments belonging to own submissions.
-- Nobody can delete.

-- 1. View Attachments (SELECT)
CREATE POLICY "View Attachments" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'ticket-attachments' AND (
    public.has_role('admin') OR
    public.has_role('manager') OR
    (auth.uid() = owner)
  )
);

-- 2. Upload Attachments (INSERT)
CREATE POLICY "Upload Attachments" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'ticket-attachments' AND
  auth.uid() = owner
);

-- NO UPDATE or DELETE policies
