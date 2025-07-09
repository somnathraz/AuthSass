// app/reset-password/page.tsx
"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useResetPassword } from "@/services/authService";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

function ResetPasswordContent() {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const router = useRouter();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const { resetPassword, loading, error, data } = useResetPassword();

  useEffect(() => {
    if (data?.resetPassword?.success) {
      // after success, redirect to login
      router.push("/login");
    }
  }, [data, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    if (newPassword !== confirmPassword) {
      setFormError("Passwords do not match");
      return;
    }
    
    if (newPassword.length < 6) {
      setFormError("Password must be at least 6 characters");
      return;
    }
    
    await resetPassword(token, newPassword, confirmPassword);
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Reset Password</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="new">New Password</Label>
          <Input
            id="new"
            type="password"
            required
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              setFormError(null);
            }}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="confirm">Confirm Password</Label>
          <Input
            id="confirm"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setFormError(null);
            }}
            className="mt-1"
          />
        </div>
        {formError && <p className="text-red-600">{formError}</p>}
        {error && <p className="text-red-600">{error.message}</p>}
        <Button type="submit" disabled={loading}>
          {loading ? "Resetting…" : "Reset Password"}
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg">Loading...</p>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
