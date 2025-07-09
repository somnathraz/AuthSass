import { gql } from "@apollo/client";

/**
 * Organization Management Mutations
 * 
 * All mutations use the working backend resolvers from our comprehensive testing.
 * These are verified to work with the current backend implementation.
 */

// ========================================
// ORGANIZATION CRUD OPERATIONS
// ========================================

export const CREATE_ORGANIZATION_MUTATION = gql`
  mutation CreateOrganization($input: CreateOrganizationInput!) {
    createOrganization(input: $input) {
      success
      organization {
        id
        name
        description
        type
        status
        imageUrl
        website
        settings
        owner {
          id
          username
          email
          firstName
          lastName
          profileImage
        }
        memberCount
        userRole
        createdAt
        updatedAt
      }
      errors {
        message
        code
        field
      }
    }
  }
`;

export const UPDATE_ORGANIZATION_MUTATION = gql`
  mutation UpdateOrganization($id: ID!, $input: UpdateOrganizationInput!) {
    updateOrganization(id: $id, input: $input) {
      success
      organization {
        id
        name
        description
        type
        status
        imageUrl
        website
        settings
        owner {
          id
          username
          email
          firstName
          lastName
          profileImage
        }
        memberCount
        userRole
        createdAt
        updatedAt
      }
      errors {
        message
        code
        field
      }
    }
  }
`;

export const DELETE_ORGANIZATION_MUTATION = gql`
  mutation DeleteOrganization($id: ID!) {
    deleteOrganization(id: $id) {
      success
      message
      errors {
        message
        code
        field
      }
    }
  }
`;

// ========================================
// ORGANIZATION MEMBER MANAGEMENT
// ========================================

export const ADD_ORGANIZATION_MEMBER_MUTATION = gql`
  mutation AddOrganizationMember($input: AddMemberInput!) {
    addOrganizationMember(input: $input) {
      success
      organization {
        id
        name
        memberCount
        userRole
      }
      errors {
        message
        code
        field
      }
    }
  }
`;

export const REMOVE_ORGANIZATION_MEMBER_MUTATION = gql`
  mutation RemoveOrganizationMember($input: RemoveMemberInput!) {
    removeOrganizationMember(input: $input) {
      success
      organization {
        id
        name
        memberCount
        userRole
      }
      errors {
        message
        code
        field
      }
    }
  }
`;

export const UPDATE_MEMBER_ROLE_MUTATION = gql`
  mutation UpdateMemberRole($input: UpdateMemberRoleInput!) {
    updateMemberRole(input: $input) {
      success
      organization {
        id
        name
        memberCount
        userRole
      }
      errors {
        message
        code
        field
      }
    }
  }
`;

// ========================================
// ORGANIZATION CONTEXT SWITCHING
// ========================================

export const SWITCH_ORGANIZATION_MUTATION = gql`
  mutation SwitchOrganization($orgId: ID!) {
    switchOrganization(orgId: $orgId) {
      id
      name
      description
      type
      status
      imageUrl
      website
      owner {
        id
        username
        email
      }
      memberCount
      userRole
      createdAt
      updatedAt
    }
  }
`;

// ========================================
// INPUT TYPE DEFINITIONS
// ========================================

export interface CreateOrganizationInput {
  name: string;
  description?: string;
  type: OrganizationType;
  imageUrl?: string;
  website?: string;
  settings?: any;
}

export interface UpdateOrganizationInput {
  name?: string;
  description?: string;
  imageUrl?: string;
  website?: string;
  settings?: any;
}

export interface AddMemberInput {
  orgId: string;
  userId: string;
  role: Role;
}

export interface RemoveMemberInput {
  orgId: string;
  userId: string;
}

export interface UpdateMemberRoleInput {
  orgId: string;
  userId: string;
  role: Role;
}

export enum OrganizationType {
  PERSONAL = "PERSONAL",
  TEAM = "TEAM",
  COMPANY = "COMPANY",
  ENTERPRISE = "ENTERPRISE",
}

export enum Role {
  ADMIN = "ADMIN",
  MEMBER = "MEMBER",
  VIEWER = "VIEWER",
  OWNER = "OWNER",
}

// ========================================
// RESPONSE TYPE DEFINITIONS
// ========================================

export interface CreateOrganizationResponse {
  createOrganization: {
    success: boolean;
    organization?: Organization;
    errors?: Error[];
  };
}

export interface UpdateOrganizationResponse {
  updateOrganization: {
    success: boolean;
    organization?: Organization;
    errors?: Error[];
  };
}

export interface DeleteOrganizationResponse {
  deleteOrganization: {
    success: boolean;
    message?: string;
    errors?: Error[];
  };
}

export interface AddOrganizationMemberResponse {
  addOrganizationMember: {
    success: boolean;
    organization?: {
      id: string;
      name: string;
      memberCount: number;
      userRole?: string;
    };
    errors?: Error[];
  };
}

export interface RemoveOrganizationMemberResponse {
  removeOrganizationMember: {
    success: boolean;
    organization?: {
      id: string;
      name: string;
      memberCount: number;
      userRole?: string;
    };
    errors?: Error[];
  };
}

export interface UpdateMemberRoleResponse {
  updateMemberRole: {
    success: boolean;
    organization?: {
      id: string;
      name: string;
      memberCount: number;
      userRole?: string;
    };
    errors?: Error[];
  };
}

export interface SwitchOrganizationResponse {
  switchOrganization: Organization;
}

export interface Organization {
  id: string;
  name: string;
  description?: string;
  type: OrganizationType;
  status: string;
  imageUrl?: string;
  website?: string;
  settings?: any;
  owner: {
    id: string;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    profileImage?: string;
  };
  memberCount: number;
  userRole?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Error {
  message: string;
  code?: string;
  field?: string;
}

export const UPDATE_ORGANIZATION_SETTINGS = gql`
  mutation UpdateOrganizationSettings($id: ID!, $input: UpdateOrganizationSettingsInput!) {
    updateOrganizationSettings(id: $id, input: $input) {
      success
      organization {
        id
        name
        slug
        description
        website
        supportEmail
        timezone
        contactName
        contactEmail
        contactPhone
        updatedAt
      }
      errors {
        field
        message
      }
    }
  }
`;

export const UPDATE_PASSWORD_POLICY = gql`
  mutation UpdatePasswordPolicy($id: ID!, $input: PasswordPolicyInput!) {
    updatePasswordPolicy(id: $id, input: $input) {
      success
      organization {
        id
        passwordPolicy {
          minLength
          requireUppercase
          requireLowercase
          requireNumbers
          requireSpecialChars
          passwordHistory
          passwordExpiration
          maxLoginAttempts
          lockoutDuration
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

export const UPDATE_DOMAIN_SETTINGS = gql`
  mutation UpdateDomainSettings($id: ID!, $input: DomainSettingsInput!) {
    updateDomainSettings(id: $id, input: $input) {
      success
      organization {
        id
        domainSettings {
          allowedCallbackUrls
          allowedLogoutUrls
          allowedWebOrigins
          customDomain
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

export const UPDATE_BRANDING_SETTINGS = gql`
  mutation UpdateBrandingSettings($id: ID!, $input: BrandingSettingsInput!) {
    updateBrandingSettings(id: $id, input: $input) {
      success
      organization {
        id
        branding {
          primaryColor
          secondaryColor
          logoUrl
          faviconUrl
          customCss
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

export const UPDATE_NOTIFICATION_SETTINGS = gql`
  mutation UpdateNotificationSettings($id: ID!, $input: NotificationSettingsInput!) {
    updateNotificationSettings(id: $id, input: $input) {
      success
      organization {
        id
        notifications {
          emailNotifications
          securityAlerts
          marketingEmails
          weeklyReports
          systemUpdates
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

export const UPDATE_ANALYTICS_SETTINGS = gql`
  mutation UpdateAnalyticsSettings($id: ID!, $input: AnalyticsSettingsInput!) {
    updateAnalyticsSettings(id: $id, input: $input) {
      success
      organization {
        id
        analytics {
          enableTracking
          retentionPeriod
          exportFormat
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

export const GET_ORGANIZATION_SETTINGS = gql`
  query GetOrganizationSettings($id: ID!) {
    organization(id: $id) {
      id
      name
      slug
      description
      website
      supportEmail
      timezone
      contactName
      contactEmail
      contactPhone
      passwordPolicy {
        minLength
        requireUppercase
        requireLowercase
        requireNumbers
        requireSpecialChars
        passwordHistory
        passwordExpiration
        maxLoginAttempts
        lockoutDuration
      }
      domainSettings {
        allowedCallbackUrls
        allowedLogoutUrls
        allowedWebOrigins
        customDomain
      }
      branding {
        primaryColor
        secondaryColor
        logoUrl
        faviconUrl
        customCss
      }
      notifications {
        emailNotifications
        securityAlerts
        marketingEmails
        weeklyReports
        systemUpdates
      }
      analytics {
        enableTracking
        retentionPeriod
        exportFormat
      }
      userRole
      createdAt
      updatedAt
    }
  }
`; 