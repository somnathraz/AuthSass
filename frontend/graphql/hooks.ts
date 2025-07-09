// GraphQL hooks will be implemented here
// For now, we'll keep the existing authService hooks

import { useQuery, useMutation, useSubscription, useLazyQuery } from "@apollo/client";
import {
  // Queries
  GET_ME,
  GET_USER_ORGANIZATIONS,
  GET_ORGANIZATION,
  GET_MY_APPS,
  GET_MY_INVITATIONS,
  GET_INVITATIONS,
  GET_ORG_INVITES,
  GET_MY_ORG_INVITES,
  GET_ORG_MEMBERS,
  FETCH_APP_LOGS,
  CHECK_ORG_INVITE,
  SUBSCRIBE_TO_APP_UPDATES,
  SUBSCRIBE_TO_ORG_UPDATES,
} from "./queries";

import {
  // Mutations
  LOGIN_MUTATION,
  SIGNUP_MUTATION,
  SOCIAL_LOGIN_MUTATION,
  CHANGE_PASSWORD,
  REQUEST_PASSWORD_RESET,
  RESET_PASSWORD_MUTATION,
  CREATE_ORGANIZATION,
  INVITE_ORG_MEMBER,
  CANCEL_ORG_INVITE,
  REMOVE_ORG_MEMBER,
  CREATE_APP,
  UPDATE_APP,
  DELETE_APP,
  ADD_APP_MEMBER,
  REMOVE_APP_MEMBER,
  UPDATE_APP_MEMBER_ROLE,
  INVITE_USER,
  CANCEL_INVITE,
  ACCEPT_INVITE,
  ADMIN_CREATE_USER,
  UPDATE_USER_ROLE,
  DELETE_USER,
  CREATE_API_KEY,
  REVOKE_API_KEY,
  SWITCH_ORGANIZATION,
} from "./mutations";

import type {
  // Query types
  GetMeQuery,
  GetUserOrganizationsQuery,
  GetOrganizationQuery,
  GetMyAppsQuery,
  GetMyInvitationsQuery,
  GetInvitationsQuery,
  GetOrgInvitesQuery,
  GetMyOrgInvitesQuery,
  GetOrgMembersQuery,
  FetchAppLogsQuery,
  CheckOrgInviteQuery,
  
  // Mutation types
  LoginMutation,
  SignupMutation,
  SocialLoginMutation,
  CreateOrganizationMutation,
  CreateAppMutation,
  UpdateAppMutation,
  DeleteAppMutation,
  InviteUserMutation,
  AcceptInviteMutation,
  InviteOrgMemberMutation,
  AddAppMemberMutation,
  RemoveAppMemberMutation,
  UpdateAppMemberRoleMutation,
  AdminCreateUserMutation,
  CreateApiKeyMutation,
  RevokeApiKeyMutation,
  
  // Variable types
  LoginVariables,
  SignupVariables,
  SocialLoginVariables,
  CreateOrganizationVariables,
  CreateAppVariables,
  UpdateAppVariables,
  DeleteAppVariables,
  InviteUserVariables,
  AcceptInviteVariables,
  InviteOrgMemberVariables,
  AddAppMemberVariables,
  RemoveAppMemberVariables,
  UpdateAppMemberRoleVariables,
  RemoveOrgMemberVariables,
  GetMyAppsVariables,
  GetOrgMembersVariables,
  GetInvitationsVariables,
  GetOrgInvitesVariables,
  FetchAppLogsVariables,
  CheckOrgInviteVariables,
  CancelInviteVariables,
  CancelOrgInviteVariables,
  ChangePasswordVariables,
  RequestPasswordResetVariables,
  ResetPasswordVariables,
  AdminCreateUserVariables,
  UpdateUserRoleVariables,
  DeleteUserVariables,
  CreateApiKeyVariables,
  RevokeApiKeyVariables,
  SwitchOrganizationVariables,
  
  // Subscription types
  AppUpdateSubscription,
  OrgUpdateSubscription,
} from "./types";

// Query hooks
export const useGetMe = () => {
  return useQuery<GetMeQuery>(GET_ME, {
    errorPolicy: "all",
    fetchPolicy: "cache-first",
  });
};

export const useGetUserOrganizations = () => {
  return useQuery<GetUserOrganizationsQuery>(GET_USER_ORGANIZATIONS, {
    errorPolicy: "all",
    fetchPolicy: "cache-first",
  });
};

export const useGetOrganization = () => {
  return useQuery<GetOrganizationQuery>(GET_ORGANIZATION, {
    errorPolicy: "all",
    fetchPolicy: "cache-first",
  });
};

export const useGetMyApps = (variables?: GetMyAppsVariables) => {
  return useQuery<GetMyAppsQuery, GetMyAppsVariables>(GET_MY_APPS, {
    variables,
    errorPolicy: "all",
    fetchPolicy: "cache-first",
  });
};

export const useGetMyInvitations = () => {
  return useQuery<GetMyInvitationsQuery>(GET_MY_INVITATIONS, {
    errorPolicy: "all",
    fetchPolicy: "cache-first",
  });
};

export const useGetInvitations = (variables: GetInvitationsVariables) => {
  return useQuery<GetInvitationsQuery, GetInvitationsVariables>(GET_INVITATIONS, {
    variables,
    errorPolicy: "all",
    fetchPolicy: "cache-first",
  });
};

export const useGetOrgInvites = (variables: GetOrgInvitesVariables) => {
  return useQuery<GetOrgInvitesQuery, GetOrgInvitesVariables>(GET_ORG_INVITES, {
    variables,
    errorPolicy: "all",
    fetchPolicy: "cache-first",
  });
};

export const useGetMyOrgInvites = () => {
  return useQuery<GetMyOrgInvitesQuery>(GET_MY_ORG_INVITES, {
    errorPolicy: "all",
    fetchPolicy: "cache-first",
  });
};

export const useGetOrgMembers = (variables: GetOrgMembersVariables) => {
  return useQuery<GetOrgMembersQuery, GetOrgMembersVariables>(GET_ORG_MEMBERS, {
    variables,
    errorPolicy: "all",
    fetchPolicy: "cache-first",
  });
};

export const useFetchAppLogs = (variables: FetchAppLogsVariables) => {
  return useQuery<FetchAppLogsQuery, FetchAppLogsVariables>(FETCH_APP_LOGS, {
    variables,
    errorPolicy: "all",
    fetchPolicy: "cache-first",
  });
};

export const useCheckOrgInvite = (variables: CheckOrgInviteVariables) => {
  return useQuery<CheckOrgInviteQuery, CheckOrgInviteVariables>(CHECK_ORG_INVITE, {
    variables,
    errorPolicy: "all",
    fetchPolicy: "cache-first",
  });
};

// Lazy query hooks for conditional fetching
export const useLazyGetMyApps = () => {
  return useLazyQuery<GetMyAppsQuery, GetMyAppsVariables>(GET_MY_APPS, {
    errorPolicy: "all",
    fetchPolicy: "cache-first",
  });
};

export const useLazyCheckOrgInvite = () => {
  return useLazyQuery<CheckOrgInviteQuery, CheckOrgInviteVariables>(CHECK_ORG_INVITE, {
    errorPolicy: "all",
    fetchPolicy: "network-only",
  });
};

// Mutation hooks
export const useLogin = () => {
  return useMutation<LoginMutation, LoginVariables>(LOGIN_MUTATION, {
    errorPolicy: "all",
    onCompleted: (data) => {
      if (data.login.accessToken) {
        localStorage.setItem("token", data.login.accessToken);
        if (data.login.refreshToken) {
          localStorage.setItem("refreshToken", data.login.refreshToken);
        }
      }
    },
  });
};

export const useSignup = () => {
  return useMutation<SignupMutation, SignupVariables>(SIGNUP_MUTATION, {
    errorPolicy: "all",
    onCompleted: (data) => {
      if (data.signup.accessToken) {
        localStorage.setItem("token", data.signup.accessToken);
        localStorage.setItem("refreshToken", data.signup.refreshToken);
      }
    },
  });
};

export const useSocialLogin = () => {
  return useMutation<SocialLoginMutation, SocialLoginVariables>(SOCIAL_LOGIN_MUTATION, {
    errorPolicy: "all",
    onCompleted: (data) => {
      if (data.socialLogin.accessToken) {
        localStorage.setItem("token", data.socialLogin.accessToken);
        if (data.socialLogin.refreshToken) {
          localStorage.setItem("refreshToken", data.socialLogin.refreshToken);
        }
      }
    },
  });
};

export const useChangePassword = () => {
  return useMutation<any, ChangePasswordVariables>(CHANGE_PASSWORD, {
    errorPolicy: "all",
  });
};

export const useRequestPasswordReset = () => {
  return useMutation<any, RequestPasswordResetVariables>(REQUEST_PASSWORD_RESET, {
    errorPolicy: "all",
  });
};

export const useResetPassword = () => {
  return useMutation<any, ResetPasswordVariables>(RESET_PASSWORD_MUTATION, {
    errorPolicy: "all",
  });
};

export const useCreateOrganization = () => {
  return useMutation<CreateOrganizationMutation, CreateOrganizationVariables>(CREATE_ORGANIZATION, {
    errorPolicy: "all",
    refetchQueries: [{ query: GET_USER_ORGANIZATIONS }],
    awaitRefetchQueries: true,
  });
};

export const useInviteOrgMember = () => {
  return useMutation<InviteOrgMemberMutation, InviteOrgMemberVariables>(INVITE_ORG_MEMBER, {
    errorPolicy: "all",
    refetchQueries: [{ query: GET_ORG_INVITES }],
  });
};

export const useCancelOrgInvite = () => {
  return useMutation<any, CancelOrgInviteVariables>(CANCEL_ORG_INVITE, {
    errorPolicy: "all",
    refetchQueries: [{ query: GET_ORG_INVITES }],
  });
};

export const useRemoveOrgMember = () => {
  return useMutation<any, RemoveOrgMemberVariables>(REMOVE_ORG_MEMBER, {
    errorPolicy: "all",
    refetchQueries: [{ query: GET_ORG_MEMBERS }],
  });
};

export const useCreateApp = (orgId?: string) => {
  return useMutation<CreateAppMutation, CreateAppVariables>(CREATE_APP, {
    errorPolicy: "all",
    refetchQueries: [{ 
      query: GET_MY_APPS,
      variables: { orgId }
    }],
    awaitRefetchQueries: true,
  });
};

export const useUpdateApp = () => {
  return useMutation<UpdateAppMutation, UpdateAppVariables>(UPDATE_APP, {
    errorPolicy: "all",
    refetchQueries: [{ query: GET_MY_APPS }],
  });
};

export const useDeleteApp = () => {
  return useMutation<DeleteAppMutation, DeleteAppVariables>(DELETE_APP, {
    errorPolicy: "all",
    refetchQueries: [{ query: GET_MY_APPS }],
    awaitRefetchQueries: true,
  });
};

export const useAddAppMember = () => {
  return useMutation<AddAppMemberMutation, AddAppMemberVariables>(ADD_APP_MEMBER, {
    errorPolicy: "all",
    refetchQueries: [{ query: GET_MY_APPS }],
  });
};

export const useRemoveAppMember = () => {
  return useMutation<RemoveAppMemberMutation, RemoveAppMemberVariables>(REMOVE_APP_MEMBER, {
    errorPolicy: "all",
    refetchQueries: [{ query: GET_MY_APPS }],
  });
};

export const useUpdateAppMemberRole = () => {
  return useMutation<UpdateAppMemberRoleMutation, UpdateAppMemberRoleVariables>(UPDATE_APP_MEMBER_ROLE, {
    errorPolicy: "all",
    refetchQueries: [{ query: GET_MY_APPS }],
  });
};

export const useInviteUser = () => {
  return useMutation<InviteUserMutation, InviteUserVariables>(INVITE_USER, {
    errorPolicy: "all",
    refetchQueries: [{ query: GET_INVITATIONS }],
  });
};

export const useCancelInvite = () => {
  return useMutation<any, CancelInviteVariables>(CANCEL_INVITE, {
    errorPolicy: "all",
    refetchQueries: [{ query: GET_INVITATIONS }, { query: GET_MY_INVITATIONS }],
  });
};

export const useAcceptInvite = () => {
  return useMutation<AcceptInviteMutation, AcceptInviteVariables>(ACCEPT_INVITE, {
    errorPolicy: "all",
    onCompleted: (data) => {
      if (data.acceptInvite.accessToken) {
        localStorage.setItem("token", data.acceptInvite.accessToken);
        localStorage.setItem("refreshToken", data.acceptInvite.refreshToken);
      }
    },
  });
};

export const useAdminCreateUser = () => {
  return useMutation<AdminCreateUserMutation, AdminCreateUserVariables>(ADMIN_CREATE_USER, {
    errorPolicy: "all",
  });
};

export const useUpdateUserRole = () => {
  return useMutation<any, UpdateUserRoleVariables>(UPDATE_USER_ROLE, {
    errorPolicy: "all",
  });
};

export const useDeleteUser = () => {
  return useMutation<any, DeleteUserVariables>(DELETE_USER, {
    errorPolicy: "all",
  });
};

export const useCreateApiKey = () => {
  return useMutation<CreateApiKeyMutation, CreateApiKeyVariables>(CREATE_API_KEY, {
    errorPolicy: "all",
  });
};

export const useRevokeApiKey = () => {
  return useMutation<RevokeApiKeyMutation, RevokeApiKeyVariables>(REVOKE_API_KEY, {
    errorPolicy: "all",
  });
};

export const useSwitchOrganization = () => {
  return useMutation<any, SwitchOrganizationVariables>(SWITCH_ORGANIZATION, {
    errorPolicy: "all",
    refetchQueries: [{ query: GET_ORGANIZATION }, { query: GET_MY_APPS }],
    awaitRefetchQueries: true,
  });
};

// Subscription hooks (for real-time features)
export const useAppUpdates = (appId: string) => {
  return useSubscription<AppUpdateSubscription>(SUBSCRIBE_TO_APP_UPDATES, {
    variables: { appId },
    shouldResubscribe: true,
  });
};

export const useOrgUpdates = (orgId: string) => {
  return useSubscription<OrgUpdateSubscription>(SUBSCRIBE_TO_ORG_UPDATES, {
    variables: { orgId },
    shouldResubscribe: true,
  });
};

// Composite hooks for complex operations
export const useAuthenticatedUser = () => {
  const { data, loading, error, refetch } = useGetMe();
  
  return {
    user: data?.me,
    isAuthenticated: !!data?.me,
    loading,
    error,
    refetch,
  };
};

export const useUserAppsAndOrgs = () => {
  const { data: userData, loading: userLoading } = useGetMe();
  const { data: appsData, loading: appsLoading } = useGetMyApps({
    orgId: userData?.me?.organizationId,
  });
  const { data: orgsData, loading: orgsLoading } = useGetUserOrganizations();
  
  return {
    user: userData?.me,
    apps: appsData?.myApps || [],
    organizations: orgsData?.userOrganizations || [],
    loading: userLoading || appsLoading || orgsLoading,
  };
};

// Utility hooks
export const useLogout = () => {
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    // Clear Apollo cache
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  };
  
  return { logout };
};

export const useGraphQLHooks = () => {
  // Placeholder for future GraphQL hooks
  return {};
}; 