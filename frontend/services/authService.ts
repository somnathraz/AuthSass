import React from "react";
import { useMutation, useLazyQuery, useQuery } from "@apollo/client";

// Import mutations
import {
  LOGIN_MUTATION,
  SIGNUP_MUTATION,
  SOCIAL_LOGIN_MUTATION,
  CREATE_ORGANIZATION,
  REQUEST_PASSWORD_RESET,
  RESET_PASSWORD_MUTATION,
  ADD_APP_MEMBER,
  INVITE_USER,
  ADMIN_CREATE_USER,
  ACCEPT_INVITE,
  CHANGE_PASSWORD,
  REMOVE_APP_MEMBER,
  CANCEL_INVITE,
  INVITE_ORG_MEMBER,
  CANCEL_ORG_INVITE,
  REMOVE_ORG_MEMBER,
  UPDATE_MEMBER_ROLE,
  CREATE_APP,
  CREATE_API_KEY_ENHANCED,
  UPDATE_API_KEY,
  UPDATE_ORGANIZATION,
  DELETE_ORGANIZATION,
  ADD_ORGANIZATION_MEMBER,
  CREATE_APP_ENHANCED,
  UPDATE_APP_ENHANCED,
  DELETE_APP_ENHANCED,
  ADD_APP_MEMBER_ENHANCED,
  REMOVE_APP_MEMBER_ENHANCED,
  UPDATE_APP_MEMBER_ROLE_ENHANCED,
  UPDATE_USER,
  UPDATE_USER_PREFERENCES,
  UPDATE_USER_STATUS,
  BULK_UPDATE_USERS,
  BULK_DELETE_USERS,
  VERIFY_USER,
  UNVERIFY_USER,
  UPDATE_PROFILE,
  DEACTIVATE_ACCOUNT,
  REACTIVATE_ACCOUNT,
  CREATE_INVITATION,
  ACCEPT_INVITATION,
  DECLINE_INVITATION,
  RESEND_INVITATION,
  REVOKE_ALL_TOKENS,
  VERIFY_EMAIL,
  RESEND_VERIFICATION_EMAIL,
} from "../graphql/mutations";

// Import queries
import {
  GET_ME,
  GET_USER_ORGANIZATIONS,
  GET_MY_APPS,
  GET_INVITATIONS,
  GET_MY_INVITATIONS,
  GET_ORG_INVITES,
  GET_MY_ORG_INVITES,
  GET_ORG_MEMBERS,
  FETCH_APP_LOGS,
  CHECK_ORG_INVITE,
  GET_APP_API_KEYS,
  GET_ALL_ORGANIZATIONS,
  GET_ORGANIZATION_MEMBERS,
  GET_ALL_APPS,
  GET_APP,
  GET_APP_MEMBERS,
  GET_USER_STATS,
  GET_ALL_USERS,
  GET_USER,
  GET_SENT_INVITATIONS,
  GET_PENDING_INVITATIONS,
  GET_AUDIT_LOGS,
  CHECK_PASSWORD_STRENGTH,
  VALIDATE_TOKEN,
  GET_APP_WITH_SETTINGS,
} from "../graphql/queries";

interface MeQuery {
  me: {
    id: string;
    username: string;
    email: string;
    image?: string;
    role: string;
    organizationId: string | null;
  };
}

interface UserOrgsQuery {
  userOrganizations: Array<{
    id: string;
    name: string;
    type: string;
    imageUrl?: string;
    description?: string;
    userRole: string;
    accessType: string;
    joinedAt: string;
    appCount: number;
  }>;
}

interface AppData {
  myApps: Array<{
    id: string;
    name: string;
    description?: string;
    organizationId: string;
    owner: { id: string; username: string; email: string };
    members: Array<{ id: string; username: string; email: string }>;
    memberCount: number;
    userRole?: string;
    createdAt: string;
    brandingSettings?: { customLogo?: string };
    generalSettings?: { logoUrl?: string };
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
    status: string;
    app: {
      id: string;
      name: string;
      description?: string;
      organizationId: string;
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
  used: boolean; // ← this is required
  brandingSettings?: { customLogo?: string };
  generalSettings?: { logoUrl?: string };
};
interface AppInvite {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
}

interface AppInvitesData {
  invitations: {
    invitations: AppInvite[];
    total: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
interface InviteOrgMemberData {
  createInvitation: {
    success: boolean;
    invitation?: {
      id: string;
      email: string;
      role: string;
      token: string;
      expiresAt: string;
      createdAt: string;
    };
    errors?: Array<{
      message: string;
      code?: string;
      field?: string;
    }>;
  };
}
interface InviteOrgMemberVars {
  input: {
    email: string;
    role: string;
    type: "ORGANIZATION";
    organizationId: string;
    message?: string;
  };
}
interface CancelOrgInviteData {
  cancelInvitation: {
    success: boolean;
    message: string;
    errors?: Array<{
      message: string;
      code?: string;
      field?: string;
    }>;
  };
}
interface CancelOrgInviteVars {
  inviteId: string;
}
interface OrgInvitation {
  id: string;
  email: string;
  role: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED" | "CANCELED";
  createdAt: string;
  expiresAt: string;
}
interface GetOrgInvitationsData {
  orgInvitations: OrgInvitation[];
}
interface GetOrgInvitationsVars {
  orgId: string;
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
  input: {
    orgId: string;
    userId: string;
  };
}
interface OrgMembersResponse {
  organizationMembers: {
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
    accessToken: string | null;
    refreshToken: string | null;
    user: {
      id: string;
      username: string;
      email: string;
      organizationId: string;
    } | null;
    appId: string | null;
    organizationId: string | null;
    requiresUserSetup: boolean;
    userExists: boolean;
    email?: string;
  };
}
interface AcceptInviteVars {
  token: string;
  username?: string;
  password?: string;
}
interface MyAppsVars {
  orgId: string;
}

export const useLogin = () => {
  const [loginMutation, { data, error, loading }] = useMutation(LOGIN_MUTATION);
  const login = async (email: string, password: string) => {
    return await loginMutation({
      variables: {
        input: { email, password },
      },
    });
  };
  return { login, data, error, loading };
};
export const useChangePassword = () => {
  const [changePasswordMutation, { loading, error }] =
    useMutation(CHANGE_PASSWORD);
  const changePassword = (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ) =>
    changePasswordMutation({
      variables: {
        input: { currentPassword, newPassword, confirmPassword },
      },
    });
  return { changePassword, loading, error };
};
export const useSignup = () => {
  const [signupMutation, { data, error, loading }] =
    useMutation(SIGNUP_MUTATION);
  const signup = async (username: string, email: string, password: string) => {
    return await signupMutation({
      variables: {
        input: {
          username,
          email,
          password,
          confirmPassword: password,
          acceptTerms: true,
        },
      },
    });
  };
  return { signup, data, error, loading };
};

export const useCheckOrgInvite = (token: string) =>
  useQuery<
    { checkOrganizationInvite: { email: string; userExists: boolean } },
    { token: string }
  >(CHECK_ORG_INVITE, { variables: { token } });

export const useSocialLogin = () => {
  const [socialLoginMutation, { data, error, loading }] = useMutation(
    SOCIAL_LOGIN_MUTATION
  );
  const socialLogin = async (provider: string, token: string) => {
    return await socialLoginMutation({
      variables: {
        input: { provider, token },
      },
    });
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
          // Removed variables since GET_MY_APPS no longer accepts orgId
        },
      ],
      awaitRefetchQueries: true,
    }
  );

  const createApp = async (
    name: string,
    description: string,
    type: string = "WEB"
  ) => {
    await createAppMutation({
      variables: {
        input: {
          name,
          description,
          organizationId: orgId,
          type: type.toUpperCase(),
        },
      },
    });
  };

  return { createApp, data, loading, error };
}

export const useFetchLogs = () => {
  const [fetchLogs, { data, error, loading }] = useLazyQuery(FETCH_APP_LOGS);

  // Memoize the function so that its identity doesn't change on every render.
  const runFetchLogs = React.useCallback(
    (appId: string, limit: number = 20, offset: number = 0) => {
      return fetchLogs({ variables: { appId, limit, offset } });
    },
    [fetchLogs]
  );

  return {
    runFetchLogs,
    data: data?.appAuditLogs?.logs || [],
    totalLogs: data?.appAuditLogs?.total || 0,
    hasNextPage: data?.appAuditLogs?.hasNextPage || false,
    error,
    loading,
  };
};
export function useUserAndOrg() {
  const {
    data: meData,
    loading: loadingMe,
    error: errorMe,
  } = useQuery<MeQuery>(GET_ME);

  const { data, loading, error, refetch } = useQuery<UserOrgsQuery>(
    GET_USER_ORGANIZATIONS
  );

  return {
    user: meData?.me,
    organizations:
      data?.userOrganizations?.map((o) => ({
        ...o,
        imageUrl: o.imageUrl || "", // Always provide imageUrl for sidebar mapping
      })) || [],
    loading,
    error,
    refetch,
  };
}
export const useCreateOrg = () => {
  const [createOrgMutation, { data, error, loading }] =
    useMutation(CREATE_ORGANIZATION);

  const createOrg = async (name: string, type: string = "TEAM") => {
    return await createOrgMutation({
      variables: {
        input: {
          name,
          type: type.toUpperCase(),
        },
      },
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
    ? data.organizationMembers.members.map((m) => ({
        id: m.user.id,
        username: m.user.username,
        email: m.user.email,
        role: m.role,
      }))
    : [];

  const owner = data?.organizationMembers.owner;

  return { members, owner, loading, error, refetch };
}
export function useInviteOrganizationMember() {
  const [mutate, { data, loading, error }] = useMutation<
    InviteOrgMemberData,
    InviteOrgMemberVars
  >(INVITE_ORG_MEMBER);

  const inviteOrgMember = (orgId: string, email: string, role: string) =>
    mutate({
      variables: {
        input: {
          email,
          role: role.toUpperCase(),
          type: "ORGANIZATION",
          organizationId: orgId,
        },
      },
    });

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
  >(GET_ORG_INVITES, {
    variables: { orgId },
    skip: !orgId || orgId.trim().length === 0, // Skip query if orgId is empty
  });

  // Filter for pending invitations only (equivalent to used: false)
  const pendingInvitations =
    data?.orgInvitations?.filter((inv) => inv.status === "PENDING") ?? [];

  return { invitations: pendingInvitations, loading, error, refetch };
}
export function useGetMyOrgInvitations() {
  return useQuery<MyOrgInvitationsData>(GET_MY_ORG_INVITES);
}
export function useAcceptInvite() {
  const [acceptInviteMutation, { data, loading, error }] = useMutation<
    AcceptInviteData,
    AcceptInviteVars
  >(ACCEPT_INVITE, {
    awaitRefetchQueries: true,
    refetchQueries: (mutationResult) => {
      if (!mutationResult.data) return [];
      const { appId, organizationId, accessToken, userExists } =
        mutationResult.data.acceptInvite;

      // Only refetch authenticated queries if user is actually authenticated
      if (!accessToken || !userExists) {
        console.log(
          "🎫 No access token or user not authenticated - skipping refetch queries"
        );
        return [];
      }

      console.log("🔄 User authenticated - refetching user data");
      const queries: any[] = [
        { query: GET_MY_APPS },
        { query: GET_USER_ORGANIZATIONS },
      ];

      if (appId) {
        queries.push({
          query: GET_INVITATIONS,
          variables: { appId },
        });
      }

      return queries;
    },
  });

  const acceptInvite = (
    token: string,
    username?: string,
    password?: string
  ) => {
    const variables: AcceptInviteVars = { token };
    if (username) variables.username = username;
    if (password) variables.password = password;

    return acceptInviteMutation({ variables });
  };

  return {
    acceptInvite,
    data,
    loading,
    error,
  };
}
export function useRemoveOrganizationMember() {
  const [mutate, { loading, error }] = useMutation<
    { removeOrganizationMember: { id: string } },
    RemoveOrgMemberVars
  >(REMOVE_ORG_MEMBER);
  return {
    remove: (orgId: string, userId: string) =>
      mutate({ variables: { input: { orgId, userId } } }),
    loading,
    error,
  };
}

export function useUpdateMemberRole() {
  const [mutate, { loading, error }] = useMutation<
    {
      updateMemberRole: { success: boolean; organization: any; errors: any[] };
    },
    { input: { orgId: string; userId: string; role: string } }
  >(UPDATE_MEMBER_ROLE);
  return {
    updateRole: (orgId: string, userId: string, role: string) =>
      mutate({
        variables: { input: { orgId, userId, role: role.toUpperCase() } },
      }),
    loading,
    error,
  };
}

export function useFetchApp(orgId: string) {
  // CRITICAL: All hooks must be called before any conditional logic
  const {
    data: appsData,
    loading: appsLoading,
    error: appsError,
    refetch: refetchApps,
  } = useQuery<AppData>(GET_MY_APPS);

  const {
    data: invData,
    loading: invLoading,
    error: invError,
    refetch: refetchInvites,
  } = useQuery<MyInvitationsQuery>(GET_MY_INVITATIONS);

  // Always call hooks first, then handle early return

  const joined = React.useMemo<FetchAppItem[]>(() => {
    if (!appsData?.myApps || !orgId) {
      return [];
    }
    try {
      return (
        appsData.myApps
          ?.filter((a) => {
            if (!a || typeof a !== "object") return false;
            if (!a.organizationId || typeof a.organizationId !== "string")
              return false;
            if (!a.id || !a.name) return false;
            return a.organizationId === orgId;
          })
          ?.map((a) => ({
            id: a.id,
            name: a.name,
            description: a.description || "",
            role: a.userRole || "MEMBER",
            status: "joined",
            used: true,
            createdAt: a.createdAt,
            brandingSettings:
              "brandingSettings" in a
                ? (a.brandingSettings as { customLogo?: string } | undefined)
                : undefined,
            generalSettings:
              "generalSettings" in a
                ? (a.generalSettings as { logoUrl?: string } | undefined)
                : undefined,
          })) ?? []
      );
    } catch (error) {
      console.error("Error in useFetchApp joined filter:", error);
      return [];
    }
  }, [appsData, orgId]);

  const pending = React.useMemo<FetchAppItem[]>(() => {
    if (!invData?.myInvitations || !orgId) {
      return [];
    }
    try {
      return (
        invData.myInvitations
          ?.filter((i) => {
            if (!i || typeof i !== "object") return false;
            if (!i.app || typeof i.app !== "object") return false;
            if (
              !i.app.organizationId ||
              typeof i.app.organizationId !== "string"
            )
              return false;
            if (!i.app.id || !i.app.name) return false;
            return i.app.organizationId === orgId;
          })
          ?.map((i) => ({
            id: i.app.id,
            name: i.app.name,
            description: i.app.description || "",
            role: i.role,
            status: i.status === "ACCEPTED" ? "joined" : "pending",
            createdAt: i.createdAt,
            used: i.status === "ACCEPTED",
            brandingSettings:
              i.app && "brandingSettings" in i.app
                ? (i.app.brandingSettings as
                    | { customLogo?: string }
                    | undefined)
                : undefined,
            generalSettings:
              i.app && "generalSettings" in i.app
                ? (i.app.generalSettings as { logoUrl?: string } | undefined)
                : undefined,
          })) ?? []
      );
    } catch (error) {
      console.error("Error in useFetchApp pending filter:", error);
      return [];
    }
  }, [invData, orgId]);

  const apps = React.useMemo(() => {
    try {
      const map = new Map<string, FetchAppItem>();
      if (Array.isArray(joined)) {
        joined.forEach((app) => {
          if (app && app.id) {
            map.set(app.id, app);
          }
        });
      }
      if (Array.isArray(pending)) {
        pending.forEach((app) => {
          if (app && app.id && !map.has(app.id)) {
            map.set(app.id, app);
          }
        });
      }
      return Array.from(map.values());
    } catch (error) {
      console.error("Error in useFetchApp apps merge:", error);
      return [];
    }
  }, [joined, pending]);

  const loading = appsLoading || invLoading;
  const error = appsError || invError;
  const refetch = () => {
    try {
      refetchApps();
      refetchInvites();
    } catch (error) {
      console.error("Error in useFetchApp refetch:", error);
    }
  };

  // Now handle early return after all hooks
  if (!orgId || typeof orgId !== "string" || orgId.trim().length === 0) {
    return {
      apps: [],
      loading: false,
      error: null,
      refetch: () => {},
    };
  }

  return { apps, loading, error, refetch };
}

export function useAppMembers(appId: string, orgId?: string) {
  // 1) Fetch joined apps + their members
  const {
    data: appsData,
    loading: appsLoading,
    error: appsError,
    refetch: refetchApps,
  } = useQuery<AppData>(GET_MY_APPS);

  // 2) Fetch pending invitations using the new schema structure
  const {
    data: invitesData,
    loading: invitesLoading,
    error: invitesError,
    refetch: refetchInvites,
  } = useQuery<
    { invitations: { invitations: AppInvite[] } },
    { filter: { appId: string } }
  >(GET_INVITATIONS, {
    variables: { filter: { appId } },
    fetchPolicy: "network-only",
  });

  // 3) Ensure we refetch invites on client-side navigations or when appId changes
  React.useEffect(() => {
    refetchInvites();
  }, [appId, refetchInvites]);

  // 4) Build the "joined" list
  const joined = React.useMemo<MemberItem[]>(() => {
    const app = appsData?.myApps?.find((a) => a && a.id === appId);
    if (!app || !app.owner) return [];

    // a) Owner row
    const ownerRow: MemberItem = {
      id: app.owner.id,
      email: app.owner.email,
      username: app.owner.username,
      role: "OWNER",
      status: "joined",
    };

    // b) Other members - now members is just an array of Users
    const memberRows: MemberItem[] = (app.members || [])
      .filter(
        (member) => member && member.id && member.email && member.username
      )
      .map((member) => ({
        id: member.id,
        email: member.email,
        username: member.username,
        role: app.userRole || "MEMBER", // Use the user's role in this app
        status: "joined",
      }));

    return [ownerRow, ...memberRows];
  }, [appsData, appId]);

  // 5) Dedupe by email: drop any pending invite if that email is already joined
  const joinedEmails = React.useMemo(
    () => new Set(joined.filter((m) => m && m.email).map((m) => m.email)),
    [joined]
  );

  // 6) Build the filtered "pending" list using the new structure
  const pending = React.useMemo<MemberItem[]>(() => {
    return (
      invitesData?.invitations?.invitations
        ?.filter((inv) => inv && inv.email && !joinedEmails.has(inv.email))
        // b) skip accepted or expired invites
        ?.filter(
          (inv) =>
            inv.status === "PENDING" && new Date(inv.expiresAt) > new Date()
        )
        // c) map to your MemberItem shape
        ?.map((i) => ({
          id: i.id,
          email: i.email,
          username: "", // not known until they join
          role: i.role,
          status: "pending",
        })) ?? []
    );
  }, [invitesData, joinedEmails]);

  // 7) Combine them
  const members = React.useMemo<MemberItem[]>(
    () => [...joined, ...pending],
    [joined, pending]
  );

  const loading = appsLoading || invitesLoading;
  const error = appsError || invitesError;
  const refetch = () => {
    refetchApps();
    refetchInvites();
  };

  return { members, loading, error, refetch };
}

export const useAddAppMember = () => {
  const [addAppMemberMutation, { data, error, loading }] =
    useMutation(ADD_APP_MEMBER);
  const addAppMember = async (appId: string, email: string, role: string) => {
    return await addAppMemberMutation({
      variables: {
        input: {
          email,
          role: role.toUpperCase(),
          type: "APPLICATION",
          appId,
        },
      },
    });
  };
  return { addAppMember, data, error, loading };
};
export const useRemoveAppMember = () => {
  const [removeMutation, { loading, error }] = useMutation(REMOVE_APP_MEMBER);
  const removeAppMember = (appId: string, userId: string) =>
    removeMutation({
      variables: {
        input: {
          appId,
          userId,
        },
      },
    });
  return { removeAppMember, loading, error };
};
export const useInviteUser = () => {
  const [inviteUserMutation, { data, error, loading }] =
    useMutation(INVITE_USER);
  const inviteUser = async (appId: string, email: string, role: string) => {
    return await inviteUserMutation({
      variables: { appId, email, role: role.toUpperCase() },
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
export const useAdminCreateUser = () => {
  const [adminCreateUserMutation, { data, error, loading }] =
    useMutation(ADMIN_CREATE_USER);
  const adminCreateUser = (appId: string, email: string, role: string) =>
    adminCreateUserMutation({
      variables: { appId, email, role: role.toUpperCase() },
    });
  return { adminCreateUser, data, error, loading };
};
export const useRequestPasswordReset = () => {
  const [mutate, { data, loading, error }] = useMutation(
    REQUEST_PASSWORD_RESET
  );
  const requestPasswordReset = async (email: string) =>
    mutate({
      variables: {
        input: { email },
      },
    });
  return { requestPasswordReset, data, loading, error };
};

export const useResetPassword = () => {
  const [mutate, { data, loading, error }] = useMutation(
    RESET_PASSWORD_MUTATION
  );
  const resetPassword = async (
    token: string,
    newPassword: string,
    confirmPassword: string
  ) =>
    mutate({
      variables: {
        input: { token, newPassword, confirmPassword },
      },
    });
  return { resetPassword, data, loading, error };
};

// Add new interface for App with Settings
export interface AppWithSettings {
  id: string;
  name: string;
  description?: string;
  type: string;
  status: string;
  organizationId: string;
  owner: {
    id: string;
    username: string;
    email: string;
  };
  memberCount: number;
  userRole?: string;
  createdAt: string;

  // Settings
  generalSettings?: {
    website?: string;
    description?: string;
    logoUrl?: string;
    allowedOrigins: string[];
    allowedCallbacks: string[];
    allowedLogouts: string[];
  };
  authSettings?: {
    enableSignUp: boolean;
    requireEmailVerification: boolean;
    allowSocialLogins: boolean;
    socialProviders: string[];
    sessionTimeout: number;
    enablePasswordless: boolean;
    jwtAlgorithm: string;
    jwtExpiration: number;
  };
  securitySettings?: {
    enableMFA: boolean;
    enableRateLimit: boolean;
    rateLimitRequests: number;
    rateLimitWindow: number;
    enableBruteForceProtection: boolean;
    maxLoginAttempts: number;
    lockoutDuration: number;
    enableAnomalyDetection: boolean;
  };
  brandingSettings?: {
    primaryColor: string;
    secondaryColor: string;
    customCss?: string;
    customLogo?: string;
    customFavicon?: string;
  };
}

// Add hook for fetching app with complete settings
export function useFetchAppWithSettings(appId: string) {
  const { data, loading, error, refetch } = useQuery<{ app: AppWithSettings }>(
    GET_APP_WITH_SETTINGS,
    {
      variables: { id: appId },
      skip: !appId,
      fetchPolicy: "cache-and-network",
    }
  );

  return {
    app: data?.app || null,
    loading,
    error,
    refetch,
  };
}
