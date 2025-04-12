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

export const CREATE_APP = gql`
  mutation CreateApp($name: String!, $description: String) {
    createApp(name: $name, description: $description) {
      id
      name
      description
      owner {
        id
        username
      }
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
