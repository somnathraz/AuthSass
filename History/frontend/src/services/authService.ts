import React from "react";
import { useMutation, useLazyQuery } from "@apollo/client";
import { 
  CREATE_APP, 
  FETCH_APP_LOGS, 
  LOGIN_MUTATION, 
  SIGNUP_MUTATION, 
  SOCIAL_LOGIN_MUTATION 
} from "../graphql/mutations";

export const useLogin = () => {
  const [loginMutation, { data, error, loading }] = useMutation(LOGIN_MUTATION);
  const login = async (email: string, password: string) => {
    return await loginMutation({ variables: { email, password } });
  };
  return { login, data, error, loading };
};

export const useSignup = () => {
  const [signupMutation, { data, error, loading }] = useMutation(SIGNUP_MUTATION);
  const signup = async (username: string, email: string, password: string) => {
    return await signupMutation({ variables: { username, email, password } });
  };
  return { signup, data, error, loading };
};

export const useSocialLogin = () => {
  const [socialLoginMutation, { data, error, loading }] = useMutation(SOCIAL_LOGIN_MUTATION);
  const socialLogin = async (provider: string, token: string) => {
    return await socialLoginMutation({ variables: { provider, token } });
  };
  return { socialLogin, data, error, loading };
};

export const useCreateApp = () => {
  const [createAppMutation, { data, error, loading }] = useMutation(CREATE_APP);
  const createApp = async (name: string, description: string) => {
    return await createAppMutation({ variables: { name, description } });
  };
  return { createApp, data, error, loading };
};

export const useFetchLogs = () => {
  const [fetchLogs, { data, error, loading }] = useLazyQuery(FETCH_APP_LOGS);

  // Memoize the function so that its identity doesn't change on every render.
  const runFetchLogs = React.useCallback(
    (appId: string) => {
      return fetchLogs({ variables: { appId } });
    },
    [fetchLogs]
  );

  return { runFetchLogs, data, error, loading };
};
