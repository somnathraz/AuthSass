"use client";

import React, { useState, useEffect } from "react";
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
  const [needsSetup, setNeedsSetup] = useState(false);
  const [triedAutoJoin, setTriedAutoJoin] = useState(false);

  const { acceptInvite: accept, loading, error } = useAcceptInvite();

  // Auto-join if user already exists
  useEffect(() => {
    if (!triedAutoJoin && token) {
      setTriedAutoJoin(true);
      console.log("Attempting auto-join with token:", token);

      accept(token)
        .then((result) => {
          const { appId, organizationId } = result.data.acceptInvite;
          router.push(`/dashboard/${organizationId}/app/${appId}`);
        })
        .catch((err: any) => {
          if (err.message.includes("Must supply username")) {
            setNeedsSetup(true); // show form if user doesn't exist
          } else if (err.message.includes("Invalid or expired invitation")) {
            alert("This invitation link is invalid or has expired.");
            router.replace("/login");
          } else {
            alert("Something went wrong: " + err.message);
            router.replace("/login");
          }
        });
    }
  }, [triedAutoJoin, token, accept, router]);

  // Manual join: if user is new
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

  if (!needsSetup) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg">Joining app…</p>
        {loading && <span className="ml-2 animate-pulse">⌛</span>}
        {error && <p className="text-red-500 mt-2">{error.message}</p>}
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-10 space-y-4">
      <h1 className="text-2xl font-semibold">Join our App</h1>
      {error && <p className="text-red-500">{error.message}</p>}

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

      <Button onClick={handleClick} disabled={loading}>
        {loading ? "Processing…" : "Complete Signup & Join"}
      </Button>
    </div>
  );
}
