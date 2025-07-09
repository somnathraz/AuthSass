import { gql } from "@apollo/client";
import {
  USER_FRAGMENT,
  USER_WITH_ORG_FRAGMENT,
  USER_ORGANIZATION_FRAGMENT,
  ORGANIZATION_WITH_MEMBERS_FRAGMENT,
  ORGANIZATION_WITH_OWNER_FRAGMENT,
  APP_WITH_MEMBERS_FRAGMENT,
  APP_WITH_OWNER_FRAGMENT,
  APP_FRAGMENT,
  INVITATION_WITH_APP_FRAGMENT,
  INVITATION_FRAGMENT,
  ORG_INVITATION_FRAGMENT,
  AUDIT_LOG_FRAGMENT,
  API_KEYS_RESPONSE_FRAGMENT,
  ORGANIZATIONS_RESPONSE_FRAGMENT,
  APPS_RESPONSE_FRAGMENT,
  APP_MEMBERS_RESPONSE_FRAGMENT,
  USER_STATS_FRAGMENT,
  USER_WITH_STATS_FRAGMENT,
  APP_WITH_SETTINGS_FRAGMENT,
} from "./fragments";

// User queries
export const GET_ME = gql`
  query GetMe {
    me {
      ...UserWithOrgFields
    }
  }
  ${USER_WITH_ORG_FRAGMENT}
`;

export const CHECK_ORG_INVITE = gql`
  query CheckOrgInvite($token: String!) {
    checkOrganizationInvite(token: $token) {
      email
      userExists
    }
  }
`;

// Organization queries
export const GET_USER_ORGANIZATIONS = gql`
  query GetUserOrganizations {
    userOrganizations {
      ...UserOrganizationFields
    }
  }
  ${USER_ORGANIZATION_FRAGMENT}
`;

export const GET_ORGANIZATION = gql`
  query GetOrganization {
    organization {
      ...OrganizationWithMembersFields
    }
  }
  ${ORGANIZATION_WITH_MEMBERS_FRAGMENT}
`;

export const GET_ORG_MEMBERS = gql`
  query GetOrgMembers($orgId: ID!) {
    organizationMembers(orgId: $orgId) {
      owner {
        id
        username
        email
      }
      members {
        user {
          id
          username
          email
        }
        role
      }
      total
    }
  }
`;

export const GET_ORG_INVITES = gql`
  query GetOrgInvites($orgId: ID!) {
    orgInvitations(orgId: $orgId) {
      ...OrgInvitationFields
    }
  }
  ${ORG_INVITATION_FRAGMENT}
`;

export const GET_MY_ORG_INVITES = gql`
  query GetMyOrgInvitations {
    myOrgInvitations {
      ...OrgInvitationFields
      orgId
    }
  }
  ${ORG_INVITATION_FRAGMENT}
`;

// App queries
export const GET_MY_APPS = gql`
  query GetMyApps {
    myApps {
      ...AppWithMembersFields
    }
  }
  ${APP_WITH_MEMBERS_FRAGMENT}
`;

export const FETCH_USER_APP_LIST = gql`
  query FetchUserAppList {
    myApps {
      ...AppFragment
    }
  }
  ${APP_FRAGMENT}
`;

// Invitation queries
export const GET_MY_INVITATIONS = gql`
  query GetMyInvitations {
    myInvitations {
      ...InvitationWithAppFields
    }
  }
  ${INVITATION_WITH_APP_FRAGMENT}
`;

export const GET_INVITATIONS = gql`
  query GetInvitations(
    $filter: InvitationFilter
    $limit: Int = 10
    $offset: Int = 0
  ) {
    invitations(filter: $filter, limit: $limit, offset: $offset) {
      invitations {
        id
        email
        role
        status
        type
        expiresAt
        createdAt
        invitedBy {
          id
          username
          email
        }
        app {
          id
          name
        }
        organization {
          id
          name
        }
      }
      total
      hasNextPage
      hasPreviousPage
    }
  }
`;

// Audit log queries
export const FETCH_APP_LOGS = gql`
  query FetchAppLogs($appId: ID!, $limit: Int = 20, $offset: Int = 0) {
    appAuditLogs(appId: $appId, limit: $limit, offset: $offset) {
      logs {
        ...AuditLogFields
      }
      total
      hasNextPage
      hasPreviousPage
    }
  }
  ${AUDIT_LOG_FRAGMENT}
`;

// Subscription queries (for real-time updates)
export const SUBSCRIBE_TO_APP_UPDATES = gql`
  subscription SubscribeToAppUpdates($appId: ID!) {
    appUpdated(appId: $appId) {
      ...AppWithMembersFields
    }
  }
  ${APP_WITH_MEMBERS_FRAGMENT}
`;

export const SUBSCRIBE_TO_ORG_UPDATES = gql`
  subscription SubscribeToOrgUpdates($orgId: ID!) {
    organizationUpdated(orgId: $orgId) {
      ...OrganizationWithMembersFields
    }
  }
  ${ORGANIZATION_WITH_MEMBERS_FRAGMENT}
`;

// API Key queries
export const GET_APP_API_KEYS = gql`
  query GetAppApiKeys($appId: ID!) {
    appApiKeys(appId: $appId) {
      ...ApiKeysResponseFields
    }
  }
  ${API_KEYS_RESPONSE_FRAGMENT}
`;

// Advanced Organization queries
export const GET_ALL_ORGANIZATIONS = gql`
  query GetAllOrganizations(
    $limit: Int
    $offset: Int
    $sortBy: String
    $sortOrder: String
    $filter: OrganizationFilter
  ) {
    organizations(
      limit: $limit
      offset: $offset
      sortBy: $sortBy
      sortOrder: $sortOrder
      filter: $filter
    ) {
      ...OrganizationsResponseFields
    }
  }
  ${ORGANIZATIONS_RESPONSE_FRAGMENT}
`;

export const GET_ORGANIZATION_MEMBERS = gql`
  query GetOrganizationMembers($orgId: ID!) {
    organizationMembers(orgId: $orgId) {
      owner {
        ...UserFields
      }
      members {
        user {
          ...UserFields
        }
        role
      }
      total
    }
  }
  ${USER_FRAGMENT}
`;

// Advanced App queries
export const GET_ALL_APPS = gql`
  query GetAllApps(
    $limit: Int
    $offset: Int
    $sortBy: String
    $sortOrder: String
    $filter: AppFilter
  ) {
    apps(
      limit: $limit
      offset: $offset
      sortBy: $sortBy
      sortOrder: $sortOrder
      filter: $filter
    ) {
      ...AppsResponseFields
    }
  }
  ${APPS_RESPONSE_FRAGMENT}
`;

export const GET_APP = gql`
  query GetApp($id: ID!) {
    app(id: $id) {
      ...AppWithMembersFields
    }
  }
  ${APP_WITH_MEMBERS_FRAGMENT}
`;

export const GET_APP_WITH_SETTINGS = gql`
  query GetAppWithSettings($id: ID!) {
    app(id: $id) {
      ...AppWithSettingsFields
    }
  }
  ${APP_WITH_SETTINGS_FRAGMENT}
`;

export const GET_APP_MEMBERS = gql`
  query GetAppMembers($appId: ID!) {
    appMembers(appId: $appId) {
      ...AppMembersResponseFields
    }
  }
  ${APP_MEMBERS_RESPONSE_FRAGMENT}
`;

// User management queries
export const GET_USER_STATS = gql`
  query GetUserStats {
    userStats {
      ...UserStatsFields
    }
  }
  ${USER_STATS_FRAGMENT}
`;

export const GET_ALL_USERS = gql`
  query GetAllUsers(
    $limit: Int
    $offset: Int
    $sortBy: String
    $sortOrder: String
    $filter: UserFilter
  ) {
    users(
      limit: $limit
      offset: $offset
      sortBy: $sortBy
      sortOrder: $sortOrder
      filter: $filter
    ) {
      users {
        ...UserWithStatsFields
      }
      total
      hasNextPage
      hasPreviousPage
    }
  }
  ${USER_WITH_STATS_FRAGMENT}
`;

export const GET_USER = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      ...UserWithStatsFields
    }
  }
  ${USER_WITH_STATS_FRAGMENT}
`;

// Advanced Invitation queries
export const GET_SENT_INVITATIONS = gql`
  query GetSentInvitations($appId: ID, $limit: Int, $offset: Int) {
    sentInvitations(appId: $appId, limit: $limit, offset: $offset) {
      ...InvitationFields
    }
  }
  ${INVITATION_FRAGMENT}
`;

export const GET_PENDING_INVITATIONS = gql`
  query GetPendingInvitations($appId: ID, $limit: Int, $offset: Int) {
    pendingInvitations(appId: $appId, limit: $limit, offset: $offset) {
      ...InvitationFields
    }
  }
  ${INVITATION_FRAGMENT}
`;

// Enhanced Audit queries
export const GET_AUDIT_LOGS = gql`
  query GetAuditLogs(
    $limit: Int
    $offset: Int
    $sortBy: String
    $sortOrder: String
    $filter: AuditLogFilter
  ) {
    auditLogs(
      limit: $limit
      offset: $offset
      sortBy: $sortBy
      sortOrder: $sortOrder
      filter: $filter
    ) {
      logs {
        ...AuditLogFields
      }
      total
      hasNextPage
      hasPreviousPage
    }
  }
  ${AUDIT_LOG_FRAGMENT}
`;

export const GET_APP_AUDIT_LOGS = gql`
  query GetAppAuditLogs($appId: ID!, $limit: Int = 20, $offset: Int = 0) {
    appAuditLogs(appId: $appId, limit: $limit, offset: $offset) {
      logs {
        ...AuditLogFields
      }
      total
      hasNextPage
      hasPreviousPage
    }
  }
  ${AUDIT_LOG_FRAGMENT}
`;

// Password strength check
export const CHECK_PASSWORD_STRENGTH = gql`
  query CheckPasswordStrength($password: String!) {
    checkPasswordStrength(password: $password) {
      score
      feedback
      isValid
      requirements {
        rule
        satisfied
        message
      }
    }
  }
`;

// Token validation
export const VALIDATE_TOKEN = gql`
  query ValidateToken($token: String!) {
    validateToken(token: $token)
  }
`;
