// src/app/accept-org-invite/page.tsx
"use client";
import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAcceptOrgInvite } from "@/services/authService";

export default function AcceptOrgInvitePage() {
  const params = useSearchParams();
  const token = params.get("token")!;
  const router = useRouter();

  const { accept, loading, error } = useAcceptOrgInvite();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!token) router.replace("/login");
  }, [token, router]);

  const handleAccept = async () => {
    try {
      const payload = await accept(
        token,
        username || undefined,
        password || undefined
      );
      router.push(`/dashboard/${payload.org.id}`);
    } catch (err: unknown) {
      // Narrow `unknown` to something we can display
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "string"
          ? err
          : "An unexpected error occurred";
      alert(message);
    }
  };
  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Accept Organization Invite</h1>
      {error && <p className="text-red-500">{error.message}</p>}

      <Input
        placeholder="Choose a username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="mb-2"
      />
      <Input
        type="password"
        placeholder="Choose a password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="mb-4"
      />
      <Button onClick={handleAccept} disabled={loading}>
        {loading ? "Joining…" : "Join Organization"}
      </Button>
    </div>
  );
}
