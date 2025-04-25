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
      }
    }
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
        id
        username
        email
      }
      createdAt
    }
  }
`;
export const GET_USER_ORGANIZATIONS = gql`
  query GetUserOrganizations {
    userOrganizations {
      id
      name
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
      createdAt
      imageUrl
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
        }
        role
      }
    }
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
