import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  BarChart3,
  BookOpen,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  Play,
  MessageCircle,
  HelpCircle,
  ListChecks,
} from 'lucide-react';

interface EnrolledCourse {
  id: string;
  title: string;
  progress_percentage: number;
  status: string;
}

interface DashboardPageProps {
  onNavigate?: (page: string) => void;
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { profile, currentOrganization, user } = useAuth();
  const role = currentOrganization?.role;
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalUsers: 0,
    averageProgress: 0,
    certificates: 0,
  });
  const [loading, setLoading] = useState(true);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptionA, setPollOptionA] = useState('Yes');
  const [pollOptionB, setPollOptionB] = useState('No');
  const [pollVotes, setPollVotes] = useState<{ a: number; b: number }>({
    a: 0,
    b: 0,
  });
  const [comments, setComments] = useState<
    { id: number; author: string; text: string; createdAt: string }[]
  >([]);
  const [newComment, setNewComment] = useState('');
  const [faqs, setFaqs] = useState<
    { id: number; question: string; answer: string }[]
  >([]);
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');

  useEffect(() => {
    if (currentOrganization?.organization_id && user?.id) {
      loadDashboardData();
      return;
    }

    setLoading(false);
  }, [currentOrganization?.organization_id, user?.id]);

  const loadDashboardData = async () => {
    if (!currentOrganization?.organization_id || !user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data: coursesData } = await supabase
        .from('courses')
        .select('id')
        .eq('organization_id', currentOrganization.organization_id)
        .eq('is_published', true);

      let averageProgress = 0;
      let certificateCount = 0;
      let courseCount = coursesData?.length || 0;

      if (role === 'learner') {
        const { data: enrollmentData } = await supabase
          .from('enrollments')
          .select(
            `
            id,
            progress_percentage,
            status,
            courses (id, title)
          `
          )
          .eq('user_id', user.id);

        if (enrollmentData && enrollmentData.length > 0) {
          const courses = enrollmentData.map((e: any) => ({
            id: e.courses.id,
            title: e.courses.title,
            progress_percentage: e.progress_percentage,
            status: e.status,
          }));

          setEnrolledCourses(courses);

          const totalProgress = courses.reduce(
            (sum: number, c: any) => sum + c.progress_percentage,
            0
          );
          averageProgress = Math.round(totalProgress / courses.length);

          const { count: certCount } = await supabase
            .from('certificates')
            .select('*', { count: 'exact', head: true })
            .in('enrollment_id', enrollmentData.map((e: any) => e.id));

          certificateCount = certCount || 0;
        }
      } else if (role === 'admin' || role === 'super_admin') {
        const { count: userCount } = await supabase
          .from('organization_members')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', currentOrganization.organization_id);

        stats.totalUsers = userCount || 0;
      }

      setStats({
        totalCourses: courseCount,
        totalUsers: stats.totalUsers,
        averageProgress,
        certificates: certificateCount,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = (option: 'a' | 'b') => {
    setPollVotes((prev) => ({
      ...prev,
      [option]: prev[option] + 1,
    }));
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    const text = newComment.trim();
    if (!text) return;

    setComments((prev) => [
      {
        id: Date.now(),
        author: profile?.full_name || user?.email || 'You',
        text,
        createdAt: new Date().toLocaleTimeString(),
      },
      ...prev,
    ]);
    setNewComment('');
  };

  const handleAddFaq = (e: React.FormEvent) => {
    e.preventDefault();
    const q = faqQuestion.trim();
    const a = faqAnswer.trim();
    if (!q || !a) return;

    setFaqs((prev) => [
      {
        id: Date.now(),
        question: q,
        answer: a,
      },
      ...prev,
    ]);
    setFaqQuestion('');
    setFaqAnswer('');
  };

  const getRoleName = (role: string) => {
    return role
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentOrganization) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold text-gray-900">No organization assigned</h1>
        <p className="text-gray-600 mt-2">
          Your account is active, but you are not yet a member of an organization.
          Ask an admin to add you to an organization to access dashboard data.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {profile?.full_name || 'User'}!
        </h1>
        <p className="text-gray-600 mt-1">
          {currentOrganization?.organization.name} - {getRoleName(role || 'unassigned')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Courses</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.totalCourses}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {(role === 'admin' || role === 'super_admin') && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.totalUsers}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {role === 'learner' ? 'My Progress' : 'Avg Progress'}
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.averageProgress}%
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {role === 'learner' ? 'Certificates' : 'Active Students'}
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {role === 'learner' ? stats.certificates : 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {role === 'learner' && enrolledCourses.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Your Learning Path
          </h2>
          <div className="space-y-3">
            {enrolledCourses.slice(0, 3).map((course) => (
              <div
                key={course.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{course.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-xs">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${course.progress_percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-medium text-gray-600">
                      {course.progress_percentage}%
                    </span>
                  </div>
                </div>
                <button className="ml-4 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <Play className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
          {enrolledCourses.length > 3 && (
            <button className="mt-4 text-blue-600 hover:text-blue-800 font-medium">
              View all {enrolledCourses.length} courses →
            </button>
          )}
        </div>
      )}

      {role === 'instructor' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Quick Poll</h2>
                <p className="text-sm text-gray-600">
                  Create a simple poll to engage your learners.
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <ListChecks className="w-5 h-5 text-blue-600" />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Poll question
                </label>
                <input
                  type="text"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  placeholder="e.g. How confident do you feel about today's topic?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Option A
                  </label>
                  <input
                    type="text"
                    value={pollOptionA}
                    onChange={(e) => setPollOptionA(e.target.value)}
                    className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Option B
                  </label>
                  <input
                    type="text"
                    value={pollOptionB}
                    onChange={(e) => setPollOptionB(e.target.value)}
                    className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-3 mt-2">
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Live results (sample)
                </p>
                <button
                  type="button"
                  onClick={() => handleVote('a')}
                  className="w-full text-left px-3 py-2 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors text-sm flex items-center justify-between"
                >
                  <span>{pollOptionA || 'Option A'}</span>
                  <span className="text-xs text-gray-500">
                    {pollVotes.a} votes
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleVote('b')}
                  className="w-full text-left px-3 py-2 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors text-sm flex items-center justify-between"
                >
                  <span>{pollOptionB || 'Option B'}</span>
                  <span className="text-xs text-gray-500">
                    {pollVotes.b} votes
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Comments & Feedback
                </h2>
                <p className="text-sm text-gray-600">
                  Capture ideas and notes from your sessions.
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>

            <form onSubmit={handleAddComment} className="space-y-2 mb-4">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Add a quick note or learner feedback..."
              />
              <button
                type="submit"
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              >
                Add Comment
              </button>
            </form>

            {comments.length === 0 ? (
              <p className="text-sm text-gray-500">
                No comments yet. Use this space to capture discussion points or
                reminders for your next session.
              </p>
            ) : (
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {comments.map((c) => (
                  <div
                    key={c.id}
                    className="border border-gray-100 rounded-lg p-3 bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-700">
                        {c.author}
                      </span>
                      <span className="text-xs text-gray-400">
                        {c.createdAt}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800">{c.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Course FAQs</h2>
                <p className="text-sm text-gray-600">
                  Build a quick FAQ to answer common learner questions.
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-purple-600" />
              </div>
            </div>

            <form onSubmit={handleAddFaq} className="space-y-2 mb-4">
              <input
                type="text"
                value={faqQuestion}
                onChange={(e) => setFaqQuestion(e.target.value)}
                placeholder="Question"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <textarea
                value={faqAnswer}
                onChange={(e) => setFaqAnswer(e.target.value)}
                rows={2}
                placeholder="Answer"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="submit"
                className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
              >
                Add FAQ
              </button>
            </form>

            {faqs.length === 0 ? (
              <p className="text-sm text-gray-500">
                No FAQs yet. Start by adding the questions learners ask you
                most often.
              </p>
            ) : (
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {faqs.map((item) => (
                  <details
                    key={item.id}
                    className="border border-gray-100 rounded-lg p-3 bg-gray-50"
                  >
                    <summary className="text-sm font-semibold text-gray-900 cursor-pointer">
                      {item.question}
                    </summary>
                    <p className="mt-2 text-sm text-gray-800">{item.answer}</p>
                  </details>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(role === 'instructor' || role === 'admin' || role === 'super_admin') && (
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left">
              <BookOpen className="w-8 h-8 text-blue-600 mb-2" />
              <h3 className="font-semibold text-gray-900">Create New Course</h3>
              <p className="text-sm text-gray-600 mt-1">
                Start building a new course
              </p>
            </button>
          )}

          {role === 'learner' && (
            <button
              onClick={() => onNavigate?.('courses')}
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
            >
              <BookOpen className="w-8 h-8 text-blue-600 mb-2" />
              <h3 className="font-semibold text-gray-900">Browse Courses</h3>
              <p className="text-sm text-gray-600 mt-1">
                Explore available courses
              </p>
            </button>
          )}

          {(role === 'admin' || role === 'super_admin') && (
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-left">
              <Users className="w-8 h-8 text-green-600 mb-2" />
              <h3 className="font-semibold text-gray-900">Add Users</h3>
              <p className="text-sm text-gray-600 mt-1">Invite team members</p>
            </button>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-8 text-white">
        <h2 className="text-2xl font-bold mb-2">Getting Started with TechCorp Academy</h2>
        <p className="text-blue-100 mb-4">
          {role === 'learner'
            ? 'Explore your available courses and continue learning to achieve your goals.'
            : 'Set up your organization and create your first course to get started.'}
        </p>
        <button className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
          Learn More
        </button>
      </div>
    </div>
  );
}
