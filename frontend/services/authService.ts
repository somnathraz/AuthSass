import React from "react";
import { useMutation, useLazyQuery, useQuery } from "@apollo/client";
import {
  CREATE_APP,
  FETCH_APP_LOGS,
  LOGIN_MUTATION,
  SIGNUP_MUTATION,
  SOCIAL_LOGIN_MUTATION,
  GET_USER_ORGANIZATIONS,
  GET_ME,
  CREATE_ORGANIZATION,
  GET_MY_APPS,
  REQUEST_PASSWORD_RESET,
  RESET_PASSWORD_MUTATION,
} from "../graphql/mutations";
interface MeQuery {
  me: {
    id: string;
    username: string;
    email: string;
    image?: string;
    organizationId: string | null;
  };
}
interface MyAppsQuery {
  myApps: Array<{
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    owner: {
      id: string;
      username: string;
      email: string;
    };
    // any other fields you need…
  }>;
}
interface UserOrgsQuery {
  userOrganizations: Array<{
    id: string;
    name: string;
    owner: { id: string; username: string; email: string };
    members: Array<{ id: string; username: string; email: string }>;
    createdAt: string;
    imageUrl?: string;
  }>;
}
// Create an app with name, description, orgId

export const useLogin = () => {
  const [loginMutation, { data, error, loading }] = useMutation(LOGIN_MUTATION);
  const login = async (email: string, password: string) => {
    return await loginMutation({ variables: { email, password } });
  };
  return { login, data, error, loading };
};

export const useSignup = () => {
  const [signupMutation, { data, error, loading }] =
    useMutation(SIGNUP_MUTATION);
  const signup = async (username: string, email: string, password: string) => {
    return await signupMutation({ variables: { username, email, password } });
  };
  return { signup, data, error, loading };
};

export const useSocialLogin = () => {
  const [socialLoginMutation, { data, error, loading }] = useMutation(
    SOCIAL_LOGIN_MUTATION
  );
  const socialLogin = async (provider: string, token: string) => {
    return await socialLoginMutation({ variables: { provider, token } });
  };
  return { socialLogin, data, error, loading };
};

export function useCreateApp(orgId: string) {
  const [createAppMutation, { data, loading, error }] = useMutation(
    CREATE_APP,
    {
      // instead of a string, reference the document + its variables
      refetchQueries: [
        {
          query: GET_MY_APPS,
          variables: { orgId },
        },
      ],
      awaitRefetchQueries: true,
    }
  );

  const createApp = async (name: string, description: string) => {
    await createAppMutation({
      variables: { name, description, orgId },
    });
  };

  return { createApp, data, loading, error };
}

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
export function useUserAndOrg() {
  const {
    data: meData,
    loading: loadingMe,
    error: errorMe,
  } = useQuery<MeQuery>(GET_ME);

  const {
    data: orgsData,
    loading: loadingOrgs,
    error: errorOrgs,
  } = useQuery<UserOrgsQuery>(GET_USER_ORGANIZATIONS);

  return {
    user: meData?.me,
    organizations: orgsData?.userOrganizations ?? [],
    loading: loadingMe || loadingOrgs,
    error: errorMe || errorOrgs,
  };
}
export const useCreateOrg = () => {
  const [createOrgMutation, { data, error, loading }] =
    useMutation(CREATE_ORGANIZATION);

  const createOrg = async (name: string) => {
    return await createOrgMutation({
      variables: { name },
    });
  };

  return {
    createOrg, // call this in your component
    data, // result data.createOrganization
    error,
    loading,
  };
};

export function useFetchApp(orgId: string) {
  const { data, loading, error, refetch } = useQuery<MyAppsQuery>(GET_MY_APPS, {
    variables: { orgId },
  });

  return {
    apps: data?.myApps ?? [],
    loading,
    error,
    refetch, // ← include refetch here
  };
}
export const useRequestPasswordReset = () => {
  const [mutate, { data, loading, error }] = useMutation(
    REQUEST_PASSWORD_RESET
  );
  const requestPasswordReset = async (email: string) =>
    mutate({ variables: { email } });
  return { requestPasswordReset, data, loading, error };
};

export const useResetPassword = () => {
  const [mutate, { data, loading, error }] = useMutation(
    RESET_PASSWORD_MUTATION
  );
  const resetPassword = async (token: string, newPassword: string) =>
    mutate({ variables: { token, newPassword } });
  return { resetPassword, data, loading, error };
};
