"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@apollo/client";
import { GET_ME } from "@/graphql/auth.queries";
import { PageLoader } from "@/components/ui/loading";

interface MeQuery {
  me: {
    id: string;
    username: string;
    email: string;
    organizationId?: string;
  } | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const { data, loading, error } = useQuery<MeQuery>(GET_ME);

  useEffect(() => {
    if (data?.me?.organizationId) {
      console.log("Redirecting to organization dashboard:", data.me.organizationId);
      router.replace(`/dashboard/${data.me.organizationId}`);
    } else if (data?.me && !data.me.organizationId) {
      console.error("User has no organization ID, staying on general dashboard");
      // Could show an error message or create organization flow here
    }
  }, [data, router]);

  if (loading) {
    return (
      <PageLoader 
        title="Loading Dashboard..." 
        description="Setting up your workspace"
      />
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Dashboard</h1>
            <p className="text-gray-600 mb-6">Failed to load user data: {error.message}</p>
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

  if (data?.me && !data.me.organizationId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m11 0a2 2 0 01-2 2H7a2 2 0 01-2-2m14 0V9a2 2 0 00-2-2M9 7h6m-6 4h6m-6 4h6m-6 4h6" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">No Organization Found</h1>
            <p className="text-gray-600 mb-6">
              Your account doesn't have an associated organization. Please contact support.
            </p>
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
    <PageLoader 
      title="Redirecting..." 
      description="Taking you to your dashboard"
    />
  );
} 