# Apex LMS - Quick Start Guide

## 30-Second Setup

```bash
npm install
npm run dev
# Visit http://localhost:5173
```

## Creating Your First Demo

### Step 1: Sign Up (3 minutes)
1. Click "Sign up"
2. Enter: Full Name, Email, Password
3. Click "Create Account"
4. You'll be redirected to login

### Step 2: Promote to Super Admin (2 minutes)
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Paste this (replace email):
```sql
INSERT INTO organization_members (organization_id, user_id, role)
SELECT '11111111-1111-1111-1111-111111111111', id, 'super_admin'::user_role
FROM user_profiles
WHERE email = 'your-email@example.com';
```
4. Execute and refresh browser

### Step 3: Explore the Dashboard
- You now have Super Admin access
- Navigate to "Courses" to see demo courses
- Switch organizations using dropdown in sidebar

---

## Testing Role-Based Access

### Create Test Users
Sign up with these emails to test different roles:

**Instructor Account**:
```
Email: instructor@test.com
Password: test123456
```
Then promote with SQL:
```sql
INSERT INTO organization_members (organization_id, user_id, role)
SELECT '11111111-1111-1111-1111-111111111111', id, 'instructor'::user_role
FROM user_profiles WHERE email = 'instructor@test.com';
```

**Learner Account**:
```
Email: learner@test.com
Password: test123456
```
Then promote with SQL:
```sql
INSERT INTO organization_members (organization_id, user_id, role)
SELECT '11111111-1111-1111-1111-111111111111', id, 'learner'::user_role
FROM user_profiles WHERE email = 'learner@test.com';
```

### What Each Role Can See

**Super Admin**: Everything
- All organizations
- All courses
- User management
- Settings

**Admin**: Organization management
- Organization settings
- User management
- All courses
- Cannot create other orgs

**Instructor**: Course creation
- Create courses
- View student progress
- Cannot manage users

**Learner**: Course enrollment
- Browse courses
- Enroll in courses
- View progress
- View certificates (when earned)

---

## Creating Your First Course

### As an Instructor:

1. **Log in as instructor**
   - Email: instructor@test.com
   - Password: test123456

2. **Navigate to Courses**
   - Click "Courses" in sidebar

3. **Click "Create Course" button**
   - Modal opens with course builder

4. **Fill in Course Details**
   ```
   Title: "Web Development 101"
   Description: "Learn the basics of web development"
   Duration: 20 hours
   Passing Score: 75%
   ```

5. **Add Modules**
   - Click "Add Module"
   - Module 1: "HTML Basics"
   - Module 2: "CSS Styling"
   - Module 3: "JavaScript"

6. **Add Lessons to Modules**
   - Click "Add Lesson" in each module
   - Fill in lesson details
   - Select content type (text/video/document)
   - Set duration

7. **Organize with Drag-and-Drop**
   - Drag module cards to reorder
   - Lessons are ordered within modules

8. **Save Course**
   - Click "Save Course" button
   - Course is created and saved to database

---

## Enrolling as a Learner

### As a Learner:

1. **Log in as learner**
   - Email: learner@test.com
   - Password: test123456

2. **Go to Dashboard**
   - See "Your Learning Path" section
   - Shows enrolled courses (if any)

3. **Click "Courses" in Sidebar**
   - See all published courses
   - 5 demo courses are available

4. **Enroll in a Course**
   - Click "Enroll Now" button
   - You'll see progress bar update

5. **Track Your Progress**
   - Dashboard shows progress
   - Courses page shows detailed progress
   - Click course to see full details

6. **Continue Learning**
   - Click "Continue" button to resume

---

## Key Features Overview

### Dashboard
- Statistics cards (courses, progress, certificates)
- "Your Learning Path" shows top 3 courses
- Quick action buttons
- Getting started banner

### Courses Page
- Grid view of all courses
- Filter by status (enrolled/available)
- Progress bars for enrolled courses
- Enroll button for new courses
- Course details modal

### Course Builder (Instructor)
- Drag-and-drop modules
- Add/remove modules dynamically
- Nested lesson creation
- Multiple content types
- Auto-save to database
- Course preview

### Navigation
- Role-based menu filtering
- Organization switcher
- User profile dropdown
- Sign out button

---

## Demo Data Included

**5 Professional Courses**:
1. Web Development Fundamentals (40 hours)
2. Data Science Essentials (50 hours)
3. Project Management Professional (60 hours)
4. Digital Marketing Mastery (35 hours)
5. Healthcare Compliance Training (20 hours)

**2 Organizations**:
- TechCorp Academy
- Healthcare Learning Institute

**Each course includes**:
- Multiple modules
- Sample lessons
- Quiz questions
- Realistic descriptions

---

## Troubleshooting

### Can't Log In
- Check email and password
- Verify account was created
- Clear browser cache
- Try incognito mode

### Don't See "Create Course" Button
- Make sure you're logged in as Instructor or Admin
- Verify your role was added correctly:
```sql
SELECT * FROM organization_members WHERE user_id = 'your-user-id';
```

### Courses Not Showing
- Only published courses are visible
- Learners only see courses from their organization
- Admins can see all courses

### Navigation Menu Incomplete
- Menu items are role-based
- Super Admin sees all items
- Others see only relevant items

### Build/Compilation Errors
- Delete `node_modules` and run `npm install`
- Clear `.next` or `dist` folders
- Run `npm run build` to verify

---

## Important SQL Queries

### Check User's Organization & Role
```sql
SELECT om.*, o.name as org_name, up.email
FROM organization_members om
JOIN organizations o ON o.id = om.organization_id
JOIN user_profiles up ON up.id = om.user_id
WHERE om.user_id = 'your-user-id';
```

### View All Users in Organization
```sql
SELECT up.email, om.role, o.name
FROM organization_members om
JOIN user_profiles up ON up.id = om.user_id
JOIN organizations o ON o.id = om.organization_id
WHERE o.id = '11111111-1111-1111-1111-111111111111';
```

### View All Courses
```sql
SELECT title, is_published, duration_hours, passing_score, up.email as instructor
FROM courses c
LEFT JOIN user_profiles up ON up.id = c.instructor_id
ORDER BY c.created_at DESC;
```

### Check User Enrollments
```sql
SELECT c.title, e.progress_percentage, e.status, e.enrolled_at
FROM enrollments e
JOIN courses c ON c.id = e.course_id
WHERE e.user_id = 'your-user-id'
ORDER BY e.enrolled_at DESC;
```

---

## What's Next

### Short Term (This Sprint)
- [ ] Quiz system (create, take, auto-grade)
- [ ] Certificate generation (PDF with QR code)
- [ ] Analytics dashboard

### Medium Term
- [ ] Discussion forums
- [ ] Badge/gamification system
- [ ] Bulk user import
- [ ] Advanced reporting

### Long Term
- [ ] Live learning (Zoom integration)
- [ ] Mobile app
- [ ] API marketplace
- [ ] Advanced scheduling

---

## Support

### Documentation
- `README.md` - Project overview
- `SETUP_GUIDE.md` - Detailed setup
- `RBAC_IMPLEMENTATION.md` - Auth system
- `PROJECT_STATUS.md` - Development roadmap

### Common Issues
See `SETUP_GUIDE.md` troubleshooting section

### Need Help?
1. Check documentation
2. Review Supabase dashboard
3. Check browser console for errors
4. Verify database schema is deployed

---

## Demo Script (5 minutes)

**Time: 0:00 - Intro**
"Apex LMS is an enterprise learning management system built with React and Supabase..."

**Time: 0:30 - Multi-Tenant Architecture**
"Switch between organizations to show data isolation"
- Sign in as Super Admin
- Show TechCorp Academy
- Show Healthcare Learning Institute
- Explain complete data isolation

**Time: 1:30 - Learner Experience**
"Let me show you what learners see..."
- Sign in as learner
- Show Dashboard with learning path
- Show 5 published courses
- Enroll in a course
- Show progress tracking

**Time: 3:00 - Instructor Features**
"Instructors can create and manage courses..."
- Sign in as instructor
- Open Course Builder
- Show drag-and-drop modules
- Demonstrate lesson creation
- Save a new course

**Time: 4:30 - Role-Based Access**
"Each role has specific permissions..."
- Show navigation filtering
- Demonstrate restricted features
- Show database RLS in action

**Time: 5:00 - Close**
"That's Apex LMS in action - secure, scalable, and ready for enterprise training."

---

## Browser Compatibility

Tested and working on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

---

**Ready to launch your LMS!** 🚀
