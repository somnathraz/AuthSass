import SignUpForm from "@/components/auth/SignUpForm";
import { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Next.js SignUp Page | TailAdmin - Next.js Dashboard Template",
  description: "This is Next.js SignUp Page TailAdmin Dashboard Template",
  // other metadata
};

export default async function SignUp() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  // If token exists, redirect to home/dashboard.
  if (token) {
    redirect("/");
  }
  return <SignUpForm />;
}
