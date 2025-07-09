import { useQuery, useMutation, useLazyQuery } from '@apollo/client';
import { useCallback, useMemo, useEffect, useState } from 'react';
import { useAppStore } from '@/store/appStore';

// Import GraphQL operations
import {
  GET_APPS,
  GET_APP,
  GET_USER_APPS,
  GET_USER_APP_ACCESS,
  GET_APP_MEMBERS,
  GET_APP_API_KEYS,
  GET_ORGANIZATION_APPS,
  SEARCH_APPS,
  GET_APP_STATS,
  AppType,
  Status,
  Role,
  SortOrder,
  AccessType,
  type Application,
  type AppMember,
  type ApiKey,
  type UserAppAccess,
  type AppsResponse,
  type AppFilter,
  type UserApp,
  type AppFilters,
  type PaginationInput,
  type AppPermissions,
  type AppsQueryOptions,
} from '@/graphql/app.queries';

import {
  CREATE_APP_MUTATION,
  UPDATE_APP_MUTATION,
  DELETE_APP_MUTATION,
  ADD_APP_MEMBER_MUTATION,
  REMOVE_APP_MEMBER_MUTATION,
  UPDATE_APP_MEMBER_ROLE_MUTATION,
  GENERATE_API_KEY_MUTATION,
  REVOKE_API_KEY_MUTATION,
  UPDATE_API_KEY_MUTATION,
  BULK_UPDATE_APP_STATUS_MUTATION,
  BULK_DELETE_APPS_MUTATION,
  TRANSFER_APP_OWNERSHIP_MUTATION,
  CLONE_APP_MUTATION,
  ARCHIVE_APP_MUTATION,
  UNARCHIVE_APP_MUTATION,
  REGENERATE_API_KEY_MUTATION,
  type CreateAppInput,
  type UpdateAppInput,
  type AddAppMemberInput,
  type RemoveAppMemberInput,
  type UpdateAppMemberRoleInput,
  type GenerateApiKeyInput,
  type RevokeApiKeyInput,
  type UpdateApiKeyInput,
} from '@/graphql/app.mutations';

// ===== QUERY HOOKS =====

// Get paginated list of applications with filtering
export const useApps = (options?: AppsQueryOptions) => {
  const { data, loading, error, refetch, fetchMore } = useQuery(GET_APPS, {
    variables: {
      filter: options?.filter,
      limit: options?.limit || 20,
      offset: options?.offset || 0,
      sortBy: options?.sortBy || 'createdAt',
      sortOrder: options?.sortOrder || SortOrder.DESC,
    },
    errorPolicy: 'all',
    notifyOnNetworkStatusChange: true,
  });

  return {
    data: data?.apps,
    loading,
    error,
    refetch,
    fetchMore,
  };
};

// Get single application with full details
export const useApp = (appId: string) => {
  const { data, loading, error, refetch } = useQuery(GET_APP, {
    variables: { id: appId },
    skip: !appId,
    errorPolicy: 'all',
  });

  return {
    data: data?.app,
    loading,
    error,
    refetch,
  };
};

// Get user's applications
export const useUserApps = () => {
  const { data, loading, error, refetch } = useQuery(GET_USER_APPS, {
    errorPolicy: 'all',
  });

  return {
    data: data?.myApps ? { apps: data.myApps, total: data.myApps.length } : undefined,
    loading,
    error,
    refetch,
  };
};

// Get user's access to specific application
export const useUserAppAccess = (appId: string) => {
  const { data, loading, error, refetch } = useQuery(GET_USER_APP_ACCESS, {
    variables: { appId },
    skip: !appId,
    errorPolicy: 'all',
  });

  return {
    data: data?.userAppAccess,
    loading,
    error,
    refetch,
  };
};

// Get application members (lazy loading)
export const useAppMembers = (appId: string) => {
  const { data, loading, error, refetch } = useQuery(GET_APP_MEMBERS, {
    variables: { appId },
    skip: !appId,
    errorPolicy: 'all',
  });

  return {
    data: data?.appMembers,
    loading,
    error,
    refetch,
  };
};

// Lazy query for application members
export const useAppMembersLazy = () => {
  const [getAppMembers, { data, loading, error }] = useLazyQuery(GET_APP_MEMBERS, {
    errorPolicy: 'all',
  });

  return {
    getAppMembers,
    data: data?.appMembers,
    loading,
    error,
  };
};

// Get application API keys (lazy loading)
export const useAppApiKeys = (appId: string) => {
  const { data, loading, error, refetch } = useQuery(GET_APP_API_KEYS, {
    variables: { appId },
    skip: !appId,
    errorPolicy: 'all',
  });

  return {
    data: data?.app,
    loading,
    error,
    refetch,
  };
};

// Get applications by organization
export const useOrganizationApps = (
  organizationId: string,
  options?: { limit?: number; offset?: number; filter?: AppFilter }
) => {
  const { data, loading, error, refetch, fetchMore } = useQuery(GET_ORGANIZATION_APPS, {
    variables: {
      organizationId: organizationId || "__INVALID_ORG_ID__", // Use placeholder for empty values
      limit: options?.limit || 20,
      offset: options?.offset || 0,
      // CRITICAL FIX: Destructure filter parameters to match GraphQL query expectations
      search: options?.filter?.search,
      type: options?.filter?.type,
      status: options?.filter?.status,
    },
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: true,
    // Add skip condition for invalid organization IDs
    skip: !organizationId || organizationId.trim() === "" || organizationId === "__INVALID_ORG_ID__",
  });

  console.log('🏢 useOrganizationApps query state:', {
    organizationId,
    loading,
    error: error?.message,
    dataLength: data?.apps?.apps?.length,
    variables: {
      organizationId: organizationId || "__INVALID_ORG_ID__",
      limit: options?.limit || 20,
      offset: options?.offset || 0,
      search: options?.filter?.search,
      type: options?.filter?.type,
      status: options?.filter?.status,
    }
  });

  // Return empty data if organizationId is invalid
  if (!organizationId || organizationId.trim() === "" || organizationId === "__INVALID_ORG_ID__") {
    return {
      data: { apps: [], total: 0, hasNextPage: false, hasPreviousPage: false },
      loading: false,
      error: null,
      refetch,
      fetchMore,
    };
  }

  return {
    data: data?.apps,
    loading,
    error,
    refetch,
    fetchMore,
  };
};

// Search applications
export const useSearchApps = () => {
  const [searchApps, { data, loading, error }] = useLazyQuery(SEARCH_APPS, {
    errorPolicy: 'all',
  });

  const search = useCallback(
    (searchTerm: string, options?: { limit?: number; organizationId?: string }) => {
      return searchApps({
        variables: {
          search: searchTerm,
          limit: options?.limit || 10,
          organizationId: options?.organizationId,
        },
      });
    },
    [searchApps]
  );

  return {
    search,
    data: data?.apps,
    loading,
    error,
  };
};

// Get application statistics
export const useAppStats = (appId: string) => {
  const { data, loading, error, refetch } = useQuery(GET_APP_STATS, {
    variables: { appId },
    skip: !appId,
    errorPolicy: 'all',
  });

  return {
    data: data?.app,
    loading,
    error,
    refetch,
  };
};

// ===== MUTATION HOOKS =====

// Create application
export const useCreateApp = () => {
  const [createAppMutation, { loading, error }] = useMutation(CREATE_APP_MUTATION, {
    // CRITICAL FIX: Remove caching to prevent missing field errors
    fetchPolicy: 'no-cache',
    errorPolicy: 'all',
  });

  const createApp = useCallback(
    async (input: CreateAppInput) => {
      return createAppMutation({
        variables: { input },
      });
    },
    [createAppMutation]
  );

  return {
    createApp,
    loading,
    error,
  };
};

// Update application
export const useUpdateApp = () => {
  const [updateAppMutation, { loading, error }] = useMutation(UPDATE_APP_MUTATION, {
    // CRITICAL FIX: Remove all caching to prevent missing field errors
    fetchPolicy: 'no-cache',
    errorPolicy: 'all',
  });

  const updateApp = useCallback(
    async (appId: string, input: UpdateAppInput) => {
      return updateAppMutation({
        variables: { id: appId, input },
        // NO optimistic response - causes missing field errors
        // NO cache updates - work without caching
        // NO refetch queries - prevent excessive re-renders
      });
    },
    [updateAppMutation]
  );

  return {
    updateApp,
    loading,
    error,
  };
};

// Delete application
export const useDeleteApp = () => {
  const [deleteAppMutation, { loading, error }] = useMutation(DELETE_APP_MUTATION);

  const deleteApp = useCallback(
    async (appId: string) => {
      return deleteAppMutation({
        variables: { id: appId },
        update: (cache) => {
          // Remove the app from cache
          cache.evict({ id: cache.identify({ __typename: 'App', id: appId }) });
          cache.gc();
        },
        // CRITICAL FIX: Refetch all relevant queries to ensure UI consistency
        refetchQueries: [
          GET_USER_APPS,
          GET_APPS,
          GET_ORGANIZATION_APPS,
        ],
      });
    },
    [deleteAppMutation]
  );

  return {
    deleteApp,
    loading,
    error,
  };
};

// Add application member
export const useAddAppMember = () => {
  const [addAppMemberMutation, { loading, error }] = useMutation(ADD_APP_MEMBER_MUTATION);

  const addAppMember = useCallback(
    async (input: AddAppMemberInput) => {
      return addAppMemberMutation({
        variables: { input },
        refetchQueries: [
          { query: GET_APP_MEMBERS, variables: { appId: input.appId } },
          { query: GET_APP, variables: { id: input.appId } },
        ],
      });
    },
    [addAppMemberMutation]
  );

  return {
    addAppMember,
    loading,
    error,
  };
};

// Remove application member
export const useRemoveAppMember = () => {
  const [removeAppMemberMutation, { loading, error }] = useMutation(REMOVE_APP_MEMBER_MUTATION);

  const removeAppMember = useCallback(
    async (input: RemoveAppMemberInput) => {
      return removeAppMemberMutation({
        variables: { input },
        refetchQueries: [
          { query: GET_APP_MEMBERS, variables: { appId: input.appId } },
          { query: GET_APP, variables: { id: input.appId } },
        ],
      });
    },
    [removeAppMemberMutation]
  );

  return {
    removeAppMember,
    loading,
    error,
  };
};

// Update application member role
export const useUpdateAppMemberRole = () => {
  const [updateAppMemberRoleMutation, { loading, error }] = useMutation(UPDATE_APP_MEMBER_ROLE_MUTATION);

  const updateAppMemberRole = useCallback(
    async (input: UpdateAppMemberRoleInput) => {
      return updateAppMemberRoleMutation({
        variables: { input },
        refetchQueries: [
          { query: GET_APP_MEMBERS, variables: { appId: input.appId } },
          { query: GET_APP, variables: { id: input.appId } },
        ],
      });
    },
    [updateAppMemberRoleMutation]
  );

  return {
    updateAppMemberRole,
    loading,
    error,
  };
};

// Generate API key
export const useGenerateApiKey = () => {
  const [generateApiKeyMutation, { loading, error }] = useMutation(GENERATE_API_KEY_MUTATION);

  const generateApiKey = useCallback(
    async (input: GenerateApiKeyInput) => {
      return generateApiKeyMutation({
        variables: { input },
        refetchQueries: [
          { query: GET_APP_API_KEYS, variables: { appId: input.appId } },
          { query: GET_APP, variables: { id: input.appId } },
        ],
      });
    },
    [generateApiKeyMutation]
  );

  return {
    generateApiKey,
    loading,
    error,
  };
};

// Revoke API key
export const useRevokeApiKey = () => {
  const [revokeApiKeyMutation, { loading, error }] = useMutation(REVOKE_API_KEY_MUTATION);

  const revokeApiKey = useCallback(
    async (input: RevokeApiKeyInput) => {
      return revokeApiKeyMutation({
        variables: { input },
        refetchQueries: [
          { query: GET_APP_API_KEYS, variables: { appId: input.appId } },
          { query: GET_APP, variables: { id: input.appId } },
        ],
      });
    },
    [revokeApiKeyMutation]
  );

  return {
    revokeApiKey,
    loading,
    error,
  };
};

// Update API key
export const useUpdateApiKey = () => {
  const [updateApiKeyMutation, { loading, error }] = useMutation(UPDATE_API_KEY_MUTATION);

  const updateApiKey = useCallback(
    async (input: UpdateApiKeyInput) => {
      return updateApiKeyMutation({
        variables: { input },
        refetchQueries: [
          { query: GET_APP_API_KEYS, variables: { appId: input.appId } },
        ],
      });
    },
    [updateApiKeyMutation]
  );

  return {
    updateApiKey,
    loading,
    error,
  };
};

// Bulk update application status
export const useBulkUpdateAppStatus = () => {
  const [bulkUpdateAppStatusMutation, { loading, error }] = useMutation(BULK_UPDATE_APP_STATUS_MUTATION, {
    refetchQueries: [
      { query: GET_USER_APPS },
    ],
  });

  const bulkUpdateAppStatus = useCallback(
    async (appIds: string[], status: Status) => {
      return bulkUpdateAppStatusMutation({
        variables: { appIds, status },
      });
    },
    [bulkUpdateAppStatusMutation]
  );

  return {
    bulkUpdateAppStatus,
    loading,
    error,
  };
};

// Bulk delete applications
export const useBulkDeleteApps = () => {
  const [bulkDeleteAppsMutation, { loading, error }] = useMutation(BULK_DELETE_APPS_MUTATION, {
    refetchQueries: [
      { query: GET_USER_APPS },
    ],
  });

  const bulkDeleteApps = useCallback(
    async (appIds: string[]) => {
      return bulkDeleteAppsMutation({
        variables: { appIds },
        update: (cache) => {
          // Remove apps from cache
          appIds.forEach(appId => {
            cache.evict({ id: cache.identify({ __typename: 'App', id: appId }) });
          });
          cache.gc();
        },
      });
    },
    [bulkDeleteAppsMutation]
  );

  return {
    bulkDeleteApps,
    loading,
    error,
  };
};

// Transfer application ownership
export const useTransferAppOwnership = () => {
  const [transferAppOwnershipMutation, { loading, error }] = useMutation(TRANSFER_APP_OWNERSHIP_MUTATION);

  const transferAppOwnership = useCallback(
    async (appId: string, newOwnerId: string) => {
      return transferAppOwnershipMutation({
        variables: { appId, newOwnerId },
        refetchQueries: [
          { query: GET_APP, variables: { id: appId } },
          { query: GET_APP_MEMBERS, variables: { appId } },
        ],
      });
    },
    [transferAppOwnershipMutation]
  );

  return {
    transferAppOwnership,
    loading,
    error,
  };
};

// Clone application
export const useCloneApp = () => {
  const [cloneAppMutation, { loading, error }] = useMutation(CLONE_APP_MUTATION, {
    refetchQueries: [
      { query: GET_USER_APPS },
    ],
  });

  const cloneApp = useCallback(
    async (appId: string, name: string, organizationId?: string) => {
      return cloneAppMutation({
        variables: { appId, name, organizationId },
      });
    },
    [cloneAppMutation]
  );

  return {
    cloneApp,
    loading,
    error,
  };
};

// Archive application
export const useArchiveApp = () => {
  const [archiveAppMutation, { loading, error }] = useMutation(ARCHIVE_APP_MUTATION);

  const archiveApp = useCallback(
    async (appId: string) => {
      return archiveAppMutation({
        variables: { appId },
        // CRITICAL FIX: Refetch all relevant queries to ensure UI consistency
        refetchQueries: [
          { query: GET_APP, variables: { id: appId } },
          GET_USER_APPS,
          GET_APPS,
          GET_ORGANIZATION_APPS,
        ],
      });
    },
    [archiveAppMutation]
  );

  return {
    archiveApp,
    loading,
    error,
  };
};

// Unarchive application
export const useUnarchiveApp = () => {
  const [unarchiveAppMutation, { loading, error }] = useMutation(UNARCHIVE_APP_MUTATION);

  const unarchiveApp = useCallback(
    async (appId: string) => {
      return unarchiveAppMutation({
        variables: { appId },
        // CRITICAL FIX: Refetch all relevant queries to ensure UI consistency
        refetchQueries: [
          { query: GET_APP, variables: { id: appId } },
          GET_USER_APPS,
          GET_APPS,
          GET_ORGANIZATION_APPS,
        ],
      });
    },
    [unarchiveAppMutation]
  );

  return {
    unarchiveApp,
    loading,
    error,
  };
};

// Regenerate API key
export const useRegenerateApiKey = () => {
  const [regenerateApiKeyMutation, { loading, error }] = useMutation(REGENERATE_API_KEY_MUTATION);

  const regenerateApiKey = useCallback(
    async (input: RevokeApiKeyInput) => {
      return regenerateApiKeyMutation({
        variables: { input },
        refetchQueries: [
          { query: GET_APP_API_KEYS, variables: { appId: input.appId } },
        ],
      });
    },
    [regenerateApiKeyMutation]
  );

  return {
    regenerateApiKey,
    loading,
    error,
  };
};

// ===== UTILITY FUNCTIONS =====

// Check if user can manage application
export const useCanManageApp = (application?: Application) => {
  const { user } = useAppStore();

  return useMemo(() => {
    if (!application || !user) return false;
    
    // Owner can always manage
    if (application.owner.id === user.id) return true;
    
    // App-level admin role can manage
    if (application.userRole === Role.ADMIN) return true;
    
    // App-level member role can perform basic management
    if (application.userRole === Role.MEMBER) return true;
    
    // System admin can manage any app
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') return true;
    
    return false;
  }, [application, user]);
};

// Check if user is app admin (owner or admin role)
export const useIsAppAdmin = (application?: Application) => {
  const { user } = useAppStore();

  return useMemo(() => {
    if (!application || !user) return false;
    
    return (
      application.owner.id === user.id ||
      application.userRole === Role.ADMIN ||
      user.role === 'ADMIN' ||
      user.role === 'SUPER_ADMIN'
    );
  }, [application, user]);
};

// Check if user can generate API keys
export const useCanGenerateApiKeys = (application?: Application) => {
  const { user } = useAppStore();

  return useMemo(() => {
    if (!application || !user) return false;
    
    // Owner, Admin, and Member can generate API keys
    return (
      application.owner.id === user.id ||
      application.userRole === Role.ADMIN ||
      application.userRole === Role.MEMBER ||
      user.role === 'ADMIN' ||
      user.role === 'SUPER_ADMIN'
    );
  }, [application, user]);
};

// Check if user can perform destructive actions (delete, archive)
export const useCanPerformDestructiveActions = (application?: Application) => {
  const { user } = useAppStore();

  return useMemo(() => {
    if (!application || !user) return false;
    
    // Only owner and system admins can perform destructive actions
    return (
      application.owner.id === user.id ||
      user.role === 'ADMIN' ||
      user.role === 'SUPER_ADMIN'
    );
  }, [application, user]);
};

// Check if user can invite members to app
export const useCanInviteMembers = (application?: Application) => {
  const { user } = useAppStore();

  return useMemo(() => {
    if (!application || !user) return false;
    
    // Owner, Admin, and Member can invite
    return (
      application.owner.id === user.id ||
      application.userRole === Role.ADMIN ||
      application.userRole === Role.MEMBER ||
      user.role === 'ADMIN' ||
      user.role === 'SUPER_ADMIN'
    );
  }, [application, user]);
};

// Check if user can transfer ownership
export const useCanTransferOwnership = (application?: Application) => {
  const { user } = useAppStore();

  return useMemo(() => {
    if (!application || !user) return false;
    
    // Only owner and system admins can transfer ownership
    return (
      application.owner.id === user.id ||
      user.role === 'ADMIN' ||
      user.role === 'SUPER_ADMIN'
    );
  }, [application, user]);
};

// Get application type badge variant (converted to regular function)
export const getAppTypeBadgeVariant = (type: AppType) => {
  switch (type) {
    case AppType.WEB:
      return 'default';
    case AppType.MOBILE:
      return 'secondary';
    case AppType.API:
      return 'outline';
    case AppType.SERVICE:
      return 'destructive';
    default:
      return 'default';
  }
};

// Get application status badge variant (converted to regular function)
export const getAppStatusBadgeVariant = (status: Status): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case Status.ACTIVE:
      return "default";
    case Status.INACTIVE:
      return "secondary";
    case Status.PENDING:
      return "outline";
    case Status.SUSPENDED:
      return "destructive";
    default:
      return "outline";
  }
};

// Get app role badge variant (converted to regular function)
export const getAppRoleBadgeVariant = (role: Role) => {
  switch (role) {
    case Role.OWNER:
      return 'default';
    case Role.ADMIN:
      return 'destructive';
    case Role.MEMBER:
      return 'secondary';
    case Role.VIEWER:
      return 'outline';
    default:
      return 'outline';
  }
};

// Get current organization from store
export const useCurrentOrganization = () => {
  const { currentOrganization } = useAppStore();
  return currentOrganization;
};

// Export all types for convenience
export type {
  Application,
  UserApp,
  AppMember,
  ApiKey,
  UserAppAccess,
  AppsResponse,
  AppsQueryOptions,
  AppFilter,
  AppFilters,
  PaginationInput,
  AppPermissions,
  CreateAppInput,
  UpdateAppInput,
  AddAppMemberInput,
  RemoveAppMemberInput,
  UpdateAppMemberRoleInput,
  GenerateApiKeyInput,
  RevokeApiKeyInput,
  UpdateApiKeyInput,
};

// Export enums as values
export {
  AppType,
  Status,
  Role,
  SortOrder,
  AccessType,
};

// ===== UTILITY HOOKS =====

// Debounced value hook for search optimization
export const useDebounced = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}; 