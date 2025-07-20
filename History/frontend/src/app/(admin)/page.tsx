import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Home from "@/components/Home/Home";

export const metadata: Metadata = {
  title:
    "Next.js E-commerce Dashboard | TailAdmin - Next.js Dashboard Template",
  description: "This is Next.js Home for TailAdmin Dashboard Template",
};

export default async function Ecommerce() {
   // This code runs on the server
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
   
   if (!token) {
     redirect("/signin");
   }
 
  return <Home/>;
}
