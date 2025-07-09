"use client";
import React from "react";
import { useAppAccessGuard } from "@/hooks/useAppAccessGuard";

export default function DashboardAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useAppAccessGuard();
  return (
    <div className="w-full">
      {children}
    </div>
  );
}
