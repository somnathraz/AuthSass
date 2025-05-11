// src/app/accept-org-invite/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAcceptOrganizationInvite } from "@/services/authService";

export default function AcceptOrgInvitePage() {
  const token = useSearchParams().get("token") || "";
  const router = useRouter();

  const [needsSetup, setNeedsSetup] = useState(false);
  const [triedAutoJoin, setTriedAutoJoin] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // ✂️ object-destructure, not array:
  const { acceptOrganizationInvite, loading, error } =
    useAcceptOrganizationInvite();

  // redirect if no token
  useEffect(() => {
    if (!token) {
      router.replace("/login");
    }
  }, [token, router]);

  // auto-join attempt for existing users
  useEffect(() => {
    if (!triedAutoJoin && token) {
      setTriedAutoJoin(true);
      acceptOrganizationInvite({ token })
        .then((res) => {
          const orgId = res.data!.acceptOrganizationInvite.user.organizationId;
          router.replace(`/dashboard/${orgId}`);
        })
        .catch((err: unknown) => {
          if (
            err instanceof Error &&
            err.message.includes("Must supply username")
          ) {
            setNeedsSetup(true);
          } else if (err instanceof Error) {
            alert(err.message);
            router.replace("/login");
          }
        });
    }
  }, [triedAutoJoin, token, acceptOrganizationInvite, router]);

  // final join for new users
  const handleSetupJoin = async () => {
    try {
      const res = await acceptOrganizationInvite({ token, username, password });
      const orgId = res.data!.acceptOrganizationInvite.user.organizationId;
      router.replace(`/dashboard/${orgId}`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      }
    }
  };

  if (!needsSetup) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg">Joining organization…</p>
        {loading && <span className="ml-2 animate-pulse">⌛</span>}
        {error && <p className="text-red-500 mt-2">{error.message}</p>}
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">Complete Sign-Up & Join</h1>
      <Input
        placeholder="Choose a username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <Input
        type="password"
        placeholder="Choose a password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button onClick={handleSetupJoin} disabled={loading}>
        {loading ? "Signing up…" : "Sign Up & Join"}
      </Button>
      {error && <p className="text-red-500">{error.message}</p>}
    </div>
  );
}
