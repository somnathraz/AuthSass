// app/dashboard/[orgId]/layout.tsx
"use client";

import React from "react";
import { useParams } from "next/navigation";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Navbar } from "@/components/accountNav/AccountNav";
import { useUserAndOrg } from "@/services/authService";
import { Settings2, SquareTerminal, User } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
export default function DashboardOrgLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { orgId } = useParams<{ orgId: string }>();
  const { user, organizations, loading, error } = useUserAndOrg();

  if (loading) return <div>Loading your profile…</div>;
  if (error) return <div className="text-red-600">Error: {error.message}</div>;
  if (!user) return <div className="text-gray-600">No user data.</div>;

  // map user → Navbar props
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

  // sidebar nav items for "org" level
  const orgNav = [
    {
      title: "My Apps",
      url: `/dashboard/${orgId}`,
      icon: SquareTerminal,
      isActive: window.location.pathname === `/dashboard/${orgId}`,
    },
    {
      title: "Users",
      url: `/dashboard/${orgId}/users`,
      icon: User,
      isActive: window.location.pathname === `/dashboard/${orgId}/users`,
    },
    {
      title: "Settings",
      url: `/dashboard/${orgId}/settings`,
      icon: Settings2,
      isActive: window.location.pathname === `/dashboard/${orgId}/setting`,
    },
  ];

  return (
    <SidebarProvider>
      <AppSidebar teamsOverride={teams} navOverride={orgNav} />
      <SidebarInset>
        <Navbar logoText="SA" user={userProp} />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
