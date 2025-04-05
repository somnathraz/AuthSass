import ApiKeys from '@/components/ApiKeys/ApiKeys'
import React from 'react'
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";


export const metadata: Metadata = {
  title:
    "Next.js E-commerce Dashboard | TailAdmin - Next.js Dashboard Template",
  description: "This is Next.js Home for TailAdmin Dashboard Template",
};

const page = async() => {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
 
 if (!token) {
   redirect("/signin");
 }
  return (
   <ApiKeys/>
  )
}

export default page