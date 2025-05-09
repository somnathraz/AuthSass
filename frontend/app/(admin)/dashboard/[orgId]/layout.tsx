// app/dashboard/[orgId]/layout.tsx
"use client";

import React from "react";
import { useParams, usePathname } from "next/navigation";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Navbar } from "@/components/accountNav/AccountNav";
import { useUserAndOrg } from "@/services/authService";
import { Settings2, SquareTerminal, User } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { useOrgAccessGuard } from "@/hooks/useOrgAccessGuard";

export default function DashboardOrgLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useOrgAccessGuard();
  const { orgId } = useParams<{ orgId: string }>();
  const pathname = usePathname();
  const { user, organizations, loading, error } = useUserAndOrg();

  if (loading) return <div>Loading your profile…</div>;
  if (error) return <div className="text-red-600">Error: {error.message}</div>;
  if (!user) return <div className="text-gray-600">No user data.</div>;

  // Nav props
  const userProp = {
    name: user.username,
    email: user.email,
    image: user.image || "/user.png",
  };

  const teams = organizations.map((o) => ({
    id: o.id,
    name: o.name,
    logo: SquareTerminal,
    plan: "",
  }));

  const orgNav = [
    {
      title: "My Apps",
      url: `/dashboard/${orgId}`,
      icon: SquareTerminal,
      isActive: pathname === `/dashboard/${orgId}`,
    },
    {
      title: "Users",
      url: `/dashboard/${orgId}/users`,
      icon: User,
      isActive: pathname === `/dashboard/${orgId}/users`,
    },
    {
      title: "Settings",
      url: `/dashboard/${orgId}/settings`,
      icon: Settings2,
      isActive: pathname === `/dashboard/${orgId}/settings`,
    },
  ];

  // detect if URL is an "app" page: e.g. /dashboard/:orgId/:appId or deeper
  const segments = pathname.split("/").filter(Boolean);
  // ["dashboard", orgId, ...rest]
  const isAppPage =
    segments.length >= 3 && !["users", "settings"].includes(segments[2]);

  return (
    <SidebarProvider>
      <AppSidebar
        // only override teams/nav when *not* on an individual app page
        {...(!isAppPage ? { teamsOverride: teams, navOverride: orgNav } : {})}
      />
      <SidebarInset>
        <Navbar logoText="SA" user={userProp} />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
