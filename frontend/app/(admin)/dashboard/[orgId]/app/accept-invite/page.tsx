// app/accept-invite/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@apollo/client";
import { ACCEPT_INVITE } from "@/graphql/mutations";

export default function AcceptInvitePage() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [acceptInvite, { loading, error }] = useMutation(ACCEPT_INVITE, {
    variables: { token, username, password },
    onCompleted: () => router.push("/dashboard"),
  });

  return (
    <div className="max-w-md mx-auto py-10 space-y-4">
      <h1 className="text-2xl font-semibold">Join our App</h1>
      {error && <p className="text-red-500">{error.message}</p>}

      <label className="block">
        <span>Username</span>
        <input
          className="w-full border p-2 rounded mt-1"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </label>

      <label className="block">
        <span>Password</span>
        <input
          type="password"
          className="w-full border p-2 rounded mt-1"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>

      <button
        onClick={() => acceptInvite()}
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded"
      >
        {loading ? "Processing…" : "Complete Signup & Join"}
      </button>
    </div>
  );
}
