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
import { SpinnerLoader, PageLoader } from "@/components/ui/loading";

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

  // Enhanced loading and error handling
  if (uLoading) {
    return (
      <Sidebar collapsible="icon" {...sidebarProps}>
        <SidebarContent>
          <div className="flex items-center justify-center py-8">
            <SpinnerLoader text="Loading user..." />
          </div>
        </SidebarContent>
      </Sidebar>
    );
  }

  if (uError) {
    return (
      <Sidebar collapsible="icon" {...sidebarProps}>
        <SidebarContent>
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="text-red-600 text-sm text-center">
              Error loading user
            </div>
            <button
              onClick={() => window.location.reload()}
              className="text-xs text-blue-600 hover:underline"
            >
              Try again
            </button>
          </div>
        </SidebarContent>
      </Sidebar>
    );
  }

  if (!user) {
    return (
      <Sidebar collapsible="icon" {...sidebarProps}>
        <SidebarContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">
              Not authenticated
            </div>
          </div>
        </SidebarContent>
      </Sidebar>
    );
  }

  // Only show app loading states if we're actually trying to fetch apps
  if (shouldShowApps && aLoading) {
    return (
      <Sidebar collapsible="icon" {...sidebarProps}>
        <SidebarHeader>
          <div className="p-4">
            <SpinnerLoader text="Loading apps..." />
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

  if (shouldShowApps && aError) {
    return (
      <Sidebar collapsible="icon" {...sidebarProps}>
        <SidebarHeader>
          <div className="p-4">
            <div className="text-red-600 text-sm">Error loading apps</div>
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
  // In app mode, we always want to show the apps for the dropdown
  safeOrganizations.forEach((org, idx) => {
    console.log(`[Org ${idx}] name:`, org.name);
    console.log(`[Org ${idx}] imageUrl:`, org.imageUrl);
    console.log(`[Org ${idx}] logo fallback used:`, !org.imageUrl);
  });
  const safeApps = shouldShowApps ? apps || [] : [];
  safeApps.forEach((app, idx) => {
    console.log(`[App ${idx}] name:`, app);
  });
  console.log(isOrgMode, teamsOverride, "isOrgMode");

  const teams: Team[] =
    teamsOverride ??
    (isOrgMode
      ? safeOrganizations.map((o, i) => {
          const useFallback = !o.imageUrl;
          console.log(`[TeamMap ${i}] name: ${o.name}`);
          console.log(`[TeamMap ${i}] imageUrl:`, o.imageUrl);
          console.log(`[TeamMap ${i}] logo fallback used:`, useFallback);
          console.log(o.imageUrl, "o.imageUrl");
          return {
            id: o.id,
            name: o.name,
            logo: o.imageUrl || SquareTerminal,
          };
        })
      : safeApps.map((a) => ({
          id: a.id,
          name: a.name,
          logo:
            a.brandingSettings?.customLogo ||
            a.generalSettings?.logoUrl ||
            SquareTerminal,
        })));
  teams.forEach((team, idx) => {
    console.log(`[Team ${idx}] name:`, team.name);
    console.log(`[Team ${idx}] logo:`, team.logo);
    console.log(`[Team ${idx}] logo typeof:`, typeof team.logo);
  });
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
