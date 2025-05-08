// src/app/accept-invite/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAcceptInvite } from "@/services/authService";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AcceptInvitePage() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { acceptInvite: accept, loading, error } = useAcceptInvite();

  const handleClick = async () => {
    if (!username || !password) {
      alert("Please choose a username and password.");
      return;
    }
    const result = await accept(token, username, password);
    if (result.data) {
      const { appId, organizationId } = result.data.acceptInvite;
      router.push(`/dashboard/${organizationId}/app/${appId}`);
    }
  };

  return (
    <div className="max-w-md mx-auto py-10 space-y-4">
      <h1 className="text-2xl font-semibold">Join our App</h1>
      {error && <p className="text-red-500">{error.message}</p>}

      <Input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <Input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <Button onClick={handleClick} disabled={loading}>
        {loading ? "Processing…" : "Complete Signup & Join"}
      </Button>
    </div>
  );
}
