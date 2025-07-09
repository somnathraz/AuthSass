import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile - SecureAuth SaaS",
  description: "Manage your profile information, avatar, and personal details in your SecureAuth account",
  keywords: ["profile", "account", "avatar", "personal information", "user settings"],
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 