// graphql/mutations.ts
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
      message
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
