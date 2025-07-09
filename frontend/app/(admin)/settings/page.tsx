"use client";

import React from "react";
import { AccountSettings } from "@/components/user/AccountSettings";
import { 
  useCurrentUser, 
  useUpdatePassword,
  useUpdateEmail, 
  useUpdateUserSettings,
  useDeleteAccount,
  useExportUserData
} from "@/services/profile.service";
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
import { ArrowLeft, Home, Settings } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const { user, loading, error, refetch } = useCurrentUser();
  const { updatePassword } = useUpdatePassword();
  const { updateEmail } = useUpdateEmail();
  const { updateUserSettings } = useUpdateUserSettings();
  const { deleteAccount } = useDeleteAccount();
  const { exportUserData } = useExportUserData();

  if (loading) {
    return (
      <PageLoader 
        title="Loading Settings..." 
        description="Please wait while we load your account settings"
      />
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-destructive">Error Loading Settings</h2>
          <p className="text-muted-foreground">Unable to load your account settings</p>
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
          <p className="text-muted-foreground">Please sign in to view your settings</p>
        </div>
      </div>
    );
  }

  // Extract security settings from user preferences
  const securitySettings = {
    twoFactorEnabled: false, // TODO: Add 2FA to user model
    emailNotifications: user.preferences?.notifications?.email ?? true,
    securityAlerts: user.preferences?.notifications?.email ?? true,
    loginNotifications: user.preferences?.notifications?.email ?? false,
    marketingEmails: user.preferences?.notifications?.email ?? true
  };

  const handleUpdatePassword = async (currentPassword: string, newPassword: string) => {
    try {
      await updatePassword({ currentPassword, newPassword });
      // Show success message (you might want to add a toast notification system)
      alert("Password updated successfully!");
    } catch (error) {
      console.error("Failed to update password:", error);
      throw error;
    }
  };

  const handleUpdateEmail = async (newEmail: string, password: string) => {
    try {
      await updateEmail({ newEmail, password });
      // Refetch user data to show updated email
      refetch();
      // Show success message
      alert("Email updated successfully!");
    } catch (error) {
      console.error("Failed to update email:", error);
      throw error;
    }
  };

  const handleUpdateSecuritySettings = async (settings: any) => {
    try {
      // Map the settings to the expected format
      const settingsInput = {
        emailNotifications: settings.emailNotifications,
        securityAlerts: settings.securityAlerts,
        loginNotifications: settings.loginNotifications,
        marketingEmails: settings.marketingEmails
      };
      
      await updateUserSettings(settingsInput);
      // Refetch user data to show updated settings
      refetch();
    } catch (error) {
      console.error("Failed to update security settings:", error);
      throw error;
    }
  };

  const handleDeleteAccount = async (confirmation: string, password: string) => {
    try {
      await deleteAccount({ confirmation, password });
      // The deleteAccount hook already handles redirection
    } catch (error) {
      console.error("Failed to delete account:", error);
      throw error;
    }
  };

  const handleExportData = async () => {
    try {
      await exportUserData();
      // The exportUserData hook already handles the file download
    } catch (error) {
      console.error("Failed to export data:", error);
      throw error;
    }
  };

  const handleEnable2FA = async () => {
    // TODO: Implement 2FA setup
    console.log("Setting up 2FA");
    alert("2FA setup will be available soon!");
    
    // In real implementation:
    // 1. Generate QR code
    // 2. Show setup modal
    // 3. Verify with TOTP code
    // await setup2FA();
  };

  const handleDisable2FA = async (password: string) => {
    // TODO: Implement 2FA disable
    console.log("Disabling 2FA");
    alert("2FA disable will be available soon!");
    
    // In real implementation:
    // await disable2FA({ password });
  };

  const userSettingsData = {
    id: user.id,
    email: user.email,
    username: user.username,
    isEmailVerified: user.isVerified || false,
    role: user.role,
    createdAt: user.createdAt
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
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Account Settings</h1>
          <p className="text-muted-foreground">
            Manage your account security, preferences, and privacy settings
          </p>
        </div>
        
        <AccountSettings
          user={userSettingsData}
          securitySettings={securitySettings}
          onUpdatePassword={handleUpdatePassword}
          onUpdateEmail={handleUpdateEmail}
          onUpdateSecuritySettings={handleUpdateSecuritySettings}
          onDeleteAccount={handleDeleteAccount}
          onExportData={handleExportData}
          onEnable2FA={handleEnable2FA}
          onDisable2FA={handleDisable2FA}
        />
      </div>
    </div>
  );
} 