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

  const {
    apps,
    loading: aLoading,
    error: aError,
    refetch: refetchApps,
  } = useFetchApp(orgId);

  const isOrgMode = !params.appId;

  if (uLoading) return <div>Loading user…</div>;
  if (uError) return <div className="text-red-600">Error loading user</div>;
  if (!user) return null;

  if (!isOrgMode && aLoading) return <div>Loading apps…</div>;
  if (!isOrgMode && aError)
    return <div className="text-red-600">Error loading apps</div>;

  const teams: Team[] =
    teamsOverride ??
    (isOrgMode
      ? organizations.map((o) => ({
          id: o.id,
          name: o.name,
          logo: SquareTerminal,
        }))
      : apps.map((a) => ({ id: a.id, name: a.name, logo: SquareTerminal })));

  const activeId = isOrgMode ? orgId : appId;

  const onSelect = (newId: string) =>
    isOrgMode
      ? router.push(`/dashboard/${newId}`)
      : router.push(`/dashboard/${orgId}/app/${newId}`);

  const renderCreateItem = () =>
    isOrgMode ? (
      <CreateOrgModal
        trigger={
          <button className="flex w-full items-center gap-2 p-2 text-sm">
            <Plus className="h-4 w-4 text-muted-foreground" />
            <span>Create organization</span>
          </button>
        }
        onCreated={() => window.location.reload()}
      />
    ) : (
      <CreateAppModal
        trigger={
          <button className="flex w-full items-center gap-2 p-2 text-sm">
            <Plus className="h-4 w-4 text-muted-foreground" />
            <span>Create app</span>
          </button>
        }
        onCreated={() => refetchApps()}
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
            title: "Account",
            url: "/account",
            icon: Settings2,
            isActive: pathname === "/account",
          },
        ]
      : [
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
            avatar: user.image || "/user.png",
          }}
        />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
