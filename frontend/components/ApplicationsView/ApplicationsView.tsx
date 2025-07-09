// src/components/ApplicationsView.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, Users, Key, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateAppModal } from "../CreateAppModal/CreateAppModal";
import { AppList } from "../app/AppList";
import { AppMembers } from "../app/AppMembers";
import { ApiKeyManager } from "../app/ApiKeyManager";
import { EditAppForm } from "../app/EditAppForm";
import { AddAppMemberForm } from "../app/AddAppMemberForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { PageLoader, AppsGridSkeleton } from "@/components/ui/loading";

// Import app service
import {
  useOrganizationApps,
  useCurrentOrganization,
  type Application,
} from "@/services/app.service";

export function ApplicationsView() {
  const { orgId } = useParams<{ orgId: string }>();
  const router = useRouter();
  const currentOrganization = useCurrentOrganization();

  // State for modals and selected app
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [activeModal, setActiveModal] = useState<"members" | "apiKeys" | "edit" | null>(null);
  const [activeTab, setActiveTab] = useState<"members" | "invite">("members");

  // CRITICAL: Always call hooks with consistent parameters to avoid skip condition variations
  // Use empty string as fallback to ensure hook is always called consistently
  const { loading, error, refetch } = useOrganizationApps(orgId || "");

  // Handle organization changes
  useEffect(() => {
    // Clear any selected app state when switching organizations
    setSelectedApp(null);
    setActiveModal(null);
    setActiveTab("members"); // Reset tab state
    
    // Refetch apps for the new organization
    if (orgId) {
      refetch();
    }
  }, [orgId, refetch]);

  const handleAppSelect = (app: Application) => {
    router.push(`/dashboard/${orgId}/app/${app.id}`);
  };

  const handleEditApp = (app: Application) => {
    setSelectedApp(app);
    setActiveModal("edit");
  };

  const handleManageMembers = (app: Application) => {
    setSelectedApp(app);
    setActiveModal("members");
    setActiveTab("members"); // Start with members tab
  };

  const handleManageApiKeys = (app: Application) => {
    setSelectedApp(app);
    setActiveModal("apiKeys");
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedApp(null);
    setActiveTab("members"); // Reset tab state
  };

  const handleAppUpdated = () => {
    console.log('🔄 App updated, closing modal...');
    closeModal();
    
    // CRITICAL FIX: Since we removed caching from useUpdateApp, manually refetch data
    // This ensures the UI shows the updated data
    console.log('🔄 Refetching apps after update...');
    refetch();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Applications</h2>
              <p className="text-gray-600">
                Loading applications in {currentOrganization?.name || "your organization"}...
              </p>
            </div>
          </div>
          
          {/* Apps Grid Skeleton */}
          <AppsGridSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-16">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-semibold text-destructive">Error Loading Applications</h2>
            <p className="text-muted-foreground">
              Unable to load applications: {error.message}
            </p>
            <Button onClick={() => refetch()} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Applications</h2>
          <p className="text-gray-600">
            Manage applications in {currentOrganization?.name || "your organization"}
          </p>
        </div>
        <CreateAppModal
          trigger={
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Application
            </Button>
          }
          onCreated={() => refetch()}
          organizationId={orgId}
        />
      </div>

      {/* Applications List */}
      <AppList
        variant="organization"
        organizationId={orgId}
        onAppSelect={handleAppSelect}
        onEditApp={handleEditApp}
        onManageMembers={handleManageMembers}
        onManageApiKeys={handleManageApiKeys}
      />

      {/* Edit Application Modal */}
      <Dialog open={activeModal === "edit"} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Edit className="w-5 h-5" />
              <span>Edit Application</span>
            </DialogTitle>
          </DialogHeader>
          {selectedApp ? (
            <EditAppForm
              application={selectedApp}
              onSuccess={handleAppUpdated}
              onCancel={closeModal}
            />
          ) : (
            <div className="p-4 text-center text-gray-500">
              No application selected
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Manage Members Modal */}
      <Dialog open={activeModal === "members"} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Manage Members - {selectedApp?.name}</span>
            </DialogTitle>
          </DialogHeader>
          {selectedApp ? (
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "members" | "invite")} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="members">Current Members</TabsTrigger>
                <TabsTrigger value="invite">Add Members</TabsTrigger>
              </TabsList>
              <TabsContent value="members" className="space-y-4">
                <AppMembers
                  applicationId={selectedApp.id}
                  applicationName={selectedApp.name}
                  onAddMember={() => {
                    // Switch to invite tab
                    setActiveTab("invite");
                  }}
                />
              </TabsContent>
              <TabsContent value="invite" className="space-y-4">
                <AddAppMemberForm
                  applicationId={selectedApp.id}
                  applicationName={selectedApp.name}
                  organizationId={orgId}
                  onSuccess={() => {
                    // Switch back to members tab and refresh
                    setActiveTab("members");
                  }}
                  onCancel={closeModal}
                />
              </TabsContent>
            </Tabs>
          ) : (
            <div className="p-4 text-center text-gray-500">
              No application selected
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Manage API Keys Modal */}
      <Dialog open={activeModal === "apiKeys"} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Key className="w-5 h-5" />
              <span>Manage API Keys - {selectedApp?.name}</span>
            </DialogTitle>
          </DialogHeader>
          {selectedApp ? (
            <ApiKeyManager
              applicationId={selectedApp.id}
              applicationName={selectedApp.name}
            />
          ) : (
            <div className="p-4 text-center text-gray-500">
              No application selected
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
