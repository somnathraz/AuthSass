// GraphQL Generated Types
export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  organizationId?: string;
  requirePasswordReset?: boolean;
  createdAt: string;
  accountType?: string;
  isVerified?: boolean;
}

export interface Organization {
  id: string;
  name: string;
  type: 'PERSONAL' | 'ORGANIZATION';
  owner: User;
  members: OrgMember[];
  createdAt: string;
  imageUrl?: string;
}

export interface OrgMember {
  user: User;
  role: string;
}

export interface App {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  owner: User;
  members: AppMember[];
  createdAt: string;
}

export interface AppMember {
  user: User;
  role: string;
}

export interface Invitation {
  id: string;
  email: string;
  role: string;
  used: boolean;
  createdAt: string;
  expiresAt: string;
  app?: App;
  token?: string;
}

export interface OrgInvitation {
  id: string;
  email: string;
  role: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'CANCELED';
  type: 'ORGANIZATION' | 'APPLICATION' | 'GENERAL';
  createdAt: string;
  expiresAt: string;
  invitedBy: {
    id: string;
    username: string;
    email: string;
  };
  organization: {
    id: string;
    name: string;
  };
  token?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  userId?: string;
  metadata?: any;
  timestamp: string;
}

export interface AuthPayload {
  accessToken: string;
  refreshToken?: string;
  user: User;
  requirePasswordReset?: boolean;
}

export interface SignupResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface AcceptInvitePayload {
  accessToken: string;
  refreshToken: string;
  user: User;
  appId: string;
  organizationId: string;
  requiresUserSetup: boolean;
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  appId: string;
  createdBy: string;
  createdAt: string;
  lastUsedAt?: string;
  expiresAt?: string;
  isActive: boolean;
  permissions: string[];
}

// Query Response Types
export interface GetMeQuery {
  me: User;
}

export interface GetUserOrganizationsQuery {
  userOrganizations: Organization[];
}

export interface GetOrganizationQuery {
  organization: Organization;
}

export interface GetMyAppsQuery {
  myApps: App[];
}

export interface GetMyInvitationsQuery {
  myInvitations: Invitation[];
}

export interface GetInvitationsQuery {
  invitations: Invitation[];
}

export interface GetOrgInvitesQuery {
  orgInvitations: OrgInvitation[];
}

export interface GetMyOrgInvitesQuery {
  myOrgInvitations: OrgInvitation[];
}

export interface GetOrgMembersQuery {
  orgMembers: {
    owner: User;
    members: OrgMember[];
  };
}

export interface FetchAppLogsQuery {
  appAuditLogs: AuditLogsResponse;
}

export interface CheckOrgInviteQuery {
  checkOrganizationInvite: {
    email: string;
    userExists: boolean;
  };
}

// Mutation Response Types
export interface LoginMutation {
  login: AuthPayload;
}

export interface SignupMutation {
  signup: SignupResponse;
}

export interface SocialLoginMutation {
  socialLogin: AuthPayload;
}

export interface CreateOrganizationMutation {
  createOrganization: Organization;
}

export interface CreateAppMutation {
  createApp: App;
}

export interface UpdateAppMutation {
  updateApp: App;
}

export interface DeleteAppMutation {
  deleteApp: string;
}

export interface InviteUserMutation {
  inviteUser: Invitation;
}

export interface AcceptInviteMutation {
  acceptInvite: AcceptInvitePayload;
}

export interface InviteOrgMemberMutation {
  createInvitation: {
    success: boolean;
    invitation?: OrgInvitation;
    errors?: Array<{
      message: string;
      code?: string;
      field?: string;
    }>;
  };
}

export interface AddAppMemberMutation {
  addAppMember: App;
}

export interface RemoveAppMemberMutation {
  removeAppMember: App;
}

export interface UpdateAppMemberRoleMutation {
  updateAppMemberRole: App;
}

export interface AdminCreateUserMutation {
  adminCreateUser: User;
}

export interface CreateApiKeyMutation {
  createApiKey: ApiKey;
}

export interface RevokeApiKeyMutation {
  revokeApiKey: string;
}

// Variable Types
export interface LoginInput {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginVariables {
  input: LoginInput;
}

export interface SignupInput {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export interface SignupVariables {
  input: SignupInput;
}

export interface SocialLoginInput {
  provider: string;
  token: string;
  redirectUri?: string;
}

export interface SocialLoginVariables {
  input: SocialLoginInput;
}

export interface CreateOrganizationVariables {
  name: string;
}

export interface CreateAppVariables {
  name: string;
  description?: string;
  orgId: string;
}

export interface UpdateAppVariables {
  appId: string;
  name?: string;
  description?: string;
}

export interface DeleteAppVariables {
  appId: string;
}

export interface InviteUserVariables {
  appId: string;
  email: string;
  role: string;
}

export interface AcceptInviteVariables {
  token: string;
  username?: string;
  password?: string;
}

export interface InviteOrgMemberVariables {
  input: {
    email: string;
    role: string;
    type: 'ORGANIZATION';
    organizationId: string;
    message?: string;
  };
}

export interface AddAppMemberVariables {
  appId: string;
  email: string;
  role: string;
}

export interface RemoveAppMemberVariables {
  appId: string;
  userId: string;
}

export interface UpdateAppMemberRoleVariables {
  appId: string;
  userId: string;
  role: string;
}

export interface RemoveOrgMemberVariables {
  orgId: string;
  userId: string;
}

export interface GetMyAppsVariables {
  orgId?: string;
}

export interface GetOrgMembersVariables {
  orgId: string;
}

export interface GetInvitationsVariables {
  filter?: {
    appId?: string;
    email?: string;
    status?: string;
    type?: string;
    organizationId?: string;
    search?: string;
  };
  limit?: number;
  offset?: number;
}

export interface GetInvitationsResponse {
  invitations: {
    invitations: Invitation[];
    total: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface GetOrgInvitesVariables {
  orgId: string;
}

export interface FetchAppLogsVariables {
  appId: string;
  limit?: number;
  offset?: number;
}

export interface CheckOrgInviteVariables {
  token: string;
}

export interface CancelInviteVariables {
  inviteId: string;
}

export interface CancelOrgInviteVariables {
  inviteId: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordVariables {
  input: ChangePasswordInput;
}

export interface PasswordResetRequestInput {
  email: string;
  redirectUri?: string;
}

export interface RequestPasswordResetVariables {
  input: PasswordResetRequestInput;
}

export interface PasswordResetInput {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordVariables {
  input: PasswordResetInput;
}

export interface AdminCreateUserVariables {
  appId: string;
  email: string;
  role: string;
}

export interface UpdateUserRoleVariables {
  userId: string;
  role: string;
}

export interface DeleteUserVariables {
  userId: string;
}

export interface CreateApiKeyVariables {
  input: CreateApiKeyInput;
}

export interface RevokeApiKeyVariables {
  apiKeyId: string;
}

export interface SwitchOrganizationVariables {
  orgId: string;
}

// Error Types
export interface GraphQLError {
  message: string;
  extensions?: {
    code?: string;
    exception?: {
      stacktrace?: string[];
    };
  };
  locations?: Array<{
    line: number;
    column: number;
  }>;
  path?: Array<string | number>;
}

// Custom Hook Return Types
export interface MutationResult<TData = any> {
  data?: TData;
  loading: boolean;
  error?: GraphQLError;
}

export interface QueryResult<TData = any> {
  data?: TData;
  loading: boolean;
  error?: GraphQLError;
  refetch: () => void;
  fetchMore?: (options: any) => Promise<any>;
}

// Cache Types
export interface CacheConfig {
  typePolicies: {
    [typename: string]: {
      fields?: {
        [fieldname: string]: any;
      };
      keyFields?: string[] | false;
    };
  };
}

// Subscription Types
export interface SubscriptionResult<TData = any> {
  data?: TData;
  loading: boolean;
  error?: GraphQLError;
}

export interface AppUpdateSubscription {
  appUpdated: App;
}

export interface OrgUpdateSubscription {
  organizationUpdated: Organization;
}

// API Key Types
export interface ApiKeysResponse {
  apiKeys: ApiKey[];
  total: number;
}

export interface CreateApiKeyInput {
  appId: string;
  name: string;
  expiresAt?: string;
  permissions?: string[];
}

export interface UpdateApiKeyInput {
  name?: string;
  expiresAt?: string;
  permissions?: string[];
  isActive?: boolean;
}

export interface UpdateApiKeyVariables {
  id: string;
  input: UpdateApiKeyInput;
}

export interface GetAppApiKeysVariables {
  appId: string;
}

// Enhanced User Types
export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
}

export interface UserWithStats extends User {
  lastSeenAt?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING';
  failedLoginAttempts: number;
  lockoutUntil?: string;
  profileImage?: string;
  firstName?: string;
  lastName?: string;
  isVerified: boolean;
  accountType: string;
  preferences?: any;
}

export interface UserFilter {
  search?: string;
  role?: string;
  status?: string;
  organizationId?: string;
  isVerified?: boolean;
}

export interface UsersResponse {
  users: UserWithStats[];
  total: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface UpdateUserInput {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImage?: string;
  role?: string;
  status?: string;
}

export interface UpdateUserPreferencesInput {
  theme?: string;
  language?: string;
  notifications?: any;
  timezone?: string;
}

export interface BulkUpdateUsersInput {
  role?: string;
  status?: string;
}

export interface UpdateProfileInput {
  username?: string;
  firstName?: string;
  lastName?: string;
  profileImage?: string;
  preferences?: any;
}

export interface UpdateUserVariables {
  id: string;
  input: UpdateUserInput;
}

export interface UpdateUserPreferencesVariables {
  input: UpdateUserPreferencesInput;
}

export interface BulkUpdateUsersVariables {
  userIds: string[];
  input: BulkUpdateUsersInput;
}

export interface BulkDeleteUsersVariables {
  userIds: string[];
}

export interface GetAllUsersVariables {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: string;
  filter?: UserFilter;
}

// Enhanced Organization Types
export interface OrganizationFilter {
  search?: string;
  type?: string;
  status?: string;
  name?: string;
}

export interface OrganizationsResponse {
  organizations: Organization[];
  total: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface UpdateOrganizationInput {
  name?: string;
  description?: string;
  imageUrl?: string;
  settings?: any;
}

export interface AddOrganizationMemberInput {
  organizationId: string;
  userId: string;
  role: string;
}

export interface UpdateMemberRoleInput {
  organizationId: string;
  userId: string;
  role: string;
}

export interface OrganizationMembersResponse {
  owner: User;
  members: Array<{
    user: User;
    role: string;
  }>;
  total: number;
}

export interface GetAllOrganizationsVariables {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: string;
  filter?: OrganizationFilter;
}

export interface UpdateOrganizationVariables {
  id: string;
  input: UpdateOrganizationInput;
}

export interface AddOrganizationMemberVariables {
  input: AddOrganizationMemberInput;
}

export interface UpdateMemberRoleVariables {
  input: UpdateMemberRoleInput;
}

export interface GetOrganizationMembersVariables {
  orgId: string;
}

// Enhanced App Types
export interface AppFilter {
  search?: string;
  type?: string;
  status?: string;
  organizationId?: string;
}

export interface AppsResponse {
  apps: App[];
  total: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface CreateAppInput {
  name: string;
  description?: string;
  organizationId: string;
  type?: string;
  settings?: any;
}

export interface UpdateAppInput {
  name?: string;
  description?: string;
  settings?: any;
}

export interface AddAppMemberInput {
  appId: string;
  userId: string;
  role: string;
}

export interface RemoveAppMemberInput {
  appId: string;
  userId: string;
}

export interface UpdateAppMemberRoleInput {
  appId: string;
  userId: string;
  role: string;
}

export interface AppMembersResponse {
  owner: User;
  members: Array<{
    user: User;
    role: string;
    joinedAt: string;
  }>;
  total: number;
}

export interface GetAllAppsVariables {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: string;
  filter?: AppFilter;
}

export interface CreateAppEnhancedVariables {
  input: CreateAppInput;
}

export interface UpdateAppEnhancedVariables {
  id: string;
  input: UpdateAppInput;
}

export interface AddAppMemberEnhancedVariables {
  input: AddAppMemberInput;
}

export interface RemoveAppMemberEnhancedVariables {
  input: RemoveAppMemberInput;
}

export interface UpdateAppMemberRoleEnhancedVariables {
  input: UpdateAppMemberRoleInput;
}

export interface GetAppMembersVariables {
  appId: string;
}

// Enhanced Invitation Types
export interface CreateInvitationInput {
  appId: string;
  email: string;
  role: string;
  message?: string;
  expiresAt?: string;
}

export interface SentInvitationsResponse {
  invitations: Invitation[];
  total: number;
}

export interface PendingInvitationsResponse {
  invitations: Invitation[];
  total: number;
}

export interface CreateInvitationVariables {
  input: CreateInvitationInput;
}

export interface GetSentInvitationsVariables {
  appId?: string;
  limit?: number;
  offset?: number;
}

export interface GetPendingInvitationsVariables {
  appId?: string;
  limit?: number;
  offset?: number;
}

export interface AcceptInvitationVariables {
  token: string;
}

export interface DeclineInvitationVariables {
  token: string;
}

export interface ResendInvitationVariables {
  id: string;
}

// Enhanced Audit Types
export interface DateRangeInput {
  startDate: string;
  endDate: string;
}

export interface AuditLogsResponse {
  logs: AuditLog[];
  total: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface GetAuditLogsVariables {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: string;
  filter?: AuditLogFilter;
}

// Password Strength Types
export interface PasswordRequirement {
  rule: string;
  satisfied: boolean;
  message: string;
}

export interface PasswordStrengthResult {
  score: number;
  feedback: string;
  isValid: boolean;
  requirements: PasswordRequirement[];
}

export interface CheckPasswordStrengthVariables {
  password: string;
}

export interface ValidateTokenVariables {
  token: string;
}

// Response Types for Enhanced Mutations
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors: Array<{
    field: string;
    message: string;
  }>;
}

export interface CreateApiKeyResponse extends ApiResponse {
  apiKey: ApiKey;
}

export interface UpdateApiKeyResponse extends ApiResponse {
  apiKey: ApiKey;
}

export interface CreateOrganizationResponse extends ApiResponse {
  organization: Organization;
}

export interface UpdateOrganizationResponse extends ApiResponse {
  organization: Organization;
}

export interface DeleteOrganizationResponse extends ApiResponse {
  message: string;
}

export interface CreateAppResponse extends ApiResponse {
  app: App;
}

export interface UpdateAppResponse extends ApiResponse {
  app: App;
}

export interface DeleteAppResponse extends ApiResponse {
  message: string;
}

export interface UpdateUserResponse extends ApiResponse {
  user: UserWithStats;
}

export interface BulkUpdateUsersResponse extends ApiResponse {
  updatedCount: number;
}

export interface BulkDeleteUsersResponse extends ApiResponse {
  deletedCount: number;
}

// Mutation Response Types
export interface CreateApiKeyEnhancedMutation {
  createApiKey: CreateApiKeyResponse;
}

export interface UpdateApiKeyMutation {
  updateApiKey: UpdateApiKeyResponse;
}

export interface GetAppApiKeysQuery {
  appApiKeys: ApiKeysResponse;
}

export interface GetUserStatsQuery {
  userStats: UserStats;
}

export interface GetAllUsersQuery {
  users: UsersResponse;
}

export interface GetAllOrganizationsQuery {
  organizations: OrganizationsResponse;
}

export interface GetAllAppsQuery {
  apps: AppsResponse;
}

export interface GetSentInvitationsQuery {
  sentInvitations: SentInvitationsResponse;
}

export interface GetPendingInvitationsQuery {
  pendingInvitations: PendingInvitationsResponse;
}

export interface GetAuditLogsQuery {
  auditLogs: AuditLogsResponse;
}

export interface CheckPasswordStrengthQuery {
  checkPasswordStrength: PasswordStrengthResult;
}

export interface ValidateTokenQuery {
  validateToken: boolean;
}

export interface GetAppAuditLogsQuery {
  appAuditLogs: AuditLogsResponse;
}

export interface GetAppAuditLogsVariables {
  appId: string;
  limit?: number;
  offset?: number;
}

export interface AuditLogFilter {
  action?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  ip?: string;
  search?: string;
} 