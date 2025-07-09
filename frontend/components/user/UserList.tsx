"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
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
  Search, 
  Filter, 
  MoreHorizontal, 
  UserCheck, 
  UserX, 
  Shield, 
  Trash2,
  Eye,
  Edit,
  RefreshCw,
} from "lucide-react";

// Import user service hooks
import {
  useUsers,
  useUpdateUserStatus,
  useUpdateUserRole,
  useDeleteUser,
  useIsAdmin,
  type User,
  type UserStatus,
  type UserRole,
  type UsersQueryOptions,
} from "@/services/user.service";

// Import SortOrder enum from queries
import { SortOrder } from "@/graphql/user.queries";

interface UserListProps {
  showAdminActions?: boolean;
  limit?: number;
  onUserSelect?: (user: User) => void;
}

export function UserList({ 
  showAdminActions = false, 
  limit = 20,
  onUserSelect 
}: UserListProps) {
  // State for filtering and pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(0);

  // Admin check
  const { isAdmin } = useIsAdmin();
  const canShowAdminActions = showAdminActions && isAdmin;

  // Build query options
  const queryOptions: UsersQueryOptions = useMemo(() => ({
    limit,
    offset: currentPage * limit,
    sortBy: "createdAt",
    sortOrder: SortOrder.DESC,
    filter: {
      ...(searchTerm && { search: searchTerm }),
      ...(statusFilter !== "all" && { status: statusFilter }),
      ...(roleFilter !== "all" && { role: roleFilter }),
    },
  }), [searchTerm, statusFilter, roleFilter, currentPage, limit]);

  // Fetch users
  const { data, loading, error, refetch } = useUsers(queryOptions);

  // Admin mutation hooks
  const { updateUserStatus, loading: statusLoading } = useUpdateUserStatus();
  const { updateUserRole, loading: roleLoading } = useUpdateUserRole();
  const { deleteUser, loading: deleteLoading } = useDeleteUser();

  // Handle admin actions
  const handleStatusChange = async (userId: string, status: UserStatus) => {
    try {
      await updateUserStatus(userId, status);
    } catch (error) {
      console.error("Failed to update user status:", error);
    }
  };

  const handleRoleChange = async (userId: string, role: UserRole) => {
    try {
      await updateUserRole(userId, role);
    } catch (error) {
      console.error("Failed to update user role:", error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      try {
        await deleteUser(userId);
      } catch (error) {
        console.error("Failed to delete user:", error);
      }
    }
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "default";
      case "inactive":
        return "secondary";
      case "suspended":
        return "destructive";
      case "pending":
        return "outline";
      default:
        return "secondary";
    }
  };

  // Get role badge variant
  const getRoleBadgeVariant = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
        return "destructive";
      case "moderator":
        return "default";
      case "user":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            <p>Error loading users: {error.message}</p>
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
          <span>Users</span>
          <Badge variant="outline">
            {data?.users.total || 0} total
          </Badge>
        </CardTitle>
        <CardDescription>
          Manage and view all users in the system
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="SUSPENDED">Suspended</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
            </SelectContent>
          </Select>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="MODERATOR">Moderator</SelectItem>
              <SelectItem value="USER">User</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Users Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Last Login</TableHead>
                {canShowAdminActions && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, i) => (
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
                      <div className="w-16 h-6 bg-gray-200 rounded animate-pulse" />
                    </TableCell>
                    <TableCell>
                      <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
                    </TableCell>
                    <TableCell>
                      <div className="w-16 h-4 bg-gray-200 rounded animate-pulse" />
                    </TableCell>
                    {canShowAdminActions && (
                      <TableCell>
                        <div className="w-8 h-8 bg-gray-200 rounded animate-pulse ml-auto" />
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : data?.users.users.length === 0 ? (
                <TableRow>
                  <TableCell 
                    colSpan={canShowAdminActions ? 6 : 5} 
                    className="text-center py-8 text-gray-500"
                  >
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                data?.users.users.map((user) => (
                  <TableRow 
                    key={user.id}
                    className={onUserSelect ? "cursor-pointer hover:bg-gray-50" : ""}
                    onClick={() => onUserSelect?.(user)}
                  >
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={user.profileImage} alt={user.username} />
                          <AvatarFallback>
                            {user.username.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.username}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(user.status)}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.organization ? (
                        <span className="text-sm">{user.organization.name}</span>
                      ) : (
                        <span className="text-sm text-gray-400">No organization</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.lastLoginAt ? (
                        <span className="text-sm">
                          {new Date(user.lastLoginAt).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">Never</span>
                      )}
                    </TableCell>
                    {canShowAdminActions && (
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => onUserSelect?.(user)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(user.id, "ACTIVE" as UserStatus)}
                              disabled={statusLoading}
                            >
                              <UserCheck className="mr-2 h-4 w-4" />
                              Activate
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(user.id, "SUSPENDED" as UserStatus)}
                              disabled={statusLoading}
                            >
                              <UserX className="mr-2 h-4 w-4" />
                              Suspend
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleRoleChange(user.id, "ADMIN" as UserRole)}
                              disabled={roleLoading}
                            >
                              <Shield className="mr-2 h-4 w-4" />
                              Make Admin
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteUser(user.id)}
                              disabled={deleteLoading}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {data?.users && (data.users.hasNextPage || data.users.hasPreviousPage) && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-500">
              Showing {currentPage * limit + 1} to {Math.min((currentPage + 1) * limit, data.users.total)} of {data.users.total} users
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={!data.users.hasPreviousPage}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={!data.users.hasNextPage}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 