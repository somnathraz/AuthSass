"use client";

import React, { useState } from "react";
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
import { Building2, Loader2, CheckCircle, AlertCircle } from "lucide-react";

// Import organization service
import {
  useCreateOrganization,
  type CreateOrganizationInput,
  type OrganizationType,
} from "@/services/organization.service";

// Form validation schema
const createOrganizationSchema = z.object({
  name: z.string()
    .min(2, "Organization name must be at least 2 characters")
    .max(100, "Organization name must be less than 100 characters")
    .regex(/^[a-zA-Z0-9\s\-_]+$/, "Organization name can only contain letters, numbers, spaces, hyphens, and underscores"),
  description: z.string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  type: z.enum(["PERSONAL", "TEAM", "COMPANY", "ENTERPRISE"]),
  website: z.string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
  imageUrl: z.string()
    .url("Please enter a valid image URL")
    .optional()
    .or(z.literal("")),
});

type CreateOrganizationFormData = z.infer<typeof createOrganizationSchema>;

interface CreateOrganizationFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSuccess?: (organization: any) => void;
  onCancel?: () => void;
  className?: string;
}

export function CreateOrganizationForm({
  onSuccess,
  onCancel,
  className,
}: CreateOrganizationFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Organization creation hook
  const { createOrganization, loading } = useCreateOrganization();

  // Form setup
  const form = useForm<CreateOrganizationFormData>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "TEAM",
      website: "",
      imageUrl: "",
    },
  });

  // Handle form submission
  const onSubmit = async (data: CreateOrganizationFormData) => {
    try {
      setSubmitError(null);
      setSubmitSuccess(false);

      // Prepare input data
      const input: CreateOrganizationInput = {
        name: data.name,
        type: data.type as OrganizationType,
        ...(data.description && { description: data.description }),
        ...(data.website && { website: data.website }),
        ...(data.imageUrl && { imageUrl: data.imageUrl }),
      };

      // Create organization
      const response = await createOrganization(input);

      if (response.data?.createOrganization.success) {
        setSubmitSuccess(true);
        form.reset();
        
        // Call success callback
        if (onSuccess && response.data.createOrganization.organization) {
          onSuccess(response.data.createOrganization.organization);
        }
      }
    } catch (error: unknown) {
      console.error("Organization creation error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to create organization. Please try again.";
      setSubmitError(errorMessage);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Building2 className="w-5 h-5" />
          <span>Create New Organization</span>
        </CardTitle>
        <CardDescription>
          Create a new organization to collaborate with your team and manage applications.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Success Message */}
        {submitSuccess && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Organization created successfully! You can now start adding members and applications.
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
                    Choose a unique name for your organization. This will be visible to all members.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Organization Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization Type *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select organization type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PERSONAL">Personal - Individual projects</SelectItem>
                      <SelectItem value="TEAM">Team - Small team collaboration</SelectItem>
                      <SelectItem value="COMPANY">Company - Business organization</SelectItem>
                      <SelectItem value="ENTERPRISE">Enterprise - Large scale organization</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the type that best describes your organization.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                    Your organization&apos;s website or homepage.
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
                    URL to your organization&apos;s logo or image.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Organization...
                  </>
                ) : (
                  <>
                    <Building2 className="w-4 h-4 mr-2" />
                    Create Organization
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
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 