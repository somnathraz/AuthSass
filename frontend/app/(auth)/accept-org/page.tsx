// src/app/accept-org-invite/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAcceptOrganizationInvite } from "@/services/authService";

export default function AcceptOrgInvitePage() {
  const params = useSearchParams();
  const token = params.get("token");
  const router = useRouter();

  const { acceptOrganizationInvite, loading, error } =
    useAcceptOrganizationInvite();

  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  // Redirect if no token
  useEffect(() => {
    if (!token) router.replace("/login");
  }, [token, router]);

  const handleAccept = async () => {
    if (!token) return;
    try {
      const result = await acceptOrganizationInvite({
        token,
        // only send username/password when provided
        username: username || undefined,
        password: password || undefined,
      });

      // result.data.acceptOrganizationInvite.user.organizationId
      const orgId = result.data?.acceptOrganizationInvite.user.organizationId;
      if (!orgId) throw new Error("Could not join organization.");

      router.push(`/dashboard/${orgId}`);
    } catch (err: unknown) {
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
