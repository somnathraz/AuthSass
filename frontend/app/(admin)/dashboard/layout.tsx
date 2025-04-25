import React from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Protected dashboard for SecureAuth",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    // If no token, redirect to signin page
    redirect("/login");
  }

  return <div className="min-h-screen xl:flex">{children}</div>;
}
