// app/page.tsx
"use client";

import React from "react";
import { Navbar } from "@/components/accountNav/AccountNav";
import { useUserAndOrg } from "@/services/authService";
import { useSearchParams } from "next/navigation";
import { ApplicationsView } from "@/components/ApplicationsView/ApplicationsView";

export default function Page() {
  const { user, organizations, loading, error } = useUserAndOrg();
  const params = useSearchParams();
  const selectedId = params.get("org") ?? organizations[0]?.id;
  // console.log("====================================");
  // console.log(user, organizations);
  // console.log("====================================");
  if (loading) {
    return <div>Loading your profile…</div>;
  }
  if (error) {
    return <div className="text-red-600">Error: {error.message}</div>;
  }
  if (!user) {
    return <div className="text-gray-600">No user data.</div>;
  }

  // 1) Map your API `user` → Navbar.user
  const userProp = {
    name: user.username,
    email: user.email,
    image: user.image || "/user.png",
  };

  // 2) Map the array of orgs → Navbar.organizations

  // 3) Pick your “current” org (first in the list, or fallback)
  // Find the org matching the URL or default to the first

  // Map straight through:
  const orgProps = organizations.map((o) => ({
    id: o.id,
    name: o.name,
    imageUrl: o.imageUrl || "/user.png",
  }));

  const currentOrg =
    organizations.find((o) => o.id === selectedId) ?? organizations[0];
  return (
    <div className="w-full">
      <Navbar
        logoText="SA"
        user={userProp}
        currentOrg={currentOrg}
        organizations={orgProps}
      />
      <ApplicationsView />
    </div>
  );
}
