// src/app/dashboard/[orgId]/members/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { Trash, MoreHorizontal, UserCheck, UserX, Edit, Users, UserPlus } from "lucide-react";

import {
  useGetOrgMembers,
  useGetOrgInvitations,
  useInviteOrganizationMember,
  useRemoveOrganizationMember,
  useCancelOrgInvitation,
  useUpdateMemberRole,
  useUserAndOrg,
} from "@/services/authService";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Role = "member" | "admin";
type RoleFilter = "all" | Role;

type FlatMember = {
  id: string;
  username: string;
  email: string;
  role: Role;
  status: "joined" | "pending";
};

interface InviteModalProps {
  orgId: string;
  inviting: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inviteFn: (orgId: string, email: string, role: Role) => Promise<void>;
  onSuccess: () => void;
}

function InviteModal({
  orgId,
  inviting,
  open,
  onOpenChange,
  inviteFn,
  onSuccess,
}: InviteModalProps) {
  const [formData, setFormData] = useState({
    email: "",
    role: "member" as Role,
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  // Get role icon
  const getRoleIcon = (role: Role) => {
    return role === "admin" ? "🛡️" : "👤";
  };

  // Get role description
  const getRoleDescription = (role: Role) => {
    return role === "admin" 
      ? "Can manage organization settings and members"
      : "Can view and collaborate within the organization";
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (formData.message && formData.message.length > 250) {
      newErrors.message = "Message must be less than 250 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await inviteFn(orgId, formData.email.trim(), formData.role);
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onOpenChange(false);
        resetForm();
      }, 1500);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e) || "Invite failed";
      setErrors({ general: msg });
    }
  };

  const resetForm = () => {
    setFormData({
      email: "",
      role: "member",
      message: "",
    });
    setErrors({});
    setSuccess(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      resetForm();
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <UserCheck className="w-4 h-4 mr-2" />
            Add Team Member
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <UserCheck className="w-5 h-5" />
              <span>Add Team Member</span>
            </DialogTitle>
            <DialogDescription>
              Invite a new team member to join your organization. They'll receive an email invitation to get started.
            </DialogDescription>
          </DialogHeader>

          {success ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-medium text-green-900">Invitation Sent!</h3>
                <p className="text-sm text-green-700">
                  We've sent an invitation to {formData.email}
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleInvite} className="space-y-6">
              {/* Email Address */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="teammate@company.com"
                  className={`h-11 ${errors.email ? "border-red-500" : ""}`}
                  autoFocus
                />
                {errors.email && (
                  <p className="text-sm text-red-600 flex items-center space-x-1">
                    <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                      <span className="text-white text-xs">!</span>
                    </div>
                    <span>{errors.email}</span>
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  We'll send them an invitation to join your organization
                </p>
              </div>

              {/* Organization Role */}
              <div className="space-y-2">
                <label htmlFor="role" className="text-sm font-medium text-gray-700">
                  Organization Role <span className="text-red-500">*</span>
                </label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value: Role) => 
                    setFormData(prev => ({ ...prev, role: value }))
                  }
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">
                      <div className="flex items-center space-x-3 py-2">
                        <span className="text-lg">👤</span>
                        <div>
                          <div className="font-medium">Member</div>
                          <div className="text-xs text-gray-500">Can view and collaborate within the organization</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex items-center space-x-3 py-2">
                        <span className="text-lg">🛡️</span>
                        <div>
                          <div className="font-medium">Admin</div>
                          <div className="text-xs text-gray-500">Can manage organization settings and members</div>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span className="text-lg">{getRoleIcon(formData.role)}</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    formData.role === 'admin' 
                      ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                  }`}>
                    {formData.role.charAt(0).toUpperCase() + formData.role.slice(1)}
                  </span>
                </div>
              </div>

              {/* Personal Message (Optional) */}
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium text-gray-700">
                  Personal Message
                </label>
                <textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Add a personal note to the invitation..."
                  rows={3}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                    errors.message ? "border-red-500" : ""
                  }`}
                />
                {errors.message && (
                  <p className="text-sm text-red-600 flex items-center space-x-1">
                    <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                      <span className="text-white text-xs">!</span>
                    </div>
                    <span>{errors.message}</span>
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  {formData.message?.length || 0}/250 characters
                </p>
              </div>

              {/* Role Preview */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start space-x-3">
                  <span className="text-xl">{getRoleIcon(formData.role)}</span>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-sm">
                        {formData.role.charAt(0).toUpperCase() + formData.role.slice(1)} Permissions
                      </h4>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        formData.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {formData.role.charAt(0).toUpperCase() + formData.role.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {getRoleDescription(formData.role)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Ready to Invite Preview */}
              {formData.email && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2 text-green-800">
                    <UserCheck className="w-4 h-4" />
                    <span className="text-sm font-medium">Ready to invite</span>
                  </div>
                  <div className="mt-2 text-sm text-green-700">
                    <div><strong>Email:</strong> {formData.email}</div>
                    <div><strong>Role:</strong> {formData.role.charAt(0).toUpperCase() + formData.role.slice(1)}</div>
                    {formData.message && (
                      <div><strong>Message:</strong> "{formData.message.substring(0, 50)}{formData.message.length > 50 ? '...' : ''}"</div>
                    )}
                  </div>
                </div>
              )}

              {/* Error Display */}
              {errors.general && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600 flex items-center space-x-1">
                    <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                      <span className="text-white text-xs">!</span>
                    </div>
                    <span>{errors.general}</span>
                  </p>
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={inviting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={inviting || !formData.email.trim()}>
                  {inviting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Sending Invite...
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4 mr-2" />
                      Send Invitation
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function OrgMembersPage() {
  const { orgId } = useParams<{ orgId: string }>();

  // Get current user and their organizations to determine permissions
  const { user, organizations } = useUserAndOrg();

  // Find current user's role in this organization
  const currentUserOrgRole = useMemo(() => {
    if (!user || !organizations || !orgId) return null;
    
    const currentOrg = organizations.find(org => org.id === orgId);
    return currentOrg?.userRole || null;
  }, [user, organizations, orgId]);

  // Check if current user has admin permissions
  const canViewInvitations = useMemo(() => {
    return currentUserOrgRole === 'ADMIN' || currentUserOrgRole === 'OWNER';
  }, [currentUserOrgRole]);

  // 1) joined members
  const {
    owner,
    members: svcMembers,
    loading: loadingMembers,
    error: membersError,
    refetch: refetchMembers,
  } = useGetOrgMembers(orgId);

  // 2) pending invites - only fetch if user has admin permissions
  const {
    invitations: pendingInvites,
    loading: loadingInvites,
    refetch: refetchInvites,
  } = useGetOrgInvitations(canViewInvitations ? orgId : '');

  // 3) Invite / Remove / Cancel hooks
  const { inviteOrgMember, loading: inviting } = useInviteOrganizationMember();
  const { remove: removeOrgMember, loading: removing } =
    useRemoveOrganizationMember();
  const { cancelOrgInvitation, loading: canceling } = useCancelOrgInvitation();
  const { updateRole: updateMemberRole, loading: updatingRole } = useUpdateMemberRole();

  // error modal state
  const [errorMsg, setErrorMsg] = useState("");
  const [errorOpen, setErrorOpen] = useState(false);

  // dialog open
  const [inviteOpen, setInviteOpen] = useState(false);

  // search + filter
  const [rawSearch, setRawSearch] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  useEffect(() => {
    const id = setTimeout(() => setSearch(rawSearch.trim().toLowerCase()), 300);
    return () => clearTimeout(id);
  }, [rawSearch]);

  // flatten + dedupe
  const allMembers = useMemo<FlatMember[]>(() => {
    const list: FlatMember[] = [];
    if (owner) {
      list.push({
        id: owner.id,
        username: owner.username,
        email: owner.email,
        role: "admin",
        status: "joined",
      });
    }
    svcMembers.forEach((m) =>
      list.push({
        id: m.id,
        username: m.username,
        email: m.email,
        role: m.role as Role,
        status: "joined",
      })
    );
    
    // Only include pending invites if user has permission to view them
    if (canViewInvitations && pendingInvites) {
      pendingInvites.forEach((inv) =>
        list.push({
          id: inv.id,
          username: "",
          email: inv.email,
          role: inv.role as Role,
          status: "pending",
        })
      );
    }
    
    return Array.from(new Map(list.map((m) => [m.id + m.status, m])).values());
  }, [owner, svcMembers, pendingInvites, canViewInvitations]);

  const filtered = useMemo(() => {
    return allMembers
      .filter((m) => `${m.username} ${m.email}`.toLowerCase().includes(search))
      .filter((m) => (roleFilter === "all" ? true : m.role === roleFilter));
  }, [allMembers, search, roleFilter]);

  if (loadingMembers || (canViewInvitations && loadingInvites))
    return <div>Loading organization members…</div>;
  if (membersError) {
    return (
      <>
        <div className="text-red-500">Error loading members</div>
      </>
    );
  }

  const handleAction = async (m: FlatMember) => {
    try {
      if (m.status === "joined") {
        if (m.id === owner?.id) {
          throw new Error("You cannot remove the organization owner.");
        }
        if (m.id === user?.id) {
          throw new Error("You cannot remove yourself from the organization. Please contact another administrator.");
        }
        await removeOrgMember(orgId, m.id);
      } else {
        await cancelOrgInvitation(m.id);
      }
      refetchMembers();
      if (canViewInvitations && refetchInvites) {
        refetchInvites();
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e) || "Action failed";
      setErrorMsg(msg || "Action failed");
      setErrorOpen(true);
    }
  };

  const handleRoleUpdate = async (userId: string, newRole: Role) => {
    try {
      await updateMemberRole(orgId, userId, newRole);
      refetchMembers();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e) || "Role update failed";
      setErrorMsg(msg);
      setErrorOpen(true);
    }
  };

  // Helper function to determine if actions should be shown for a member
  const canPerformActionsOn = (member: FlatMember) => {
    // Cannot perform actions on the organization owner
    if (member.id === owner?.id) return false;
    
    // Cannot perform actions on yourself (prevent self-removal)
    if (member.id === user?.id) return false;
    
    return true;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
              <p className="text-gray-600">
                Manage your organization members and their roles
              </p>
            </div>
          </div>
        </div>
        {canViewInvitations && (
          <InviteModal
            orgId={orgId}
            inviting={inviting}
            open={inviteOpen}
            onOpenChange={setInviteOpen}
            inviteFn={(o, e, r) =>
              inviteOrgMember(o, e, r).then(() => {})
            }
            onSuccess={() => {
              refetchMembers();
              if (refetchInvites) {
                refetchInvites();
              }
            }}
          />
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="relative flex-1 min-w-64">
            <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search members..."
              value={rawSearch}
              onChange={(e) => setRawSearch(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
          <Select
            value={roleFilter}
            onValueChange={(v) => setRoleFilter(v as RoleFilter)}
          >
            <SelectTrigger className="w-36 h-11">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="member">Member</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-gray-500">
          {filtered.length} member{filtered.length !== 1 ? 's' : ''} {roleFilter !== 'all' && `(${roleFilter}s)`}
        </div>
      </div>

      {!canViewInvitations && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 text-sm">
            <strong>Note:</strong> You can view organization members, but only administrators can manage invitations and member roles.
          </p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                {canViewInvitations && (
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filtered.map((m) => (
                <tr key={`${m.id}-${m.status}`} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-11 w-11">
                        <div className="h-11 w-11 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center border-2 border-white shadow-sm">
                          <span className="text-sm font-semibold text-blue-700">
                            {(m.username || m.email).charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-gray-900">
                          {m.username || "—"}
                        </div>
                        {m.id === owner?.id && (
                          <div className="flex items-center space-x-1 mt-1">
                            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                            <span className="text-xs text-yellow-700 font-medium">
                              Organization Owner
                            </span>
                          </div>
                        )}
                        {m.id === user?.id && m.id !== owner?.id && (
                          <div className="flex items-center space-x-1 mt-1">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span className="text-xs text-green-700 font-medium">
                              You
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {m.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
                      m.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}>
                      <span className="mr-1">{m.role === 'admin' ? '🛡️' : '👤'}</span>
                      {m.role.charAt(0).toUpperCase() + m.role.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
                      m.status === 'joined' 
                        ? 'bg-green-100 text-green-800 border border-green-200' 
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      <div className={`w-2 h-2 rounded-full mr-2 ${
                        m.status === 'joined' ? 'bg-green-500' : 'bg-amber-500'
                      }`}></div>
                      {m.status.charAt(0).toUpperCase() + m.status.slice(1)}
                    </span>
                  </td>
                  {canViewInvitations && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {canPerformActionsOn(m) ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            {m.status === "joined" && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleRoleUpdate(m.id, m.role === "admin" ? "member" : "admin")}
                                  disabled={updatingRole}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Change to {m.role === "admin" ? "Member" : "Admin"}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleAction(m)}
                              disabled={removing || canceling}
                              className="text-red-600"
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              {m.status === "joined" ? "Remove" : "Cancel Invite"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <span className="text-gray-400 text-sm">
                          {m.id === owner?.id ? "Owner" : m.id === user?.id ? "You" : "—"}
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {errorOpen && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600 flex items-center space-x-1">
            <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
              <span className="text-white text-xs">!</span>
            </div>
            <span>{errorMsg}</span>
          </p>
        </div>
      )}
    </div>
  );
}
