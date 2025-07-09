"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
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
  Search, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  Users, 
  Key, 
  Globe, 
  Smartphone, 
  Code, 
  Server, 
  RefreshCw,
  Crown,
  Shield,
  Archive,
  Play,
  Pause,
  Box,
  GitBranch,
  AlertCircle,
  Loader2,
} from "lucide-react";

// Import application service hooks
import {
  useUserApps,
  useOrganizationApps,
  useApps,
  useDeleteApp,
  useCanManageApp,
  useIsAppAdmin,
  useCanGenerateApiKeys,
  useCanPerformDestructiveActions,
  useCanInviteMembers,
  useCanTransferOwnership,
  getAppTypeBadgeVariant,
  getAppStatusBadgeVariant,
  getAppRoleBadgeVariant,
  useCurrentOrganization,
  useUpdateApp,
  useArchiveApp,
  useUnarchiveApp,
  useDebounced,
  AppType,
  Status,
  SortOrder,
  type Application,
  type UserApp,
  type AppsQueryOptions,
} from "@/services/app.service";


interface AppListProps {
  variant?: "my" | "organization" | "admin";
  organizationId?: string;
  limit?: number;
  onAppSelect?: (app: Application) => void;
  onEditApp?: (app: Application) => void;
  onManageMembers?: (app: Application) => void;
  onManageApiKeys?: (app: Application) => void;
}

// Unified data structure for all variants
interface UnifiedAppData {
  apps: (Application | UserApp)[];
  total: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Helper function to check if app has status field (Application vs UserApp)
const hasStatus = (app: Application | UserApp): app is Application => {
  return 'status' in app;
};

// Helper function to check if app has organization field (Application vs UserApp)
const hasOrganization = (app: Application | UserApp): app is Application => {
  return 'settings' in app;
};

// Helper function to get organization name from either type
const getOrganizationName = (app: Application | UserApp): string => {
  if (hasOrganization(app)) {
    return app.organization.name;
  } else {
    // UserApp has organization object directly
    return (app as UserApp).organization.name;
  }
};

// Helper function to get app type icon - handle missing type in UserApp
const getAppTypeFromApp = (app: Application | UserApp): AppType | null => {
  if (hasOrganization(app)) {
    return app.type;
  }
  return null; // UserApp doesn't have type field
};

// Helper function to get member count
const getMemberCount = (app: Application | UserApp): number => {
  if (hasOrganization(app)) {
    return app.memberCount;
  }
  return 0; // UserApp doesn't have memberCount
};

export function AppList({ 
  variant = "my",
  organizationId,
  limit = 20,
  onAppSelect,
  onEditApp,
  onManageMembers,
  onManageApiKeys,
}: AppListProps) {
  // State for filtering and pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(0);
  
  // State for delete confirmation modal
  const [appToDelete, setAppToDelete] = useState<{ id: string; name: string } | null>(null);
  const [confirmationText, setConfirmationText] = useState("");

  // PERFORMANCE IMPROVEMENT: Debounce search term to reduce API calls
  const debouncedSearchTerm = useDebounced(searchTerm, 300);

  // Get current organization
  const currentOrganization = useCurrentOrganization();
  const effectiveOrgId = organizationId || currentOrganization?.id;

  // Reset state when organization changes
  useEffect(() => {
    // Reset pagination and filters when organization changes
    setCurrentPage(0);
    setSearchTerm("");
    setTypeFilter("all");
    setStatusFilter("all");
  }, [effectiveOrgId, variant]);

  // Build query options for admin variant - use debounced search term
  const queryOptions: AppsQueryOptions = useMemo(() => ({
    limit,
    offset: currentPage * limit,
    sortBy: "createdAt",
    sortOrder: SortOrder.DESC,
    filter: {
      ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
      ...(typeFilter !== "all" && { type: typeFilter as AppType }),
      ...(statusFilter !== "all" && { status: statusFilter as Status }),
      ...(effectiveOrgId && variant === "organization" && { organizationId: effectiveOrgId }),
    },
  }), [debouncedSearchTerm, typeFilter, statusFilter, currentPage, limit, effectiveOrgId, variant]);

  // Fetch applications based on variant
  const userAppsQuery = useUserApps();
  const orgAppsQuery = useOrganizationApps(effectiveOrgId || "", {
    limit,
    offset: currentPage * limit,
    filter: {
      search: debouncedSearchTerm || undefined,
      type: typeFilter !== "all" ? (typeFilter as AppType) : undefined,
      status: statusFilter !== "all" ? (statusFilter as Status) : undefined,
    },
  });
  const adminAppsQuery = useApps(queryOptions);

  // Select the appropriate query based on variant and normalize data structure
  const { data, loading, error, refetch } = useMemo(() => {
    switch (variant) {
      case "my":
        return {
          data: userAppsQuery.data ? {
            apps: userAppsQuery.data.apps,
            total: userAppsQuery.data.total,
            hasNextPage: false,
            hasPreviousPage: false
          } as UnifiedAppData : null,
          loading: userAppsQuery.loading,
          error: userAppsQuery.error,
          refetch: userAppsQuery.refetch,
        };
      case "organization":
        return {
          data: orgAppsQuery.data || null,
          loading: orgAppsQuery.loading,
          error: orgAppsQuery.error,
          refetch: orgAppsQuery.refetch,
        };
      case "admin":
        return {
          data: adminAppsQuery.data || null,
          loading: adminAppsQuery.loading,
          error: adminAppsQuery.error,
          refetch: adminAppsQuery.refetch,
        };
      default:
        return {
          data: null,
          loading: false,
          error: null,
          refetch: () => {},
        };
    }
  }, [variant, userAppsQuery, orgAppsQuery, adminAppsQuery]);

  // IMPROVED: Client-side filtering with better performance and debugging
  const filteredData = useMemo(() => {
    if (!data) return null;

    // For "my" variant, implement client-side filtering since backend doesn't support it
    if (variant === "my") {
      let filteredApps = data.apps;
      
      console.log('🔍 Client-side filtering for "my" variant:', {
        originalCount: filteredApps.length,
        searchTerm: debouncedSearchTerm,
        typeFilter,
        statusFilter
      });

      // Apply search filter with debounced term
      if (debouncedSearchTerm?.trim()) {
        const searchLower = debouncedSearchTerm.toLowerCase();
        const beforeSearch = filteredApps.length;
        filteredApps = filteredApps.filter((app: Application | UserApp) => 
          app.name.toLowerCase().includes(searchLower) ||
          (app.description && app.description.toLowerCase().includes(searchLower))
        );
        console.log(`🔍 Search filter applied: ${beforeSearch} → ${filteredApps.length} apps`);
      }

      // Apply type filter
      if (typeFilter !== "all") {
        const beforeType = filteredApps.length;
        filteredApps = filteredApps.filter((app: Application | UserApp) => {
          const appType = getAppTypeFromApp(app);
          const matches = appType === typeFilter;
          console.log(`🏷️ Type filter check for ${app.name}: ${appType} === ${typeFilter} = ${matches}`);
          return matches;
        });
        console.log(`🏷️ Type filter applied: ${beforeType} → ${filteredApps.length} apps`);
      }

      // Apply status filter
      if (statusFilter !== "all") {
        const beforeStatus = filteredApps.length;
        filteredApps = filteredApps.filter((app: Application | UserApp) => {
          if (hasStatus(app)) {
            const matches = app.status === statusFilter;
            console.log(`📊 Status filter check for ${app.name}: ${app.status} === ${statusFilter} = ${matches}`);
            return matches;
          }
          console.log(`📊 Status filter check for ${app.name}: No status field, excluding`);
          return false; // UserApp doesn't have status, so exclude from status filtering
        });
        console.log(`📊 Status filter applied: ${beforeStatus} → ${filteredApps.length} apps`);
      }

      const result = {
        apps: filteredApps,
        total: filteredApps.length,
        hasNextPage: false,
        hasPreviousPage: false
      };
      
      console.log('🔍 Final filtered result for "my" variant:', result);
      return result;
    }

    // For other variants, return data as-is (filtering handled by backend)
    console.log(`🔍 Backend filtering for "${variant}" variant:`, data);
    return data;
  }, [data, variant, debouncedSearchTerm, typeFilter, statusFilter]);

  // Admin mutation hooks
  const { deleteApp, loading: deleteLoading } = useDeleteApp();

  // Get badge colors
  const getTypeBadgeVariant = getAppTypeBadgeVariant;
  const getStatusBadgeVariant = getAppStatusBadgeVariant;
  const getRoleBadgeVariant = getAppRoleBadgeVariant;

  // Handle app deletion with confirmation modal
  const handleDeleteApp = useCallback((appId: string, appName: string) => {
    setAppToDelete({ id: appId, name: appName });
    setConfirmationText(""); // Reset confirmation text
  }, []);

  // Confirm app deletion
  const confirmDeleteApp = useCallback(async () => {
    if (!appToDelete) return;
    
    try {
      console.log(`🗑️ Deleting app: ${appToDelete.name} (${appToDelete.id})`);
      await deleteApp(appToDelete.id);
      console.log(`✅ App deleted successfully: ${appToDelete.name}`);
      setAppToDelete(null);
      setConfirmationText("");
    } catch (error) {
      console.error(`❌ Failed to delete app: ${appToDelete.name}`, error);
      // Keep modal open on error so user can try again
    }
  }, [deleteApp, appToDelete]);

  // Cancel app deletion
  const cancelDeleteApp = useCallback(() => {
    setAppToDelete(null);
    setConfirmationText("");
  }, []);

  // Get application type icon
  const getAppTypeIcon = (type: AppType) => {
    switch (type) {
      case AppType.WEB:
        return <Globe className="w-4 h-4" />;
      case AppType.MOBILE:
        return <Smartphone className="w-4 h-4" />;
      case AppType.API:
        return <Code className="w-4 h-4" />;
      case AppType.SERVICE:
        return <Server className="w-4 h-4" />;
      default:
        return <Box className="w-4 h-4" />;
    }
  };

  // Stabilize callback functions to prevent unnecessary re-renders
  const stableOnAppSelect = useCallback((app: Application) => {
    console.log(`📱 App selected: ${app.name} (${app.id})`);
    onAppSelect?.(app);
  }, [onAppSelect]);

  const stableOnEditApp = useCallback((app: Application) => {
    console.log(`✏️ Edit app requested: ${app.name} (${app.id})`);
    onEditApp?.(app);
  }, [onEditApp]);

  const stableOnManageMembers = useCallback((app: Application) => {
    console.log(`👥 Manage members requested: ${app.name} (${app.id})`);
    onManageMembers?.(app);
  }, [onManageMembers]);

  const stableOnManageApiKeys = useCallback((app: Application) => {
    console.log(`🔑 Manage API keys requested: ${app.name} (${app.id})`);
    onManageApiKeys?.(app);
  }, [onManageApiKeys]);

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            <p>Error loading applications: {error.message}</p>
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
      case "my": return "My Applications";
      case "organization": return `${currentOrganization?.name || "Organization"} Applications`;
      case "admin": return "Manage Applications";
      default: return "Applications";
    }
  };

  const getVariantDescription = () => {
    switch (variant) {
      case "my": return "Applications you have access to";
      case "organization": return "Applications in this organization";
      case "admin": return "Manage and monitor all applications";
      default: return "Application management";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Code className="w-5 h-5" />
            <span>{getVariantTitle()}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">
              {filteredData?.total || 0} total
            </Badge>
          </div>
        </CardTitle>
        <CardDescription>
          {getVariantDescription()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* FIXED: Show filters for all variants including "my" */}
        {(variant === "admin" || variant === "organization" || variant === "my") && (
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search applications..."
                value={searchTerm}
                onChange={(e) => {
                  e.stopPropagation();
                  console.log('🔍 Search input changed:', e.target.value);
                  setSearchTerm(e.target.value);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('🔍 Search input clicked');
                }}
                className="pl-10"
                style={{
                  // Ensure input is always clickable
                  pointerEvents: 'auto',
                  position: 'relative',
                  zIndex: 1
                }}
              />
            </div>
            <Select 
              value={typeFilter} 
              onValueChange={(value) => {
                console.log('🏷️ Type filter changed:', value);
                setTypeFilter(value);
              }}
            >
              <SelectTrigger 
                className="w-[180px]"
                style={{
                  // Ensure select trigger is always clickable
                  pointerEvents: 'auto',
                  position: 'relative',
                  zIndex: 1
                }}
              >
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="WEB">Web Application</SelectItem>
                <SelectItem value="MOBILE">Mobile App</SelectItem>
                <SelectItem value="API">API Service</SelectItem>
                <SelectItem value="SERVICE">Service</SelectItem>
              </SelectContent>
            </Select>
            {/* Only show status filter for variants that have status data */}
            {(variant === "admin" || variant === "organization") && (
              <Select 
                value={statusFilter} 
                onValueChange={(value) => {
                  console.log('📊 Status filter changed:', value);
                  setStatusFilter(value);
                }}
              >
                <SelectTrigger 
                  className="w-[180px]"
                  style={{
                    // Ensure select trigger is always clickable
                    pointerEvents: 'auto',
                    position: 'relative',
                    zIndex: 1
                  }}
                >
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        {/* Applications Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Application</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Your Role</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Organization</TableHead>
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
              ) : filteredData?.apps.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    {searchTerm || typeFilter !== "all" || statusFilter !== "all" 
                      ? "No applications match your filters" 
                      : variant === "my" 
                        ? "You don't have access to any applications" 
                        : "No applications found"
                    }
                  </TableCell>
                </TableRow>
              ) : (
                filteredData?.apps.map((app: Application | UserApp) => (
                  <TableRow 
                    key={`app-${app.id}-${app.name.replace(/\s+/g, '-')}`}
                    className={onAppSelect ? "cursor-pointer hover:bg-gray-50" : ""}
                    onClick={() => stableOnAppSelect(app as Application)}
                    data-app-id={app.id}
                    data-app-name={app.name}
                  >
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          {hasOrganization(app) && app.settings?.imageUrl ? (
                            <Avatar className="w-10 h-10">
                              <AvatarImage 
                                src={app.settings.imageUrl} 
                                alt={app.name}
                                onError={(e) => {
                                  // Fallback to icon when image fails to load
                                  console.log(`🖼️ Image failed to load for ${app.name}:`, app.settings.imageUrl);
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                              <AvatarFallback className="bg-blue-100 text-blue-600">
                                {hasOrganization(app) ? getAppTypeIcon(getAppTypeFromApp(app)!) : <Box className="w-4 h-4" />}
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="flex items-center justify-center w-full h-full text-blue-600">
                              {hasOrganization(app) ? getAppTypeIcon(getAppTypeFromApp(app)!) : <Box className="w-4 h-4" />}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{app.name}</div>
                          {app.description && (
                            <div className="text-sm text-gray-500 truncate max-w-[200px]">
                              {app.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getAppTypeFromApp(app) ? (
                        <Badge variant={getTypeBadgeVariant(getAppTypeFromApp(app)!)} className="flex items-center space-x-1">
                          {getAppTypeIcon(getAppTypeFromApp(app)!)}
                          <span>{getAppTypeFromApp(app)}</span>
                        </Badge>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {hasStatus(app) ? (
                        <Badge variant={getStatusBadgeVariant(app.status)}>
                          {app.status}
                        </Badge>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {app.userRole ? (
                        <Badge variant={getRoleBadgeVariant(app.userRole as any)}>
                          {app.userRole === "OWNER" && <Crown className="w-3 h-3 mr-1" />}
                          {app.userRole === "ADMIN" && <Shield className="w-3 h-3 mr-1" />}
                          {app.userRole}
                        </Badge>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{getMemberCount(app)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-9 w-9">
                          <AvatarImage
                            src={hasOrganization(app) ? app.owner.profileImage : undefined}
                            alt={hasOrganization(app) ? app.owner.username : 'User'}
                          />
                          <AvatarFallback>
                            {hasOrganization(app) 
                              ? app.owner.username.substring(0, 2).toUpperCase()
                              : 'U'
                            }
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">
                          {getOrganizationName(app)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {new Date(hasOrganization(app) ? app.createdAt : (app as UserApp).grantedAt || '').toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          console.log(`🛑 Action cell clicked - preventing row click for app: ${app.name}`);
                        }}
                        onMouseDown={(e) => {
                          // Prevent any mouse event bubbling that might interfere
                          e.stopPropagation();
                        }}
                        style={{ 
                          // Ensure the container doesn't interfere with child events
                          pointerEvents: 'auto',
                          position: 'relative',
                          zIndex: 1
                        }}
                      >
                        <MemoizedAppActions 
                          app={app as Application}
                          onAppSelect={stableOnAppSelect}
                          onEditApp={stableOnEditApp}
                          onManageMembers={stableOnManageMembers}
                          onManageApiKeys={stableOnManageApiKeys}
                          onDeleteApp={handleDeleteApp}
                          deleteLoading={deleteLoading}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination - Only for admin and organization variants */}
        {(variant === "admin" || variant === "organization") && filteredData && (filteredData.hasNextPage || filteredData.hasPreviousPage) && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-500">
              Showing {currentPage * limit + 1} to {Math.min((currentPage + 1) * limit, filteredData.total)} of {filteredData.total} applications
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={!filteredData.hasPreviousPage}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={!filteredData.hasNextPage}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <AlertDialog open={!!appToDelete} onOpenChange={() => setAppToDelete(null)}>
          <AlertDialogContent className="sm:max-w-lg">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center space-x-2 text-red-600">
                <Trash2 className="w-5 h-5" />
                <span>Delete Application</span>
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                Are you sure you want to delete <strong>&quot;{appToDelete?.name}&quot;</strong>?
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="space-y-3">
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <div className="font-medium">This action cannot be undone. This will permanently:</div>
                    <ul className="mt-1 space-y-1 list-disc list-inside">
                      <li>Delete the application and all its data</li>
                      <li>Remove all API keys associated with this application</li>
                      <li>Remove all member access and permissions</li>
                      <li>Delete all audit logs and analytics data</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                Please type <strong>{appToDelete?.name}</strong> to confirm deletion.
              </div>
              <Input
                placeholder={`Type "${appToDelete?.name}" to confirm`}
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                className="border-red-300 focus:border-red-500 focus:ring-red-500"
              />
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel onClick={cancelDeleteApp} disabled={deleteLoading}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDeleteApp}
                disabled={deleteLoading || confirmationText !== appToDelete?.name}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
              >
                {deleteLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Application
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

// Separate component for application actions to avoid React Hook issues
interface AppActionsProps {
  app: Application;
  onAppSelect?: (app: Application) => void;
  onEditApp?: (app: Application) => void;
  onManageMembers?: (app: Application) => void;
  onManageApiKeys?: (app: Application) => void;
  onDeleteApp: (appId: string, appName: string) => void;
  deleteLoading: boolean;
}

function AppActions({
  app,
  onAppSelect,
  onEditApp,
  onManageMembers,
  onManageApiKeys,
  onDeleteApp,
  deleteLoading,
}: AppActionsProps) {
  // CRITICAL: All hooks must be called unconditionally at the top
  const canManage = useCanManageApp(app);
  const isAppAdmin = useIsAppAdmin(app);
  const canGenerateApiKeys = useCanGenerateApiKeys(app);
  const canPerformDestructiveActions = useCanPerformDestructiveActions(app);
  const canInviteMembers = useCanInviteMembers(app);
  const canTransferOwnership = useCanTransferOwnership(app);
  
  const { updateApp, loading: updateLoading } = useUpdateApp();
  const { archiveApp, loading: archiveLoading } = useArchiveApp();
  const { unarchiveApp, loading: unarchiveLoading } = useUnarchiveApp();

  // DEBUG: Log when component renders with app data
  console.log(`🔧 AppActions rendered for app: ${app.name} (${app.id}) - Updated: ${app.updatedAt}`);

  const handleToggleStatus = async () => {
    if (!isAppAdmin) {
      console.warn('🚫 User lacks admin permissions for app:', app.name);
      alert('You do not have permission to change the status of this application.');
      return;
    }
    
    try {
      console.log(`🔄 Toggling status for app: ${app.name} from ${app.status}`);
      const newStatus = app.status === Status.ACTIVE ? Status.INACTIVE : Status.ACTIVE;
      
      const result = await updateApp(app.id, { status: newStatus });
      
      console.log('✅ Update result:', result);
      
      if (result.data?.updateApp?.success) {
        console.log(`✅ Status toggled successfully: ${app.name} → ${newStatus}`);
        
        // Force UI update by refetching data
        if (typeof window !== 'undefined') {
          // Show success message
          alert(`App "${app.name}" status changed to ${newStatus}`);
          // Reload the page to ensure fresh data
          window.location.reload();
        }
      } else {
        const errors = result.data?.updateApp?.errors || [];
        console.error('❌ Update failed:', errors);
        alert(`Failed to update app status: ${errors.map((e: any) => e.message).join(', ')}`);
      }
    } catch (error: any) {
      console.error(`❌ Failed to toggle status for app: ${app.name}`, error);
      alert(`Error updating app status: ${error.message || 'Unknown error'}`);
    }
  };

  const handleArchiveApp = async () => {
    if (!isAppAdmin) return;
    
    try {
      console.log(`📦 Archiving/unarchiving app: ${app.name}`);
      if (app.status === Status.SUSPENDED) {
        await unarchiveApp(app.id);
      } else {
        await archiveApp(app.id);
      }
      console.log(`✅ Archive operation completed for app: ${app.name}`);
    } catch (error) {
      console.error(`❌ Failed to archive/unarchive app: ${app.name}`, error);
    }
  };

  const isLoading = updateLoading || archiveLoading || unarchiveLoading;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="h-8 w-8 p-0" 
          disabled={isLoading}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            console.log(`🛑 Action cell clicked - preventing row click for app: ${app.name}`);
          }}
          onMouseDown={(e) => {
            // Prevent any mouse event bubbling that might interfere
            e.stopPropagation();
          }}
          style={{ 
            // Ensure the container doesn't interfere with child events
            pointerEvents: 'auto',
            position: 'relative',
            zIndex: 1
          }}
        >
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end"
        style={{
          // Ensure dropdown content is above other elements
          zIndex: 1000
        }}
        onCloseAutoFocus={(e) => {
          // Prevent focus issues that might break subsequent clicks
          e.preventDefault();
        }}
      >
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        
        {/* View Details - Available to all users */}
        <DropdownMenuItem onClick={(e) => {
          e.stopPropagation();
          console.log(`👁️ View details clicked for app: ${app.name}`);
          onAppSelect?.(app);
        }}>
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>
        
        {/* External Links - Available to all users */}
        {app.settings?.website && (
          <DropdownMenuItem onClick={(e) => {
            e.stopPropagation();
            console.log(`🌐 Website link clicked for app: ${app.name}`);
            window.open(app.settings.website, '_blank');
          }}>
            <Globe className="mr-2 h-4 w-4" />
            Visit Website
          </DropdownMenuItem>
        )}
        
        {app.settings?.repository && (
          <DropdownMenuItem onClick={(e) => {
            e.stopPropagation();
            console.log(`📂 Repository link clicked for app: ${app.name}`);
            window.open(app.settings.repository, '_blank');
          }}>
            <GitBranch className="mr-2 h-4 w-4" />
            View Repository
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        
        {/* Management Actions - Based on permissions */}
        {canManage && (
          <>
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation();
              console.log(`✏️ Edit app clicked for app: ${app.name}`);
              onEditApp?.(app);
            }}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Application
            </DropdownMenuItem>
            
            {canInviteMembers && (
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                console.log(`👥 Manage members clicked for app: ${app.name}`);
                onManageMembers?.(app);
              }}>
                <Users className="mr-2 h-4 w-4" />
                Manage Members
              </DropdownMenuItem>
            )}
            
            {canGenerateApiKeys && (
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                console.log(`🔑 Manage API keys clicked for app: ${app.name}`);
                onManageApiKeys?.(app);
              }}>
                <Key className="mr-2 h-4 w-4" />
                Manage API Keys
              </DropdownMenuItem>
            )}
            
            <DropdownMenuSeparator />
            
            {/* Status Management - Admin level permissions */}
            {isAppAdmin && (
              <>
                {app.status === Status.ACTIVE ? (
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    handleToggleStatus();
                  }} disabled={isLoading}>
                    <Pause className="mr-2 h-4 w-4" />
                    Deactivate App
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    handleToggleStatus();
                  }} disabled={isLoading}>
                    <Play className="mr-2 h-4 w-4" />
                    Activate App
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  handleArchiveApp();
                }} disabled={isLoading}>
                  <Archive className="mr-2 h-4 w-4" />
                  {app.status === Status.SUSPENDED ? 'Unarchive App' : 'Archive App'}
                </DropdownMenuItem>
              </>
            )}
            
            <DropdownMenuSeparator />
            
            {/* Destructive Actions - Owner/Super Admin only */}
            {canPerformDestructiveActions && (
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  console.log(`🗑️ Delete app clicked for app: ${app.name}`);
                  onDeleteApp(app.id, app.name);
                }}
                disabled={deleteLoading || isLoading}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Application
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// CRITICAL FIX: Memoize AppActions to prevent unnecessary re-renders that break click events
const MemoizedAppActions = React.memo(AppActions, (prevProps, nextProps) => {
  // FIXED: React.memo comparison should return TRUE when props are EQUAL (to prevent re-render)
  // and FALSE when props are DIFFERENT (to trigger re-render)
  const areEqual = (
    prevProps.app.id === nextProps.app.id &&
    prevProps.app.name === nextProps.app.name &&
    prevProps.app.status === nextProps.app.status &&
    prevProps.app.updatedAt === nextProps.app.updatedAt &&
    prevProps.deleteLoading === nextProps.deleteLoading &&
    // Include callback function references to prevent stale closures
    prevProps.onAppSelect === nextProps.onAppSelect &&
    prevProps.onEditApp === nextProps.onEditApp &&
    prevProps.onManageMembers === nextProps.onManageMembers &&
    prevProps.onManageApiKeys === nextProps.onManageApiKeys &&
    prevProps.onDeleteApp === nextProps.onDeleteApp
  );
  
  // DEBUG: Log memoization decisions
  console.log(`🔄 AppActions memo check for ${prevProps.app.name}: ${areEqual ? 'SKIP re-render' : 'ALLOW re-render'}`);
  
  return areEqual; // Return TRUE to prevent re-render, FALSE to allow re-render
});