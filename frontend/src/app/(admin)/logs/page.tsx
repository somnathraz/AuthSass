import Logs from '@/components/Logs/Logs'
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import React from 'react'

export const metadata: Metadata = {
  title:
    "Next.js E-commerce Dashboard | TailAdmin - Next.js Dashboard Template",
  description: "This is Next.js Home for TailAdmin Dashboard Template",
};

const LogsPage =async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
 
 if (!token) {
   redirect("/signin");
 }
  return (
   <Logs/>
  )
}

export default LogsPage