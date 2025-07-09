import { useMutation, useQuery, useLazyQuery } from "@apollo/client";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/appStore";

// Import user queries
import {
  GET_USERS,
  GET_USER_BY_ID,
  GET_USER_STATS,
  GET_USER_APPS,
  GET_USER_ORGANIZATIONS,
  type UsersQueryOptions,
  type UsersResponse,
  type UserResponse,
  type UserStatsResponse,
  type UserAppsResponse,
  type UserOrganizationsResponse,
  type UserAppsInput,
  type UserOrganizationsInput,
  type User,
  type UserStats,
  type UserApp,
  type UserOrganization,
  type UserFilterInput,
  SortOrder,
} from "@/graphql/user.queries";

// Import user mutations
import {
  UPDATE_USER_MUTATION,
  UPDATE_CURRENT_USER_MUTATION,
  UPDATE_USER_STATUS_MUTATION,
  UPDATE_USER_ROLE_MUTATION,
  DELETE_USER_MUTATION,
  BULK_UPDATE_USER_STATUS_MUTATION,
  BULK_DELETE_USERS_MUTATION,
  UPDATE_USER_PREFERENCES_MUTATION,
  UPDATE_USER_PROFILE_IMAGE_MUTATION,
  type UserUpdateInput,
  type UserStatus,
  type UserRole,
  type UserPreferencesInput,
  type ProfileImageInput,
  type UpdateUserResponse,
  type UpdateUserStatusResponse,
  type UpdateUserRoleResponse,
  type DeleteUserResponse,
  type BulkUpdateUserStatusResponse,
  type BulkDeleteUsersResponse,
  type UpdateUserPreferencesResponse,
  type UpdateUserProfileImageResponse,
} from "@/graphql/user.mutations";

/**
 * User Management Service
 * 
 * Comprehensive user management service using all working backend resolvers.
 * Provides type-safe hooks for all user operations.
 */

// ========================================
// USER QUERY HOOKS
// ========================================

/**
 * Get Users with Filtering and Pagination
 */
export const useUsers = (options?: UsersQueryOptions) => {
  return useQuery<UsersResponse>(GET_USERS, {
    variables: options,
    errorPolicy: "all",
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
  });
};

/**
 * Get User by ID
 */
export const useUser = (id: string) => {
  return useQuery<UserResponse>(GET_USER_BY_ID, {
    variables: { id },
    errorPolicy: "all",
    fetchPolicy: "cache-and-network",
    skip: !id,
  });
};

/**
 * Lazy Query for User by ID
 */
export const useUserLazy = () => {
  return useLazyQuery<UserResponse>(GET_USER_BY_ID, {
    errorPolicy: "all",
    fetchPolicy: "cache-and-network",
  });
};

/**
 * Get User Statistics
 */
export const useUserStats = () => {
  return useQuery<UserStatsResponse>(GET_USER_STATS, {
    errorPolicy: "all",
    fetchPolicy: "cache-and-network",
    pollInterval: 30000, // Refresh every 30 seconds
  });
};

/**
 * Get User Apps
 */
export const useUserApps = (userId: string, input?: UserAppsInput) => {
  return useQuery<UserAppsResponse>(GET_USER_APPS, {
    variables: { userId, input },
    errorPolicy: "all",
    fetchPolicy: "cache-and-network",
    skip: !userId,
  });
};

/**
 * Get User Organizations
 */
export const useUserOrganizations = (userId: string, input?: UserOrganizationsInput) => {
  return useQuery<UserOrganizationsResponse>(GET_USER_ORGANIZATIONS, {
    variables: { userId, input },
    errorPolicy: "all",
    fetchPolicy: "cache-and-network",
    skip: !userId,
  });
};

// ========================================
// USER MUTATION HOOKS
// ========================================

/**
 * Update User Profile
 */
export const useUpdateUser = () => {
  const [updateUserMutation, { loading, error }] = useMutation<UpdateUserResponse>(UPDATE_USER_MUTATION);

  const updateUser = async (id: string, input: UserUpdateInput) => {
    try {
      const response = await updateUserMutation({
        variables: { id, input },
        refetchQueries: ["GetUsers", "GetUserById", "GetMe"],
      });

      if (response.data?.updateUser.success) {
        return response;
      } else {
        throw new Error(response.data?.updateUser.errors?.[0]?.message || "User update failed");
      }
    } catch (err) {
      console.error("Update user error:", err);
      throw err;
    }
  };

  return { updateUser, loading, error };
};

/**
 * Update Current User Profile
 */
export const useUpdateCurrentUser = () => {
  const [updateCurrentUserMutation, { loading, error }] = useMutation<UpdateUserResponse>(UPDATE_CURRENT_USER_MUTATION);
  const setUser = useAppStore((state) => state.setUser);

  const updateCurrentUser = async (input: UserUpdateInput) => {
    try {
      const response = await updateCurrentUserMutation({
        variables: { input },
        refetchQueries: ["GetMe", "GetCurrentUser"],
      });

      if (response.data?.updateUser.success && response.data.updateUser.user) {
        const user = response.data.updateUser.user;
        
        // Update app store
        setUser({
          id: user.id,
          name: user.username,
          email: user.email,
          image: user.profileImage,
        });

        return response;
      } else {
        throw new Error(response.data?.updateUser.errors?.[0]?.message || "Profile update failed");
      }
    } catch (err) {
      console.error("Update current user error:", err);
      throw err;
    }
  };

  return { updateCurrentUser, loading, error };
};

/**
 * Admin: Update User Status
 */
export const useUpdateUserStatus = () => {
  const [updateUserStatusMutation, { loading, error }] = useMutation<UpdateUserStatusResponse>(UPDATE_USER_STATUS_MUTATION);

  const updateUserStatus = async (id: string, status: UserStatus) => {
    try {
      const response = await updateUserStatusMutation({
        variables: { id, status },
        refetchQueries: ["GetUsers", "GetUserById", "GetUserStats"],
      });

      if (response.data?.updateUserStatus.success) {
        return response;
      } else {
        throw new Error(response.data?.updateUserStatus.errors?.[0]?.message || "User status update failed");
      }
    } catch (err) {
      console.error("Update user status error:", err);
      throw err;
    }
  };

  return { updateUserStatus, loading, error };
};

/**
 * Admin: Update User Role
 */
export const useUpdateUserRole = () => {
  const [updateUserRoleMutation, { loading, error }] = useMutation<UpdateUserRoleResponse>(UPDATE_USER_ROLE_MUTATION);

  const updateUserRole = async (id: string, role: UserRole) => {
    try {
      const response = await updateUserRoleMutation({
        variables: { id, role },
        refetchQueries: ["GetUsers", "GetUserById", "GetUserStats"],
      });

      if (response.data?.updateUserRole.success) {
        return response;
      } else {
        throw new Error(response.data?.updateUserRole.errors?.[0]?.message || "User role update failed");
      }
    } catch (err) {
      console.error("Update user role error:", err);
      throw err;
    }
  };

  return { updateUserRole, loading, error };
};

/**
 * Admin: Delete User
 */
export const useDeleteUser = () => {
  const [deleteUserMutation, { loading, error }] = useMutation<DeleteUserResponse>(DELETE_USER_MUTATION);

  const deleteUser = async (id: string) => {
    try {
      const response = await deleteUserMutation({
        variables: { id },
        refetchQueries: ["GetUsers", "GetUserStats"],
      });

      if (response.data?.deleteUser.success) {
        return response;
      } else {
        throw new Error(response.data?.deleteUser.errors?.[0]?.message || "User deletion failed");
      }
    } catch (err) {
      console.error("Delete user error:", err);
      throw err;
    }
  };

  return { deleteUser, loading, error };
};

/**
 * Admin: Bulk Update User Status
 */
export const useBulkUpdateUserStatus = () => {
  const [bulkUpdateUserStatusMutation, { loading, error }] = useMutation<BulkUpdateUserStatusResponse>(BULK_UPDATE_USER_STATUS_MUTATION);

  const bulkUpdateUserStatus = async (userIds: string[], status: UserStatus) => {
    try {
      const response = await bulkUpdateUserStatusMutation({
        variables: { userIds, status },
        refetchQueries: ["GetUsers", "GetUserStats"],
      });

      if (response.data?.bulkUpdateUserStatus.success) {
        return response;
      } else {
        throw new Error("Bulk user status update failed");
      }
    } catch (err) {
      console.error("Bulk update user status error:", err);
      throw err;
    }
  };

  return { bulkUpdateUserStatus, loading, error };
};

/**
 * Admin: Bulk Delete Users
 */
export const useBulkDeleteUsers = () => {
  const [bulkDeleteUsersMutation, { loading, error }] = useMutation<BulkDeleteUsersResponse>(BULK_DELETE_USERS_MUTATION);

  const bulkDeleteUsers = async (userIds: string[]) => {
    try {
      const response = await bulkDeleteUsersMutation({
        variables: { userIds },
        refetchQueries: ["GetUsers", "GetUserStats"],
      });

      if (response.data?.bulkDeleteUsers.success) {
        return response;
      } else {
        throw new Error("Bulk user deletion failed");
      }
    } catch (err) {
      console.error("Bulk delete users error:", err);
      throw err;
    }
  };

  return { bulkDeleteUsers, loading, error };
};

/**
 * Update User Preferences
 */
export const useUpdateUserPreferences = () => {
  const [updateUserPreferencesMutation, { loading, error }] = useMutation<UpdateUserPreferencesResponse>(UPDATE_USER_PREFERENCES_MUTATION);

  const updateUserPreferences = async (input: UserPreferencesInput) => {
    try {
      const response = await updateUserPreferencesMutation({
        variables: { input },
        refetchQueries: ["GetMe", "GetCurrentUser"],
      });

      if (response.data?.updateUserPreferences.success) {
        return response;
      } else {
        throw new Error(response.data?.updateUserPreferences.errors?.[0]?.message || "Preferences update failed");
      }
    } catch (err) {
      console.error("Update user preferences error:", err);
      throw err;
    }
  };

  return { updateUserPreferences, loading, error };
};

/**
 * Update User Profile Image
 */
export const useUpdateUserProfileImage = () => {
  const [updateUserProfileImageMutation, { loading, error }] = useMutation<UpdateUserProfileImageResponse>(UPDATE_USER_PROFILE_IMAGE_MUTATION);
  const setUser = useAppStore((state) => state.setUser);

  const updateUserProfileImage = async (input: ProfileImageInput) => {
    try {
      const response = await updateUserProfileImageMutation({
        variables: { input },
        refetchQueries: ["GetMe", "GetCurrentUser"],
      });

      if (response.data?.updateUserProfileImage.success && response.data.updateUserProfileImage.user) {
        const user = response.data.updateUserProfileImage.user;
        
        // Update app store
        setUser({
          id: user.id,
          name: user.username,
          email: user.email,
          image: user.profileImage,
        });

        return response;
      } else {
        throw new Error(response.data?.updateUserProfileImage.errors?.[0]?.message || "Profile image update failed");
      }
    } catch (err) {
      console.error("Update user profile image error:", err);
      throw err;
    }
  };

  return { updateUserProfileImage, loading, error };
};

// ========================================
// UTILITY HOOKS
// ========================================

/**
 * Check if current user is admin
 */
export const useIsAdmin = () => {
  const { data, loading, error } = useQuery(GET_USERS, {
    variables: { limit: 1 },
    errorPolicy: "all",
  });

  return {
    isAdmin: !error && !loading,
    loading,
    error,
  };
};

/**
 * Search Users
 */
export const useSearchUsers = () => {
  const [searchUsers, { data, loading, error }] = useLazyQuery<UsersResponse>(GET_USERS, {
    errorPolicy: "all",
    fetchPolicy: "cache-and-network",
  });

  const search = (searchTerm: string, options?: Partial<UsersQueryOptions>) => {
    return searchUsers({
      variables: {
        ...options,
        filter: {
          ...options?.filter,
          search: searchTerm,
        },
      },
    });
  };

  return {
    search,
    data: data?.users,
    loading,
    error,
  };
};

/**
 * Get User Statistics Summary
 */
export const useUserStatsSummary = () => {
  const { data, loading, error } = useUserStats();

  const summary = data?.userStats ? {
    totalUsers: data.userStats.totalUsers,
    activeUsers: data.userStats.activeUsers,
    newUsersToday: data.userStats.newUsersToday,
    growthRate: data.userStats.growthMetrics.dailyGrowth,
    activeRate: data.userStats.totalUsers > 0 
      ? (data.userStats.activeUsers / data.userStats.totalUsers) * 100 
      : 0,
  } : null;

  return {
    summary,
    fullStats: data?.userStats,
    loading,
    error,
  };
};

/**
 * Export types for external use
 */
export type {
  User,
  UserStats,
  UsersQueryOptions,
  UserUpdateInput,
  UserStatus,
  UserRole,
  UserPreferencesInput,
  ProfileImageInput,
  UserAppsInput,
  UserOrganizationsInput,
}; 