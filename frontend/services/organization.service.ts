import { useMutation, useQuery, useLazyQuery } from "@apollo/client";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/appStore";

// Import organization queries
import {
  GET_ORGANIZATIONS,
  GET_MY_ORGANIZATIONS,
  GET_ALL_ORGANIZATIONS,
  GET_ORGANIZATION_MEMBERS,
  GET_USER_ORG_ACCESS,
  type OrganizationsQueryOptions,
  type OrganizationsResponse,
  type MyOrganizationsResponse,
  type AllOrganizationsResponse,
  type OrganizationMembersResponse,
  type UserOrgAccessResponse,
  type Organization,
} from "@/graphql/organization.queries";

// Import organization mutations
import {
  CREATE_ORGANIZATION_MUTATION,
  UPDATE_ORGANIZATION_MUTATION,
  DELETE_ORGANIZATION_MUTATION,
  ADD_ORGANIZATION_MEMBER_MUTATION,
  REMOVE_ORGANIZATION_MEMBER_MUTATION,
  UPDATE_MEMBER_ROLE_MUTATION,
  SWITCH_ORGANIZATION_MUTATION,
  type CreateOrganizationInput,
  type UpdateOrganizationInput,
  type AddMemberInput,
  type RemoveMemberInput,
  type UpdateMemberRoleInput,
  type OrganizationType,
  type Role,
  type CreateOrganizationResponse,
  type UpdateOrganizationResponse,
  type DeleteOrganizationResponse,
  type AddOrganizationMemberResponse,
  type RemoveOrganizationMemberResponse,
  type UpdateMemberRoleResponse,
  type SwitchOrganizationResponse,
  UPDATE_ORGANIZATION_SETTINGS,
  UPDATE_PASSWORD_POLICY,
  UPDATE_DOMAIN_SETTINGS,
  UPDATE_BRANDING_SETTINGS,
  UPDATE_NOTIFICATION_SETTINGS,
  UPDATE_ANALYTICS_SETTINGS,
  GET_ORGANIZATION_SETTINGS,
} from "@/graphql/organization.mutations";

/**
 * Organization Management Service
 * 
 * Comprehensive organization management service using all working backend resolvers.
 * Provides type-safe hooks for all organization operations.
 */

// ========================================
// ORGANIZATION QUERY HOOKS
// ========================================

/**
 * Get Organizations with Filtering and Pagination (Admin)
 */
export const useOrganizations = (options?: OrganizationsQueryOptions) => {
  return useQuery<OrganizationsResponse>(GET_ORGANIZATIONS, {
    variables: options,
    errorPolicy: "all",
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
  });
};

/**
 * Get Current User's Organizations
 */
export const useMyOrganizations = () => {
  return useQuery<MyOrganizationsResponse>(GET_MY_ORGANIZATIONS, {
    errorPolicy: "all",
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
  });
};

/**
 * Get All Organizations (Admin)
 */
export const useAllOrganizations = () => {
  return useQuery<AllOrganizationsResponse>(GET_ALL_ORGANIZATIONS, {
    errorPolicy: "all",
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
  });
};

/**
 * Get Organization Members
 */
export const useOrganizationMembers = (orgId: string) => {
  return useQuery<OrganizationMembersResponse>(GET_ORGANIZATION_MEMBERS, {
    variables: { orgId },
    errorPolicy: "all",
    fetchPolicy: "cache-and-network",
    skip: !orgId,
  });
};

/**
 * Lazy Query for Organization Members
 */
export const useOrganizationMembersLazy = () => {
  return useLazyQuery<OrganizationMembersResponse>(GET_ORGANIZATION_MEMBERS, {
    errorPolicy: "all",
    fetchPolicy: "cache-and-network",
  });
};

/**
 * Get User Organization Access
 */
export const useUserOrgAccess = (orgId: string) => {
  return useQuery<UserOrgAccessResponse>(GET_USER_ORG_ACCESS, {
    variables: { orgId },
    errorPolicy: "all",
    fetchPolicy: "cache-and-network",
    skip: !orgId,
  });
};

// ========================================
// ORGANIZATION MUTATION HOOKS
// ========================================

/**
 * Create Organization
 */
export const useCreateOrganization = () => {
  const [createOrganizationMutation, { loading, error }] = useMutation<CreateOrganizationResponse>(CREATE_ORGANIZATION_MUTATION);
  const router = useRouter();

  const createOrganization = async (input: CreateOrganizationInput) => {
    try {
      const response = await createOrganizationMutation({
        variables: { input },
        refetchQueries: ["GetMyOrganizations", "GetAllOrganizations"],
      });

      if (response.data?.createOrganization.success) {
        return response;
      } else {
        throw new Error(response.data?.createOrganization.errors?.[0]?.message || "Organization creation failed");
      }
    } catch (err) {
      console.error("Create organization error:", err);
      throw err;
    }
  };

  return { createOrganization, loading, error };
};

/**
 * Update Organization
 */
export const useUpdateOrganization = () => {
  const [updateOrganizationMutation, { loading, error }] = useMutation<UpdateOrganizationResponse>(UPDATE_ORGANIZATION_MUTATION);

  const updateOrganization = async (id: string, input: UpdateOrganizationInput) => {
    try {
      const response = await updateOrganizationMutation({
        variables: { id, input },
        refetchQueries: ["GetMyOrganizations", "GetOrganizations", "GetAllOrganizations"],
      });

      if (response.data?.updateOrganization.success) {
        return response;
      } else {
        throw new Error(response.data?.updateOrganization.errors?.[0]?.message || "Organization update failed");
      }
    } catch (err) {
      console.error("Update organization error:", err);
      throw err;
    }
  };

  return { updateOrganization, loading, error };
};

/**
 * Delete Organization
 */
export const useDeleteOrganization = () => {
  const [deleteOrganizationMutation, { loading, error }] = useMutation<DeleteOrganizationResponse>(DELETE_ORGANIZATION_MUTATION);

  const deleteOrganization = async (id: string) => {
    try {
      const response = await deleteOrganizationMutation({
        variables: { id },
        refetchQueries: ["GetMyOrganizations", "GetOrganizations", "GetAllOrganizations"],
      });

      if (response.data?.deleteOrganization.success) {
        return response;
      } else {
        throw new Error(response.data?.deleteOrganization.errors?.[0]?.message || "Organization deletion failed");
      }
    } catch (err) {
      console.error("Delete organization error:", err);
      throw err;
    }
  };

  return { deleteOrganization, loading, error };
};

/**
 * Add Organization Member
 */
export const useAddOrganizationMember = () => {
  const [addOrganizationMemberMutation, { loading, error }] = useMutation<AddOrganizationMemberResponse>(ADD_ORGANIZATION_MEMBER_MUTATION);

  const addOrganizationMember = async (input: AddMemberInput) => {
    try {
      const response = await addOrganizationMemberMutation({
        variables: { input },
        refetchQueries: ["GetOrganizationMembers", "GetMyOrganizations"],
      });

      if (response.data?.addOrganizationMember.success) {
        return response;
      } else {
        throw new Error(response.data?.addOrganizationMember.errors?.[0]?.message || "Failed to add organization member");
      }
    } catch (err) {
      console.error("Add organization member error:", err);
      throw err;
    }
  };

  return { addOrganizationMember, loading, error };
};

/**
 * Remove Organization Member
 */
export const useRemoveOrganizationMember = () => {
  const [removeOrganizationMemberMutation, { loading, error }] = useMutation<RemoveOrganizationMemberResponse>(REMOVE_ORGANIZATION_MEMBER_MUTATION);

  const removeOrganizationMember = async (input: RemoveMemberInput) => {
    try {
      const response = await removeOrganizationMemberMutation({
        variables: { input },
        refetchQueries: ["GetOrganizationMembers", "GetMyOrganizations"],
      });

      if (response.data?.removeOrganizationMember.success) {
        return response;
      } else {
        throw new Error(response.data?.removeOrganizationMember.errors?.[0]?.message || "Failed to remove organization member");
      }
    } catch (err) {
      console.error("Remove organization member error:", err);
      throw err;
    }
  };

  return { removeOrganizationMember, loading, error };
};

/**
 * Update Member Role
 */
export const useUpdateMemberRole = () => {
  const [updateMemberRoleMutation, { loading, error }] = useMutation<UpdateMemberRoleResponse>(UPDATE_MEMBER_ROLE_MUTATION);

  const updateMemberRole = async (input: UpdateMemberRoleInput) => {
    try {
      const response = await updateMemberRoleMutation({
        variables: { input },
        refetchQueries: ["GetOrganizationMembers", "GetMyOrganizations"],
      });

      if (response.data?.updateMemberRole.success) {
        return response;
      } else {
        throw new Error(response.data?.updateMemberRole.errors?.[0]?.message || "Failed to update member role");
      }
    } catch (err) {
      console.error("Update member role error:", err);
      throw err;
    }
  };

  return { updateMemberRole, loading, error };
};

/**
 * Switch Organization Context
 */
export const useSwitchOrganization = () => {
  const [switchOrganizationMutation, { loading, error }] = useMutation<SwitchOrganizationResponse>(SWITCH_ORGANIZATION_MUTATION);
  const setCurrentOrganization = useAppStore((state) => state.setCurrentOrganization);

  const switchOrganization = async (orgId: string) => {
    try {
      const response = await switchOrganizationMutation({
        variables: { orgId },
        refetchQueries: ["GetMe", "GetMyOrganizations"],
      });

      if (response.data?.switchOrganization) {
        const org = response.data.switchOrganization;
        
        // Update app store with current organization
        setCurrentOrganization({
          id: org.id,
          name: org.name,
          type: org.type as OrganizationType,
          userRole: org.userRole,
          imageUrl: org.imageUrl,
        });

        return response;
      } else {
        throw new Error("Organization switch failed");
      }
    } catch (err) {
      console.error("Switch organization error:", err);
      throw err;
    }
  };

  return { switchOrganization, loading, error };
};

// ========================================
// UTILITY HOOKS
// ========================================

/**
 * Check if current user is organization admin
 */
export const useIsOrgAdmin = (orgId?: string) => {
  const { data, loading, error } = useUserOrgAccess(orgId || "");

  return {
    isOrgAdmin: data?.userOrgAccess?.role === "ADMIN" || data?.userOrgAccess?.role === "OWNER",
    role: data?.userOrgAccess?.role,
    loading,
    error,
  };
};

/**
 * Search Organizations (Admin)
 */
export const useSearchOrganizations = () => {
  const [searchOrganizations, { data, loading, error }] = useLazyQuery<OrganizationsResponse>(GET_ORGANIZATIONS, {
    errorPolicy: "all",
    fetchPolicy: "cache-and-network",
  });

  const search = (searchTerm: string, options?: Partial<OrganizationsQueryOptions>) => {
    return searchOrganizations({
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
    data: data?.organizations,
    loading,
    error,
  };
};

/**
 * Get Current Organization from Store
 */
export const useCurrentOrganization = () => {
  const currentOrganization = useAppStore((state) => state.currentOrganization);
  return currentOrganization;
};

/**
 * Check if user can manage organization
 */
export const useCanManageOrganization = (organization?: Organization) => {
  const user = useAppStore((state) => state.user);
  
  if (!organization || !user) return false;
  
  // User can manage if they are the owner or have admin role in the org
  const isOwner = organization.owner.id === user.id;
  const isOrgAdmin = organization.userRole === "ADMIN";
  const isSystemAdmin = user.role === "ADMIN";
  
  return isOwner || isOrgAdmin || isSystemAdmin;
};

/**
 * Get Organization Role Badge Variant
 */
export const useOrganizationRoleBadgeVariant = (role: string) => {
  switch (role?.toLowerCase()) {
    case "owner":
      return "destructive";
    case "admin":
      return "default";
    case "member":
      return "secondary";
    case "viewer":
      return "outline";
    default:
      return "secondary";
  }
};

/**
 * Get Organization Type Badge Variant
 */
export const useOrganizationTypeBadgeVariant = (type: string) => {
  switch (type?.toLowerCase()) {
    case "enterprise":
      return "destructive";
    case "company":
      return "default";
    case "team":
      return "secondary";
    case "personal":
      return "outline";
    default:
      return "secondary";
  }
};

/**
 * Export types for external use
 */
export type {
  Organization,
  OrganizationsQueryOptions,
  CreateOrganizationInput,
  UpdateOrganizationInput,
  AddMemberInput,
  RemoveMemberInput,
  UpdateMemberRoleInput,
  OrganizationType,
  Role,
};

// Types
export interface OrganizationSettings {
  name: string;
  slug?: string;
  description?: string;
  website?: string;
  supportEmail?: string;
  timezone: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  passwordHistory: number;
  passwordExpiration: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
}

export interface DomainSettings {
  allowedCallbackUrls: string[];
  allowedLogoutUrls: string[];
  allowedWebOrigins: string[];
  customDomain?: string;
}

export interface BrandingSettings {
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  faviconUrl?: string;
  customCss?: string;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  securityAlerts: boolean;
  marketingEmails: boolean;
  weeklyReports: boolean;
  systemUpdates: boolean;
}

export interface AnalyticsSettings {
  enableTracking: boolean;
  retentionPeriod: number;
  exportFormat: 'JSON' | 'CSV';
}

export interface OrganizationWithSettings {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  website?: string;
  supportEmail?: string;
  timezone: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  passwordPolicy: PasswordPolicy;
  domainSettings: DomainSettings;
  branding: BrandingSettings;
  notifications: NotificationSettings;
  analytics: AnalyticsSettings;
  userRole?: string;
  createdAt: string;
  updatedAt: string;
}

// React Hooks

export function useOrganizationSettings(orgId: string) {
  const { data, loading, error, refetch } = useQuery(GET_ORGANIZATION_SETTINGS, {
    variables: { id: orgId },
    skip: !orgId,
    errorPolicy: 'all',
  });

  return {
    organization: data?.organization,
    loading,
    error,
    refetch,
  };
}

export function useUpdateOrganizationSettings() {
  const [updateSettingsMutation, { loading, error }] = useMutation(
    UPDATE_ORGANIZATION_SETTINGS,
    {
      errorPolicy: 'all',
    }
  );

  const updateSettings = async (orgId: string, settings: Partial<OrganizationSettings>) => {
    try {
      const result = await updateSettingsMutation({
        variables: {
          id: orgId,
          input: settings,
        },
      });

      if (result.data?.updateOrganizationSettings?.success) {
        return {
          success: true,
          organization: result.data.updateOrganizationSettings.organization,
        };
      }

      return {
        success: false,
        errors: result.data?.updateOrganizationSettings?.errors || [],
      };
    } catch (err) {
      console.error('Failed to update organization settings:', err);
      return {
        success: false,
        errors: [{ message: 'Failed to update organization settings' }],
      };
    }
  };

  return {
    updateSettings,
    loading,
    error,
  };
}

export function useUpdatePasswordPolicy() {
  const [updatePolicyMutation, { loading, error }] = useMutation(
    UPDATE_PASSWORD_POLICY,
    {
      errorPolicy: 'all',
    }
  );

  const updatePolicy = async (orgId: string, policy: Partial<PasswordPolicy>) => {
    try {
      const result = await updatePolicyMutation({
        variables: {
          id: orgId,
          input: policy,
        },
      });

      if (result.data?.updatePasswordPolicy?.success) {
        return {
          success: true,
          organization: result.data.updatePasswordPolicy.organization,
        };
      }

      return {
        success: false,
        errors: result.data?.updatePasswordPolicy?.errors || [],
      };
    } catch (err) {
      console.error('Failed to update password policy:', err);
      return {
        success: false,
        errors: [{ message: 'Failed to update password policy' }],
      };
    }
  };

  return {
    updatePolicy,
    loading,
    error,
  };
}

export function useUpdateDomainSettings() {
  const [updateDomainMutation, { loading, error }] = useMutation(
    UPDATE_DOMAIN_SETTINGS,
    {
      errorPolicy: 'all',
    }
  );

  const updateDomainSettings = async (orgId: string, settings: Partial<DomainSettings>) => {
    try {
      const result = await updateDomainMutation({
        variables: {
          id: orgId,
          input: settings,
        },
      });

      if (result.data?.updateDomainSettings?.success) {
        return {
          success: true,
          organization: result.data.updateDomainSettings.organization,
        };
      }

      return {
        success: false,
        errors: result.data?.updateDomainSettings?.errors || [],
      };
    } catch (err) {
      console.error('Failed to update domain settings:', err);
      return {
        success: false,
        errors: [{ message: 'Failed to update domain settings' }],
      };
    }
  };

  return {
    updateDomainSettings,
    loading,
    error,
  };
}

export function useUpdateBrandingSettings() {
  const [updateBrandingMutation, { loading, error }] = useMutation(
    UPDATE_BRANDING_SETTINGS,
    {
      errorPolicy: 'all',
    }
  );

  const updateBrandingSettings = async (orgId: string, settings: Partial<BrandingSettings>) => {
    try {
      const result = await updateBrandingMutation({
        variables: {
          id: orgId,
          input: settings,
        },
      });

      if (result.data?.updateBrandingSettings?.success) {
        return {
          success: true,
          organization: result.data.updateBrandingSettings.organization,
        };
      }

      return {
        success: false,
        errors: result.data?.updateBrandingSettings?.errors || [],
      };
    } catch (err) {
      console.error('Failed to update branding settings:', err);
      return {
        success: false,
        errors: [{ message: 'Failed to update branding settings' }],
      };
    }
  };

  return {
    updateBrandingSettings,
    loading,
    error,
  };
}

export function useUpdateNotificationSettings() {
  const [updateNotificationMutation, { loading, error }] = useMutation(
    UPDATE_NOTIFICATION_SETTINGS,
    {
      errorPolicy: 'all',
    }
  );

  const updateNotificationSettings = async (orgId: string, settings: Partial<NotificationSettings>) => {
    try {
      const result = await updateNotificationMutation({
        variables: {
          id: orgId,
          input: settings,
        },
      });

      if (result.data?.updateNotificationSettings?.success) {
        return {
          success: true,
          organization: result.data.updateNotificationSettings.organization,
        };
      }

      return {
        success: false,
        errors: result.data?.updateNotificationSettings?.errors || [],
      };
    } catch (err) {
      console.error('Failed to update notification settings:', err);
      return {
        success: false,
        errors: [{ message: 'Failed to update notification settings' }],
      };
    }
  };

  return {
    updateNotificationSettings,
    loading,
    error,
  };
}

export function useUpdateAnalyticsSettings() {
  const [updateAnalyticsMutation, { loading, error }] = useMutation(
    UPDATE_ANALYTICS_SETTINGS,
    {
      errorPolicy: 'all',
    }
  );

  const updateAnalyticsSettings = async (orgId: string, settings: Partial<AnalyticsSettings>) => {
    try {
      const result = await updateAnalyticsMutation({
        variables: {
          id: orgId,
          input: settings,
        },
      });

      if (result.data?.updateAnalyticsSettings?.success) {
        return {
          success: true,
          organization: result.data.updateAnalyticsSettings.organization,
        };
      }

      return {
        success: false,
        errors: result.data?.updateAnalyticsSettings?.errors || [],
      };
    } catch (err) {
      console.error('Failed to update analytics settings:', err);
      return {
        success: false,
        errors: [{ message: 'Failed to update analytics settings' }],
      };
    }
  };

  return {
    updateAnalyticsSettings,
    loading,
    error,
  };
} 