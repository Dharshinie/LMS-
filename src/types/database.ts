export type UserRole = 'super_admin' | 'admin' | 'instructor' | 'learner';
export type LessonType = 'video' | 'document' | 'scorm' | 'text' | 'external_link';
export type QuestionType = 'multiple_choice' | 'true_false';
export type EnrollmentStatus = 'active' | 'completed' | 'dropped';

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          is_active: boolean;
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          is_active?: boolean;
          created_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          is_active?: boolean;
          created_at?: string;
          created_by?: string | null;
        };
      };
      organization_settings: {
        Row: {
          id: string;
          organization_id: string;
          logo_url: string | null;
          primary_color: string;
          secondary_color: string;
          custom_domain: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          logo_url?: string | null;
          primary_color?: string;
          secondary_color?: string;
          custom_domain?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          logo_url?: string | null;
          primary_color?: string;
          secondary_color?: string;
          custom_domain?: string | null;
          updated_at?: string;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      organization_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: UserRole;
          invited_by: string | null;
          joined_at: string;
          max_courses: number | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role?: UserRole;
          invited_by?: string | null;
          joined_at?: string;
          max_courses?: number | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          role?: UserRole;
          invited_by?: string | null;
          joined_at?: string;
          max_courses?: number | null;
        };
      };
      courses: {
        Row: {
          id: string;
          organization_id: string;
          title: string;
          description: string | null;
          thumbnail_url: string | null;
          instructor_id: string | null;
          is_published: boolean;
          duration_hours: number;
          passing_score: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          title: string;
          description?: string | null;
          thumbnail_url?: string | null;
          instructor_id?: string | null;
          is_published?: boolean;
          duration_hours?: number;
          passing_score?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          title?: string;
          description?: string | null;
          thumbnail_url?: string | null;
          instructor_id?: string | null;
          is_published?: boolean;
          duration_hours?: number;
          passing_score?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      modules: {
        Row: {
          id: string;
          course_id: string;
          title: string;
          description: string | null;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          title: string;
          description?: string | null;
          order_index?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          course_id?: string;
          title?: string;
          description?: string | null;
          order_index?: number;
          created_at?: string;
        };
      };
      lessons: {
        Row: {
          id: string;
          module_id: string;
          title: string;
          content_type: LessonType;
          content_url: string | null;
          content_text: string | null;
          duration_minutes: number;
          order_index: number;
          is_mandatory: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          module_id: string;
          title: string;
          content_type?: LessonType;
          content_url?: string | null;
          content_text?: string | null;
          duration_minutes?: number;
          order_index?: number;
          is_mandatory?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          module_id?: string;
          title?: string;
          content_type?: LessonType;
          content_url?: string | null;
          content_text?: string | null;
          duration_minutes?: number;
          order_index?: number;
          is_mandatory?: boolean;
          created_at?: string;
        };
      };
      enrollments: {
        Row: {
          id: string;
          course_id: string;
          user_id: string;
          enrolled_at: string;
          completed_at: string | null;
          progress_percentage: number;
          status: EnrollmentStatus;
        };
        Insert: {
          id?: string;
          course_id: string;
          user_id: string;
          enrolled_at?: string;
          completed_at?: string | null;
          progress_percentage?: number;
          status?: EnrollmentStatus;
        };
        Update: {
          id?: string;
          course_id?: string;
          user_id?: string;
          enrolled_at?: string;
          completed_at?: string | null;
          progress_percentage?: number;
          status?: EnrollmentStatus;
        };
      };
    };
  };
}
