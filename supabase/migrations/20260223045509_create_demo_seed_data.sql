/*
  # Demo Seed Data Migration
  
  ## Overview
  This migration creates comprehensive demo data for sales presentations and testing.
  It includes sample organizations, users, courses, and learning content.
  
  ## Important Notes
  1. **Super Admin Creation**: Before running this, create a user account through the UI
     and note their user_id from the auth.users table. Then manually insert them into
     organization_members with role='super_admin'.
  
  2. **Demo Organizations**: Creates 2 sample organizations:
     - TechCorp Academy (tech training)
     - Healthcare Learning Institute (healthcare training)
  
  3. **Sample Courses**: Creates 5 professional courses with modules and lessons:
     - Web Development Fundamentals
     - Data Science Essentials
     - Project Management Professional
     - Digital Marketing Mastery
     - Healthcare Compliance Training
  
  4. **Sample Users**: Creates placeholder entries (actual users must be created via auth)
  
  ## Security
  All demo data respects RLS policies and multi-tenant isolation.
*/

-- Insert Demo Organizations
INSERT INTO organizations (id, name, slug, is_active) VALUES
  ('11111111-1111-1111-1111-111111111111', 'TechCorp Academy', 'techcorp', true),
  ('22222222-2222-2222-2222-222222222222', 'Healthcare Learning Institute', 'healthcare-learning', true)
ON CONFLICT (id) DO NOTHING;

-- Insert Demo Courses for TechCorp Academy
INSERT INTO courses (id, organization_id, title, description, instructor_id, is_published, duration_hours, passing_score) VALUES
  (
    '10000000-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'Web Development Fundamentals',
    'Master the essential skills of modern web development. Learn HTML, CSS, JavaScript, and responsive design principles. Perfect for beginners looking to start a career in tech.',
    NULL,
    true,
    40,
    75
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    '11111111-1111-1111-1111-111111111111',
    'Data Science Essentials',
    'Unlock the power of data! Learn Python, data analysis, visualization, and machine learning basics. Includes hands-on projects with real-world datasets.',
    NULL,
    true,
    50,
    70
  ),
  (
    '10000000-0000-0000-0000-000000000003',
    '11111111-1111-1111-1111-111111111111',
    'Project Management Professional',
    'Comprehensive project management training covering methodologies, tools, and best practices. Prepare for PMP certification while learning practical skills.',
    NULL,
    true,
    60,
    80
  ),
  (
    '10000000-0000-0000-0000-000000000004',
    '11111111-1111-1111-1111-111111111111',
    'Digital Marketing Mastery',
    'Complete digital marketing course covering SEO, social media, content marketing, email campaigns, and analytics. Build and execute successful marketing strategies.',
    NULL,
    true,
    35,
    70
  )
ON CONFLICT (id) DO NOTHING;

-- Insert Demo Course for Healthcare Learning
INSERT INTO courses (id, organization_id, title, description, instructor_id, is_published, duration_hours, passing_score) VALUES
  (
    '10000000-0000-0000-0000-000000000005',
    '22222222-2222-2222-2222-222222222222',
    'Healthcare Compliance Training',
    'Essential training for healthcare professionals covering HIPAA regulations, patient privacy, workplace safety, and ethical standards in healthcare delivery.',
    NULL,
    true,
    20,
    85
  )
ON CONFLICT (id) DO NOTHING;

-- Insert Modules for Web Development Fundamentals
INSERT INTO modules (id, course_id, title, description, order_index) VALUES
  (
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'Introduction to Web Development',
    'Understanding the basics of how the web works and setting up your development environment.',
    1
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    'HTML & CSS Fundamentals',
    'Learn to structure web pages with HTML and style them beautifully with CSS.',
    2
  ),
  (
    '20000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000001',
    'JavaScript Essentials',
    'Add interactivity to your websites with JavaScript programming.',
    3
  ),
  (
    '20000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000001',
    'Responsive Web Design',
    'Create websites that work perfectly on all devices and screen sizes.',
    4
  )
ON CONFLICT (id) DO NOTHING;

-- Insert Modules for Data Science Essentials
INSERT INTO modules (id, course_id, title, description, order_index) VALUES
  (
    '20000000-0000-0000-0000-000000000005',
    '10000000-0000-0000-0000-000000000002',
    'Python Programming Basics',
    'Master Python fundamentals for data science applications.',
    1
  ),
  (
    '20000000-0000-0000-0000-000000000006',
    '10000000-0000-0000-0000-000000000002',
    'Data Analysis with Pandas',
    'Learn to manipulate and analyze data using the powerful Pandas library.',
    2
  ),
  (
    '20000000-0000-0000-0000-000000000007',
    '10000000-0000-0000-0000-000000000002',
    'Data Visualization',
    'Create compelling visualizations with Matplotlib and Seaborn.',
    3
  )
ON CONFLICT (id) DO NOTHING;

-- Insert Modules for Project Management
INSERT INTO modules (id, course_id, title, description, order_index) VALUES
  (
    '20000000-0000-0000-0000-000000000008',
    '10000000-0000-0000-0000-000000000003',
    'Project Management Fundamentals',
    'Core concepts and methodologies in project management.',
    1
  ),
  (
    '20000000-0000-0000-0000-000000000009',
    '10000000-0000-0000-0000-000000000003',
    'Agile & Scrum Methodology',
    'Modern agile approaches to project delivery.',
    2
  ),
  (
    '20000000-0000-0000-0000-000000000010',
    '10000000-0000-0000-0000-000000000003',
    'Risk Management',
    'Identify, assess, and mitigate project risks effectively.',
    3
  )
ON CONFLICT (id) DO NOTHING;

-- Insert Modules for Digital Marketing
INSERT INTO modules (id, course_id, title, description, order_index) VALUES
  (
    '20000000-0000-0000-0000-000000000011',
    '10000000-0000-0000-0000-000000000004',
    'SEO Fundamentals',
    'Master search engine optimization techniques.',
    1
  ),
  (
    '20000000-0000-0000-0000-000000000012',
    '10000000-0000-0000-0000-000000000004',
    'Social Media Marketing',
    'Leverage social platforms for brand growth.',
    2
  ),
  (
    '20000000-0000-0000-0000-000000000013',
    '10000000-0000-0000-0000-000000000004',
    'Content Marketing Strategy',
    'Create and distribute valuable content that attracts customers.',
    3
  )
ON CONFLICT (id) DO NOTHING;

-- Insert Modules for Healthcare Compliance
INSERT INTO modules (id, course_id, title, description, order_index) VALUES
  (
    '20000000-0000-0000-0000-000000000014',
    '10000000-0000-0000-0000-000000000005',
    'HIPAA Privacy Rules',
    'Understanding patient privacy and data protection requirements.',
    1
  ),
  (
    '20000000-0000-0000-0000-000000000015',
    '10000000-0000-0000-0000-000000000005',
    'Workplace Safety Standards',
    'Essential safety protocols for healthcare environments.',
    2
  )
ON CONFLICT (id) DO NOTHING;

-- Insert Sample Lessons for Web Development Module 1
INSERT INTO lessons (id, module_id, title, content_type, content_text, duration_minutes, order_index) VALUES
  (
    '30000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    'Welcome to Web Development',
    'text',
    'Welcome to the exciting world of web development! In this course, you will learn the fundamental building blocks of creating websites and web applications. Web development is one of the most in-demand skills in today''s job market, and this course will set you on the path to success.',
    15,
    1
  ),
  (
    '30000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000001',
    'How the Internet Works',
    'text',
    'Understanding how the internet works is crucial for any web developer. The internet is a global network of computers that communicate using standardized protocols. When you type a URL into your browser, your computer sends a request to a server, which then sends back the requested web page.',
    20,
    2
  ),
  (
    '30000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000001',
    'Setting Up Your Development Environment',
    'text',
    'Before we start coding, we need to set up our development environment. You will need a text editor (we recommend VS Code), a web browser (Chrome or Firefox), and some basic command line tools. This lesson walks you through the installation process step by step.',
    25,
    3
  )
ON CONFLICT (id) DO NOTHING;

-- Insert Sample Lessons for HTML & CSS Module
INSERT INTO lessons (id, module_id, title, content_type, content_text, duration_minutes, order_index) VALUES
  (
    '30000000-0000-0000-0000-000000000004',
    '20000000-0000-0000-0000-000000000002',
    'HTML Basics',
    'text',
    'HTML (HyperText Markup Language) is the standard markup language for creating web pages. It describes the structure of a web page using a series of elements represented by tags. Learn about headings, paragraphs, links, images, and more.',
    30,
    1
  ),
  (
    '30000000-0000-0000-0000-000000000005',
    '20000000-0000-0000-0000-000000000002',
    'CSS Fundamentals',
    'text',
    'CSS (Cascading Style Sheets) is used to style and layout web pages. Learn how to change colors, fonts, spacing, and create beautiful designs. Master selectors, properties, and the box model.',
    35,
    2
  ),
  (
    '30000000-0000-0000-0000-000000000006',
    '20000000-0000-0000-0000-000000000002',
    'Building Your First Web Page',
    'text',
    'Put your HTML and CSS knowledge into practice by building your first complete web page. This hands-on project will reinforce everything you have learned so far.',
    45,
    3
  )
ON CONFLICT (id) DO NOTHING;

-- Insert Sample Quizzes
INSERT INTO quizzes (id, course_id, lesson_id, title, description, passing_score, time_limit_minutes, randomize_questions) VALUES
  (
    '40000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000002',
    'Internet Fundamentals Quiz',
    'Test your understanding of how the internet works.',
    70,
    10,
    true
  ),
  (
    '40000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000004',
    'HTML Knowledge Check',
    'Verify your HTML skills with this quick quiz.',
    75,
    15,
    false
  )
ON CONFLICT (id) DO NOTHING;

-- Insert Quiz Questions
INSERT INTO quiz_questions (id, quiz_id, question_text, question_type, points, order_index) VALUES
  (
    '50000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000001',
    'What does HTTP stand for?',
    'multiple_choice',
    1,
    1
  ),
  (
    '50000000-0000-0000-0000-000000000002',
    '40000000-0000-0000-0000-000000000001',
    'The internet and the World Wide Web are the same thing.',
    'true_false',
    1,
    2
  ),
  (
    '50000000-0000-0000-0000-000000000003',
    '40000000-0000-0000-0000-000000000002',
    'What does HTML stand for?',
    'multiple_choice',
    1,
    1
  ),
  (
    '50000000-0000-0000-0000-000000000004',
    '40000000-0000-0000-0000-000000000002',
    'Which tag is used for the largest heading?',
    'multiple_choice',
    1,
    2
  )
ON CONFLICT (id) DO NOTHING;

-- Insert Quiz Options
INSERT INTO quiz_options (id, question_id, option_text, is_correct, order_index) VALUES
  ('60000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'HyperText Transfer Protocol', true, 1),
  ('60000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', 'High Tech Transfer Protocol', false, 2),
  ('60000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000001', 'HyperText Transmission Process', false, 3),
  ('60000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000001', 'Home Tool Transfer Protocol', false, 4),
  
  ('60000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000002', 'True', false, 1),
  ('60000000-0000-0000-0000-000000000006', '50000000-0000-0000-0000-000000000002', 'False', true, 2),
  
  ('60000000-0000-0000-0000-000000000007', '50000000-0000-0000-0000-000000000003', 'HyperText Markup Language', true, 1),
  ('60000000-0000-0000-0000-000000000008', '50000000-0000-0000-0000-000000000003', 'Home Tool Markup Language', false, 2),
  ('60000000-0000-0000-0000-000000000009', '50000000-0000-0000-0000-000000000003', 'Hyperlinks and Text Markup Language', false, 3),
  
  ('60000000-0000-0000-0000-000000000010', '50000000-0000-0000-0000-000000000004', '<h1>', true, 1),
  ('60000000-0000-0000-0000-000000000011', '50000000-0000-0000-0000-000000000004', '<h6>', false, 2),
  ('60000000-0000-0000-0000-000000000012', '50000000-0000-0000-0000-000000000004', '<heading>', false, 3)
ON CONFLICT (id) DO NOTHING;