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
  ADD_APP_MEMBER,
  INVITE_USER,
  ADMIN_CREATE_USER,
  ACCEPT_INVITE,
  CHANGE_PASSWORD,
  REMOVE_APP_MEMBER,
  GET_INVITATIONS,
  GET_MY_INVITATIONS,
  CANCEL_INVITE,
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

interface AppData {
  myApps: Array<{
    id: string;
    members: AppMember[];
  }>;
}
interface AppVars {
  orgId?: string;
}

// 2) Unified member shape
export type MemberItem = {
  id: string;
  email: string;
  username: string;
  role: string;
  status: "joined" | "pending";
};
type AppMember = {
  user: { id: string; username: string; email: string };
  role: string;
};
type MyAppsQuery = {
  myApps: Array<{
    id: string;
    name: string;
    createdAt: string;
    description?: string;
    members: AppMember[];
    owner: { id: string };
  }>;
};
type MyAppsVars = { orgId: string };

interface MyInvitationsQuery {
  myInvitations: Array<{
    id: string;
    role: string;
    createdAt: string;
    app: {
      id: string;
      name: string;
      description?: string;
    };
  }>;
}
export type FetchAppItem = {
  id: string;
  name: string;
  description?: string;
  role: string;
  status: "joined" | "pending";
  createdAt: string;
};

interface AppInvite {
  id: string;
  email: string;
  role: string;
}

interface AppInvitesData {
  invitations: AppInvite[];
}
// Create an app with name, description, orgId

export const useLogin = () => {
  const [loginMutation, { data, error, loading }] = useMutation(LOGIN_MUTATION);
  const login = async (email: string, password: string) => {
    return await loginMutation({ variables: { email, password } });
  };
  return { login, data, error, loading };
};
export const useChangePassword = () => {
  const [changePasswordMutation, { loading, error }] =
    useMutation(CHANGE_PASSWORD);
  const changePassword = (newPassword: string) =>
    changePasswordMutation({ variables: { newPassword } });
  return { changePassword, loading, error };
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
  const {
    data: appsData,
    loading: appsLoading,
    error: appsError,
    refetch: refetchApps,
  } = useQuery<MyAppsQuery, MyAppsVars>(GET_MY_APPS, {
    variables: { orgId },
  });

  const {
    data: invData,
    loading: invLoading,
    error: invError,
    refetch: refetchInvites,
  } = useQuery<MyInvitationsQuery>(GET_MY_INVITATIONS);

  const joined = React.useMemo<FetchAppItem[]>(() => {
    return (
      appsData?.myApps.map((a) => ({
        id: a.id,
        name: a.name,
        description: a.description,
        role: a.members.find((m) => m.user.id !== a.owner.id)?.role ?? "owner",
        status: "joined",
        createdAt: a.createdAt,
      })) ?? []
    );
  }, [appsData]);

  const pending = React.useMemo<FetchAppItem[]>(() => {
    return (
      invData?.myInvitations.map((i) => ({
        id: i.app.id,
        name: i.app.name,
        description: i.app.description,
        role: i.role,
        status: "pending",
        createdAt: i.createdAt,
      })) ?? []
    );
  }, [invData]);

  const apps = React.useMemo(() => [...joined, ...pending], [joined, pending]);
  const loading = appsLoading || invLoading;
  const error = appsError || invError;
  const refetch = () => {
    refetchApps();
    refetchInvites();
  };

  return { apps, loading, error, refetch };
}

// export function useFetchApp(orgId: string) {
//   const { data, loading, error, refetch } = useQuery<MyAppsQuery>(GET_MY_APPS, {
//     variables: { orgId },
//   });

//   return {
//     apps: data?.myApps ?? [],
//     loading,
//     error,
//     refetch, // ← include refetch here
//   };
// }
export function useAppMembers(appId: string, orgId?: string) {
  // Fetch apps + their members
  const {
    data: appsData,
    loading: appsLoading,
    error: appsError,
    refetch: refetchApps,
  } = useQuery<AppData, AppVars>(GET_MY_APPS, { variables: { orgId } });

  // Fetch pending invitations
  // Build the "pending" list
  const {
    data: invitesData,
    loading: invitesLoading,
    error: invitesError,
    refetch: refetchInvites,
  } = useQuery<AppInvitesData, { appId: string }>(GET_INVITATIONS, {
    variables: { appId },
  });

  // Build the "joined" list
  const joined = React.useMemo<MemberItem[]>(() => {
    const app = appsData?.myApps.find((a) => a.id === appId);
    if (!app) return [];
    return app.members.map((m) => ({
      id: m.user.id,
      email: m.user.email,
      username: m.user.username,
      role: m.role,
      status: "joined",
    }));
  }, [appsData, appId]);

  // 3) Build the pending list from AppInvite[], which has `email`:
  const pending = React.useMemo<MemberItem[]>(() => {
    return (
      invitesData?.invitations.map((i) => ({
        id: i.id,
        email: i.email,
        username: "", // not known yet
        role: i.role,
        status: "pending",
      })) ?? []
    );
  }, [invitesData]);

  const loading = appsLoading || invitesLoading;
  const error = appsError || invitesError;
  const refetch = () => {
    refetchApps();
    refetchInvites();
  };

  // Merge them
  const members = React.useMemo<MemberItem[]>(
    () => [...joined, ...pending],
    [joined, pending]
  );

  return { members, loading, error, refetch };
}

export const useAddAppMember = () => {
  const [addAppMemberMutation, { data, error, loading }] =
    useMutation(ADD_APP_MEMBER);
  const addAppMember = async (appId: string, email: string, role: string) => {
    return await addAppMemberMutation({
      variables: { appId, email, role },
    });
  };
  return { addAppMember, data, error, loading };
};
export const useRemoveAppMember = () => {
  const [removeMutation, { loading, error }] = useMutation(REMOVE_APP_MEMBER);
  const removeAppMember = (appId: string, userId: string) =>
    removeMutation({ variables: { appId, userId } });
  return { removeAppMember, loading, error };
};
export const useInviteUser = () => {
  const [inviteUserMutation, { data, error, loading }] =
    useMutation(INVITE_USER);
  const inviteUser = async (appId: string, email: string, role: string) => {
    return await inviteUserMutation({
      variables: { appId, email, role },
    });
  };
  return { inviteUser, data, error, loading };
};
export const useCancelInvite = () => {
  const [cancelMutation, { loading, error }] = useMutation(CANCEL_INVITE);
  const cancelInvite = async (inviteId: string) => {
    await cancelMutation({ variables: { inviteId } });
  };
  return { cancelInvite, loading, error };
};
export const useAcceptInvite = () => {
  const [acceptInviteMutation, { data, error, loading }] =
    useMutation(ACCEPT_INVITE);
  const acceptInvite = (token: string, username: string, password: string) =>
    acceptInviteMutation({
      variables: { token, username, password },
    });
  return { acceptInvite, data, error, loading };
};
export const useAdminCreateUser = () => {
  const [adminCreateUserMutation, { data, error, loading }] =
    useMutation(ADMIN_CREATE_USER);
  const adminCreateUser = (appId: string, email: string, role: string) =>
    adminCreateUserMutation({ variables: { appId, email, role } });
  return { adminCreateUser, data, error, loading };
};
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
