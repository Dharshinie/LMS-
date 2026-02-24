# Role-Based Access Control (RBAC) Implementation

## Overview

Apex LMS implements comprehensive Role-Based Access Control at both the database and application layers, ensuring that users can only access data and features appropriate to their role.

## Role Hierarchy

```
Super Admin
    ├── Full platform access
    ├── Can create organizations
    └── Can access all organizations

Admin (per organization)
    ├── Organizational management
    ├── User management
    ├── Can create/publish courses
    └── Can view organization analytics

Instructor (per organization)
    ├── Can create/edit courses
    ├── Can view student progress
    └── Can grade assessments

Learner (per organization)
    ├── Can enroll in courses
    ├── Can view own progress
    └── Can complete courses
```

## Implementation Layers

### 1. Database Layer (Row Level Security)

**Every table has RLS enabled** with specific policies:

#### Organizations Table
- **SELECT**: Super Admins see all organizations; Users see only their organizations
- **INSERT**: Only Super Admins can create organizations
- **UPDATE**: Only Admins/Super Admins within the org can update

#### User Profiles Table
- **SELECT**: Users can view their own profile; Can view profiles within same organization
- **UPDATE**: Users can update only their own profile

#### Organization Members Table
- **SELECT**: Users see members of their organizations
- **INSERT/UPDATE/DELETE**: Only Admins can manage members in their organization

#### Courses Table
- **SELECT**:
  - Published courses: All org members
  - Unpublished courses: Only the instructor/admin
- **INSERT**: Only instructors and admins can create
- **UPDATE**: Only course instructor or admin can edit

#### Enrollments Table
- **SELECT**:
  - Learners see only their own enrollments
  - Instructors see enrollments for their courses
  - Admins see all organization enrollments
- **INSERT**: Users can self-enroll or admins can enroll others
- **UPDATE**: Users can update their own, instructors/admins for organization

#### Quizzes & Quiz Attempts
- **SELECT**: Users can view quizzes for courses they're enrolled in
- **INSERT**: Users can create attempts for courses they're enrolled in
- **UPDATE/VIEW ANSWERS**: Only query own attempts or have instructor role

### 2. Application Layer (Frontend)

**Role-based UI rendering**:

#### Navigation Menu
```typescript
// src/components/layout/DashboardLayout.tsx
const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', roles: ['all'] },
  { id: 'courses', label: 'Courses', roles: ['all'] },
  { id: 'users', label: 'Users', roles: ['admin', 'super_admin'] },
  { id: 'organizations', label: 'Organizations', roles: ['super_admin'] },
  { id: 'settings', label: 'Settings', roles: ['admin', 'super_admin'] },
];
```

#### Feature Visibility
```typescript
// Role-gated buttons and content
{(role === 'instructor' || role === 'admin') && (
  <button>Create Course</button>
)}
```

### 3. Authentication Layer

**Authentication Context** (`src/contexts/AuthContext.tsx`):

```typescript
interface OrganizationMember {
  id: string;
  organization_id: string;
  role: UserRole;  // super_admin | admin | instructor | learner
  organization: {
    id: string;
    name: string;
    slug: string;
  };
}
```

When a user logs in:
1. Supabase retrieves authenticated user
2. System queries user's organization memberships
3. Each membership includes the user's role for that organization
4. Frontend stores current organization and role
5. All queries filter by both user ID and organization ID

## Security Guarantees

### Data Isolation

**Cross-Organization Access Prevention**:
```sql
-- Users CANNOT access other organizations' data
-- Even with direct URL manipulation, RLS prevents access

-- Example: Learner from Org A tries to access Org B course
SELECT * FROM courses
WHERE organization_id = 'org_b_id'  -- User in org_a cannot see this
```

### Role Enforcement

**Users cannot elevate their own privileges**:
- Supabase JWT contains only read-only user info
- Role is stored in `organization_members` table (immutable from user perspective)
- Only admins can modify roles (protected by RLS)

### Default Deny

**RLS Policy Default**: All tables are locked down by default
```sql
-- After enabling RLS without policies, NO ONE can access data
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
-- Now explicitly define who CAN access

CREATE POLICY "Users can view published courses in their org"
  ON courses FOR SELECT
  TO authenticated
  USING (
    is_published = true AND
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = courses.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );
```

## Verification Checklist

### Testing RBAC

1. **Cross-Organization Access**
   ```
   - Sign in as learner from Org A
   - Verify cannot access Org B courses even with URL manipulation
   - Cannot see Org B users in user list
   - Cannot enroll in Org B courses
   ```

2. **Role Permissions**
   ```
   - Learner: Cannot create courses, manage users, or access settings
   - Instructor: Can create courses, view own student progress
   - Admin: Can create courses, manage users, modify org settings
   - Super Admin: Can access all organizations
   ```

3. **Privilege Escalation Prevention**
   ```
   - Learner cannot promote themselves to instructor
   - Instructor cannot access admin settings
   - Admin cannot access other organizations
   - Only super admin can create organizations
   ```

## Implementation Best Practices

### When Adding New Features

1. **Create table with RLS enabled**:
   ```sql
   CREATE TABLE feature (
     id uuid PRIMARY KEY,
     organization_id uuid REFERENCES organizations(id),
     ...
   );
   ALTER TABLE feature ENABLE ROW LEVEL SECURITY;
   ```

2. **Define explicit policies**:
   ```sql
   CREATE POLICY "Users can view org features"
     ON feature FOR SELECT
     TO authenticated
     USING (
       EXISTS (
         SELECT 1 FROM organization_members
         WHERE organization_id = feature.organization_id
         AND user_id = auth.uid()
       )
     );
   ```

3. **Filter on frontend**:
   ```typescript
   const { data } = await supabase
     .from('feature')
     .select('*')
     .eq('organization_id', currentOrganization.organization_id)
     .eq('user_id', user.id);  // Double filter for safety
   ```

### Query Patterns

**Always include organization_id in WHERE clause**:
```typescript
// Good - filtered by organization
await supabase
  .from('courses')
  .select('*')
  .eq('organization_id', currentOrganization.organization_id);

// Bad - trusting only RLS (works but risky)
await supabase
  .from('courses')
  .select('*');
```

**Always use maybeSingle() for optional results**:
```typescript
// Good - returns null safely
const { data } = await supabase
  .from('courses')
  .select('*')
  .eq('id', courseId)
  .maybeSingle();

// Bad - throws error if not found
const { data } = await supabase
  .from('courses')
  .select('*')
  .eq('id', courseId)
  .single();
```

## Known Limitations & Notes

1. **RLS Performance**: RLS can add minimal query overhead; heavily used queries should be tested
2. **Service Role Keys**: Only use with server-side code; never expose in frontend
3. **JWT Tokens**: All RLS checks validate against user's JWT
4. **Testing**: Must test as different roles to verify RLS works correctly

## Future Enhancements

- [ ] Implement custom roles (e.g., "Content Manager", "Report Viewer")
- [ ] Add audit logging for role changes
- [ ] Implement role inheritance system
- [ ] Add time-based role assignments (temporary permissions)
- [ ] Create role templates for common use cases

## Support & Debugging

### Check User's Roles
```sql
SELECT om.*, o.name as org_name
FROM organization_members om
JOIN organizations o ON o.id = om.organization_id
WHERE om.user_id = auth.uid();
```

### Test RLS Policy
```sql
-- Run as specific user (requires JWT)
SELECT * FROM courses WHERE organization_id = 'test_org_id';
```

### Enable RLS Audit (Optional)
```sql
CREATE TABLE audit_log (
  id uuid PRIMARY KEY,
  table_name text,
  action text,
  user_id uuid,
  timestamp timestamptz DEFAULT now()
);
```

---

**Last Updated**: Implementation complete
**Status**: All roles fully implemented with RLS enforcement
