import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface UserOrganization {
  id: string;
  name: string;
  type: 'PERSONAL' | 'ORGANIZATION';
  imageUrl?: string;
  description?: string;
  userRole: 'SUPER_ADMIN' | 'ADMIN' | 'MEMBER' | 'GUEST';
  accessType: 'FULL' | 'SCOPED' | 'DIRECT' | 'ORGANIZATION';
  joinedAt: string;
  appCount: number;
  accessibleApps: UserApp[];
  permissions: OrganizationPermissions;
}

export interface UserApp {
  id: string;
  name: string;
  description?: string;
  organization: {
    id: string;
    name: string;
    type: 'PERSONAL' | 'ORGANIZATION';
  };
  userRole: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  accessType: 'FULL' | 'SCOPED' | 'DIRECT' | 'ORGANIZATION';
  grantedAt?: string;
  grantedBy?: {
    id: string;
    username: string;
    email: string;
  };
  permissions: AppPermissions;
}

export interface OrganizationPermissions {
  canCreateApps: boolean;
  canInviteMembers: boolean;
  canManageSettings: boolean;
}

export interface AppPermissions {
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canInvite: boolean;
  canManageSettings: boolean;
}

interface OrganizationStore {
  // State
  organizations: UserOrganization[];
  currentOrganization: UserOrganization | null;
  apps: UserApp[];
  currentApp: UserApp | null;
  loading: boolean;
  error: string | null;

  // Organization Actions
  setOrganizations: (organizations: UserOrganization[]) => void;
  setCurrentOrganization: (organization: UserOrganization | null) => void;
  addOrganization: (organization: UserOrganization) => void;
  updateOrganization: (id: string, updates: Partial<UserOrganization>) => void;
  removeOrganization: (id: string) => void;

  // App Actions
  setApps: (apps: UserApp[]) => void;
  setCurrentApp: (app: UserApp | null) => void;
  addApp: (app: UserApp) => void;
  updateApp: (id: string, updates: Partial<UserApp>) => void;
  removeApp: (id: string) => void;

  // Filter and search
  getOrganizationsByType: (type?: 'PERSONAL' | 'ORGANIZATION') => UserOrganization[];
  getAppsByOrganization: (organizationId: string) => UserApp[];
  getAppsByAccessType: (accessType: 'FULL' | 'SCOPED' | 'DIRECT' | 'ORGANIZATION') => UserApp[];
  
  // Permissions
  canPerformAction: (action: string, resource: 'organization' | 'app', resourceId?: string) => boolean;
  hasOrgPermission: (permission: keyof OrganizationPermissions, orgId?: string) => boolean;
  hasAppPermission: (permission: keyof AppPermissions, appId: string) => boolean;

  // Utility
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  organizations: [],
  currentOrganization: null,
  apps: [],
  currentApp: null,
  loading: false,
  error: null,
};

export const useOrganizationStore = create<OrganizationStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Organization Actions
        setOrganizations: (organizations) => {
          set({ organizations }, false, 'setOrganizations');
        },

        setCurrentOrganization: (organization) => {
          set({ currentOrganization: organization }, false, 'setCurrentOrganization');
        },

        addOrganization: (organization) => {
          set((state) => ({
            organizations: [...state.organizations, organization]
          }), false, 'addOrganization');
        },

        updateOrganization: (id, updates) => {
          set((state) => ({
            organizations: state.organizations.map(org =>
              org.id === id ? { ...org, ...updates } : org
            ),
            currentOrganization: state.currentOrganization?.id === id
              ? { ...state.currentOrganization, ...updates }
              : state.currentOrganization
          }), false, 'updateOrganization');
        },

        removeOrganization: (id) => {
          set((state) => ({
            organizations: state.organizations.filter(org => org.id !== id),
            currentOrganization: state.currentOrganization?.id === id 
              ? null 
              : state.currentOrganization
          }), false, 'removeOrganization');
        },

        // App Actions
        setApps: (apps) => {
          set({ apps }, false, 'setApps');
        },

        setCurrentApp: (app) => {
          set({ currentApp: app }, false, 'setCurrentApp');
        },

        addApp: (app) => {
          set((state) => ({
            apps: [...state.apps, app]
          }), false, 'addApp');
        },

        updateApp: (id, updates) => {
          set((state) => ({
            apps: state.apps.map(app =>
              app.id === id ? { ...app, ...updates } : app
            ),
            currentApp: state.currentApp?.id === id
              ? { ...state.currentApp, ...updates }
              : state.currentApp
          }), false, 'updateApp');
        },

        removeApp: (id) => {
          set((state) => ({
            apps: state.apps.filter(app => app.id !== id),
            currentApp: state.currentApp?.id === id ? null : state.currentApp
          }), false, 'removeApp');
        },

        // Filter and search
        getOrganizationsByType: (type) => {
          const { organizations } = get();
          if (!type) return organizations;
          return organizations.filter(org => org.type === type);
        },

        getAppsByOrganization: (organizationId) => {
          const { apps } = get();
          return apps.filter(app => app.organization.id === organizationId);
        },

        getAppsByAccessType: (accessType) => {
          const { apps } = get();
          return apps.filter(app => app.accessType === accessType);
        },

        // Permissions
        canPerformAction: (action, resource, resourceId) => {
          const state = get();
          
          if (resource === 'organization') {
            const org = resourceId 
              ? state.organizations.find(o => o.id === resourceId)
              : state.currentOrganization;
            
            if (!org) return false;

            // Check role-based permissions
            switch (action) {
              case 'create_app':
                // INDUSTRY STANDARD: Only organization admins can create apps
                return ['SUPER_ADMIN', 'ADMIN'].includes(org.userRole);
              case 'invite_members':
                return org.permissions.canInviteMembers || ['SUPER_ADMIN', 'ADMIN'].includes(org.userRole);
              case 'manage_settings':
                return org.permissions.canManageSettings || ['SUPER_ADMIN'].includes(org.userRole);
              case 'view':
                return true; // If user has organization access, they can view
              default:
                return false;
            }
          }

          if (resource === 'app' && resourceId) {
            const app = state.apps.find(a => a.id === resourceId);
            if (!app) return false;

            switch (action) {
              case 'read':
                return app.permissions.canRead || ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'].includes(app.userRole);
              case 'write':
                return app.permissions.canWrite || ['OWNER', 'ADMIN', 'MEMBER'].includes(app.userRole);
              case 'delete':
                return app.permissions.canDelete || ['OWNER', 'ADMIN'].includes(app.userRole);
              case 'invite':
                return app.permissions.canInvite || ['OWNER', 'ADMIN'].includes(app.userRole);
              case 'manage':
                return app.permissions.canManageSettings || ['OWNER'].includes(app.userRole);
              default:
                return false;
            }
          }

          return false;
        },

        hasOrgPermission: (permission, orgId) => {
          const state = get();
          const org = orgId 
            ? state.organizations.find(o => o.id === orgId)
            : state.currentOrganization;
          
          return org ? org.permissions[permission] : false;
        },

        hasAppPermission: (permission, appId) => {
          const { apps } = get();
          const app = apps.find(a => a.id === appId);
          return app ? app.permissions[permission] : false;
        },

        // Utility
        setLoading: (loading) => {
          set({ loading }, false, 'setLoading');
        },

        setError: (error) => {
          set({ error }, false, 'setError');
        },

        clearError: () => {
          set({ error: null }, false, 'clearError');
        },

        reset: () => {
          set(initialState, false, 'reset');
        },
      }),
      {
        name: 'organization-store',
        partialize: (state) => ({
          currentOrganization: state.currentOrganization,
          currentApp: state.currentApp,
        }),
      }
    ),
    {
      name: 'organization-store',
    }
  )
);

// Selectors for common use cases
export const useCurrentOrganization = () => 
  useOrganizationStore((state) => state.currentOrganization);

export const useCurrentApp = () => 
  useOrganizationStore((state) => state.currentApp);

export const useOrganizations = () => 
  useOrganizationStore((state) => state.organizations);

export const useApps = () => 
  useOrganizationStore((state) => state.apps);

export const usePersonalOrganizations = () =>
  useOrganizationStore((state) => state.getOrganizationsByType('PERSONAL'));

export const useTeamOrganizations = () =>
  useOrganizationStore((state) => state.getOrganizationsByType('ORGANIZATION'));

export const useOrganizationPermissions = (orgId?: string) =>
  useOrganizationStore((state) => {
    const org = orgId 
      ? state.organizations.find(o => o.id === orgId)
      : state.currentOrganization;
    return org?.permissions;
  });

export const useAppPermissions = (appId: string) =>
  useOrganizationStore((state) => {
    const app = state.apps.find(a => a.id === appId);
    return app?.permissions;
  });

export default useOrganizationStore; 