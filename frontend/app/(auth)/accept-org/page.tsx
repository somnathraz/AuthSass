// src/app/accept-org-invite/page.tsx
"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAcceptInvite } from "@/services/authService";
import { PageLoader } from "@/components/ui/loading";

function AcceptOrgInviteContent() {
  const token = useSearchParams().get("token") || "";
  const router = useRouter();

  const [needsSetup, setNeedsSetup] = useState(false);
  const [triedAutoJoin, setTriedAutoJoin] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");

  const { acceptInvite, loading, error } = useAcceptInvite();

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
      
      acceptInvite(token)
        .then((res) => {
          const inviteData = res.data?.acceptInvite;
          
          if (!inviteData) {
            setFormError('Invalid response from server');
            return;
          }
          
          if (inviteData.userExists === false) {
            // User doesn't exist, show setup form
            setNeedsSetup(true);
            return;
          }

          // User exists and was added to org, redirect to org
          if (inviteData.organizationId) {
            router.replace(`/dashboard/${inviteData.organizationId}`);
          } else {
            throw new Error("Invalid response from server");
          }
        })
        .catch((err: unknown) => {
          if (err instanceof Error) {
            if (err.message.includes('Must supply username')) {
              setNeedsSetup(true);
            } else if (err.message.includes('Invalid or expired')) {
              setFormError('This invitation link is invalid or has expired. Please request a new invitation.');
            } else if (err.message.includes('Network Error') || err.message.includes('fetch')) {
              setFormError('Unable to connect to server. Please check your internet connection and try again.');
            } else if (err.message.includes('UNAUTHENTICATED')) {
              setFormError('Authentication error. Please try refreshing the page.');
            } else {
              setFormError(`Error: ${err.message}`);
            }
          } else {
            setFormError('An unexpected error occurred. Please try again.');
          }
        });
    }
  }, [triedAutoJoin, token, acceptInvite, router]);

  // final join for new users
  const handleSetupJoin = async () => {
    try {
      // Reset form error
      setFormError("");

      // Validate inputs
      if (!username.trim()) {
        setFormError("Username is required");
        return;
      }
      if (!password) {
        setFormError("Password is required");
        return;
      }
      if (password !== confirmPassword) {
        setFormError("Passwords do not match");
        return;
      }
      if (password.length < 8) {
        setFormError("Password must be at least 8 characters long");
        return;
      }

      const res = await acceptInvite(token, username.trim(), password);

      if (res.data?.acceptInvite?.organizationId) {
        // For organization invites, redirect to the organization dashboard
        router.replace(`/dashboard/${res.data.acceptInvite.organizationId}`);
      } else if (res.data?.acceptInvite?.appId) {
        // For app invites, redirect to the specific app
        router.replace(`/dashboard/${res.data.acceptInvite.organizationId}/apps/${res.data.acceptInvite.appId}`);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError("An unexpected error occurred");
      }
    }
  };

  if (!needsSetup && !formError) {
    return (
      <PageLoader 
        title="Processing Invitation" 
        description="Please wait while we process your invitation"
      />
    );
  }

  if (formError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Invitation Error</h1>
            <p className="text-gray-600 mb-6">{formError}</p>
            <button 
              onClick={() => router.push('/login')}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full mx-auto p-8 bg-white rounded-lg shadow-lg space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Complete Your Account Setup
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Create your account to accept the invitation
          </p>
        </div>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <Input
              id="username"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <Input
              id="password"
              type="password"
              placeholder="Choose a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full"
            />
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full"
            />
          </div>

          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{formError}</p>
            </div>
          )}

          <Button
            onClick={handleSetupJoin}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Creating Account...</span>
              </div>
            ) : (
              "Complete Setup"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AcceptOrgInvitePage() {
  return (
    <Suspense fallback={
      <PageLoader 
        title="Loading Invitation" 
        description="Please wait while we load your invitation"
      />
    }>
      <AcceptOrgInviteContent />
    </Suspense>
  );
}
