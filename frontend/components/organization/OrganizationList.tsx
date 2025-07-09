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
  Building2, 
  Users, 
  Settings, 
  Trash2,
  Eye,
  Edit,
  RefreshCw,
  Plus,
  Crown,
  Shield,
} from "lucide-react";

// Import organization service hooks
import {
  useMyOrganizations,
  useOrganizations,
  useAllOrganizations,
  useDeleteOrganization,
  useSwitchOrganization,
  useCanManageOrganization,
  useOrganizationTypeBadgeVariant,
  useOrganizationRoleBadgeVariant,
  type Organization,
  type OrganizationsQueryOptions,
  type OrganizationType,
} from "@/services/organization.service";

// Import SortOrder and Status enums from queries
import { SortOrder, Status } from "@/graphql/organization.queries";

interface OrganizationListProps {
  variant?: "my" | "all" | "admin";
  limit?: number;
  onOrganizationSelect?: (organization: Organization) => void;
  onCreateOrganization?: () => void;
}

// Unified data structure for all variants
interface UnifiedOrganizationData {
  organizations: Organization[];
  total: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export function OrganizationList({ 
  variant = "my",
  limit = 20,
  onOrganizationSelect,
  onCreateOrganization,
}: OrganizationListProps) {
  // State for filtering and pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(0);

  // Build query options for admin/all variants
  const queryOptions: OrganizationsQueryOptions = useMemo(() => ({
    limit,
    offset: currentPage * limit,
    sortBy: "createdAt",
    sortOrder: SortOrder.DESC,
    filter: {
      ...(searchTerm && { search: searchTerm }),
      ...(typeFilter !== "all" && { type: typeFilter as OrganizationType }),
      ...(statusFilter !== "all" && { status: statusFilter as Status }),
    },
  }), [searchTerm, typeFilter, statusFilter, currentPage, limit]);

  // Fetch organizations based on variant
  const myOrgsQuery = useMyOrganizations();
  const allOrgsQuery = useAllOrganizations();
  const adminOrgsQuery = useOrganizations(queryOptions);

  // Select the appropriate query based on variant and normalize data structure
  const { data, loading, error, refetch } = useMemo(() => {
    switch (variant) {
      case "my":
        return {
          data: myOrgsQuery.data ? {
            organizations: myOrgsQuery.data.myOrganizations,
            total: myOrgsQuery.data.myOrganizations.length,
            hasNextPage: false,
            hasPreviousPage: false
          } as UnifiedOrganizationData : null,
          loading: myOrgsQuery.loading,
          error: myOrgsQuery.error,
          refetch: myOrgsQuery.refetch,
        };
      case "all":
        return {
          data: allOrgsQuery.data ? {
            organizations: allOrgsQuery.data.allOrganizations,
            total: allOrgsQuery.data.allOrganizations.length,
            hasNextPage: false,
            hasPreviousPage: false
          } as UnifiedOrganizationData : null,
          loading: allOrgsQuery.loading,
          error: allOrgsQuery.error,
          refetch: allOrgsQuery.refetch,
        };
      case "admin":
        return {
          data: adminOrgsQuery.data?.organizations || null,
          loading: adminOrgsQuery.loading,
          error: adminOrgsQuery.error,
          refetch: adminOrgsQuery.refetch,
        };
      default:
        return {
          data: null,
          loading: false,
          error: null,
          refetch: () => {},
        };
    }
  }, [variant, myOrgsQuery, allOrgsQuery, adminOrgsQuery]);

  // Admin mutation hooks
  const { deleteOrganization, loading: deleteLoading } = useDeleteOrganization();
  const { switchOrganization, loading: switchLoading } = useSwitchOrganization();

  // Utility hooks
  const getTypeBadgeVariant = useOrganizationTypeBadgeVariant;
  const getRoleBadgeVariant = useOrganizationRoleBadgeVariant;

  // Handle admin actions
  const handleDeleteOrganization = async (orgId: string, orgName: string) => {
    if (window.confirm(`Are you sure you want to delete "${orgName}"? This action cannot be undone.`)) {
      try {
        await deleteOrganization(orgId);
      } catch (error) {
        console.error("Failed to delete organization:", error);
      }
    }
  };

  const handleSwitchOrganization = async (orgId: string) => {
    try {
      await switchOrganization(orgId);
    } catch (error) {
      console.error("Failed to switch organization:", error);
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            <p>Error loading organizations: {error.message}</p>
            <Button onClick={() => refetch()} className="mt-2">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getVariantTitle = () => {
    switch (variant) {
      case "my": return "My Organizations";
      case "all": return "All Organizations";
      case "admin": return "Manage Organizations";
      default: return "Organizations";
    }
  };

  const getVariantDescription = () => {
    switch (variant) {
      case "my": return "Organizations you are a member of";
      case "all": return "All organizations in the system";
      case "admin": return "Manage and monitor all organizations";
      default: return "Organization management";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5" />
            <span>{getVariantTitle()}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">
              {data?.total || 0} total
            </Badge>
            {onCreateOrganization && (
              <Button onClick={onCreateOrganization} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Create Organization
              </Button>
            )}
          </div>
        </CardTitle>
        <CardDescription>
          {getVariantDescription()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters - Only show for admin variant */}
        {variant === "admin" && (
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search organizations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="PERSONAL">Personal</SelectItem>
                <SelectItem value="TEAM">Team</SelectItem>
                <SelectItem value="COMPANY">Company</SelectItem>
                <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
              </SelectContent>
            </Select>
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
          </div>
        )}

        {/* Organizations Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Your Role</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse" />
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
                      <div className="w-8 h-4 bg-gray-200 rounded animate-pulse" />
                    </TableCell>
                    <TableCell>
                      <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
                    </TableCell>
                    <TableCell>
                      <div className="w-16 h-4 bg-gray-200 rounded animate-pulse" />
                    </TableCell>
                    <TableCell>
                      <div className="w-8 h-8 bg-gray-200 rounded animate-pulse ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : data?.organizations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    {variant === "my" ? "You are not a member of any organizations" : "No organizations found"}
                  </TableCell>
                </TableRow>
              ) : (
                data?.organizations.map((organization: Organization) => (
                  <TableRow 
                    key={organization.id}
                    className={onOrganizationSelect ? "cursor-pointer hover:bg-gray-50" : ""}
                    onClick={() => onOrganizationSelect?.(organization)}
                  >
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={organization.imageUrl} alt={organization.name} />
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {organization.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{organization.name}</div>
                          {organization.description && (
                            <div className="text-sm text-gray-500 truncate max-w-[200px]">
                              {organization.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getTypeBadgeVariant(organization.type)}>
                        {organization.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {organization.userRole ? (
                        <Badge variant={getRoleBadgeVariant(organization.userRole)}>
                          {organization.userRole === "OWNER" && <Crown className="w-3 h-3 mr-1" />}
                          {organization.userRole === "ADMIN" && <Shield className="w-3 h-3 mr-1" />}
                          {organization.userRole}
                        </Badge>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{organization.memberCount}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={organization.owner.profileImage} alt={organization.owner.username} />
                          <AvatarFallback className="text-xs">
                            {organization.owner.username.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{organization.owner.username}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {new Date(organization.createdAt).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <OrganizationActions 
                        organization={organization}
                        variant={variant}
                        onOrganizationSelect={onOrganizationSelect}
                        onSwitchOrganization={handleSwitchOrganization}
                        onDeleteOrganization={handleDeleteOrganization}
                        switchLoading={switchLoading}
                        deleteLoading={deleteLoading}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination - Only for admin variant */}
        {variant === "admin" && data && (data.hasNextPage || data.hasPreviousPage) && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-500">
              Showing {currentPage * limit + 1} to {Math.min((currentPage + 1) * limit, data.total)} of {data.total} organizations
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={!data.hasPreviousPage}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={!data.hasNextPage}
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

// Separate component for organization actions to avoid React Hook issues
interface OrganizationActionsProps {
  organization: Organization;
  variant: "my" | "all" | "admin";
  onOrganizationSelect?: (organization: Organization) => void;
  onSwitchOrganization: (orgId: string) => void;
  onDeleteOrganization: (orgId: string, orgName: string) => void;
  switchLoading: boolean;
  deleteLoading: boolean;
}

function OrganizationActions({
  organization,
  variant,
  onOrganizationSelect,
  onSwitchOrganization,
  onDeleteOrganization,
  switchLoading,
  deleteLoading,
}: OrganizationActionsProps) {
  const canManage = useCanManageOrganization(organization);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onOrganizationSelect?.(organization)}>
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>
        {variant === "my" && (
          <DropdownMenuItem 
            onClick={() => onSwitchOrganization(organization.id)}
            disabled={switchLoading}
          >
            <Building2 className="mr-2 h-4 w-4" />
            Switch To
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        {canManage && (
          <>
            <DropdownMenuItem>
              <Edit className="mr-2 h-4 w-4" />
              Edit Organization
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Manage Members
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onDeleteOrganization(organization.id, organization.name)}
              disabled={deleteLoading}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Organization
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 