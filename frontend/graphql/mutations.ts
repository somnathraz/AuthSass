import { gql } from "@apollo/client";

export const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      accessToken
      refreshToken
      user {
        id
        username
        email
        role
        organizationId
      }
      requirePasswordReset
    }
  }
`;
export const CHANGE_PASSWORD = gql`
  mutation ChangePassword($newPassword: String!) {
    changePassword(newPassword: $newPassword)
  }
`;

export const SIGNUP_MUTATION = gql`
  mutation Signup($username: String!, $email: String!, $password: String!) {
    signup(username: $username, email: $email, password: $password) {
      accessToken
      refreshToken
      user {
        id
        username
        email
        organizationId
      }
    }
  }
`;

export const SOCIAL_LOGIN_MUTATION = gql`
  mutation SocialLogin($provider: String!, $token: String!) {
    socialLogin(provider: $provider, token: $token) {
      accessToken
      refreshToken
      user {
        id
        username
        email
        role
        organizationId
      }
    }
  }
`;
export const FETCH_USER_APP_LIST = gql`
  query MyApps {
    myApps {
      id
      name
      description
      createdAt
    }
  }
`;
export const FETCH_APP_LOGS = gql`
  query AuditLogs($appId: ID!) {
    auditLogs(appId: $appId) {
      id
      action
      userId
      metadata
      timestamp
    }
  }
`;
export const GET_ME = gql`
  query Me {
    me {
      id
      username
      email
      organizationId
      role
    }
  }
`;
export const GET_ORGANIZATION = gql`
  query GetOrganization {
    organization {
      id
      name
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
      createdAt
      imageUrl
    }
  }
`;
export const GET_USER_ORGANIZATIONS = gql`
  query GetUserOrganizations {
    userOrganizations {
      id
      name
      type
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
      createdAt
      imageUrl
    }
  }
`;
export const GET_ORG_MEMBERS = gql`
  query GetOrgMembers($orgId: ID!) {
    orgMembers(orgId: $orgId) {
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
    }
  }
`;
export const CREATE_ORGANIZATION = gql`
  mutation CreateOrganization($name: String!) {
    createOrganization(name: $name) {
      id
      name
      createdAt
    }
  }
`;
export const INVITE_ORG_MEMBER = gql`
  mutation ($orgId: ID!, $email: String!, $role: String!) {
    inviteOrganizationMember(orgId: $orgId, email: $email, role: $role) {
      id
      email
      role
      expiresAt
    }
  }
`;
export const CANCEL_ORG_INVITE = gql`
  mutation ($inviteId: ID!) {
    cancelOrgInvitation(inviteId: $inviteId)
  }
`;
export const ACCEPT_ORG_INVITE = gql`
  mutation AcceptOrganizationInvite(
    $token: String!
    $username: String # optional now
    $password: String # optional now
  ) {
    acceptOrganizationInvite(
      token: $token
      username: $username
      password: $password
    ) {
      accessToken
      refreshToken
      user {
        id
        username
        email
        organizationId
      }
    }
  }
`;
export const GET_ORG_INVITES = gql`
  query ($orgId: ID!) {
    orgInvitations(orgId: $orgId) {
      id
      email
      role
      createdAt
      expiresAt
    }
  }
`;
export const GET_MY_ORG_INVITES = gql`
  query GetMyOrgInvitations {
    myOrgInvitations {
      id
      email
      orgId
      role
      used
      createdAt
      expiresAt
    }
  }
`;
export const GET_MY_INVITES = gql`
  query {
    myOrgInvitations {
      id
      email
      orgId
      role
      expiresAt
      used
    }
  }
`;
// 4) Remove a member by userId (owner/admin only)
export const REMOVE_ORG_MEMBER = gql`
  mutation RemoveOrgMember($orgId: ID!, $userId: ID!) {
    removeOrganizationMember(orgId: $orgId, userId: $userId) {
      id
    }
  }
`;
export const GET_MY_APPS = gql`
  query GetMyApps($orgId: ID) {
    myApps(orgId: $orgId) {
      id
      name
      description
      organizationId
      createdAt
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
    }
  }
`;
export const GET_MY_INVITATIONS = gql`
  query MyInvites {
    myInvitations {
      id
      role
      used # ← add this
      createdAt
      app {
        id
        name
        description
      }
    }
  }
`;
export const CANCEL_INVITE = gql`
  mutation CancelInvitation($inviteId: ID!) {
    cancelInvitation(inviteId: $inviteId)
  }
`;
export const CREATE_APP = gql`
  mutation CreateApp($name: String!, $description: String, $orgId: ID!) {
    createApp(name: $name, description: $description, orgId: $orgId) {
      id
      name
    }
  }
`;
export const ADD_APP_MEMBER = gql`
  mutation AddAppMember($appId: ID!, $email: String!, $role: String!) {
    addAppMember(appId: $appId, email: $email, role: $role) {
      id
      members {
        user {
          id
          username
          email
        }
        role
      }
    }
  }
`;
export const REMOVE_APP_MEMBER = gql`
  mutation RemoveAppMember($appId: ID!, $userId: ID!) {
    removeAppMember(appId: $appId, userId: $userId) {
      id
      members {
        user {
          id
        }
      }
    }
  }
`;
export const ACCEPT_INVITE = gql`
  mutation AcceptInvite(
    $token: String!
    $username: String # optional now
    $password: String # optional now
  ) {
    acceptInvite(token: $token, username: $username, password: $password) {
      accessToken
      refreshToken
      user {
        id
        username
        email
        organizationId
      }
      appId
      organizationId
    }
  }
`;

export const INVITE_USER = gql`
  mutation InviteUser($appId: ID!, $email: String!, $role: String!) {
    inviteUser(appId: $appId, email: $email, role: $role) {
      id
      token
    }
  }
`;
export const GET_INVITATIONS = gql`
  query Invitations($appId: ID!) {
    invitations(appId: $appId) {
      id
      email
      role
      used
      expiresAt
    }
  }
`;
export const ADMIN_CREATE_USER = gql`
  mutation AdminCreateUser($appId: ID!, $email: String!, $role: String!) {
    adminCreateUser(appId: $appId, email: $email, role: $role) {
      id
      email
      requirePasswordReset
    }
  }
`;

export const REQUEST_PASSWORD_RESET = gql`
  mutation RequestPasswordReset($email: String!) {
    requestPasswordReset(email: $email)
  }
`;

export const RESET_PASSWORD_MUTATION = gql`
  mutation ResetPassword($token: String!, $newPassword: String!) {
    resetPassword(token: $token, newPassword: $newPassword)
  }
`;
