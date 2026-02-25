import { useEffect, useState } from 'react';
import { Users, Plus, UserPlus, Shield, Trash2, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { UserRole } from '../types/database';

interface MemberProfile {
  id: string;
  full_name: string | null;
  email: string;
}

interface OrganizationMemberWithProfile {
  id: string;
  user_id: string;
  role: UserRole;
  joined_at: string;
  profile: MemberProfile;
  max_courses: number | null;
}

export function UsersPage() {
  const { currentOrganization, user } = useAuth();
  const [members, setMembers] = useState<OrganizationMemberWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingMemberId, setSavingMemberId] = useState<string | null>(null);
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addEmail, setAddEmail] = useState('');
  const [addRole, setAddRole] = useState<UserRole>('learner');
  const [addError, setAddError] = useState<string | null>(null);
  const [addLoading, setAddLoading] = useState(false);

  const role = currentOrganization?.role;
  const isAdmin = role === 'admin' || role === 'super_admin';
  const isInstructor = role === 'instructor';
  const isSuperAdmin = role === 'super_admin';

  useEffect(() => {
    if (!currentOrganization?.organization_id) {
      setLoading(false);
      return;
    }
    loadMembers();
  }, [currentOrganization?.organization_id]);

  const loadMembers = async () => {
    if (!currentOrganization?.organization_id) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: membersError } = await supabase
        .from('organization_members')
        .select(
          `
          id,
          user_id,
          role,
          joined_at,
          max_courses,
          user_profiles (
            id,
            full_name,
            email
          )
        `
        )
        .eq('organization_id', currentOrganization.organization_id)
        .order('joined_at', { ascending: true });

      if (membersError) throw membersError;

      const mapped: OrganizationMemberWithProfile[] =
        ((data as any[]) || []).map((m: any) => ({
          id: m.id,
          user_id: m.user_id,
          role: m.role,
          joined_at: m.joined_at,
          max_courses: m.max_courses,
          profile: Array.isArray(m.user_profiles)
            ? m.user_profiles[0]
            : m.user_profiles,
        })) || [];

      setMembers(mapped);
    } catch (err) {
      console.error('Error loading members:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to load organization members'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMaxCourses = async (memberId: string, value: number | null) => {
    if (!isSuperAdmin) return;

    const normalized =
      value === null || Number.isNaN(value) || value <= 0 ? null : Math.round(value);

    try {
      const { error: updateError } = await (supabase as any)
        .from('organization_members')
        .update({ max_courses: normalized })
        .eq('id', memberId);

      if (updateError) throw updateError;

      setMembers((prev) =>
        prev.map((m) =>
          m.id === memberId ? { ...m, max_courses: normalized } : m
        )
      );
    } catch (err) {
      console.error('Error updating course limit:', err);
      alert(
        err instanceof Error
          ? err.message
          : 'Failed to update instructor course limit'
      );
    }
  };

  const handleRoleChange = async (memberId: string, newRole: UserRole) => {
    if (!isAdmin && !(isInstructor && newRole === 'learner')) {
      return;
    }

    try {
      setSavingMemberId(memberId);
      const { error: updateError } = await (supabase as any)
        .from('organization_members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (updateError) throw updateError;

      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
      );
    } catch (err) {
      console.error('Error updating member role:', err);
      alert(
        err instanceof Error ? err.message : 'Failed to update member role'
      );
    } finally {
      setSavingMemberId(null);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    const member = members.find((m) => m.id === memberId);
    if (!member) return;

    if (member.user_id === user?.id) {
      alert('You cannot remove yourself from the organization.');
      return;
    }

    if (!isAdmin && !(isInstructor && member.role === 'learner')) {
      return;
    }

    if (
      !window.confirm(
        'Are you sure you want to remove this member from the organization?'
      )
    ) {
      return;
    }

    try {
      setDeletingMemberId(memberId);
      const { error: deleteError } = await supabase
        .from('organization_members')
        .delete()
        .eq('id', memberId);

      if (deleteError) throw deleteError;

      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch (err) {
      console.error('Error removing member:', err);
      alert(
        err instanceof Error ? err.message : 'Failed to remove organization member'
      );
    } finally {
      setDeletingMemberId(null);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrganization?.organization_id) return;

    setAddError(null);
    setAddLoading(true);

    try {
      const email = addEmail.trim().toLowerCase();
      if (!email) {
        setAddError('Email is required');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profile) {
        setAddError(
          'No existing user found with this email. Ask the user to sign up first.'
        );
        return;
      }

      const profileId = (profile as { id: string }).id;

      const { data: existingMember } = (await (supabase as any)
        .from('organization_members')
        .select('id')
        .eq('organization_id', currentOrganization.organization_id)
        .eq('user_id', profileId)
        .maybeSingle()) as { data: { id: string } | null };

      if (existingMember) {
        setAddError('This user is already a member of the organization.');
        return;
      }

      const effectiveRole: UserRole =
        isInstructor && !isAdmin ? 'learner' : addRole;

      const { data: inserted, error: insertError } = (await (supabase as any)
        .from('organization_members')
        .insert({
          organization_id: currentOrganization.organization_id,
          user_id: profileId,
          role: effectiveRole,
          invited_by: user?.id ?? null,
          max_courses: effectiveRole === 'instructor' ? 5 : null,
        })
        .select(
          `
          id,
          user_id,
          role,
          joined_at,
          user_profiles (
            id,
            full_name,
            email
          )
        `
        )
        .single()) as {
        data: {
          id: string;
          user_id: string;
          role: UserRole;
          joined_at: string;
          max_courses: number | null;
          user_profiles:
            | { id: string; full_name: string | null; email: string }[]
            | { id: string; full_name: string | null; email: string }
            | null;
        } | null;
        error: Error | null;
      };

      if (insertError || !inserted) throw insertError;

      const profileData = Array.isArray(inserted.user_profiles)
        ? inserted.user_profiles[0]
        : inserted.user_profiles;

      if (!profileData) {
        throw new Error('Failed to load profile for new member');
      }

      const newMember: OrganizationMemberWithProfile = {
        id: inserted.id,
        user_id: inserted.user_id,
        role: inserted.role,
        joined_at: inserted.joined_at,
        max_courses: inserted.max_courses,
        profile: {
          id: profileData.id,
          full_name: profileData.full_name,
          email: profileData.email,
        },
      };

      setMembers((prev) => [...prev, newMember]);
      setAddEmail('');
      if (isAdmin) {
        setAddRole('learner');
      }
      setShowAddModal(false);
    } catch (err) {
      console.error('Error adding member:', err);
      setAddError(
        err instanceof Error ? err.message : 'Failed to add organization member'
      );
    } finally {
      setAddLoading(false);
    }
  };

  const totalUsers = members.length;
  const instructorCount = members.filter((m) => m.role === 'instructor').length;
  const learnerCount = members.filter((m) => m.role === 'learner').length;

  if (!currentOrganization) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold text-gray-900">No organization selected</h1>
        <p className="text-gray-600 mt-2">
          Select an organization from the sidebar to manage its members.
        </p>
      </div>
    );
  }

  if (!isAdmin && !isInstructor) {
    return (
      <div className="bg-white rounded-lg shadow p-8 flex items-center gap-3">
        <Shield className="w-6 h-6 text-yellow-500" />
        <div>
          <h1 className="text-xl font-bold text-gray-900">Limited access</h1>
          <p className="text-gray-600 mt-1">
            You do not have permission to manage users in this organization.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isInstructor ? 'Learner Management' : 'User Management'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isInstructor
              ? 'Add and manage learners in your organization'
              : 'Manage organization members and their roles'}
          </p>
        </div>
        <button
          onClick={() => {
            setAddError(null);
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          {isInstructor ? 'Add Learner' : 'Add User'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {totalUsers}
              </p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Instructors</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {instructorCount}
              </p>
            </div>
            <UserPlus className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Learners</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {learnerCount}
              </p>
            </div>
            <Users className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {isInstructor ? 'Learners' : 'Organization Members'}
          </h2>
          {loading && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading...
            </div>
          )}
        </div>

        {error && (
          <div className="px-6 py-3 bg-red-50 text-red-700 text-sm border-b border-red-100">
            {error}
          </div>
        )}

        {members.length === 0 && !loading ? (
          <div className="p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No members yet
            </h3>
            <p className="text-gray-600 mb-4">
              Start by adding learners or inviting team members to your organization.
            </p>
            <button
              onClick={() => {
                setAddError(null);
                setShowAddModal(true);
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {isInstructor ? 'Add Learner' : 'Add User'}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course Limit
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {members.map((member) => {
                  const isSelf = member.user_id === user?.id;
                  const canEditRole =
                    isAdmin ||
                    (isInstructor &&
                      member.role === 'learner' &&
                      !isSelf);
                  const canDelete =
                    (isAdmin && !isSelf) ||
                    (isInstructor && member.role === 'learner' && !isSelf);

                  const effectiveLimit =
                    member.role === 'instructor'
                      ? member.max_courses ?? 5
                      : null;

                  return (
                    <tr key={member.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                            <span className="text-sm font-semibold text-blue-700">
                              {member.profile.full_name?.charAt(0) ||
                                member.profile.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {member.profile.full_name || 'Unnamed user'}
                              {isSelf && (
                                <span className="ml-1 text-xs text-gray-500">
                                  (You)
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID: {member.user_id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {member.profile.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={member.role}
                          onChange={(e) =>
                            handleRoleChange(
                              member.id,
                              e.target.value as UserRole
                            )
                          }
                          disabled={!canEditRole || savingMemberId === member.id}
                          className="px-2 py-1 border border-gray-300 rounded text-sm bg-white disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <option value="learner">Learner</option>
                          <option value="instructor">Instructor</option>
                          {isAdmin && <option value="admin">Admin</option>}
                          {isAdmin && (
                            <option value="super_admin">Super Admin</option>
                          )}
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(member.joined_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {member.role === 'instructor' ? (
                          isSuperAdmin ? (
                            <input
                              type="number"
                              min={1}
                              value={effectiveLimit ?? ''}
                              onChange={(e) =>
                                handleUpdateMaxCourses(
                                  member.id,
                                  e.target.value === ''
                                    ? null
                                    : parseInt(e.target.value, 10)
                                )
                              }
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          ) : (
                            <span>
                              {effectiveLimit ?? 5}
                            </span>
                          )
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDeleteMember(member.id)}
                          disabled={!canDelete || deletingMemberId === member.id}
                          className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletingMemberId === member.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-1">
                {isInstructor ? 'Add Learner' : 'Add User to Organization'}
              </h2>
              <p className="text-sm text-gray-600">
                Enter the email of an existing user to add them to{' '}
                <span className="font-semibold">
                  {currentOrganization.organization.name}
                </span>
                .
              </p>
            </div>

            {addError && (
              <div className="mb-3 p-2 rounded bg-red-50 text-red-700 text-sm">
                {addError}
              </div>
            )}

            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="learner@example.com"
                  required
                />
              </div>

              {isAdmin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={addRole}
                    onChange={(e) => setAddRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="learner">Learner</option>
                    <option value="instructor">Instructor</option>
                    <option value="admin">Admin</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Super admin role can only be granted from the backend.
                  </p>
                </div>
              )}

              {isInstructor && !isAdmin && (
                <div className="text-xs text-gray-500">
                  As an instructor you can only add learners. To create new
                  instructor or admin accounts, contact an organization admin.
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {addLoading && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  {isInstructor ? 'Add Learner' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
