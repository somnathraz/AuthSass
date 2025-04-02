import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Next.js SignIn Page | TailAdmin - Next.js Dashboard Template",
  description: "This is Next.js Signin Page TailAdmin Dashboard Template",
};

export default async function SignIn() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  // If token exists, redirect to home/dashboard.
  if (token) {
    redirect("/");
  }
  return <SignInForm />;
}
