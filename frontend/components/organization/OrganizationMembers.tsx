"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Users, 
  MoreHorizontal, 
  Crown, 
  Shield, 
  Eye, 
  UserMinus,
  UserPlus,
  Settings,
  RefreshCw,
  Mail,
} from "lucide-react";

// Import organization service hooks
import {
  useOrganizationMembers,
  useRemoveOrganizationMember,
  useUpdateMemberRole,
  useIsOrgAdmin,
  useOrganizationRoleBadgeVariant,
  type Role,
} from "@/services/organization.service";

interface OrganizationMembersProps {
  organizationId: string;
  organizationName?: string;
  onAddMember?: () => void;
  onInviteMember?: () => void;
}

export function OrganizationMembers({ 
  organizationId,
  organizationName,
  onAddMember,
  onInviteMember,
}: OrganizationMembersProps) {
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);

  // Fetch organization members
  const { data, loading, error, refetch } = useOrganizationMembers(organizationId);

  // Check if current user is admin
  const { isOrgAdmin } = useIsOrgAdmin(organizationId);

  // Member management hooks
  const { removeOrganizationMember, loading: removeLoading } = useRemoveOrganizationMember();
  const { updateMemberRole, loading: updateRoleLoading } = useUpdateMemberRole();

  // Utility hooks
  const getRoleBadgeVariant = useOrganizationRoleBadgeVariant;

  // Handle member removal
  const handleRemoveMember = async (userId: string, userName: string) => {
    if (window.confirm(`Are you sure you want to remove ${userName} from this organization?`)) {
      try {
        await removeOrganizationMember({
          orgId: organizationId,
          userId: userId,
        });
        setShowRemoveDialog(false);
        setSelectedMember(null);
      } catch (error) {
        console.error("Failed to remove member:", error);
      }
    }
  };

  // Handle role update
  const handleUpdateRole = async (userId: string, newRole: Role) => {
    try {
      await updateMemberRole({
        orgId: organizationId,
        userId: userId,
        role: newRole,
      });
    } catch (error) {
      console.error("Failed to update member role:", error);
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            <p>Error loading organization members: {error.message}</p>
            <Button onClick={() => refetch()} className="mt-2">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Organization Members</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">
              {data ? data.organizationMembers.total + 1 : 0} members
            </Badge>
            {isOrgAdmin && (
              <div className="flex space-x-2">
                {onInviteMember && (
                  <Button onClick={onInviteMember} size="sm" variant="outline">
                    <Mail className="w-4 h-4 mr-2" />
                    Invite
                  </Button>
                )}
                {onAddMember && (
                  <Button onClick={onAddMember} size="sm">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Member
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardTitle>
        <CardDescription>
          {organizationName ? `Members of ${organizationName}` : "Manage organization members and their roles"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Last Active</TableHead>
                {isOrgAdmin && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
                        <div className="space-y-1">
                          <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
                          <div className="w-24 h-3 bg-gray-200 rounded animate-pulse" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="w-16 h-6 bg-gray-200 rounded animate-pulse" />
                    </TableCell>
                    <TableCell>
                      <div className="w-16 h-6 bg-gray-200 rounded animate-pulse" />
                    </TableCell>
                    <TableCell>
                      <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
                    </TableCell>
                    <TableCell>
                      <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
                    </TableCell>
                    {isOrgAdmin && (
                      <TableCell>
                        <div className="w-8 h-8 bg-gray-200 rounded animate-pulse ml-auto" />
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : !data ? (
                <TableRow>
                  <TableCell colSpan={isOrgAdmin ? 6 : 5} className="text-center py-8 text-gray-500">
                    No member data available
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {/* Organization Owner */}
                  <TableRow className="bg-yellow-50">
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={data.organizationMembers.owner.profileImage} alt={data.organizationMembers.owner.username} />
                          <AvatarFallback>
                            {data.organizationMembers.owner.username.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium flex items-center space-x-2">
                            <span>{data.organizationMembers.owner.username}</span>
                            <Crown className="w-4 h-4 text-yellow-600" />
                          </div>
                          <div className="text-sm text-gray-500">{data.organizationMembers.owner.email}</div>
                          {data.organizationMembers.owner.fullName && (
                            <div className="text-sm text-gray-500">{data.organizationMembers.owner.fullName}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="destructive">
                        <Crown className="w-3 h-3 mr-1" />
                        OWNER
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">
                        {data.organizationMembers.owner.status || "ACTIVE"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {new Date(data.organizationMembers.owner.createdAt).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {data.organizationMembers.owner.lastLoginAt 
                          ? new Date(data.organizationMembers.owner.lastLoginAt).toLocaleDateString()
                          : "Never"
                        }
                      </span>
                    </TableCell>
                    {isOrgAdmin && (
                      <TableCell className="text-right">
                        <span className="text-sm text-gray-400">Owner</span>
                      </TableCell>
                    )}
                  </TableRow>

                  {/* Organization Members */}
                  {data.organizationMembers.members.map((member) => (
                    <TableRow key={member.user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={member.user.profileImage} alt={member.user.username} />
                            <AvatarFallback>
                              {member.user.username.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{member.user.username}</div>
                            <div className="text-sm text-gray-500">{member.user.email}</div>
                            {member.user.fullName && (
                              <div className="text-sm text-gray-500">{member.user.fullName}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(member.role)}>
                          {member.role === "ADMIN" && <Shield className="w-3 h-3 mr-1" />}
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={member.status === "ACTIVE" ? "default" : "secondary"}>
                          {member.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {new Date(member.joinedAt).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {member.user.lastLoginAt 
                            ? new Date(member.user.lastLoginAt).toLocaleDateString()
                            : "Never"
                          }
                        </span>
                      </TableCell>
                      {isOrgAdmin && (
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleUpdateRole(member.user.id, "ADMIN" as Role)}
                                disabled={updateRoleLoading || member.role === "ADMIN"}
                              >
                                <Shield className="mr-2 h-4 w-4" />
                                Make Admin
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleUpdateRole(member.user.id, "MEMBER" as Role)}
                                disabled={updateRoleLoading || member.role === "MEMBER"}
                              >
                                <Users className="mr-2 h-4 w-4" />
                                Make Member
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleUpdateRole(member.user.id, "VIEWER" as Role)}
                                disabled={updateRoleLoading || member.role === "VIEWER"}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Make Viewer
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleRemoveMember(member.user.id, member.user.username)}
                                disabled={removeLoading}
                                className="text-red-600"
                              >
                                <UserMinus className="mr-2 h-4 w-4" />
                                Remove Member
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Summary */}
        {data && (
          <div className="mt-4 text-sm text-gray-500">
            Total: {data.organizationMembers.total + 1} members (1 owner, {data.organizationMembers.total} members)
          </div>
        )}
      </CardContent>
    </Card>
  );
} 