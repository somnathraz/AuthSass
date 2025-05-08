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
  INVITE_ORG_MEMBER,
  CANCEL_ORG_INVITE,
  GET_ORG_INVITES,
  GET_MY_ORG_INVITES,
  ACCEPT_ORG_INVITE,
  GET_ORG_MEMBERS,
  REMOVE_ORG_MEMBER,
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
    members: Array<{
      user: { id: string; username: string; email: string };
      role: string;
    }>;
    createdAt: string;
    imageUrl?: string;
  }>;
}

interface AppData {
  myApps: Array<{
    id: string;
    owner: { id: string; username: string; email: string };
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
interface InviteOrgMemberData {
  inviteOrganizationMember: {
    id: string;
    email: string;
    role: string;
    token: string;
    expiresAt: string;
    createdAt: string;
  };
}
interface InviteOrgMemberVars {
  orgId: string;
  email: string;
  role: string;
}
interface CancelOrgInviteData {
  cancelOrgInvitation: string;
}
interface CancelOrgInviteVars {
  inviteId: string;
}
interface OrgInvitation {
  id: string;
  email: string;
  role: string;
  used: boolean;
  createdAt: string;
  expiresAt: string;
}
interface GetOrgInvitationsData {
  orgInvitations: OrgInvitation[];
}
interface GetOrgInvitationsVars {
  orgId: string;
}
interface GetOrgInvitationsVars {
  orgId: string;
}
interface AcceptOrgInviteData {
  acceptOrganizationInvite: {
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      username: string;
      email: string;
      organizationId: string;
    };
  };
}
interface AcceptOrgInviteVars {
  token: string;
  username?: string;
  password?: string;
}
interface MyOrgInvitationsData {
  myOrgInvitations: Array<OrgInvitation & { orgId: string }>;
}
// Create an app with name, description, orgId
export interface OrgMember {
  user: { id: string; username: string; email: string };
  role: string;
}
interface RemoveOrgMemberVars {
  orgId: string;
  userId: string;
}
interface OrgMembersResponse {
  orgMembers: {
    owner: {
      id: string;
      username: string;
      email: string;
    };
    members: Array<{
      user: { id: string; username: string; email: string };
      role: string;
    }>;
  };
}

interface MyAppsVars {
  orgId: string;
}

//
// 2) Define your acceptInvite mutation types
//
interface AcceptInviteData {
  acceptInvite: {
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      username: string;
      email: string;
      organizationId: string;
    };
    appId: string;
    organizationId: string;
  };
}
interface AcceptInviteVars {
  token: string;
  username: string;
  password: string;
}
interface MyAppsVars {
  orgId: string;
}

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
export function useGetOrgMembers(orgId: string) {
  const { data, loading, error, refetch } = useQuery<OrgMembersResponse>(
    GET_ORG_MEMBERS,
    { variables: { orgId } }
  );

  // pull out the flat list our page wants
  const members = data
    ? data.orgMembers.members.map((m) => ({
        id: m.user.id,
        username: m.user.username,
        email: m.user.email,
        role: m.role,
      }))
    : [];

  const owner = data?.orgMembers.owner;

  return { members, owner, loading, error, refetch };
}
export function useInviteOrganizationMember() {
  const [mutate, { data, loading, error }] = useMutation<
    InviteOrgMemberData,
    InviteOrgMemberVars
  >(INVITE_ORG_MEMBER);
  const inviteOrgMember = (vars: InviteOrgMemberVars) =>
    mutate({ variables: vars });
  return { inviteOrgMember, data, loading, error };
}
export function useCancelOrgInvitation() {
  const [mutate, { data, loading, error }] = useMutation<
    CancelOrgInviteData,
    CancelOrgInviteVars
  >(CANCEL_ORG_INVITE);
  const cancelOrgInvitation = (inviteId: string) =>
    mutate({ variables: { inviteId } });
  return { cancelOrgInvitation, data, loading, error };
}
export function useGetOrgInvitations(orgId: string) {
  const { data, loading, error, refetch } = useQuery<
    GetOrgInvitationsData,
    GetOrgInvitationsVars
  >(GET_ORG_INVITES, { variables: { orgId } });
  return { invitations: data?.orgInvitations ?? [], loading, error, refetch };
}
export function useGetMyOrgInvitations() {
  const { data, loading, error, refetch } =
    useQuery<MyOrgInvitationsData>(GET_MY_ORG_INVITES);
  return { invitations: data?.myOrgInvitations ?? [], loading, error, refetch };
}
export function useAcceptOrganizationInvite() {
  const [mutate, { data, loading, error }] = useMutation<
    AcceptOrgInviteData,
    AcceptOrgInviteVars
  >(ACCEPT_ORG_INVITE);
  const acceptOrganizationInvite = (vars: AcceptOrgInviteVars) =>
    mutate({ variables: vars });
  return { acceptOrganizationInvite, data, loading, error };
}
export function useRemoveOrganizationMember() {
  const [mutate, { loading, error }] = useMutation<
    { removeOrganizationMember: { id: string } },
    RemoveOrgMemberVars
  >(REMOVE_ORG_MEMBER);
  return {
    remove: (orgId: string, userId: string) =>
      mutate({ variables: { orgId, userId } }),
    loading,
    error,
  };
}
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

    // 1) The owner
    const ownerRow: MemberItem = {
      id: app.owner.id,
      email: app.owner.email,
      username: app.owner.username,
      role: "owner", // you can choose whatever role label you like
      status: "joined", // now this is correctly inferred as the literal "joined"
    };

    // 2) Everybody else
    const memberRows: MemberItem[] = app.members.map((m) => ({
      id: m.user.id,
      email: m.user.email,
      username: m.user.username,
      role: m.role,
      status: "joined",
    }));

    return [ownerRow, ...memberRows];
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
  const [acceptInviteMutation, { data, loading, error }] = useMutation<
    AcceptInviteData,
    AcceptInviteVars
  >(ACCEPT_INVITE, {
    // after the mutation completes, refetch both queries
    awaitRefetchQueries: true,
    refetchQueries: (mutationResult) => {
      if (!mutationResult.data) return [];
      const { appId, organizationId } = mutationResult.data.acceptInvite;

      return [
        // “joined” apps
        {
          query: GET_MY_APPS,
          variables: { orgId: organizationId },
        },
        // “pending” invites
        {
          query: GET_INVITATIONS,
          variables: { appId },
        },
      ];
    },
  });

  const acceptInvite = (token: string, username: string, password: string) =>
    acceptInviteMutation({
      variables: { token, username, password },
    });

  return {
    acceptInvite,
    data,
    loading,
    error,
  };
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
