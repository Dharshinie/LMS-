/*
  # Fix organization_members RLS to prevent invisible memberships

  ## Why
  The existing policies query `organization_members` from within policies on the
  same table, which can lead to recursion problems and hidden rows.
  Also, the INSERT policy compares `organization_members.organization_id` to
  itself, which is always true and not scoped to the new row.
*/

CREATE OR REPLACE FUNCTION public.is_org_member(target_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.organization_id = target_org_id
      AND om.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_org_admin(target_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.organization_id = target_org_id
      AND om.user_id = auth.uid()
      AND om.role IN ('admin', 'super_admin')
  );
$$;

DROP POLICY IF EXISTS "Users can view members in their organizations" ON public.organization_members;
DROP POLICY IF EXISTS "Admins can add members to their organization" ON public.organization_members;
DROP POLICY IF EXISTS "Admins can update members in their organization" ON public.organization_members;
DROP POLICY IF EXISTS "Admins can remove members from their organization" ON public.organization_members;

CREATE POLICY "Users can view members in their organizations"
  ON public.organization_members FOR SELECT
  TO authenticated
  USING (public.is_org_member(organization_id));

CREATE POLICY "Admins can add members to their organization"
  ON public.organization_members FOR INSERT
  TO authenticated
  WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY "Admins can update members in their organization"
  ON public.organization_members FOR UPDATE
  TO authenticated
  USING (public.is_org_admin(organization_id))
  WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY "Admins can remove members from their organization"
  ON public.organization_members FOR DELETE
  TO authenticated
  USING (public.is_org_admin(organization_id));
