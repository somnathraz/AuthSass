"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Globe, 
  Smartphone, 
  Code, 
  Monitor, 
  Server, 
  Package, 
  HelpCircle,
  Loader2,
  AlertCircle,
  Save,
  X,
} from "lucide-react";

// Import app service
import { 
  useUpdateApp,
  AppType,
  Status,
  type Application,
  type UpdateAppInput,
} from "@/services/app.service";

interface EditAppFormProps {
  application: Application;
  onSuccess?: (app: Application) => void;
  onCancel?: () => void;
  className?: string;
}

export function EditAppForm({
  application,
  onSuccess,
  onCancel,
  className,
}: EditAppFormProps) {
  const [formData, setFormData] = useState<UpdateAppInput>({
    name: application.name,
    description: application.description || "",
    status: application.status,
    website: application.settings?.website || "",
    repository: application.settings?.repository || "",
    imageUrl: application.settings?.imageUrl || "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const { updateApp, loading, error: updateError } = useUpdateApp();

  // Track changes
  useEffect(() => {
    const hasFormChanges = 
      formData.name !== application.name ||
      formData.description !== (application.description || "") ||
      formData.status !== application.status ||
      formData.website !== (application.settings?.website || "") ||
      formData.repository !== (application.settings?.repository || "") ||
      formData.imageUrl !== (application.settings?.imageUrl || "");
    
    setHasChanges(hasFormChanges);
  }, [formData, application]);

  // Get application type icon
  const getAppTypeIcon = (type: AppType) => {
    switch (type) {
      case AppType.WEB:
        return <Globe className="w-4 h-4" />;
      case AppType.MOBILE:
        return <Smartphone className="w-4 h-4" />;
      case AppType.API:
        return <Code className="w-4 h-4" />;
      case AppType.SERVICE:
        return <Server className="w-4 h-4" />;
      default:
        return <HelpCircle className="w-4 h-4" />;
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = "Application name is required";
    } else if (formData.name.length < 2) {
      newErrors.name = "Application name must be at least 2 characters";
    } else if (formData.name.length > 50) {
      newErrors.name = "Application name must be less than 50 characters";
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = "Description must be less than 500 characters";
    }

    if (formData.website && formData.website.trim()) {
      try {
        new URL(formData.website);
      } catch {
        newErrors.website = "Please enter a valid website URL";
      }
    }

    if (formData.repository && formData.repository.trim()) {
      try {
        new URL(formData.repository);
      } catch {
        newErrors.repository = "Please enter a valid repository URL";
      }
    }

    if (formData.imageUrl && formData.imageUrl.trim()) {
      try {
        new URL(formData.imageUrl);
      } catch {
        newErrors.imageUrl = "Please enter a valid image URL";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      console.log('📝 Updating app:', application.name, 'with data:', formData);
      
      const result = await updateApp(application.id, {
        ...formData,
        // Clean up empty optional fields
        website: formData.website?.trim() || undefined,
        repository: formData.repository?.trim() || undefined,
        imageUrl: formData.imageUrl?.trim() || undefined,
        description: formData.description?.trim() || undefined,
      });

      console.log('📝 Update result:', result);

      if (result.data?.updateApp?.success) {
        console.log('✅ App update successful, calling onSuccess with:', result.data.updateApp.app);
        onSuccess?.(result.data.updateApp.app);
      } else {
        console.error('❌ App update failed:', result.data?.updateApp?.errors);
      }
    } catch (error) {
      console.error("❌ Failed to update application:", error);
    }
  };

  const handleReset = () => {
    setFormData({
      name: application.name,
      description: application.description || "",
      status: application.status,
      website: application.settings?.website || "",
      repository: application.settings?.repository || "",
      imageUrl: application.settings?.imageUrl || "",
    });
    setErrors({});
  };

  return (
    <div className={className}>
      {/* Application Info Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {getAppTypeIcon(application.type)}
            <span>{application.name}</span>
            <Badge variant="outline">{application.type}</Badge>
          </CardTitle>
          <CardDescription>
            Created on {new Date(application.createdAt).toLocaleDateString()} • 
            Organization: {application.organization.name}
          </CardDescription>
        </CardHeader>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Application Name */}
        <div className="space-y-2">
          <Label htmlFor="appName">Application Name *</Label>
          <Input
            id="appName"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="My Awesome App"
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && (
            <p className="text-sm text-red-600 flex items-center space-x-1">
              <AlertCircle className="w-4 h-4" />
              <span>{errors.name}</span>
            </p>
          )}
        </div>

        {/* Application Status */}
        <div className="space-y-2">
          <Label htmlFor="appStatus">Status</Label>
          <Select 
            value={formData.status} 
            onValueChange={(value: Status) => 
              setFormData(prev => ({ ...prev, status: value }))
            }
          >
            <SelectTrigger id="appStatus">
              <SelectValue placeholder="Select application status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={Status.ACTIVE}>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Active</span>
                </div>
              </SelectItem>
              <SelectItem value={Status.INACTIVE}>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gray-500 rounded-full" />
                  <span>Inactive</span>
                </div>
              </SelectItem>
              <SelectItem value={Status.PENDING}>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                  <span>Pending</span>
                </div>
              </SelectItem>
              <SelectItem value={Status.SUSPENDED}>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                  <span>Suspended</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="appDesc">Description</Label>
          <Textarea
            id="appDesc"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Brief description of your application..."
            rows={3}
            className={errors.description ? "border-red-500" : ""}
          />
          {errors.description && (
            <p className="text-sm text-red-600 flex items-center space-x-1">
              <AlertCircle className="w-4 h-4" />
              <span>{errors.description}</span>
            </p>
          )}
          <p className="text-xs text-gray-500">
            {formData.description?.length || 0}/500 characters
          </p>
        </div>

        {/* Website URL */}
        <div className="space-y-2">
          <Label htmlFor="appWebsite">Website URL</Label>
          <Input
            id="appWebsite"
            type="url"
            value={formData.website}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              website: e.target.value 
            }))}
            placeholder="https://myapp.com"
            className={errors.website ? "border-red-500" : ""}
          />
          {errors.website && (
            <p className="text-sm text-red-600 flex items-center space-x-1">
              <AlertCircle className="w-4 h-4" />
              <span>{errors.website}</span>
            </p>
          )}
        </div>

        {/* Repository URL */}
        <div className="space-y-2">
          <Label htmlFor="appRepository">Repository URL</Label>
          <Input
            id="appRepository"
            type="url"
            value={formData.repository}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              repository: e.target.value 
            }))}
            placeholder="https://github.com/username/repo"
            className={errors.repository ? "border-red-500" : ""}
          />
          {errors.repository && (
            <p className="text-sm text-red-600 flex items-center space-x-1">
              <AlertCircle className="w-4 h-4" />
              <span>{errors.repository}</span>
            </p>
          )}
        </div>

        {/* Image URL */}
        <div className="space-y-2">
          <Label htmlFor="appImageUrl">Application Icon URL</Label>
          <Input
            id="appImageUrl"
            type="url"
            value={formData.imageUrl}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              imageUrl: e.target.value 
            }))}
            placeholder="https://example.com/icon.png"
            className={errors.imageUrl ? "border-red-500" : ""}
          />
          {errors.imageUrl && (
            <p className="text-sm text-red-600 flex items-center space-x-1">
              <AlertCircle className="w-4 h-4" />
              <span>{errors.imageUrl}</span>
            </p>
          )}
        </div>

        {/* Read-only fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <Label className="text-sm text-gray-600">Application Type</Label>
            <div className="flex items-center space-x-2 mt-1">
              {getAppTypeIcon(application.type)}
              <span className="text-sm">{application.type}</span>
            </div>
          </div>
          <div>
            <Label className="text-sm text-gray-600">Organization</Label>
            <p className="text-sm mt-1">{application.organization.name}</p>
          </div>
          <div>
            <Label className="text-sm text-gray-600">Created</Label>
            <p className="text-sm mt-1">{new Date(application.createdAt).toLocaleDateString()}</p>
          </div>
          <div>
            <Label className="text-sm text-gray-600">Last Updated</Label>
            <p className="text-sm mt-1">{new Date(application.updatedAt).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Error Display */}
        {updateError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600 flex items-center space-x-1">
              <AlertCircle className="w-4 h-4" />
              <span>{updateError.message}</span>
            </p>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex items-center justify-between pt-6 border-t">
          <div className="flex items-center space-x-2">
            {hasChanges && (
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={loading}
              >
                Reset Changes
              </Button>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !hasChanges}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
} 