"use client";

import React from "react";
import { UserProfile } from "@/components/user/UserProfile";
import { useCurrentUser, useUpdateProfile, useUpdateAvatar } from "@/services/profile.service";
import { PageLoader } from "@/components/ui/loading";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, User } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const { user, loading, error, refetch } = useCurrentUser();
  const { updateProfile } = useUpdateProfile();
  const { updateAvatar } = useUpdateAvatar();

  if (loading) {
    return (
      <PageLoader 
        title="Redirecting to Dashboard..." 
        description="Please wait while we redirect you to the dashboard"
      />
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-destructive">Error Loading Profile</h2>
          <p className="text-muted-foreground">Unable to load your profile information</p>
          <button 
            onClick={() => refetch()} 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold">Not Authenticated</h2>
          <p className="text-muted-foreground">Please sign in to view your profile</p>
        </div>
      </div>
    );
  }

  const handleUpdateProfile = async (data: any) => {
    try {
      await updateProfile(data);
      // Refetch to get the latest data
      refetch();
    } catch (error) {
      console.error("Failed to update profile:", error);
      throw error;
    }
  };

  const handleAvatarUpload = async (file: File) => {
    try {
      // For now, we'll simulate upload and generate a simple avatar
      console.log("File selected for upload:", file);
      
      // Generate a simple initials avatar
      const name = user.username || "User";
      const words = name.trim().split(/\s+/);
      let initials;
      if (words.length >= 2) {
        initials = `${words[0][0]}${words[1][0]}`.toUpperCase();
      } else if (words[0] && words[0].length >= 2) {
        initials = words[0].substring(0, 2).toUpperCase();
      } else {
        initials = words[0]?.[0]?.toUpperCase() || 'U';
      }
      
      const svg = `
        <svg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
          <circle cx="40" cy="40" r="40" fill="#45B7D1"/>
          <text x="40" y="50" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
                font-size="24" font-weight="600" text-anchor="middle" fill="#FFFFFF">${initials}</text>
        </svg>
      `;
      
      const avatarUrl = `data:image/svg+xml;base64,${btoa(svg)}`;
      await updateAvatar({ avatar: avatarUrl });
      
      // Refetch to get the latest data
      refetch();
      
      return avatarUrl;
    } catch (error) {
      console.error("Failed to upload avatar:", error);
      throw error;
    }
  };

  // Generate default avatar if none exists
  const getDefaultAvatar = () => {
    const name = user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}` 
      : user.username;
    
    // Generate initials
    const words = (name || "User").trim().split(/\s+/);
    let initials;
    if (words.length >= 2) {
      initials = `${words[0][0]}${words[1][0]}`.toUpperCase();
    } else if (words[0] && words[0].length >= 2) {
      initials = words[0].substring(0, 2).toUpperCase();
    } else {
      initials = words[0]?.[0]?.toUpperCase() || 'U';
    }
    
    // Generate clean SVG avatar
    const svg = `
      <svg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <circle cx="40" cy="40" r="40" fill="#4ECDC4"/>
        <text x="40" y="50" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
              font-size="24" font-weight="600" text-anchor="middle" fill="#FFFFFF">${initials}</text>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  };

  const userProfileData = {
    id: user.id,
    username: user.username,
    email: user.email,
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    bio: user.bio || "",
    location: user.location || "",
    website: user.website || "",
    avatar: user.profileImage || getDefaultAvatar(),
    role: user.role,
    isVerified: user.isVerified || false,
    joinedAt: user.createdAt,
    lastLoginAt: user.lastLoginAt || undefined
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard" className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Link>
            </Button>
          </div>
          
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard" className="flex items-center space-x-1">
                  <Home className="h-4 w-4" />
                  <span>Dashboard</span>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="flex items-center space-x-1">
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground">
            Manage your profile information and preferences
          </p>
        </div>
        
        <UserProfile
          user={userProfileData}
          isOwner={true}
          onUpdateProfile={handleUpdateProfile}
          onAvatarUpload={handleAvatarUpload}
        />
      </div>
    </div>
  );
} 