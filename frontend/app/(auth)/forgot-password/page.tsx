// app/forgot-password/page.tsx
"use client";

import React, { useState } from "react";
import { useRequestPasswordReset } from "@/services/authService";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const { requestPasswordReset, loading, error } = useRequestPasswordReset();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await requestPasswordReset(email);
    setSent(true);
  };

  if (sent) {
    return (
      <div className="p-6 max-w-md mx-auto">
        <h1 className="text-xl font-bold">Check your inbox</h1>
        <p>
          If an account with <strong>{email}</strong> exists, you’ll receive an
          email with a reset link shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Forgot Password</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1"
          />
        </div>
        {error && <p className="text-red-600">{error.message}</p>}
        <Button type="submit" disabled={loading}>
          {loading ? "Sending…" : "Send reset link"}
        </Button>
      </form>
    </div>
  );
}
