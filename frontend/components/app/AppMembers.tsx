"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Users, 
  Crown, 
  Shield, 
  Code, 
  Eye, 
  MoreHorizontal, 
  UserMinus, 
  UserCheck,
  RefreshCw,
  Plus,
  Loader2,
} from "lucide-react";

// Import app service hooks
import {
  useAppMembers,
  useRemoveAppMember,
  useUpdateAppMemberRole,
  useCanManageApp,
  getAppRoleBadgeVariant,
} from "@/services/app.service";

import {
  Role,
  type Application,
  type AppMember,
} from "@/graphql/app.queries";

interface AppMembersProps {
  applicationId: string;
  applicationName?: string;
  onAddMember?: () => void;
}

export function AppMembers({ 
  applicationId, 
  applicationName,
  onAddMember,
}: AppMembersProps) {
  const [memberToRemove, setMemberToRemove] = useState<AppMember | null>(null);
  const [memberToUpdate, setMemberToUpdate] = useState<AppMember | null>(null);
  const [newRole, setNewRole] = useState<Role | null>(null);

  // Fetch application members
  const { data: appData, loading, error, refetch } = useAppMembers(applicationId);
  
  // Mutation hooks
  const { removeAppMember, loading: removeLoading } = useRemoveAppMember();
  const { updateAppMemberRole, loading: updateLoading } = useUpdateAppMemberRole();

  // Utility hooks
  const canManage = useCanManageApp(appData as Application);

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;

    try {
      await removeAppMember({
        appId: applicationId,
        userId: memberToRemove.user.id,
      });
      setMemberToRemove(null);
      refetch();
    } catch (error) {
      console.error("Failed to remove member:", error);
    }
  };

  const handleUpdateRole = async () => {
    if (!memberToUpdate || !newRole) return;

    try {
      await updateAppMemberRole({
        appId: applicationId,
        userId: memberToUpdate.user.id,
        role: newRole,
      });
      setMemberToUpdate(null);
      setNewRole(null);
      refetch();
    } catch (error) {
      console.error("Failed to update member role:", error);
    }
  };

  const getRoleIcon = (role: Role) => {
    switch (role) {
      case Role.OWNER:
        return <Crown className="w-4 h-4" />;
      case Role.ADMIN:
        return <Shield className="w-4 h-4" />;
      case Role.MEMBER:
        return <Code className="w-4 h-4" />;
      case Role.VIEWER:
        return <Eye className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            <p>Error loading members: {error.message}</p>
            <Button onClick={() => refetch()} className="mt-2">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const members = appData?.members || [];
  const owner = appData?.owner;
  const totalMembers = members.length + (owner ? 1 : 0);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Application Members</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {totalMembers} member{totalMembers !== 1 ? 's' : ''}
              </Badge>
              {canManage && onAddMember && (
                <Button onClick={onAddMember} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Member
                </Button>
              )}
            </div>
          </CardTitle>
          <CardDescription>
            Manage members and their roles for {applicationName || "this application"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  // Loading skeleton
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
                          <div className="space-y-1">
                            <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
                            <div className="w-32 h-3 bg-gray-200 rounded animate-pulse" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="w-16 h-6 bg-gray-200 rounded animate-pulse" />
                      </TableCell>
                      <TableCell>
                        <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
                      </TableCell>
                      <TableCell>
                        <div className="w-8 h-8 bg-gray-200 rounded animate-pulse ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <>
                    {/* Owner */}
                    {owner && (
                      <TableRow>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={owner.profileImage} alt={owner.username} />
                              <AvatarFallback>
                                {owner.username.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{owner.username}</div>
                              <div className="text-sm text-gray-500">{owner.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getAppRoleBadgeVariant(Role.OWNER)} className="flex items-center space-x-1 w-fit">
                            <Crown className="w-3 h-3" />
                            <span>Owner</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-500">-</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-sm text-gray-400">Owner</span>
                        </TableCell>
                      </TableRow>
                    )}

                    {/* Members */}
                    {members.map((member: AppMember) => (
                      <TableRow key={member.user.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={member.user.profileImage} alt={member.user.username} />
                              <AvatarFallback>
                                {member.user.username.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{member.user.username}</div>
                              <div className="text-sm text-gray-500">{member.user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getAppRoleBadgeVariant(member.role)} className="flex items-center space-x-1 w-fit">
                            {getRoleIcon(member.role)}
                            <span>{member.role}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {new Date(member.joinedAt).toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {canManage && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setMemberToUpdate(member);
                                    setNewRole(member.role);
                                  }}
                                >
                                  <UserCheck className="mr-2 h-4 w-4" />
                                  Change Role
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => setMemberToRemove(member)}
                                  className="text-red-600"
                                >
                                  <UserMinus className="mr-2 h-4 w-4" />
                                  Remove Member
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}

                    {members.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                          No additional members. {canManage && onAddMember && (
                            <Button variant="link" onClick={onAddMember} className="ml-1">
                              Add the first member
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Remove Member Confirmation Dialog */}
      <AlertDialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{memberToRemove?.user.username}</strong> from this application? 
              They will lose access immediately and this action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRemoveMember}
              disabled={removeLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {removeLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove Member"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Update Role Dialog */}
      <AlertDialog open={!!memberToUpdate} onOpenChange={() => {
        setMemberToUpdate(null);
        setNewRole(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Member Role</AlertDialogTitle>
            <AlertDialogDescription>
              Change the role for <strong>{memberToUpdate?.user.username}</strong> in this application.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Select 
              value={newRole || undefined} 
              onValueChange={(value: Role) => setNewRole(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select new role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Role.ADMIN}>
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4" />
                    <div>
                      <div className="font-medium">Admin</div>
                      <div className="text-xs text-gray-500">Full application management</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value={Role.MEMBER}>
                  <div className="flex items-center space-x-2">
                    <Code className="w-4 h-4" />
                    <div>
                      <div className="font-medium">Member</div>
                      <div className="text-xs text-gray-500">Can modify data and generate keys</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value={Role.VIEWER}>
                  <div className="flex items-center space-x-2">
                    <Eye className="w-4 h-4" />
                    <div>
                      <div className="font-medium">Viewer</div>
                      <div className="text-xs text-gray-500">Read-only access</div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updateLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleUpdateRole}
              disabled={updateLoading || !newRole || newRole === memberToUpdate?.role}
            >
              {updateLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Role"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 