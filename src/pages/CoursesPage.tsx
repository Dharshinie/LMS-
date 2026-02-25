import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { BookOpen, Plus, Play, CheckCircle, Clock, Users, Edit, Info } from 'lucide-react';
import { CourseBuilderModal } from '../components/CourseBuilder/CourseBuilderModal';
import type { UserRole } from '../types/database';

interface CourseWithEnrollment {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  duration_hours: number;
  instructor_id: string | null;
  is_published: boolean;
  passing_score: number;
  enrollment?: {
    id: string;
    status: string;
    progress_percentage: number;
    enrolled_at: string;
    completed_at: string | null;
  } | null;
}

export function CoursesPage() {
  const { currentOrganization, user } = useAuth();
  const role = currentOrganization?.role as UserRole | undefined;
  const [courses, setCourses] = useState<CourseWithEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<CourseWithEnrollment | null>(null);
  const [showCourseBuilder, setShowCourseBuilder] = useState(false);
  const [instructorCourseLimit, setInstructorCourseLimit] = useState<number | null>(null);
  const [instructorCourseCount, setInstructorCourseCount] = useState<number | null>(null);
  const [quotaLoading, setQuotaLoading] = useState(false);

  useEffect(() => {
    loadCourses();
  }, [currentOrganization?.organization_id, user?.id]);

  useEffect(() => {
    if (
      role === 'instructor' &&
      currentOrganization?.organization_id &&
      user?.id
    ) {
      loadInstructorCourseQuota();
    }
  }, [role, currentOrganization?.organization_id, user?.id]);

  const loadInstructorCourseQuota = async () => {
    if (!currentOrganization?.organization_id || !user?.id || role !== 'instructor') {
      return;
    }

    try {
      setQuotaLoading(true);

      const { data: member, error: memberError } = await supabase
        .from('organization_members')
        .select('max_courses')
        .eq('organization_id', currentOrganization.organization_id)
        .eq('user_id', user.id)
        .eq('role', 'instructor')
        .maybeSingle();

      if (memberError) throw memberError;

      const limit = (member?.max_courses ?? 5) as number;
      setInstructorCourseLimit(limit);

      const { count, error: countError } = await supabase
        .from('courses')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', currentOrganization.organization_id)
        .eq('instructor_id', user.id);

      if (countError) throw countError;

      setInstructorCourseCount(count ?? 0);
    } catch (err) {
      console.error('Error loading instructor course quota:', err);
    } finally {
      setQuotaLoading(false);
    }
  };

  const loadCourses = async () => {
    if (!currentOrganization?.organization_id || !user?.id) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      let query = supabase
        .from('courses')
        .select('*')
        .eq('organization_id', currentOrganization.organization_id);

      // Learners only see published courses.
      if (role === 'learner') {
        query = query.eq('is_published', true);
      }

      // Instructors see their own courses (published or draft).
      if (role === 'instructor') {
        query = query.eq('instructor_id', user.id);
      }

      // Admin / super_admin see all courses in the organization (no extra filter).

      const { data: coursesData, error: coursesError } = await query;

      if (coursesError) throw coursesError;

      if (role === 'learner' && coursesData) {
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('*')
          .eq('user_id', user.id)
          .in('course_id', coursesData.map(c => c.id));

        const enrollmentMap = new Map(
          enrollments?.map(e => [e.course_id, e]) || []
        );

        const coursesWithEnrollment = coursesData.map(course => ({
          ...course,
          enrollment: enrollmentMap.get(course.id) || null,
        }));

        setCourses(coursesWithEnrollment);
      } else {
        setCourses(coursesData || []);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      setError(error instanceof Error ? error.message : 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('enrollments')
        .insert({
          course_id: courseId,
          user_id: user.id,
          status: 'active',
        });

      if (error) throw error;

      loadCourses();
    } catch (error) {
      console.error('Error enrolling in course:', error);
    }
  };

  const handleStartCourse = (course: CourseWithEnrollment) => {
    setSelectedCourse(course);
  };

  const handleSaveCourse = async (courseData: any) => {
    if (!currentOrganization?.organization_id || !user?.id) return;

    if (role === 'instructor') {
      const limit = instructorCourseLimit ?? 5;
      const count = instructorCourseCount ?? 0;
      if (count >= limit) {
        alert(
          `You have reached your course limit (${count}/${limit}). ` +
            'Contact a super admin if you need a higher limit.'
        );
        return;
      }
    }

    try {
      const coursePayload = {
        organization_id: currentOrganization.organization_id,
        title: courseData.title,
        description: courseData.description,
        duration_hours: courseData.duration_hours,
        passing_score: courseData.passing_score,
        instructor_id: user.id,
        is_published: false,
      };

      const { data: savedCourse, error: courseError } = await supabase
        .from('courses')
        .insert(coursePayload)
        .select()
        .single();

      if (courseError) throw courseError;

      if (courseData.modules && savedCourse) {
        for (const module of courseData.modules) {
          const { data: savedModule, error: moduleError } = await supabase
            .from('modules')
            .insert({
              course_id: savedCourse.id,
              title: module.title,
              description: module.description,
              order_index: courseData.modules.indexOf(module),
            })
            .select()
            .single();

          if (moduleError) throw moduleError;

          if (module.lessons && savedModule) {
            for (const lesson of module.lessons) {
              await supabase
                .from('lessons')
                .insert({
                  module_id: savedModule.id,
                  title: lesson.title,
                  content_type: lesson.contentType,
                  content_text: lesson.content,
                  duration_minutes: lesson.durationMinutes,
                  order_index: module.lessons.indexOf(lesson),
                });
            }
          }
        }
      }

      loadCourses();
      if (role === 'instructor') {
        loadInstructorCourseQuota();
      }
      setShowCourseBuilder(false);
    } catch (error) {
      console.error('Error saving course:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (selectedCourse && selectedCourse.enrollment) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedCourse(null)}
          className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          ← Back to Courses
        </button>

        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {selectedCourse.title}
          </h1>
          <p className="text-gray-600 mb-6">
            {selectedCourse.description}
          </p>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="font-semibold text-gray-900 mb-4">Your Progress</h2>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Course Completion
                  </span>
                  <span className="text-sm font-bold text-blue-600">
                    {selectedCourse.enrollment.progress_percentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${selectedCourse.enrollment.progress_percentage}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <p className="text-xs text-gray-600">Status</p>
                  <p className="font-semibold text-gray-900 capitalize">
                    {selectedCourse.enrollment.status}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Enrolled Since</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(selectedCourse.enrollment.enrolled_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
            <Play className="w-4 h-4" />
            Continue Learning
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Courses</h1>
          <p className="text-gray-600 mt-1">
            {role === 'learner'
              ? 'Browse and enroll in courses to start learning'
              : 'Manage your courses'}
          </p>
        </div>
        {(role === 'instructor' || role === 'admin' || role === 'super_admin') && (
          <button
            onClick={() => setShowCourseBuilder(true)}
            disabled={
              role === 'instructor' &&
              instructorCourseLimit !== null &&
              instructorCourseCount !== null &&
              instructorCourseCount >= instructorCourseLimit
            }
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-5 h-5" />
            Create Course
          </button>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex flex-col gap-1 text-sm text-blue-900">
          <p>
            Signed in as <span className="font-semibold">{user?.email}</span> |
            Role{' '}
            <span className="font-semibold">
              {(role || 'unassigned').replace('_', ' ')}
            </span>{' '}
            |
            Organization{' '}
            <span className="font-semibold">
              {currentOrganization?.organization.name || 'None'}
            </span>
          </p>
          {role === 'instructor' && (
            <p className="flex items-center gap-1">
              <Info className="w-4 h-4 text-blue-700" />
              Course limit:{' '}
              <span className="font-semibold">
                {instructorCourseCount ?? '–'}
                {' / '}
                {instructorCourseLimit ?? 5}
              </span>
              {quotaLoading && (
                <span className="text-xs text-blue-800 ml-1">
                  Updating...
                </span>
              )}
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      <CourseBuilderModal
        isOpen={showCourseBuilder}
        onClose={() => setShowCourseBuilder(false)}
        onSave={handleSaveCourse}
      />

      {courses.length === 0 ? (
        <div className="bg-white rounded-lg shadow">
          <div className="p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {role === 'learner' ? 'No courses available' : 'No courses yet'}
            </h3>
            <p className="text-gray-600 mb-4">
              {role === 'learner'
                ? 'No published courses are available. Check back later!'
                : 'Get started by creating your first course.'}
            </p>
            {(role === 'instructor' || role === 'admin' || role === 'super_admin') && (
              <button
                onClick={() => setShowCourseBuilder(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Your First Course
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const isEnrolled = course.enrollment !== null;
            const isCompleted = course.enrollment?.status === 'completed';

            return (
              <div
                key={course.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
              >
                {course.thumbnail_url && (
                  <div className="w-full h-48 bg-gray-200 overflow-hidden">
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {course.title}
                  </h3>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {course.description}
                  </p>

                  <div className="space-y-2 mb-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {course.duration_hours} hours
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Passing score: {course.passing_score}%
                    </div>
                  </div>

                  {role === 'learner' && (
                    <>
                      {isEnrolled ? (
                        <div className="space-y-3">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-gray-700">
                                Progress
                              </span>
                              <span className="text-xs font-bold text-blue-600">
                                {course.enrollment?.progress_percentage || 0}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{
                                  width: `${course.enrollment?.progress_percentage || 0}%`,
                                }}
                              ></div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleStartCourse(course)}
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                          >
                            {isCompleted ? (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                View Certificate
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4" />
                                Continue
                              </>
                            )}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEnroll(course.id)}
                          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Enroll Now
                        </button>
                      )}
                    </>
                  )}

                  {role !== 'learner' && (
                    <button className="w-full border-2 border-blue-600 text-blue-600 py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2">
                      <Edit className="w-4 h-4" />
                      Edit Course
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
