"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { BookOpen, Bot, Plus, Settings2, SquareTerminal } from "lucide-react";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher, Team } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useParams, useRouter, usePathname } from "next/navigation";
import { useFetchApp, useUserAndOrg } from "@/services/authService";
import { CreateAppModal } from "@/components/CreateAppModal/CreateAppModal";
import { CreateOrgModal } from "@/components/CreateOrgModal/CreateOrgModal";

export type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  isActive: boolean;
};

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  teamsOverride?: Team[];
  navOverride?: NavItem[];
}

export function AppSidebar({
  teamsOverride,
  navOverride,
  ...sidebarProps
}: AppSidebarProps) {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();

  const rawOrg = params.orgId;
  const rawApp = params.appId;
  const orgId = Array.isArray(rawOrg) ? rawOrg[0] : rawOrg ?? "personal";
  const appId = Array.isArray(rawApp) ? rawApp[0] : rawApp ?? "";

  const {
    user,
    organizations,
    loading: uLoading,
    error: uError,
  } = useUserAndOrg();

  // CRITICAL: Always call useFetchApp with consistent parameter to avoid hooks violations
  // Use empty string as fallback to ensure hook is always called consistently
  const {
    apps,
    loading: aLoading,
    error: aError,
    refetch: refetchApps,
  } = useFetchApp(orgId || "");

  // Determine if we're in org mode vs app mode
  const isOrgMode = !params.appId;
  // Always fetch apps when we have an orgId - needed for both org mode (to show app list) and app mode (to show app dropdown)
  const shouldShowApps = orgId && typeof orgId === "string" && orgId.length > 0;

  // Enhanced loading and error handling with shimmer effects
  if (uLoading || uError || !user) {
    return (
      <Sidebar collapsible="icon" {...sidebarProps}>
        <SidebarHeader>
          <div className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
              </div>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <div className="space-y-2 p-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-3 p-2">
                <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse flex-1"></div>
              </div>
            ))}
          </div>
        </SidebarContent>
        <SidebarFooter>
          <div className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
              </div>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>
    );
  }

  // Only show app loading states if we're actually trying to fetch apps
  if (shouldShowApps && (aLoading || aError)) {
    return (
      <Sidebar collapsible="icon" {...sidebarProps}>
        <SidebarHeader>
          <div className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
              </div>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <NavMain items={[]} />
        </SidebarContent>
        <SidebarFooter>
          <NavUser
            user={{
              name: user.username,
              email: user.email,
              avatar: user.image || "",
            }}
          />
        </SidebarFooter>
      </Sidebar>
    );
  }

  // Ensure arrays are never null/undefined
  const safeOrganizations = organizations || [];
  const safeApps = shouldShowApps ? apps || [] : [];

  const teams: Team[] =
    teamsOverride ??
    (isOrgMode
      ? safeOrganizations.map((o) => ({
          id: o.id,
          name: o.name,
          logo: o.imageUrl || SquareTerminal,
        }))
      : safeApps.map((a) => ({
          id: a.id,
          name: a.name,
          logo:
            a.brandingSettings?.customLogo ||
            a.generalSettings?.logoUrl ||
            SquareTerminal,
        })));
  const activeId = isOrgMode ? orgId : appId;

  const onSelect = (newId: string) =>
    isOrgMode
      ? router.push(`/dashboard/${newId}`)
      : router.push(`/dashboard/${orgId}/app/${newId}`);

  const renderCreateItem = () =>
    isOrgMode ? (
      <CreateOrgModal
        trigger={
          <div className="flex w-full items-center gap-2 p-2 text-sm cursor-pointer hover:bg-accent rounded-md">
            <Plus className="h-4 w-4 text-muted-foreground" />
            <span>Create organization</span>
          </div>
        }
        onCreated={() => window.location.reload()}
      />
    ) : (
      <CreateAppModal
        trigger={
          <div className="flex w-full items-center gap-2 p-2 text-sm cursor-pointer hover:bg-accent rounded-md">
            <Plus className="h-4 w-4 text-muted-foreground" />
            <span>Create app</span>
          </div>
        }
        onCreated={() => refetchApps()}
        organizationId={orgId}
      />
    );

  const navItems: NavItem[] =
    navOverride ??
    (isOrgMode
      ? [
          {
            title: "My Apps",
            url: `/dashboard/${orgId}`,
            icon: SquareTerminal,
            isActive: pathname === `/dashboard/${orgId}`,
          },
          {
            title: "Settings",
            url: `/dashboard/${orgId}/settings`,
            icon: Settings2,
            isActive: pathname === `/dashboard/${orgId}/settings`,
          },
        ]
      : [
          {
            title: "Apps",
            url: `/dashboard/${orgId}/app/${appId}`,
            icon: SquareTerminal,
            isActive: pathname === `/dashboard/${orgId}/app/${appId}`,
          },
          {
            title: "Users",
            url: `/dashboard/${orgId}/app/${appId}/users`,
            icon: Bot,
            isActive: pathname.endsWith("/users"),
          },
          {
            title: "Logs",
            url: `/dashboard/${orgId}/app/${appId}/logs`,
            icon: BookOpen,
            isActive: pathname.endsWith("/logs"),
          },
          {
            title: "Settings",
            url: `/dashboard/${orgId}/app/${appId}/settings`,
            icon: Settings2,
            isActive: pathname.endsWith("/settings"),
          },
        ]);

  return (
    <Sidebar collapsible="icon" {...sidebarProps}>
      <SidebarHeader>
        <TeamSwitcher
          teams={teams}
          activeId={activeId}
          onSelect={onSelect}
          renderCreateItem={renderCreateItem}
        />
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser
          user={{
            name: user.username,
            email: user.email,
            avatar: user.image || "",
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
