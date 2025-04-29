// app/change-password/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useChangePassword } from "@/services/authService";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const { changePassword, loading, error } = useChangePassword();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirm) {
      alert("Passwords don’t match");
      return;
    }
    try {
      await changePassword(newPassword);
      // once they’ve changed it, send them into the dashboard
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-md mx-auto py-10">
      <h1 className="text-2xl mb-4">Set your new password</h1>
      {error && <p className="text-red-500">{error.message}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label>New password</label>
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <div>
          <label>Confirm password</label>
          <Input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving…" : "Save password"}
        </Button>
      </form>
    </div>
  );
}
