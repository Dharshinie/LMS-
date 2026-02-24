# Apex LMS - Enterprise Learning Management System

A comprehensive, multi-tenant Learning Management System built with React, TypeScript, and Supabase. Designed for enterprise sales demos and production deployment.

## Features

### Phase 1: Foundation & SaaS Core
- Multi-tenant architecture with complete data isolation
- Role-Based Access Control (Super Admin, Admin, Instructor, Learner)
- Supabase Authentication with email/password
- White-labeling support (custom colors, logos, domains)
- Organization management system

### Phase 2: Learning Experience
- Hierarchical course structure (Courses → Modules → Lessons)
- Multiple content types (video, documents, SCORM, text, external links)
- Quiz and assessment engine with multiple question types
- Student enrollment and progress tracking
- Certificate generation system

### Phase 3: Enterprise Features
- Analytics dashboard (in development)
- Reporting capabilities (in development)
- Badge and gamification system (planned)
- Live learning integration (planned)

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Icons**: Lucide React
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Supabase account and project

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd apex-lms
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables

The `.env` file should already contain your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server
```bash
npm run dev
```

5. Build for production
```bash
npm run build
```

## Database Setup

The database schema has been automatically created with the following structure:

### Core Tables
- `organizations` - Multi-tenant organizations
- `organization_settings` - White-labeling configuration
- `user_profiles` - Extended user information
- `organization_members` - User-organization relationships with roles

### Learning Tables
- `courses` - Course catalog
- `modules` - Course sections
- `lessons` - Individual learning units
- `quizzes` - Assessments
- `quiz_questions` - Quiz questions
- `quiz_options` - Answer choices
- `enrollments` - Student course registrations
- `lesson_progress` - Lesson completion tracking
- `quiz_attempts` - Quiz submissions
- `certificates` - Completion certificates

### Demo Data

The system includes comprehensive demo data:
- 2 sample organizations (TechCorp Academy, Healthcare Learning Institute)
- 5 professional courses with modules and lessons
- Sample quizzes with questions and answers

## Setting Up Your First Super Admin

1. Sign up for an account through the UI at `/`
2. After creating your account, you need to manually add yourself as a super admin
3. Run this SQL query in your Supabase SQL Editor:

```sql
-- Replace 'your-email@example.com' with your actual email
INSERT INTO organization_members (organization_id, user_id, role)
SELECT
  '11111111-1111-1111-1111-111111111111',
  id,
  'super_admin'
FROM user_profiles
WHERE email = 'your-email@example.com';
```

4. Refresh your browser and you'll now have super admin access

## User Roles

### Super Admin
- Create and manage organizations
- Access all organizations and data
- Manage platform-wide settings

### Admin
- Manage users within their organization
- Create and publish courses
- View analytics and reports
- Configure organization branding

### Instructor
- Create and manage courses
- View student progress
- Grade assessments

### Learner
- Enroll in courses
- Complete lessons and quizzes
- Track personal progress
- Earn certificates

## Project Structure

```
src/
├── components/
│   ├── auth/          # Authentication components
│   └── layout/        # Layout components
├── contexts/          # React contexts (Auth)
├── lib/               # Utilities (Supabase client)
├── pages/             # Page components
├── types/             # TypeScript definitions
├── App.tsx            # Main application
└── main.tsx           # Entry point
```

## Development Roadmap

### Completed
- [x] Multi-tenant database architecture
- [x] Authentication system
- [x] Role-based access control
- [x] User management UI
- [x] Organization management
- [x] White-labeling foundation
- [x] Course schema and data models
- [x] Basic dashboard views

### In Progress
- [ ] Course builder UI with drag-and-drop
- [ ] Assessment engine UI
- [ ] Certificate generation with QR codes
- [ ] Analytics dashboard

### Planned
- [ ] Video player with seek prevention
- [ ] SCORM package support
- [ ] Discussion forums
- [ ] Badge/gamification system
- [ ] Live learning integration (Zoom/Meet)
- [ ] Bulk user upload (CSV/Excel)
- [ ] Advanced reporting (PDF/Excel exports)
- [ ] Notification system

## Security

- Row Level Security (RLS) enabled on all tables
- Complete data isolation between organizations
- Secure authentication with Supabase Auth
- Role-based authorization throughout the application
- No SQL injection vulnerabilities

## Performance

- Optimized database indexes for common queries
- Efficient React rendering with proper memoization
- Lazy loading for large datasets (planned)
- CDN integration for media files (planned)

## Support

For issues or questions, please refer to the documentation or contact the development team.

## License

Proprietary - All rights reserved

---

**Built with React, TypeScript, and Supabase**
