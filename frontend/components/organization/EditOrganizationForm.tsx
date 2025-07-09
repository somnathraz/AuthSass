"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Building2, Loader2, CheckCircle, AlertCircle, Save } from "lucide-react";

// Import organization service
import {
  useUpdateOrganization,
  type UpdateOrganizationInput,
  type Organization,
} from "@/services/organization.service";

// Form validation schema
const editOrganizationSchema = z.object({
  name: z.string()
    .min(2, "Organization name must be at least 2 characters")
    .max(100, "Organization name must be less than 100 characters")
    .regex(/^[a-zA-Z0-9\s\-_]+$/, "Organization name can only contain letters, numbers, spaces, hyphens, and underscores"),
  description: z.string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  website: z.string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
  imageUrl: z.string()
    .url("Please enter a valid image URL")
    .optional()
    .or(z.literal("")),
});

type EditOrganizationFormData = z.infer<typeof editOrganizationSchema>;

interface EditOrganizationFormProps {
  organization: Organization;
  onSuccess?: (organization: any) => void;
  onCancel?: () => void;
  className?: string;
}

export function EditOrganizationForm({
  organization,
  onSuccess,
  onCancel,
  className,
}: EditOrganizationFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Organization update hook
  const { updateOrganization, loading } = useUpdateOrganization();

  // Form setup
  const form = useForm<EditOrganizationFormData>({
    resolver: zodResolver(editOrganizationSchema),
    defaultValues: {
      name: organization.name || "",
      description: organization.description || "",
      website: organization.website || "",
      imageUrl: organization.imageUrl || "",
    },
  });

  // Reset form when organization changes
  useEffect(() => {
    form.reset({
      name: organization.name || "",
      description: organization.description || "",
      website: organization.website || "",
      imageUrl: organization.imageUrl || "",
    });
  }, [organization, form]);

  // Handle form submission
  const onSubmit = async (data: EditOrganizationFormData) => {
    try {
      setSubmitError(null);
      setSubmitSuccess(false);

      // Prepare input data (only include changed fields)
      const input: UpdateOrganizationInput = {};
      
      if (data.name !== organization.name) {
        input.name = data.name;
      }
      if (data.description !== organization.description) {
        input.description = data.description || undefined;
      }
      if (data.website !== organization.website) {
        input.website = data.website || undefined;
      }
      if (data.imageUrl !== organization.imageUrl) {
        input.imageUrl = data.imageUrl || undefined;
      }

      // Only update if there are changes
      if (Object.keys(input).length === 0) {
        setSubmitError("No changes detected. Please modify at least one field.");
        return;
      }

      // Update organization
      const response = await updateOrganization(organization.id, input);

      if (response.data?.updateOrganization.success) {
        setSubmitSuccess(true);
        
        // Call success callback
        if (onSuccess) {
          onSuccess(response.data.updateOrganization.organization);
        }
      }
    } catch (error: any) {
      console.error("Organization update error:", error);
      setSubmitError(error.message || "Failed to update organization. Please try again.");
    }
  };

  // Check if form has changes
  const hasChanges = () => {
    const currentValues = form.getValues();
    return (
      currentValues.name !== organization.name ||
      currentValues.description !== (organization.description || "") ||
      currentValues.website !== (organization.website || "") ||
      currentValues.imageUrl !== (organization.imageUrl || "")
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Building2 className="w-5 h-5" />
          <span>Edit Organization</span>
        </CardTitle>
        <CardDescription>
          Update your organization details and settings.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Success Message */}
        {submitSuccess && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Organization updated successfully!
            </AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {submitError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Organization Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter organization name"
                      {...field}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormDescription>
                    The name of your organization. This will be visible to all members.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Organization Type (Read-only) */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Organization Type</label>
              <div className="p-3 bg-gray-50 rounded-md border">
                <span className="text-sm text-gray-700">{organization.type}</span>
                <p className="text-xs text-gray-500 mt-1">
                  Organization type cannot be changed after creation.
                </p>
              </div>
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your organization (optional)"
                      className="resize-none"
                      rows={3}
                      {...field}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide a brief description of your organization and its purpose.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Website */}
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com (optional)"
                      type="url"
                      {...field}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormDescription>
                    Your organization's website or homepage.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Organization Image */}
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization Logo</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/logo.png (optional)"
                      type="url"
                      {...field}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormDescription>
                    URL to your organization's logo or image.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Organization Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="text-sm font-medium text-gray-700">Created</label>
                <p className="text-sm text-gray-600">
                  {new Date(organization.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Members</label>
                <p className="text-sm text-gray-600">
                  {organization.memberCount} member{organization.memberCount !== 1 ? 's' : ''}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Owner</label>
                <p className="text-sm text-gray-600">
                  {organization.owner.username}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Your Role</label>
                <p className="text-sm text-gray-600">
                  {organization.userRole || "Member"}
                </p>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="submit"
                disabled={loading || !hasChanges()}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating Organization...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancel
                </Button>
              )}
            </div>

            {/* Changes indicator */}
            {hasChanges() && (
              <p className="text-sm text-amber-600 text-center">
                You have unsaved changes
              </p>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 