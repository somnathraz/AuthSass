// src/components/AppSidebar.tsx
"use client";

import * as React from "react";
import { BookOpen, Bot, Settings2, SquareTerminal } from "lucide-react";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useParams, useRouter, usePathname } from "next/navigation";
import { useFetchApp, useUserAndOrg } from "@/services/authService";

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();

  const orgIdRaw = params.orgId;
  const appIdRaw = params.appId;
  const orgId = Array.isArray(orgIdRaw) ? orgIdRaw[0] : orgIdRaw ?? "personal";
  const appId = Array.isArray(appIdRaw) ? appIdRaw[0] : appIdRaw ?? "";
  const { user, loading: userLoading, error: userError } = useUserAndOrg();
  const {
    apps,
    loading: appsLoading,
    error: appsError,
    refetch,
  } = useFetchApp(orgId);

  // Don't try to read user.username until it's loaded
  if (userLoading) return <div>Loading…</div>;
  if (userError || !user)
    return <div className="text-red-600">Error loading user</div>;

  if (appsLoading) return <div>Loading apps…</div>;
  if (appsError) return <div className="text-red-600">Error loading apps</div>;
  const userProp = {
    name: user.username,
    email: user.email,
    avatar: user.image || "/user.png",
  };
  const teams = apps.map((app) => ({
    id: app.id,
    name: app.name,
    logo: SquareTerminal,
    plan: "",
  }));

  const navMain = [
    {
      title: "Home",
      url: `/dashboard/${orgId}${appId ? `/app/${appId}` : ""}`,
      icon: SquareTerminal,
      isActive:
        pathname === `/dashboard/${orgId}` ||
        pathname.startsWith(`/dashboard/${orgId}/app/`),
    },
    {
      title: "Users",
      url: `/dashboard/${orgId}/app/${appId}/users`,
      icon: Bot,
      isActive: pathname === `/dashboard/${orgId}/app/${appId}/users`,
    },
    {
      title: "Logs",
      url: `/dashboard/${orgId}/app/${appId}/users`,
      icon: BookOpen,
      isActive: pathname === `/dashboard/${orgId}/app/${appId}/logs`,
    },
    {
      title: "Settings",
      url: `/dashboard/${orgId}/app/${appId}/settings`,
      icon: Settings2,
      isActive: pathname === `/dashboard/${orgId}/app/${appId}/settings`,
    },
  ];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher
          teams={teams}
          activeId={appId}
          onSelect={(newAppId) =>
            router.push(`/dashboard/${orgId}/app/${newAppId}`)
          }
          onAppCreated={() => refetch()}
        />
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={userProp} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
