import { gql, useMutation, useQuery } from '@apollo/client';
import { AppType, Status, Role } from './app.queries';

// ===== MUTATION INPUT TYPES =====

export interface CreateAppInput {
  name: string;
  description?: string;
  type: AppType;
  organizationId?: string; // If not provided, uses current organization
  website?: string;
  repository?: string;
  imageUrl?: string;
}

export interface UpdateAppInput {
  name?: string;
  description?: string;
  status?: Status;
  website?: string;
  repository?: string;
  imageUrl?: string;
}

export interface AddAppMemberInput {
  appId: string;
  userId: string;
  role: Role;
  permissions?: string[];
}

export interface RemoveAppMemberInput {
  appId: string;
  userId: string;
}

export interface UpdateAppMemberRoleInput {
  appId: string;
  userId: string;
  role: Role;
  permissions?: string[];
}

export interface GenerateApiKeyInput {
  appId: string;
  name: string;
  permissions: string[];
  expiresAt?: string; // ISO date string
}

export interface RevokeApiKeyInput {
  appId: string;
  keyId: string;
}

export interface UpdateApiKeyInput {
  appId: string;
  keyId: string;
  name?: string;
  permissions?: string[];
  expiresAt?: string;
}

// ===== MUTATION RESPONSE TYPES =====

export interface CreateAppResponse {
  success: boolean;
  app?: {
    id: string;
    name: string;
    description?: string;
    type: string;
    organizationId: string;
    owner: {
      id: string;
      username: string;
      email: string;
    };
    members: {
      id: string;
      username: string;
      email: string;
    }[];
    memberCount: number;
    userRole?: string;
    createdAt: string;
  };
  errors?: {
    message: string;
    code: string;
    field: string;
  }[];
}

export interface UpdateAppResponse {
  success: boolean;
  app?: {
    id: string;
    name: string;
    description?: string;
    type: string;
    status: string;
    organizationId: string;
    createdAt: string;
    updatedAt: string;
  };
  errors?: {
    message: string;
    code: string;
    field: string;
  }[];
}

export interface DeleteAppResponse {
  success: boolean;
  message: string;
}

export interface AddAppMemberResponse {
  success: boolean;
  app?: {
    id: string;
    name: string;
    memberCount: number;
    members: {
      id: string;
      username: string;
      email: string;
    }[];
  };
  errors?: {
    message: string;
    code: string;
    field: string;
  }[];
}

export interface RemoveAppMemberResponse {
  success: boolean;
  app?: {
    id: string;
    name: string;
    memberCount: number;
    members: {
      id: string;
      username: string;
      email: string;
    }[];
  };
  errors?: {
    message: string;
    code: string;
    field: string;
  }[];
}

export interface UpdateAppMemberRoleResponse {
  success: boolean;
  app?: {
    id: string;
    name: string;
    memberCount: number;
    members: {
      id: string;
      username: string;
      email: string;
    }[];
  };
  errors?: {
    message: string;
    code: string;
    field: string;
  }[];
}

export interface GenerateApiKeyResponse {
  success: boolean;
  message: string;
  apiKey?: {
    id: string;
    key: string; // Only returned on creation
    name: string;
    permissions: string[];
    createdAt: string;
    expiresAt?: string;
  };
}

export interface RevokeApiKeyResponse {
  success: boolean;
  message: string;
}

export interface UpdateApiKeyResponse {
  success: boolean;
  message: string;
  apiKey?: {
    id: string;
    name: string;
    permissions: string[];
    expiresAt?: string;
  };
}

// ===== MUTATIONS =====

// Create new application
export const CREATE_APP_MUTATION = gql`
  mutation CreateApp($input: CreateAppInput!) {
    createApp(input: $input) {
      success
      app {
        id
        name
        description
        type
        organizationId
        owner {
          id
          username
          email
        }
        members {
          id
          username
          email
        }
        memberCount
        userRole
        createdAt
      }
      errors {
        message
        code
        field
      }
    }
  }
`;

// Update application
export const UPDATE_APP_MUTATION = gql`
  mutation UpdateApp($id: ID!, $input: UpdateAppInput!) {
    updateApp(id: $id, input: $input) {
      success
      app {
        id
        name
        description
        status
        type
        settings
        updatedAt
        organization {
          id
          name
        }
        owner {
          id
          username
          email
        }
      }
      errors {
        field
        message
      }
    }
  }
`;

// Delete application
export const DELETE_APP_MUTATION = gql`
  mutation DeleteApp($id: ID!) {
    deleteApp(id: $id) {
      success
      message
    }
  }
`;

// Add member to application
export const ADD_APP_MEMBER_MUTATION = gql`
  mutation AddAppMember($input: AddAppMemberInput!) {
    addAppMember(input: $input) {
      success
      app {
        id
        name
        memberCount
        members {
          id
          username
          email
        }
      }
      errors {
        message
        code
        field
      }
    }
  }
`;

// Remove member from application
export const REMOVE_APP_MEMBER_MUTATION = gql`
  mutation RemoveAppMember($input: RemoveAppMemberInput!) {
    removeAppMember(input: $input) {
      success
      app {
        id
        name
        memberCount
        members {
          id
          username
          email
        }
      }
      errors {
        message
        code
        field
      }
    }
  }
`;

// Update application member role
export const UPDATE_APP_MEMBER_ROLE_MUTATION = gql`
  mutation UpdateAppMemberRole($input: UpdateAppMemberRoleInput!) {
    updateAppMemberRole(input: $input) {
      success
      app {
        id
        name
        memberCount
        members {
          id
          username
          email
        }
      }
      errors {
        message
        code
        field
      }
    }
  }
`;

// Generate API key for application
export const GENERATE_API_KEY_MUTATION = gql`
  mutation GenerateApiKey($input: GenerateApiKeyInput!) {
    generateApiKey(input: $input) {
      success
      message
    }
  }
`;

// Revoke API key
export const REVOKE_API_KEY_MUTATION = gql`
  mutation RevokeApiKey($input: RevokeApiKeyInput!) {
    revokeApiKey(input: $input) {
      success
      message
    }
  }
`;

// Update API key details
export const UPDATE_API_KEY_MUTATION = gql`
  mutation UpdateApiKey($input: UpdateApiKeyInput!) {
    updateApiKey(input: $input) {
      success
      message
      apiKey {
        id
        name
        permissions
        expiresAt
      }
    }
  }
`;

// Bulk operations for applications
export const BULK_UPDATE_APP_STATUS_MUTATION = gql`
  mutation BulkUpdateAppStatus($appIds: [ID!]!, $status: Status!) {
    bulkUpdateAppStatus(appIds: $appIds, status: $status) {
      success
      message
      updatedCount
    }
  }
`;

export const BULK_DELETE_APPS_MUTATION = gql`
  mutation BulkDeleteApps($appIds: [ID!]!) {
    bulkDeleteApps(appIds: $appIds) {
      success
      message
      deletedCount
    }
  }
`;

// Transfer application ownership
export const TRANSFER_APP_OWNERSHIP_MUTATION = gql`
  mutation TransferAppOwnership($appId: ID!, $newOwnerId: ID!) {
    transferAppOwnership(appId: $appId, newOwnerId: $newOwnerId) {
      success
      message
      app {
        id
        name
        owner {
          id
          username
        }
      }
    }
  }
`;

// Clone application (if supported)
export const CLONE_APP_MUTATION = gql`
  mutation CloneApp($appId: ID!, $name: String!, $organizationId: ID) {
    cloneApp(appId: $appId, name: $name, organizationId: $organizationId) {
      success
      message
      app {
        id
        name
        organization {
          id
          name
        }
      }
    }
  }
`;

// Archive/Unarchive application
export const ARCHIVE_APP_MUTATION = gql`
  mutation ArchiveApp($appId: ID!) {
    archiveApp(appId: $appId) {
      success
      app {
        id
        status
        updatedAt
      }
      errors {
        field
        message
      }
    }
  }
`;

export const UNARCHIVE_APP_MUTATION = gql`
  mutation UnarchiveApp($appId: ID!) {
    unarchiveApp(appId: $appId) {
      success
      app {
        id
        status
        updatedAt
      }
      errors {
        field
        message
      }
    }
  }
`;

// Regenerate API key (revoke old, create new)
export const REGENERATE_API_KEY_MUTATION = gql`
  mutation RegenerateApiKey($input: RevokeApiKeyInput!) {
    regenerateApiKey(input: $input) {
      success
      message
      apiKey {
        id
        key
        name
        permissions
        createdAt
      }
    }
  }
`;

// App Settings Mutations
export const UPDATE_APP_GENERAL_SETTINGS_MUTATION = gql`
  mutation UpdateAppGeneralSettings($id: ID!, $input: AppGeneralSettingsInput!) {
    updateAppGeneralSettings(id: $id, input: $input) {
      success
      app {
        id
        name
        description
        generalSettings {
          website
          description
          logoUrl
          allowedOrigins
          allowedCallbacks
          allowedLogouts
        }
        updatedAt
      }
      errors {
        field
        message
      }
    }
  }
`;

export const UPDATE_APP_AUTH_SETTINGS_MUTATION = gql`
  mutation UpdateAppAuthSettings($id: ID!, $input: AppAuthSettingsInput!) {
    updateAppAuthSettings(id: $id, input: $input) {
      success
      app {
        id
        name
        authSettings {
          enableSignUp
          requireEmailVerification
          allowSocialLogins
          socialProviders
          sessionTimeout
          enablePasswordless
          jwtAlgorithm
          jwtExpiration
        }
        updatedAt
      }
      errors {
        field
        message
      }
    }
  }
`;

export const UPDATE_APP_SECURITY_SETTINGS_MUTATION = gql`
  mutation UpdateAppSecuritySettings($id: ID!, $input: AppSecuritySettingsInput!) {
    updateAppSecuritySettings(id: $id, input: $input) {
      success
      app {
        id
        name
        securitySettings {
          enableMFA
          enableRateLimit
          rateLimitRequests
          rateLimitWindow
          enableBruteForceProtection
          maxLoginAttempts
          lockoutDuration
          enableAnomalyDetection
        }
        updatedAt
      }
      errors {
        field
        message
      }
    }
  }
`;

export const UPDATE_APP_BRANDING_SETTINGS_MUTATION = gql`
  mutation UpdateAppBrandingSettings($id: ID!, $input: AppBrandingSettingsInput!) {
    updateAppBrandingSettings(id: $id, input: $input) {
      success
      app {
        id
        name
        brandingSettings {
          primaryColor
          secondaryColor
          customCss
          customLogo
          customFavicon
        }
        updatedAt
      }
      errors {
        field
        message
      }
    }
  }
`;

// App Logs Query
export const GET_APP_LOGS_QUERY = gql`
  query GetAppLogs(
    $appId: ID!
    $limit: Int = 50
    $offset: Int = 0
    $eventType: String
    $dateFrom: DateTime
    $dateTo: DateTime
  ) {
    appLogs(
      appId: $appId
      limit: $limit
      offset: $offset
      eventType: $eventType
      dateFrom: $dateFrom
      dateTo: $dateTo
    ) {
      logs {
        id
        appId
        eventType
        eventCategory
        severity
        message
        metadata
        userId
        user {
          id
          username
          email
        }
        ipAddress
        userAgent
        location {
          country
          region
          city
          latitude
          longitude
        }
        timestamp
      }
      total
      hasNextPage
      hasPreviousPage
    }
  }
`;

// App Settings Types
export interface AppGeneralSettingsInput {
  website?: string;
  description?: string;
  logoUrl?: string;
  allowedOrigins?: string[];
  allowedCallbacks?: string[];
  allowedLogouts?: string[];
}

export interface AppAuthSettingsInput {
  enableSignUp?: boolean;
  requireEmailVerification?: boolean;
  allowSocialLogins?: boolean;
  socialProviders?: string[];
  sessionTimeout?: number;
  enablePasswordless?: boolean;
  jwtAlgorithm?: string;
  jwtExpiration?: number;
}

export interface AppSecuritySettingsInput {
  enableMFA?: boolean;
  enableRateLimit?: boolean;
  rateLimitRequests?: number;
  rateLimitWindow?: number;
  enableBruteForceProtection?: boolean;
  maxLoginAttempts?: number;
  lockoutDuration?: number;
  enableAnomalyDetection?: boolean;
}

export interface AppBrandingSettingsInput {
  primaryColor?: string;
  secondaryColor?: string;
  customCss?: string;
  customLogo?: string;
  customFavicon?: string;
}

export interface AppLog {
  id: string;
  appId: string;
  eventType: string;
  eventCategory: string;
  severity: string;
  message: string;
  metadata?: any;
  userId?: string;
  user?: {
    id: string;
    username: string;
    email: string;
  };
  ipAddress?: string;
  userAgent?: string;
  location?: {
    country?: string;
    region?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
  timestamp: string;
}

export interface AppLogsResponse {
  logs: AppLog[];
  total: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Hook for using app settings mutations
export const useUpdateAppGeneralSettings = () => {
  const [updateAppGeneralSettings, { loading, error }] = useMutation(
    UPDATE_APP_GENERAL_SETTINGS_MUTATION,
    {
      errorPolicy: 'all',
    }
  );

  return {
    updateAppGeneralSettings,
    loading,
    error,
  };
};

export const useUpdateAppAuthSettings = () => {
  const [updateAppAuthSettings, { loading, error }] = useMutation(
    UPDATE_APP_AUTH_SETTINGS_MUTATION,
    {
      errorPolicy: 'all',
    }
  );

  return {
    updateAppAuthSettings,
    loading,
    error,
  };
};

export const useUpdateAppSecuritySettings = () => {
  const [updateAppSecuritySettings, { loading, error }] = useMutation(
    UPDATE_APP_SECURITY_SETTINGS_MUTATION,
    {
      errorPolicy: 'all',
    }
  );

  return {
    updateAppSecuritySettings,
    loading,
    error,
  };
};

export const useUpdateAppBrandingSettings = () => {
  const [updateAppBrandingSettings, { loading, error }] = useMutation(
    UPDATE_APP_BRANDING_SETTINGS_MUTATION,
    {
      errorPolicy: 'all',
    }
  );

  return {
    updateAppBrandingSettings,
    loading,
    error,
  };
};

export const useGetAppLogs = (
  appId: string,
  options?: {
    limit?: number;
    offset?: number;
    eventType?: string;
    dateFrom?: string;
    dateTo?: string;
  }
) => {
  const { data, loading, error, refetch } = useQuery(GET_APP_LOGS_QUERY, {
    variables: {
      appId,
      limit: options?.limit || 50,
      offset: options?.offset || 0,
      eventType: options?.eventType,
      dateFrom: options?.dateFrom,
      dateTo: options?.dateTo,
    },
    errorPolicy: 'all',
    skip: !appId,
  });

  return {
    logs: data?.appLogs?.logs || [],
    total: data?.appLogs?.total || 0,
    hasNextPage: data?.appLogs?.hasNextPage || false,
    hasPreviousPage: data?.appLogs?.hasPreviousPage || false,
    loading,
    error,
    refetch,
  };
};

export default {
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
  UPDATE_APP_GENERAL_SETTINGS_MUTATION,
  UPDATE_APP_AUTH_SETTINGS_MUTATION,
  UPDATE_APP_SECURITY_SETTINGS_MUTATION,
  UPDATE_APP_BRANDING_SETTINGS_MUTATION,
  GET_APP_LOGS_QUERY,
}; 