/*
  # Assign Organization Role During Signup

  ## Goal
  Use auth signup metadata to auto-create organization membership so role-based
  access works immediately after first login.

  Metadata expected:
  - role: learner | instructor | admin | super_admin
  - organization_id: uuid (optional, defaults to TechCorp demo org)
*/

CREATE OR REPLACE FUNCTION public.create_user_profile()
RETURNS TRIGGER AS $$
DECLARE
  requested_role_text text;
  requested_role user_role;
  requested_org_id uuid;
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NULLIF(NEW.raw_user_meta_data ->> 'full_name', '')
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = COALESCE(public.user_profiles.full_name, EXCLUDED.full_name),
        updated_at = now();

  requested_role_text := NEW.raw_user_meta_data ->> 'role';
  requested_role := CASE
    WHEN requested_role_text IN ('learner', 'instructor', 'admin', 'super_admin')
      THEN requested_role_text::user_role
    ELSE 'learner'::user_role
  END;

  requested_org_id := COALESCE(
    NULLIF(NEW.raw_user_meta_data ->> 'organization_id', '')::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid
  );

  IF EXISTS (SELECT 1 FROM public.organizations WHERE id = requested_org_id) THEN
    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (requested_org_id, NEW.id, requested_role)
    ON CONFLICT (organization_id, user_id) DO UPDATE
      SET role = EXCLUDED.role;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'create_user_profile failed for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_user_profile();
