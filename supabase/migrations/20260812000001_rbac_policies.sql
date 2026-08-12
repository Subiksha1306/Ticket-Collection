-- 1. Foreign Key for Profiles to Auth Users
ALTER TABLE "public"."profiles" ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES auth.users("id") ON DELETE CASCADE;

-- 2. Role Helper Function
CREATE OR REPLACE FUNCTION public.has_role(required_role public."AppRole")
RETURNS boolean AS $$
DECLARE
  user_role public."AppRole";
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid()::uuid;
  
  IF user_role IS NULL THEN
    RETURN false;
  END IF;

  IF required_role = 'admin' THEN
    RETURN user_role = 'admin';
  ELSIF required_role = 'manager' THEN
    RETURN user_role IN ('admin', 'manager');
  ELSE
    RETURN user_role IN ('admin', 'manager', 'employee');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Enable RLS on all tables
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."submissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."submission_versions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."attachments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for PROFILES
CREATE POLICY "Users can view all profiles if manager/admin, else own profile"
ON "public"."profiles"
FOR SELECT
USING (
  public.has_role('manager') OR id = auth.uid()::uuid
);

CREATE POLICY "Users can insert their own profile"
ON "public"."profiles"
FOR INSERT
WITH CHECK (
  id = auth.uid()::uuid
);

CREATE POLICY "Only admins can update roles"
ON "public"."profiles"
FOR UPDATE
USING (
  public.has_role('admin') OR id = auth.uid()::uuid
)
WITH CHECK (
  public.has_role('admin') OR (
    id = auth.uid()::uuid AND role = (SELECT role FROM public.profiles p WHERE p.id = auth.uid()::uuid)
  )
);

-- 5. RLS Policies for SUBMISSIONS
CREATE POLICY "View Submissions Policy"
ON "public"."submissions"
FOR SELECT
USING (
  public.has_role('manager') OR
  created_by = auth.uid()::uuid
);

CREATE POLICY "Insert Submissions Policy"
ON "public"."submissions"
FOR INSERT
WITH CHECK (
  created_by = auth.uid()::uuid
);

CREATE POLICY "Update Submissions Policy (Metadata only)"
ON "public"."submissions"
FOR UPDATE
USING (
  public.has_role('manager') OR
  created_by = auth.uid()::uuid
);

-- 6. RLS Policies for SUBMISSION VERSIONS
CREATE POLICY "View Submission Versions Policy"
ON "public"."submission_versions"
FOR SELECT
USING (
  public.has_role('manager') OR
  created_by = auth.uid()::uuid OR
  EXISTS (
    SELECT 1 FROM "public"."submissions" s 
    WHERE s.id = "public"."submission_versions".submission_id 
    AND s.created_by = auth.uid()::uuid
  )
);

CREATE POLICY "Insert Submission Versions Policy"
ON "public"."submission_versions"
FOR INSERT
WITH CHECK (
  created_by = auth.uid()::uuid
);

CREATE POLICY "Update Submission Versions Policy"
ON "public"."submission_versions"
FOR UPDATE
USING (
  public.has_role('manager') OR
  created_by = auth.uid()::uuid
);

-- 7. RLS Policies for ATTACHMENTS
CREATE POLICY "View Attachments Policy"
ON "public"."attachments"
FOR SELECT
USING (
  public.has_role('manager') OR
  uploaded_by = auth.uid()::uuid OR
  EXISTS (
    SELECT 1 FROM "public"."submission_versions" sv
    JOIN "public"."submissions" s ON sv.submission_id = s.id
    WHERE sv.id = "public"."attachments".version_id
    AND s.created_by = auth.uid()::uuid
  )
);

CREATE POLICY "Insert Attachments Policy"
ON "public"."attachments"
FOR INSERT
WITH CHECK (
  uploaded_by = auth.uid()::uuid
);

-- 8. RLS Policies for AUDIT LOGS
CREATE POLICY "View Audit Logs Policy"
ON "public"."audit_logs"
FOR SELECT
USING (
  public.has_role('admin')
);

CREATE POLICY "Insert Audit Logs Policy"
ON "public"."audit_logs"
FOR INSERT
WITH CHECK (
  user_id = auth.uid()::uuid OR user_id IS NULL
);
