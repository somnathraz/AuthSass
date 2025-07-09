export type Role = 
  | 'SUPER_ADMIN'
  | 'ADMIN' 
  | 'MEMBER'
  | 'GUEST'
  | 'OWNER'
  | 'VIEWER';

export type AccessType = 
  | 'FULL'
  | 'SCOPED'
  | 'DIRECT'
  | 'ORGANIZATION';

export type OrganizationType = 
  | 'PERSONAL'
  | 'ORGANIZATION';

export type PermissionStatus = 'ACTIVE' | 'SUSPENDED' | 'REVOKED';

export interface OrganizationPermissions {
  canCreateApps?: boolean;
  canInviteMembers?: boolean;
  canManageSettings?: boolean;
  canDeleteOrganization?: boolean;
  canManageRoles?: boolean;
}

export interface AppPermissions {
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canInvite: boolean;
  canManageSettings: boolean;
}

export interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImage?: string;
  lastSeenAt?: string;
}

export interface AppPermission {
  app: {
    id: string;
    name: string;
    description?: string;
  };
  role: Role;
  grantedAt: string;
  grantedBy: User;
  status: PermissionStatus;
}

export interface UserApp {
  id: string;
  name: string;
  accessType: AccessType;
  userRole: Role;
  permissions?: {
    canRead?: boolean;
    canWrite?: boolean;
    canAdmin?: boolean;
  };
}

export interface UserOrganization {
  id: string;
  name: string;
  type: OrganizationType;
  userRole: Role;
  accessType: AccessType;
  description?: string;
  imageUrl?: string;
  appCount: number;
  accessibleApps?: UserApp[];
  permissions?: OrganizationPermissions;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrganizationMember {
  id: string;
  username: string;
  email: string;
  role: Role;
  joinedAt: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
}

export interface OrganizationMembers {
  owner: User;
  members: OrganizationMember[];
  total: number;
}

export interface App {
  id: string;
  name: string;
  description?: string;
  owner: User;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  userRole?: Role;
  userAccess?: {
    role: Role;
    accessType: AccessType;
    permissions: AppPermissions;
  };
  memberCount?: number;
  isActive?: boolean;
}

export interface OrganizationApps {
  apps: App[];
  total: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface UserAppsResult {
  apps: UserApp[];
  total: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface UserAppAccess {
  hasAccess: boolean;
  accessType: AccessType;
  role: Role;
  permissions: AppPermissions;
}

export interface UserOrgAccess {
  hasAccess: boolean;
  role: Role;
  accessType: AccessType;
  joinedAt: string;
  permissions: OrganizationPermissions;
  appPermissions: AppPermission[];
}

// Input types
export interface OrganizationFilters {
  type?: OrganizationType;
  accessType?: AccessType;
  role?: Role;
}

export interface AppFilters {
  organizationId?: string;
  accessType?: AccessType;
  role?: Role;
}

export interface PaginationInput {
  offset?: number;
  limit?: number;
}

export interface UserOrganizationsInput {
  filters?: OrganizationFilters;
}

export interface UserAppsInput {
  filters?: AppFilters;
  pagination?: PaginationInput;
}

export interface CreateOrganizationInput {
  name: string;
  description?: string;
  type?: OrganizationType;
}

export interface UpdateOrganizationInput {
  id: string;
  name?: string;
  description?: string;
  imageUrl?: string;
}

export interface InviteOrganizationMemberInput {
  organizationId: string;
  email: string;
  role: Role;
  message?: string;
}

export interface AddOrganizationMemberInput {
  organizationId: string;
  userId: string;
  role: Role;
  appId?: string; // For scoped app access
  appRole?: Role; // Role within the app
}

export interface UpdateMemberRoleInput {
  organizationId: string;
  userId: string;
  role: Role;
}

export interface RemoveOrganizationMemberInput {
  organizationId: string;
  userId: string;
}

export interface AddAppPermissionInput {
  organizationId: string;
  userId: string;
  appId: string;
  role: Role;
}

export interface RevokeAppPermissionInput {
  organizationId: string;
  userId: string;
  appId: string;
}

// Error types
export interface GraphQLError {
  message: string;
  code: string;
  field?: string;
}

export interface MutationResult<T = any> {
  success: boolean;
  data?: T;
  errors?: GraphQLError[];
}

// Subscription types
export interface OrganizationMembershipChange {
  type: 'ADDED' | 'REMOVED' | 'ROLE_CHANGED' | 'PERMISSION_CHANGED';
  member: OrganizationMember;
  organization: {
    id: string;
    name: string;
  };
}

// Component props types
export interface OrganizationSelectorProps {
  className?: string;
  showCreateButton?: boolean;
  onCreateClick?: () => void;
  variant?: 'default' | 'compact' | 'detailed';
}

export interface AppCardProps {
  app: UserApp | App;
  showActions?: boolean;
  onEdit?: (app: UserApp | App) => void;
  onDelete?: (app: UserApp | App) => void;
  onView?: (app: UserApp | App) => void;
}

export interface MemberListProps {
  organizationId: string;
  showInviteButton?: boolean;
  onInvite?: () => void;
  onMemberAction?: (action: string, member: OrganizationMember) => void;
}

export interface PermissionBadgeProps {
  permissions: OrganizationPermissions | AppPermissions;
  role: Role;
  accessType: AccessType;
  variant?: 'default' | 'detailed' | 'compact';
}

// Store types
export interface OrganizationState {
  organizations: UserOrganization[];
  currentOrganization: UserOrganization | null;
  apps: UserApp[];
  currentApp: UserApp | null;
  loading: boolean;
  error: string | null;
}

// Hook return types
export interface UseOrganizationReturn {
  organizations: UserOrganization[];
  currentOrganization: UserOrganization | null;
  loading: boolean;
  error: string | null;
  setCurrentOrganization: (org: UserOrganization | null) => void;
  refetch: () => Promise<any>;
}

export interface UseAppsReturn {
  apps: UserApp[];
  currentApp: UserApp | null;
  loading: boolean;
  error: string | null;
  setCurrentApp: (app: UserApp | null) => void;
  refetch: () => Promise<any>;
}

export interface UsePermissionsReturn {
  canPerformAction: (action: string, resource: 'organization' | 'app', resourceId?: string) => boolean;
  hasOrgPermission: (permission: keyof OrganizationPermissions, orgId?: string) => boolean;
  hasAppPermission: (permission: keyof AppPermissions, appId: string) => boolean;
  checkAppAccess: (appId: string) => Promise<UserAppAccess>;
  checkOrgAccess: (orgId: string) => Promise<UserOrgAccess>;
} 