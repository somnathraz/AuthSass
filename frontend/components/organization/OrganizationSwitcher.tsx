"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Building2, 
  ChevronDown, 
  Check, 
  Plus, 
  Settings, 
  Users,
  Crown,
  Shield,
  Loader2,
} from "lucide-react";

// Import organization service hooks
import {
  useMyOrganizations,
  useSwitchOrganization,
  useCurrentOrganization,
  useOrganizationTypeBadgeVariant,
  useOrganizationRoleBadgeVariant,
  type Organization,
} from "@/services/organization.service";

// Import create organization form
import { CreateOrganizationForm } from "./CreateOrganizationForm";

interface OrganizationSwitcherProps {
  variant?: "dropdown" | "select" | "compact";
  showCreateButton?: boolean;
  onOrganizationChange?: (organization: Organization) => void;
  className?: string;
}

export function OrganizationSwitcher({
  variant = "dropdown",
  showCreateButton = true,
  onOrganizationChange,
  className,
}: OrganizationSwitcherProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Fetch user's organizations
  const { data: myOrganizations, loading, error, refetch } = useMyOrganizations();
  
  // Get current organization from store
  const currentOrganization = useCurrentOrganization();
  
  // Organization switching hook
  const { switchOrganization, loading: switchLoading } = useSwitchOrganization();

  // Utility hooks
  const getTypeBadgeVariant = useOrganizationTypeBadgeVariant;
  const getRoleBadgeVariant = useOrganizationRoleBadgeVariant;

  // Handle organization switch
  const handleSwitchOrganization = async (orgId: string) => {
    try {
      const organization = myOrganizations?.myOrganizations.find(org => org.id === orgId);
      if (!organization) return;

      await switchOrganization(orgId);
      
      // Call callback if provided
      if (onOrganizationChange) {
        onOrganizationChange(organization);
      }
    } catch (error) {
      console.error("Failed to switch organization:", error);
    }
  };

  // Handle organization creation success
  const handleCreateSuccess = (organization: any) => {
    setShowCreateDialog(false);
    refetch(); // Refresh organizations list
    
    // Switch to the newly created organization
    if (organization?.id) {
      handleSwitchOrganization(organization.id);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm text-gray-500">Loading organizations...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-sm text-red-500 ${className}`}>
        Error loading organizations
      </div>
    );
  }

  const organizations = myOrganizations?.myOrganizations || [];

  // Compact variant - just show current org name
  if (variant === "compact") {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Building2 className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium">
          {currentOrganization?.name || "No Organization"}
        </span>
      </div>
    );
  }

  // Select variant - simple select dropdown
  if (variant === "select") {
    return (
      <div className={`space-y-2 ${className}`}>
        <label className="text-sm font-medium">Current Organization</label>
        <Select
          value={currentOrganization?.id || ""}
          onValueChange={handleSwitchOrganization}
          disabled={switchLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select organization" />
          </SelectTrigger>
          <SelectContent>
            {organizations.map((org) => (
              <SelectItem key={org.id} value={org.id}>
                <div className="flex items-center space-x-2">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={org.imageUrl} alt={org.name} />
                    <AvatarFallback className="text-xs">
                      {org.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span>{org.name}</span>
                  <Badge variant={getRoleBadgeVariant(org.userRole || "MEMBER")} className="ml-auto">
                    {org.userRole}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  // Dropdown variant (default) - full featured dropdown
  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full justify-between" disabled={switchLoading}>
            <div className="flex items-center space-x-2">
              <Avatar className="w-6 h-6">
                <AvatarImage src={currentOrganization?.imageUrl} alt={currentOrganization?.name} />
                <AvatarFallback className="text-xs">
                  {currentOrganization?.name?.substring(0, 2).toUpperCase() || "NO"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium">
                  {currentOrganization?.name || "No Organization"}
                </span>
                {currentOrganization?.userRole && (
                  <span className="text-xs text-gray-500">
                    {currentOrganization.userRole}
                  </span>
                )}
              </div>
            </div>
            {switchLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80" align="start">
          <DropdownMenuLabel>Switch Organization</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Organization List */}
          {organizations.map((org) => (
            <DropdownMenuItem
              key={org.id}
              onClick={() => handleSwitchOrganization(org.id)}
              className="p-3"
            >
              <div className="flex items-center space-x-3 w-full">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={org.imageUrl} alt={org.name} />
                  <AvatarFallback>
                    {org.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium truncate">{org.name}</span>
                    {currentOrganization?.id === org.id && (
                      <Check className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant={getTypeBadgeVariant(org.type)} className="text-xs">
                      {org.type}
                    </Badge>
                    <Badge variant={getRoleBadgeVariant(org.userRole || "MEMBER")} className="text-xs">
                      {org.userRole === "OWNER" && <Crown className="w-3 h-3 mr-1" />}
                      {org.userRole === "ADMIN" && <Shield className="w-3 h-3 mr-1" />}
                      {org.userRole}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                    <span className="flex items-center space-x-1">
                      <Users className="w-3 h-3" />
                      <span>{org.memberCount} members</span>
                    </span>
                  </div>
                </div>
              </div>
            </DropdownMenuItem>
          ))}

          {organizations.length === 0 && (
            <div className="p-3 text-center text-gray-500 text-sm">
              No organizations found
            </div>
          )}

          <DropdownMenuSeparator />
          
          {/* Actions */}
          {showCreateButton && (
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Organization
                </DropdownMenuItem>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Organization</DialogTitle>
                  <DialogDescription>
                    Create a new organization to collaborate with your team.
                  </DialogDescription>
                </DialogHeader>
                <CreateOrganizationForm
                  onSuccess={handleCreateSuccess}
                  onCancel={() => setShowCreateDialog(false)}
                />
              </DialogContent>
            </Dialog>
          )}

          {currentOrganization && (
            <DropdownMenuItem>
              <Settings className="w-4 h-4 mr-2" />
              Organization Settings
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
} 