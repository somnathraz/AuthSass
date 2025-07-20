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
import { DashboardLayoutShimmer } from "@/components/ui/loading";

export default function DashboardOrgLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // CRITICAL: All hooks must be called before any conditional logic
  useOrgAccessGuard();
  const { orgId } = useParams<{ orgId: string }>();
  const pathname = usePathname();
  const { user, organizations, loading, error } = useUserAndOrg();

  // Handle loading state
  if (loading) {
    return <DashboardLayoutShimmer />;
  }

  // Handle error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Error Loading Dashboard
            </h1>
            <p className="text-gray-600 mb-6">Error: {error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  // Handle no user state - show shimmer instead of error
  if (!user) {
    return <DashboardLayoutShimmer />;
  }

  // All hooks have been called, now we can safely process the data
  const userProp = {
    name: user.username,
    email: user.email,
    image: user.image || "/user.png",
  };

  const teams = organizations.map((o) => ({
    id: o.id,
    name: o.name,
    logo: o.imageUrl || SquareTerminal, // Use imageUrl if available, otherwise fallback to icon
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
