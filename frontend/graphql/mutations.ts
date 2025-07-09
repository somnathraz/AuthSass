import { gql } from "@apollo/client";
import {
  AUTH_PAYLOAD_FRAGMENT,
  SIGNUP_RESPONSE_FRAGMENT,
  USER_WITH_ORG_FRAGMENT,
  ORGANIZATION_FRAGMENT,
  APP_FRAGMENT,
  APP_WITH_MEMBERS_FRAGMENT,
  INVITATION_FRAGMENT,
  ORG_INVITATION_FRAGMENT,
  API_KEY_FRAGMENT,
  ORGANIZATION_WITH_MEMBERS_FRAGMENT,
  USER_FRAGMENT,
  USER_WITH_STATS_FRAGMENT,
  INVITATION_WITH_APP_FRAGMENT,
} from "./fragments";

// Auth mutations
export const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      ...AuthPayloadFields
    }
  }
  ${AUTH_PAYLOAD_FRAGMENT}
`;

export const SIGNUP_MUTATION = gql`
  mutation Signup($input: SignupInput!) {
    signup(input: $input) {
      ...SignupResponseFields
    }
  }
  ${SIGNUP_RESPONSE_FRAGMENT}
`;

export const SOCIAL_LOGIN_MUTATION = gql`
  mutation SocialLogin($input: SocialLoginInput!) {
    socialLogin(input: $input) {
      ...AuthPayloadFields
    }
  }
  ${AUTH_PAYLOAD_FRAGMENT}
`;

export const CHANGE_PASSWORD = gql`
  mutation ChangePassword($input: ChangePasswordInput!) {
    changePassword(input: $input) {
      success
      message
      errors {
        field
        message
      }
    }
  }
`;

export const REQUEST_PASSWORD_RESET = gql`
  mutation RequestPasswordReset($input: PasswordResetRequestInput!) {
    requestPasswordReset(input: $input) {
      success
      message
      errors {
        field
        message
      }
    }
  }
`;

export const RESET_PASSWORD_MUTATION = gql`
  mutation ResetPassword($input: PasswordResetInput!) {
    resetPassword(input: $input) {
      success
      message
      errors {
        field
        message
      }
    }
  }
`;

// Organization mutations
export const CREATE_ORGANIZATION = gql`
  mutation CreateOrganization($input: CreateOrganizationInput!) {
    createOrganization(input: $input) {
      success
      organization {
      id
      name
      description
        type
        imageUrl
        website
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

export const INVITE_ORG_MEMBER = gql`
  mutation InviteOrgMember($input: CreateInvitationInput!) {
    createInvitation(input: $input) {
      success
      invitation {
        ...OrgInvitationFields
        token
      }
      errors {
        message
        code
        field
      }
    }
  }
  ${ORG_INVITATION_FRAGMENT}
`;

export const CANCEL_ORG_INVITE = gql`
  mutation CancelOrgInvite($inviteId: ID!) {
    cancelInvitation(id: $inviteId) {
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

export const REMOVE_ORG_MEMBER = gql`
  mutation RemoveOrgMember($input: RemoveMemberInput!) {
    removeOrganizationMember(input: $input) {
      success
    organization {
      id
      name
        memberCount
      }
      errors {
        message
        code
        field
      }
    }
  }
`;

export const UPDATE_MEMBER_ROLE = gql`
  mutation UpdateMemberRole($input: UpdateMemberRoleInput!) {
    updateMemberRole(input: $input) {
      success
      organization {
        id
        name
        memberCount
      }
      errors {
        message
        code
        field
      }
    }
  }
`;

// App mutations
export const CREATE_APP = gql`
  mutation CreateApp($input: CreateAppInput!) {
    createApp(input: $input) {
      success
      app {
      id
      name
        description
        type
        organizationId
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

export const UPDATE_APP = gql`
  mutation UpdateApp($appId: ID!, $name: String, $description: String) {
    updateApp(appId: $appId, name: $name, description: $description) {
      ...AppFields
    }
  }
  ${APP_FRAGMENT}
`;

export const DELETE_APP = gql`
  mutation DeleteApp($appId: ID!) {
    deleteApp(appId: $appId)
  }
`;

export const ADD_APP_MEMBER = gql`
  mutation CreateInvitation($input: CreateInvitationInput!) {
    createInvitation(input: $input) {
      success
      invitation {
        id
        email
        role
        status
        type
        expiresAt
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

export const REMOVE_APP_MEMBER = gql`
  mutation RemoveAppMember($input: RemoveAppMemberInput!) {
    removeAppMember(input: $input) {
      success
      app {
      id
      members {
          id
          username
          email
        }
        memberCount
      }
      errors {
        message
        code
        field
      }
    }
  }
`;

export const UPDATE_APP_MEMBER_ROLE = gql`
  mutation UpdateAppMemberRole($appId: ID!, $userId: ID!, $role: String!) {
    updateAppMemberRole(appId: $appId, userId: $userId, role: $role) {
      ...AppWithMembersFields
    }
  }
  ${APP_WITH_MEMBERS_FRAGMENT}
`;

// Invitation mutations
export const INVITE_USER = gql`
  mutation InviteUser($appId: ID!, $email: String!, $role: String!) {
    inviteUser(appId: $appId, email: $email, role: $role) {
      ...InvitationFields
      token
    }
  }
  ${INVITATION_FRAGMENT}
`;

export const CANCEL_INVITE = gql`
  mutation CancelInvitation($inviteId: ID!) {
    cancelInvitation(id: $inviteId) {
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

// Admin mutations
export const ADMIN_CREATE_USER = gql`
  mutation AdminCreateUser($appId: ID!, $email: String!, $role: String!) {
    adminCreateUser(appId: $appId, email: $email, role: $role) {
      id
      email
      requirePasswordReset
    }
  }
`;

export const UPDATE_USER_ROLE = gql`
  mutation UpdateUserRole($userId: ID!, $role: String!) {
    updateUserRole(userId: $userId, role: $role) {
      ...UserWithOrgFields
  }
  }
  ${USER_WITH_ORG_FRAGMENT}
`;

export const DELETE_USER = gql`
  mutation DeleteUser($userId: ID!) {
    deleteUser(userId: $userId)
  }
`;

// API Key mutations
export const CREATE_API_KEY = gql`
  mutation CreateApiKey($appId: ID!) {
    createApiKey(appId: $appId) {
      id
      key
      createdAt
      revoked
    }
  }
`;

export const REVOKE_API_KEY = gql`
  mutation RevokeApiKey($apiKeyId: ID!) {
    revokeApiKey(apiKeyId: $apiKeyId)
  }
`;

// Organization switching
export const SWITCH_ORGANIZATION = gql`
  mutation SwitchOrganization($orgId: ID!) {
    switchOrganization(orgId: $orgId) {
      ...OrganizationFields
    }
  }
  ${ORGANIZATION_FRAGMENT}
`;

// Enhanced API Key mutations
export const CREATE_API_KEY_ENHANCED = gql`
  mutation CreateApiKeyEnhanced($input: CreateApiKeyInput!) {
    createApiKey(input: $input) {
      success
      apiKey {
        ...ApiKeyFields
      }
      errors {
        field
        message
      }
    }
  }
  ${API_KEY_FRAGMENT}
`;

export const UPDATE_API_KEY = gql`
  mutation UpdateApiKey($id: ID!, $input: UpdateApiKeyInput!) {
    updateApiKey(id: $id, input: $input) {
      success
      apiKey {
        ...ApiKeyFields
      }
      errors {
        field
        message
      }
    }
  }
  ${API_KEY_FRAGMENT}
`;

// Enhanced Organization mutations
export const UPDATE_ORGANIZATION = gql`
  mutation UpdateOrganization($id: ID!, $input: UpdateOrganizationInput!) {
    updateOrganization(id: $id, input: $input) {
      success
      organization {
        ...OrganizationWithMembersFields
      }
      errors {
        field
        message
      }
    }
  }
  ${ORGANIZATION_WITH_MEMBERS_FRAGMENT}
`;

export const DELETE_ORGANIZATION = gql`
  mutation DeleteOrganization($id: ID!) {
    deleteOrganization(id: $id) {
      success
      message
      errors {
        field
        message
      }
    }
  }
`;

export const ADD_ORGANIZATION_MEMBER = gql`
  mutation AddOrganizationMember($input: AddOrganizationMemberInput!) {
    addOrganizationMember(input: $input) {
      success
      member {
        user {
          ...UserFields
        }
        role
      }
      errors {
        field
        message
      }
    }
  }
  ${USER_FRAGMENT}
`;

// Enhanced App mutations  
export const CREATE_APP_ENHANCED = gql`
  mutation CreateAppEnhanced($input: CreateAppInput!) {
    createApp(input: $input) {
      success
      app {
        ...AppWithMembersFields
      }
      errors {
        field
        message
      }
    }
  }
  ${APP_WITH_MEMBERS_FRAGMENT}
`;

export const UPDATE_APP_ENHANCED = gql`
  mutation UpdateAppEnhanced($id: ID!, $input: UpdateAppInput!) {
    updateApp(id: $id, input: $input) {
      success
      app {
        ...AppWithMembersFields
      }
      errors {
        field
        message
      }
    }
  }
  ${APP_WITH_MEMBERS_FRAGMENT}
`;

export const DELETE_APP_ENHANCED = gql`
  mutation DeleteAppEnhanced($id: ID!) {
    deleteApp(id: $id) {
      success
      message
      errors {
        field
        message
      }
    }
  }
`;

export const ADD_APP_MEMBER_ENHANCED = gql`
  mutation AddAppMemberEnhanced($input: AddAppMemberInput!) {
    addAppMember(input: $input) {
      success
      member {
        user {
          ...UserFields
        }
        role
      }
      errors {
        field
        message
      }
    }
  }
  ${USER_FRAGMENT}
`;

export const REMOVE_APP_MEMBER_ENHANCED = gql`
  mutation RemoveAppMemberEnhanced($input: RemoveAppMemberInput!) {
    removeAppMember(input: $input) {
      success
      message
      errors {
        field
        message
      }
    }
  }
`;

export const UPDATE_APP_MEMBER_ROLE_ENHANCED = gql`
  mutation UpdateAppMemberRoleEnhanced($input: UpdateAppMemberRoleInput!) {
    updateAppMemberRole(input: $input) {
      success
      member {
        user {
          ...UserFields
        }
        role
      }
      errors {
        field
        message
      }
    }
  }
  ${USER_FRAGMENT}
`;

// Enhanced User management mutations
export const UPDATE_USER = gql`
  mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
    updateUser(id: $id, input: $input) {
      success
      user {
        ...UserWithStatsFields
      }
      errors {
        field
        message
      }
    }
  }
  ${USER_WITH_STATS_FRAGMENT}
`;

export const UPDATE_USER_PREFERENCES = gql`
  mutation UpdateUserPreferences($input: UpdateUserPreferencesInput!) {
    updateUserPreferences(input: $input) {
      success
      user {
        ...UserWithStatsFields
      }
      errors {
        field
        message
      }
    }
  }
  ${USER_WITH_STATS_FRAGMENT}
`;

export const UPDATE_USER_STATUS = gql`
  mutation UpdateUserStatus($userId: ID!, $status: UserStatus!) {
    updateUserStatus(userId: $userId, status: $status) {
      success
      user {
        ...UserWithStatsFields
      }
      errors {
        field
        message
      }
    }
  }
  ${USER_WITH_STATS_FRAGMENT}
`;

export const BULK_UPDATE_USERS = gql`
  mutation BulkUpdateUsers($userIds: [ID!]!, $input: BulkUpdateUsersInput!) {
    bulkUpdateUsers(userIds: $userIds, input: $input) {
      success
      updatedCount
      errors {
        field
        message
      }
    }
  }
`;

export const BULK_DELETE_USERS = gql`
  mutation BulkDeleteUsers($userIds: [ID!]!) {
    bulkDeleteUsers(userIds: $userIds) {
      success
      deletedCount
      errors {
        field
        message
      }
    }
  }
`;

export const VERIFY_USER = gql`
  mutation VerifyUser($userId: ID!) {
    verifyUser(userId: $userId) {
      success
      user {
        ...UserWithStatsFields
      }
      errors {
        field
        message
      }
    }
  }
  ${USER_WITH_STATS_FRAGMENT}
`;

export const UNVERIFY_USER = gql`
  mutation UnverifyUser($userId: ID!) {
    unverifyUser(userId: $userId) {
      success
      user {
        ...UserWithStatsFields
      }
      errors {
        field
        message
      }
    }
  }
  ${USER_WITH_STATS_FRAGMENT}
`;

export const UPDATE_PROFILE = gql`
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      success
      user {
        ...UserWithStatsFields
      }
      errors {
        field
        message
      }
    }
  }
  ${USER_WITH_STATS_FRAGMENT}
`;

export const DEACTIVATE_ACCOUNT = gql`
  mutation DeactivateAccount {
    deactivateAccount {
      success
      message
      errors {
        field
        message
      }
    }
  }
`;

export const REACTIVATE_ACCOUNT = gql`
  mutation ReactivateAccount($password: String!) {
    reactivateAccount(password: $password) {
      success
      user {
        ...UserWithStatsFields
      }
      errors {
        field
        message
      }
    }
  }
  ${USER_WITH_STATS_FRAGMENT}
`;

// Enhanced Invitation mutations
export const CREATE_INVITATION = gql`
  mutation CreateInvitation($input: CreateInvitationInput!) {
    createInvitation(input: $input) {
      success
      invitation {
        ...InvitationWithAppFields
      }
      errors {
        field
        message
      }
    }
  }
  ${INVITATION_WITH_APP_FRAGMENT}
`;

export const ACCEPT_INVITATION = gql`
  mutation AcceptInvitation($token: String!) {
    acceptInvitation(token: $token) {
      success
      user {
        ...UserWithStatsFields
      }
      errors {
        field
        message
      }
    }
  }
  ${USER_WITH_STATS_FRAGMENT}
`;

export const DECLINE_INVITATION = gql`
  mutation DeclineInvitation($token: String!) {
    declineInvitation(token: $token) {
      success
      message
      errors {
        field
        message
      }
    }
  }
`;

export const RESEND_INVITATION = gql`
  mutation ResendInvitation($id: ID!) {
    resendInvitation(id: $id) {
      success
      invitation {
        ...InvitationWithAppFields
      }
      errors {
        field
        message
      }
    }
  }
  ${INVITATION_WITH_APP_FRAGMENT}
`;

// Token management mutations
export const REVOKE_ALL_TOKENS = gql`
  mutation RevokeAllTokens {
    revokeAllTokens {
      success
      message
      errors {
        field
        message
      }
    }
  }
`;

export const VERIFY_EMAIL = gql`
  mutation VerifyEmail($token: String!) {
    verifyEmail(token: $token) {
      success
      message
      errors {
        field
        message
      }
    }
  }
`;

export const RESEND_VERIFICATION_EMAIL = gql`
  mutation ResendVerificationEmail {
    resendVerificationEmail {
      success
      message
      errors {
        field
        message
      }
    }
  }
`;

export const ACCEPT_INVITE = gql`
  mutation AcceptInvite(
    $token: String!
    $username: String
    $password: String
  ) {
    acceptInvite(token: $token, username: $username, password: $password) {
      accessToken
      refreshToken
      user {
        ...UserWithOrgFields
      }
      appId
      organizationId
      requiresUserSetup
      userExists
      email
    }
  }
  ${USER_WITH_ORG_FRAGMENT}
`;

