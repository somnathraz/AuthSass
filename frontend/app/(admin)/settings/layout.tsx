import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account Settings - SecureAuth SaaS",
  description: "Manage your account security, password, email, notifications, and privacy settings in your SecureAuth account",
  keywords: ["settings", "account security", "password", "email", "notifications", "privacy", "2FA"],
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 