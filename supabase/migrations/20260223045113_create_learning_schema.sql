/*
  # Apex-LMS Learning Schema - Phase 2
  
  ## Overview
  This migration creates the complete learning content structure including:
  - Courses with hierarchical organization
  - Modules and lessons within courses
  - Quizzes and assessments
  - Student enrollments and progress tracking
  - Certificates upon completion
  
  ## New Tables
  
  ### 1. `courses`
  Main course container.
  - `id` (uuid, primary key)
  - `organization_id` (uuid, foreign key) - Tenant isolation
  - `title` (text) - Course name
  - `description` (text) - Course overview
  - `thumbnail_url` (text) - Course image
  - `instructor_id` (uuid) - Course creator
  - `is_published` (boolean) - Visibility status
  - `duration_hours` (integer) - Estimated completion time
  - `passing_score` (integer) - Minimum score to pass (0-100)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### 2. `modules`
  Course sections/chapters.
  - `id` (uuid, primary key)
  - `course_id` (uuid, foreign key)
  - `title` (text) - Module name
  - `description` (text)
  - `order_index` (integer) - Display order
  - `created_at` (timestamptz)
  
  ### 3. `lessons`
  Individual learning units within modules.
  - `id` (uuid, primary key)
  - `module_id` (uuid, foreign key)
  - `title` (text) - Lesson name
  - `content_type` (lesson_type enum) - video, document, scorm, etc.
  - `content_url` (text) - File/video URL
  - `content_text` (text) - Text content
  - `duration_minutes` (integer) - Lesson length
  - `order_index` (integer) - Display order
  - `is_mandatory` (boolean) - Must complete to proceed
  - `created_at` (timestamptz)
  
  ### 4. `quizzes`
  Assessment containers.
  - `id` (uuid, primary key)
  - `lesson_id` (uuid, foreign key) - Optional link to lesson
  - `course_id` (uuid, foreign key)
  - `title` (text)
  - `passing_score` (integer) - Minimum score (0-100)
  - `time_limit_minutes` (integer) - Time constraint
  - `randomize_questions` (boolean)
  - `created_at` (timestamptz)
  
  ### 5. `quiz_questions`
  Individual quiz items.
  - `id` (uuid, primary key)
  - `quiz_id` (uuid, foreign key)
  - `question_text` (text)
  - `question_type` (question_type enum) - mcq, true_false
  - `points` (integer) - Question weight
  - `order_index` (integer)
  - `created_at` (timestamptz)
  
  ### 6. `quiz_options`
  Answer choices for questions.
  - `id` (uuid, primary key)
  - `question_id` (uuid, foreign key)
  - `option_text` (text)
  - `is_correct` (boolean)
  - `order_index` (integer)
  
  ### 7. `enrollments`
  Student course registrations.
  - `id` (uuid, primary key)
  - `course_id` (uuid, foreign key)
  - `user_id` (uuid, foreign key)
  - `enrolled_at` (timestamptz)
  - `completed_at` (timestamptz)
  - `progress_percentage` (integer)
  - `status` (enrollment_status enum)
  
  ### 8. `lesson_progress`
  Tracks individual lesson completion.
  - `id` (uuid, primary key)
  - `enrollment_id` (uuid, foreign key)
  - `lesson_id` (uuid, foreign key)
  - `is_completed` (boolean)
  - `time_spent_minutes` (integer)
  - `completed_at` (timestamptz)
  
  ### 9. `quiz_attempts`
  Student quiz submissions.
  - `id` (uuid, primary key)
  - `quiz_id` (uuid, foreign key)
  - `user_id` (uuid, foreign key)
  - `score` (integer) - Score achieved (0-100)
  - `passed` (boolean)
  - `started_at` (timestamptz)
  - `completed_at` (timestamptz)
  
  ### 10. `certificates`
  Course completion credentials.
  - `id` (uuid, primary key)
  - `enrollment_id` (uuid, foreign key)
  - `certificate_number` (text, unique)
  - `issued_at` (timestamptz)
  - `qr_code_data` (text) - Verification data
  
  ## Security
  All tables have RLS enabled with organization-based isolation.
*/

-- Create enums
CREATE TYPE lesson_type AS ENUM ('video', 'document', 'scorm', 'text', 'external_link');
CREATE TYPE question_type AS ENUM ('multiple_choice', 'true_false');
CREATE TYPE enrollment_status AS ENUM ('active', 'completed', 'dropped');

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  thumbnail_url text,
  instructor_id uuid REFERENCES user_profiles(id),
  is_published boolean DEFAULT false,
  duration_hours integer DEFAULT 0,
  passing_score integer DEFAULT 70,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Modules table
CREATE TABLE IF NOT EXISTS modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE modules ENABLE ROW LEVEL SECURITY;

-- Lessons table
CREATE TABLE IF NOT EXISTS lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  content_type lesson_type NOT NULL DEFAULT 'text',
  content_url text,
  content_text text,
  duration_minutes integer DEFAULT 0,
  order_index integer NOT NULL DEFAULT 0,
  is_mandatory boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid REFERENCES lessons(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  passing_score integer DEFAULT 70,
  time_limit_minutes integer,
  randomize_questions boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

-- Quiz questions table
CREATE TABLE IF NOT EXISTS quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  question_type question_type NOT NULL DEFAULT 'multiple_choice',
  points integer DEFAULT 1,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

-- Quiz options table
CREATE TABLE IF NOT EXISTS quiz_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  option_text text NOT NULL,
  is_correct boolean DEFAULT false,
  order_index integer NOT NULL DEFAULT 0
);

ALTER TABLE quiz_options ENABLE ROW LEVEL SECURITY;

-- Enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  enrolled_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  progress_percentage integer DEFAULT 0,
  status enrollment_status DEFAULT 'active',
  UNIQUE(course_id, user_id)
);

ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Lesson progress table
CREATE TABLE IF NOT EXISTS lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  is_completed boolean DEFAULT false,
  time_spent_minutes integer DEFAULT 0,
  last_accessed_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(enrollment_id, lesson_id)
);

ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;

-- Quiz attempts table
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  enrollment_id uuid REFERENCES enrollments(id) ON DELETE CASCADE,
  score integer DEFAULT 0,
  passed boolean DEFAULT false,
  answers jsonb,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Certificates table
CREATE TABLE IF NOT EXISTS certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid UNIQUE NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  certificate_number text UNIQUE NOT NULL,
  issued_at timestamptz DEFAULT now(),
  qr_code_data text,
  pdf_url text
);

ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for courses
CREATE POLICY "Users can view published courses in their organization"
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

CREATE POLICY "Instructors can view their own courses"
  ON courses FOR SELECT
  TO authenticated
  USING (instructor_id = auth.uid());

CREATE POLICY "Instructors and admins can create courses"
  ON courses FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = courses.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('instructor', 'admin', 'super_admin')
    )
  );

CREATE POLICY "Instructors can update their own courses"
  ON courses FOR UPDATE
  TO authenticated
  USING (instructor_id = auth.uid())
  WITH CHECK (instructor_id = auth.uid());

CREATE POLICY "Admins can update courses in their organization"
  ON courses FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = courses.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = courses.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for modules
CREATE POLICY "Users can view modules of accessible courses"
  ON modules FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = modules.course_id
      AND (
        courses.is_published = true AND
        EXISTS (
          SELECT 1 FROM organization_members
          WHERE organization_members.organization_id = courses.organization_id
          AND organization_members.user_id = auth.uid()
        )
        OR courses.instructor_id = auth.uid()
      )
    )
  );

CREATE POLICY "Course instructors can manage modules"
  ON modules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = modules.course_id
      AND courses.instructor_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = modules.course_id
      AND courses.instructor_id = auth.uid()
    )
  );

-- RLS Policies for lessons
CREATE POLICY "Users can view lessons of accessible courses"
  ON lessons FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM modules
      JOIN courses ON courses.id = modules.course_id
      WHERE modules.id = lessons.module_id
      AND (
        courses.is_published = true AND
        EXISTS (
          SELECT 1 FROM organization_members
          WHERE organization_members.organization_id = courses.organization_id
          AND organization_members.user_id = auth.uid()
        )
        OR courses.instructor_id = auth.uid()
      )
    )
  );

CREATE POLICY "Course instructors can manage lessons"
  ON lessons FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM modules
      JOIN courses ON courses.id = modules.course_id
      WHERE modules.id = lessons.module_id
      AND courses.instructor_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM modules
      JOIN courses ON courses.id = modules.course_id
      WHERE modules.id = lessons.module_id
      AND courses.instructor_id = auth.uid()
    )
  );

-- RLS Policies for quizzes
CREATE POLICY "Users can view quizzes of accessible courses"
  ON quizzes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = quizzes.course_id
      AND (
        courses.is_published = true AND
        EXISTS (
          SELECT 1 FROM organization_members
          WHERE organization_members.organization_id = courses.organization_id
          AND organization_members.user_id = auth.uid()
        )
        OR courses.instructor_id = auth.uid()
      )
    )
  );

CREATE POLICY "Course instructors can manage quizzes"
  ON quizzes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = quizzes.course_id
      AND courses.instructor_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = quizzes.course_id
      AND courses.instructor_id = auth.uid()
    )
  );

-- RLS Policies for quiz_questions and quiz_options (inherit from quiz)
CREATE POLICY "Users can view questions of accessible quizzes"
  ON quiz_questions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quizzes
      JOIN courses ON courses.id = quizzes.course_id
      WHERE quizzes.id = quiz_questions.quiz_id
      AND (
        courses.is_published = true AND
        EXISTS (
          SELECT 1 FROM organization_members
          WHERE organization_members.organization_id = courses.organization_id
          AND organization_members.user_id = auth.uid()
        )
        OR courses.instructor_id = auth.uid()
      )
    )
  );

CREATE POLICY "Course instructors can manage questions"
  ON quiz_questions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quizzes
      JOIN courses ON courses.id = quizzes.course_id
      WHERE quizzes.id = quiz_questions.quiz_id
      AND courses.instructor_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quizzes
      JOIN courses ON courses.id = quizzes.course_id
      WHERE quizzes.id = quiz_questions.quiz_id
      AND courses.instructor_id = auth.uid()
    )
  );

CREATE POLICY "Users can view options of accessible questions"
  ON quiz_options FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quiz_questions
      JOIN quizzes ON quizzes.id = quiz_questions.quiz_id
      JOIN courses ON courses.id = quizzes.course_id
      WHERE quiz_questions.id = quiz_options.question_id
      AND (
        courses.is_published = true AND
        EXISTS (
          SELECT 1 FROM organization_members
          WHERE organization_members.organization_id = courses.organization_id
          AND organization_members.user_id = auth.uid()
        )
        OR courses.instructor_id = auth.uid()
      )
    )
  );

CREATE POLICY "Course instructors can manage options"
  ON quiz_options FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quiz_questions
      JOIN quizzes ON quizzes.id = quiz_questions.quiz_id
      JOIN courses ON courses.id = quizzes.course_id
      WHERE quiz_questions.id = quiz_options.question_id
      AND courses.instructor_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quiz_questions
      JOIN quizzes ON quizzes.id = quiz_questions.quiz_id
      JOIN courses ON courses.id = quizzes.course_id
      WHERE quiz_questions.id = quiz_options.question_id
      AND courses.instructor_id = auth.uid()
    )
  );

-- RLS Policies for enrollments
CREATE POLICY "Users can view their own enrollments"
  ON enrollments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Instructors can view enrollments for their courses"
  ON enrollments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = enrollments.course_id
      AND courses.instructor_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view enrollments in their organization"
  ON enrollments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      JOIN organization_members ON organization_members.organization_id = courses.organization_id
      WHERE courses.id = enrollments.course_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Users can enroll themselves in courses"
  ON enrollments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can enroll users"
  ON enrollments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      JOIN organization_members ON organization_members.organization_id = courses.organization_id
      WHERE courses.id = enrollments.course_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Users can update their own enrollments"
  ON enrollments FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for lesson_progress
CREATE POLICY "Users can view their own lesson progress"
  ON lesson_progress FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM enrollments
      WHERE enrollments.id = lesson_progress.enrollment_id
      AND enrollments.user_id = auth.uid()
    )
  );

CREATE POLICY "Instructors can view lesson progress for their courses"
  ON lesson_progress FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM enrollments
      JOIN courses ON courses.id = enrollments.course_id
      WHERE enrollments.id = lesson_progress.enrollment_id
      AND courses.instructor_id = auth.uid()
    )
  );

CREATE POLICY "Users can create/update their own lesson progress"
  ON lesson_progress FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM enrollments
      WHERE enrollments.id = lesson_progress.enrollment_id
      AND enrollments.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM enrollments
      WHERE enrollments.id = lesson_progress.enrollment_id
      AND enrollments.user_id = auth.uid()
    )
  );

-- RLS Policies for quiz_attempts
CREATE POLICY "Users can view their own quiz attempts"
  ON quiz_attempts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Instructors can view attempts for their course quizzes"
  ON quiz_attempts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quizzes
      JOIN courses ON courses.id = quizzes.course_id
      WHERE quizzes.id = quiz_attempts.quiz_id
      AND courses.instructor_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own quiz attempts"
  ON quiz_attempts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own quiz attempts"
  ON quiz_attempts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for certificates
CREATE POLICY "Users can view their own certificates"
  ON certificates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM enrollments
      WHERE enrollments.id = certificates.enrollment_id
      AND enrollments.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can verify certificates by number"
  ON certificates FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "System can create certificates"
  ON certificates FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM enrollments
      WHERE enrollments.id = certificates.enrollment_id
      AND enrollments.user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX idx_courses_org_id ON courses(organization_id);
CREATE INDEX idx_courses_instructor_id ON courses(instructor_id);
CREATE INDEX idx_courses_is_published ON courses(is_published);
CREATE INDEX idx_modules_course_id ON modules(course_id);
CREATE INDEX idx_lessons_module_id ON lessons(module_id);
CREATE INDEX idx_quizzes_course_id ON quizzes(course_id);
CREATE INDEX idx_quiz_questions_quiz_id ON quiz_questions(quiz_id);
CREATE INDEX idx_quiz_options_question_id ON quiz_options(question_id);
CREATE INDEX idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX idx_lesson_progress_enrollment_id ON lesson_progress(enrollment_id);
CREATE INDEX idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX idx_certificates_number ON certificates(certificate_number);