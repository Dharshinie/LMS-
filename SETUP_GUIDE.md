# Apex LMS - Complete Setup Guide

This guide will walk you through setting up Apex LMS from scratch, including creating your first super admin account and accessing the demo data.

## Prerequisites

Before you begin, ensure you have:
- Node.js 18 or higher installed
- A Supabase account (free tier works fine)
- A code editor (VS Code recommended)
- Basic familiarity with the command line

## Step 1: Environment Setup

### 1.1 Verify Installation
```bash
node --version  # Should show v18.x.x or higher
npm --version   # Should show 9.x.x or higher
```

### 1.2 Install Dependencies
```bash
npm install
```

This will install all required packages:
- React & React DOM
- Supabase client
- Tailwind CSS
- Lucide React (icons)
- TypeScript and type definitions

## Step 2: Database Configuration

Your Supabase database is already configured with the connection details in the `.env` file:
```
VITE_SUPABASE_URL=https://tlkikdfjdpvgkqxaamvl.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

### 2.1 Verify Database Schema
The database has been automatically set up with all necessary tables:

**Core Tables** (11 tables total):
- organizations
- organization_settings
- user_profiles
- organization_members
- courses
- modules
- lessons
- quizzes
- quiz_questions
- quiz_options
- enrollments
- lesson_progress
- quiz_attempts
- certificates

### 2.2 Demo Data
Sample data has been pre-loaded:
- 2 organizations (TechCorp Academy, Healthcare Learning Institute)
- 5 professional courses
- Multiple modules and lessons
- Sample quizzes with questions

## Step 3: Creating Your Super Admin Account

### 3.1 Start the Development Server
```bash
npm run dev
```

The application will start at `http://localhost:5173`

### 3.2 Create Your Account
1. Open your browser and go to `http://localhost:5173`
2. Click "Don't have an account? Sign up"
3. Fill in your details:
   - Full Name: Your Name
   - Email: your-email@example.com
   - Password: Choose a secure password (min 6 characters)
   - Confirm Password: Re-enter your password
4. Click "Sign Up"
5. You'll be redirected to login automatically

### 3.3 Promote Yourself to Super Admin

After creating your account, you need to manually grant super admin privileges:

1. Open your Supabase Dashboard
2. Go to the SQL Editor
3. Run this query (replace the email with yours):

```sql
-- Get your user ID first
SELECT id, email FROM user_profiles WHERE email = 'your-email@example.com';

-- Add super admin role for TechCorp Academy
INSERT INTO organization_members (organization_id, user_id, role)
SELECT
  '11111111-1111-1111-1111-111111111111',
  id,
  'super_admin'::user_role
FROM user_profiles
WHERE email = 'your-email@example.com';
```

4. Refresh your browser
5. You now have super admin access!

## Step 4: Exploring the Platform

### 4.1 Dashboard Overview
After logging in as a super admin, you'll see:
- **Dashboard**: Overview of your platform
- **Courses**: Browse and manage all courses
- **Users**: User management (admin/super admin only)
- **Organizations**: Organization management (super admin only)
- **Settings**: Branding and configuration

### 4.2 Viewing Demo Courses
1. Click "Courses" in the sidebar
2. You'll see 5 pre-loaded courses:
   - Web Development Fundamentals
   - Data Science Essentials
   - Project Management Professional
   - Digital Marketing Mastery
   - Healthcare Compliance Training

### 4.3 Switching Organizations
As a super admin, you can access multiple organizations:
1. Click the organization dropdown at the top of the sidebar
2. Select between:
   - TechCorp Academy
   - Healthcare Learning Institute

## Step 5: Creating Additional Users

### 5.1 Create Test Users
For demo purposes, create additional users with different roles:

**Admin User**:
1. Sign up with a new email
2. Run this SQL to make them an admin:
```sql
INSERT INTO organization_members (organization_id, user_id, role)
SELECT
  '11111111-1111-1111-1111-111111111111',
  id,
  'admin'::user_role
FROM user_profiles
WHERE email = 'admin@example.com';
```

**Instructor User**:
```sql
INSERT INTO organization_members (organization_id, user_id, role)
SELECT
  '11111111-1111-1111-1111-111111111111',
  id,
  'instructor'::user_role
FROM user_profiles
WHERE email = 'instructor@example.com';
```

**Learner User**:
```sql
INSERT INTO organization_members (organization_id, user_id, role)
SELECT
  '11111111-1111-1111-1111-111111111111',
  id,
  'learner'::user_role
FROM user_profiles
WHERE email = 'learner@example.com';
```

## Step 6: Understanding User Roles

### Super Admin
- Can create new organizations
- Access all organizations
- Manage platform-wide settings
- See everything

**What you can do**:
- Navigate to "Organizations" to create new tenants
- Switch between any organization
- Manage users across all organizations

### Admin
- Manage their organization
- Create and publish courses
- Manage users within their org
- Configure branding

**What they can do**:
- Add/remove users in their organization
- Change organization colors and logo
- Create courses and assign instructors

### Instructor
- Create and manage courses
- View student progress
- Grade assessments

**What they can do**:
- Create new courses
- Edit their own courses
- View enrollments and progress

### Learner
- Enroll in courses
- Complete lessons
- Take quizzes
- Earn certificates

**What they can do**:
- Browse available courses
- Track their progress
- Download certificates

## Step 7: Testing Multi-Tenancy

### 7.1 Verify Data Isolation
1. Log in as super admin
2. Switch to "TechCorp Academy"
3. Note the courses visible
4. Switch to "Healthcare Learning Institute"
5. You should see different courses
6. Data is completely isolated!

### 7.2 Test Role Permissions
1. Log in as a learner
2. Notice you can't see "Users" or "Organizations" in the menu
3. You only see learner-relevant features
4. Log out and log in as an admin
5. You now see management features

## Step 8: Customizing Your Organization

### 8.1 Update Branding
1. Navigate to "Settings"
2. Update the following:
   - Logo URL (use a public image URL)
   - Primary Color (e.g., #2563EB for blue)
   - Secondary Color (e.g., #1E40AF for darker blue)
3. Click "Save Changes"

### 8.2 Organization Settings
Each organization can have:
- Custom logo
- Brand colors
- Custom domain (requires setup)

## Step 9: Building for Production

### 9.1 Run Build
```bash
npm run build
```

This creates optimized production files in the `dist/` directory.

### 9.2 Test Production Build
```bash
npm run preview
```

Visit `http://localhost:4173` to test the production build.

## Common Issues & Solutions

### Issue: Can't log in after signing up
**Solution**: Check that email confirmation is disabled in Supabase:
1. Go to Supabase Dashboard → Authentication → Settings
2. Under "Email Auth", ensure "Enable email confirmations" is OFF

### Issue: Don't see any navigation items
**Solution**: You haven't been added to an organization:
1. Run the SQL query from Step 3.3
2. Make sure you're using the correct email
3. Refresh the page

### Issue: "Missing Supabase environment variables" error
**Solution**: Check your `.env` file:
1. Ensure it exists in the project root
2. Verify the variables are named correctly:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### Issue: RLS policy error when accessing data
**Solution**: This usually means:
1. You're not logged in
2. You don't have the required role
3. You're not a member of the organization

Run this to check your membership:
```sql
SELECT om.*, o.name as org_name
FROM organization_members om
JOIN organizations o ON o.id = om.organization_id
WHERE om.user_id = 'your-user-id';
```

## Next Steps

Now that you have Apex LMS set up, you can:

1. **Explore the code**:
   - `/src/contexts/AuthContext.tsx` - Authentication logic
   - `/src/components/layout/DashboardLayout.tsx` - Main layout
   - `/src/pages/` - All page components

2. **Start development**:
   - Build the course creator UI
   - Implement the quiz-taking interface
   - Add certificate generation

3. **Read the documentation**:
   - `README.md` - Project overview
   - `PROJECT_STATUS.md` - Development roadmap
   - Supabase docs - Database and auth details

## Development Workflow

### Daily Development
```bash
# Start dev server
npm run dev

# Run type checking
npm run typecheck

# Build for production
npm run build
```

### Database Changes
If you need to modify the schema:
1. Use Supabase Dashboard SQL Editor
2. Always use RLS policies
3. Test with different user roles
4. Document your changes

### Testing Different Roles
Keep multiple browser profiles or use incognito:
- Chrome Profile 1: Super Admin
- Chrome Profile 2: Admin
- Chrome Profile 3: Instructor
- Incognito: Learner

## Support & Resources

- **Supabase Docs**: https://supabase.com/docs
- **React Docs**: https://react.dev
- **Tailwind CSS**: https://tailwindcss.com
- **TypeScript**: https://www.typescriptlang.org

## Security Reminders

- Never commit the `.env` file to version control
- Always use RLS policies for new tables
- Test multi-tenant isolation thoroughly
- Use the principle of least privilege for roles
- Validate all user inputs

---

**Congratulations!** You now have a fully operational multi-tenant LMS. Start building amazing courses and experiences for your users!

For questions or issues, refer to `PROJECT_STATUS.md` for the current development status and roadmap.
