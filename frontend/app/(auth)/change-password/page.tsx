// app/change-password/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useChangePassword } from "@/services/authService";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const { changePassword, loading, error } = useChangePassword();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    if (newPassword !== confirmPassword) {
      setFormError("New passwords don't match");
      return;
    }
    
    if (newPassword.length < 6) {
      setFormError("New password must be at least 6 characters");
      return;
    }
    
    try {
      await changePassword(currentPassword, newPassword, confirmPassword);
      // once they've changed it, send them into the dashboard
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-md mx-auto py-10">
      <h1 className="text-2xl mb-4">Change Your Password</h1>
      {error && <p className="text-red-500">{error.message}</p>}
      {formError && <p className="text-red-500">{formError}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="current">Current Password</Label>
          <Input
            id="current"
            type="password"
            value={currentPassword}
            onChange={(e) => {
              setCurrentPassword(e.target.value);
              setFormError(null);
            }}
            required
          />
        </div>
        <div>
          <Label htmlFor="new">New Password</Label>
          <Input
            id="new"
            type="password"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              setFormError(null);
            }}
            required
          />
        </div>
        <div>
          <Label htmlFor="confirm">Confirm New Password</Label>
          <Input
            id="confirm"
            type="password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setFormError(null);
            }}
            required
          />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? "Changing Password…" : "Change Password"}
        </Button>
      </form>
    </div>
  );
}
