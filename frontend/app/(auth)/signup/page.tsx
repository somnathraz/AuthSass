import { SignupForm } from "@/components/Signup/Signup-from";
import { GalleryVerticalEnd } from "lucide-react";
import { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Signup Page | SecureAuth",
  description: "This is Signup Page SecureAuth",
};

export default async function SignupPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  // If token exists, redirect to home/dashboard.
  if (token) {
    redirect("/dashboard");
  }
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="size-4" />
          </div>
          SecureAuth inc.
        </a>
        <SignupForm />
      </div>
    </div>
  );
}
