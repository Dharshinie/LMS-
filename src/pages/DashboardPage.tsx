import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { BarChart3, BookOpen, Users, TrendingUp, Clock, CheckCircle, Play } from 'lucide-react';

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
        <h2 className="text-2xl font-bold mb-2">Getting Started with Apex LMS</h2>
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
