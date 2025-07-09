// src/components/CreateOrgModal/CreateOrgModal.tsx
"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateOrganization } from "@/services/organization.service";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  Loader2,
  Camera,
  X,
  Upload,
  Settings,
  Shield,
  Globe,
  Building2,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  OrganizationType,
  CreateOrganizationInput,
} from "@/graphql/organization.mutations";

// Enhanced form validation schema
const createOrgSchema = z.object({
  // Basic Information
  name: z
    .string()
    .min(1, "Organization name is required")
    .min(2, "Organization name must be at least 2 characters")
    .max(100, "Organization name must be less than 100 characters")
    .regex(
      /^[a-zA-Z0-9\s\-_\.]+$/,
      "Organization name can only contain letters, numbers, spaces, hyphens, underscores, and periods"
    ),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(
      /^[a-zA-Z0-9-]+$/,
      "Slug can only contain letters, numbers, and hyphens"
    )
    .optional(),
  description: z.string().max(500).optional(),
  website: z.string().url().optional().or(z.literal("")),
  supportEmail: z.string().email().optional().or(z.literal("")),
  timezone: z.string(),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),

  // Security Settings
  enableMFA: z.boolean().optional(),
  sessionTimeout: z.number().min(5).max(1440).optional(),
  allowPasswordReset: z.boolean().optional(),
  enforcePasswordComplexity: z.boolean().optional(),
  passwordPolicy: z
    .object({
      minLength: z.number().min(6).max(128),
      requireUppercase: z.boolean(),
      requireLowercase: z.boolean(),
      requireNumbers: z.boolean(),
      requireSpecialChars: z.boolean(),
      passwordHistory: z.number().min(0).max(24),
      passwordExpiration: z.number().min(0).max(365),
      maxLoginAttempts: z.number().min(1).max(20),
      lockoutDuration: z.number().min(1).max(1440),
    })
    .optional(),

  // Domain Settings
  allowedDomains: z.string().optional(),
  enableCORS: z.boolean().optional(),
  corsMaxAge: z.number().min(0).max(86400).optional(),

  // Branding
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),

  logo: z.any().optional(),
});

type CreateOrgFormData = z.infer<typeof createOrgSchema>;

interface CreateOrgModalProps {
  /** The element that, when clicked, should open the modal */
  trigger: React.ReactNode;
  /** Optional callback after a successful creation */
  onCreated?: () => void;
}

export function CreateOrgModal({ trigger, onCreated }: CreateOrgModalProps) {
  const [open, setOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("general");

  const {
    createOrganization,
    error: createError,
    loading: createLoading,
  } = useCreateOrganization();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<CreateOrgFormData>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      website: "",
      supportEmail: "",
      timezone: "UTC",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      imageUrl: "",
      enableMFA: false,
      sessionTimeout: 15,
      allowPasswordReset: true,
      enforcePasswordComplexity: false,
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
        passwordHistory: 5,
        passwordExpiration: 90,
        maxLoginAttempts: 5,
        lockoutDuration: 30,
      },
      allowedDomains: "",
      enableCORS: false,
      corsMaxAge: 3600,
      primaryColor: "#4F46E5",
      secondaryColor: "#6B7280",
      logo: undefined,
    },
  });

  // Reset form when modal closes
  React.useEffect(() => {
    if (!open) {
      reset();
      setActiveTab("general");
    }
  }, [open, reset]);

  // Auto-generate slug from name
  React.useEffect(() => {
    const name = watch("name");
    if (name && !watch("slug")) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
      setValue("slug", slug);
    }
  }, [watch("name"), setValue, watch]);

  // Client-side file validation
  const validateFile = (files: FileList | null) => {
    if (!files || files.length === 0) return true;

    const file = files[0];

    // Size validation (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError("logo", { message: "Logo file must be less than 5MB" });
      return false;
    }

    // Type validation
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("logo", {
        message: "Logo must be a valid image file (JPEG, PNG, GIF, or WebP)",
      });
      return false;
    }

    // Clear any previous errors
    clearErrors("logo");
    return true;
  };

  const onSubmit = async (data: CreateOrgFormData) => {
    try {
      // Validate file if present
      const fileInput = document.getElementById("logo") as HTMLInputElement;
      if (fileInput?.files && !validateFile(fileInput.files)) {
        return;
      }

      console.log("Creating organization with data:", data);

      // Build input for GraphQL mutation
      const input: CreateOrganizationInput = {
        name: data.name,
        type: OrganizationType.TEAM,
        imageUrl: data.imageUrl || undefined,
        description: data.description || undefined,
        website: data.website || undefined,
      };

      console.log("Sending organization input:", input);

      const result = await createOrganization(input);
      console.log("Organization creation result:", result);

      reset();
      setOpen(false);

      // Refresh the page to ensure all data is updated properly
      // This ensures the sidebar organizations list is refreshed
      if (onCreated) {
        onCreated();
      } else {
        // Fallback to refresh if no callback provided
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to create organization:", error);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>

        {/* Default overlay from shadcn Dialog is used, no custom overlay to avoid pointer blocking */}
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Create Organization
            </DialogTitle>
            <DialogDescription>
              Create a new organization with comprehensive settings and security
              policies.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger
                  value="general"
                  className="flex items-center gap-1"
                >
                  <Settings className="h-3 w-3" />
                  General
                </TabsTrigger>
                <TabsTrigger
                  value="security"
                  className="flex items-center gap-1"
                >
                  <Shield className="h-3 w-3" />
                  Security
                </TabsTrigger>
                <TabsTrigger
                  value="domains"
                  className="flex items-center gap-1"
                >
                  <Globe className="h-3 w-3" />
                  Domains
                </TabsTrigger>
                <TabsTrigger
                  value="branding"
                  className="flex items-center gap-1"
                >
                  <Camera className="h-3 w-3" />
                  Branding
                </TabsTrigger>
              </TabsList>

              <div className="max-h-[400px] overflow-y-auto">
                <TabsContent value="general" className="space-y-4">
                  {/* Logo Section */}
                  <div className="space-y-3">
                    <Label>Organization Logo</Label>
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        {watch("imageUrl") ? (
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden border">
                            <img
                              src={watch("imageUrl")}
                              alt="Organization logo"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Handle broken image URLs
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => setValue("imageUrl", "")}
                              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                            >
                              <X className="h-2 w-2" />
                            </button>
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                            <Camera className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex space-x-2">
                          <Button type="button" variant="outline" size="sm">
                            <Upload className="h-3 w-3 mr-1" />
                            Upload
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const orgName = watch("name") || "Org";
                              const defaultIcons = [
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                  orgName
                                )}&background=4F46E5&color=fff&size=200`,
                                `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(
                                  orgName.toLowerCase()
                                )}`,
                              ];
                              setValue(
                                "imageUrl",
                                defaultIcons[
                                  Math.floor(
                                    Math.random() * defaultIcons.length
                                  )
                                ]
                              );
                            }}
                          >
                            Generate
                          </Button>
                        </div>
                      </div>
                    </div>
                    <Input
                      placeholder="Or enter logo URL"
                      {...register("imageUrl")}
                    />
                    {errors.imageUrl && (
                      <p className="text-sm text-red-600">
                        {String(errors.imageUrl.message)}
                      </p>
                    )}
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="name">Organization Name *</Label>
                      <Input
                        id="name"
                        placeholder="Acme Corporation"
                        {...register("name")}
                      />
                      {errors.name?.message && (
                        <p className="text-sm text-red-600">
                          {String(errors.name.message)}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="slug">URL Slug</Label>
                      <Input
                        id="slug"
                        placeholder="acme-corp"
                        {...register("slug")}
                      />
                      {errors.slug?.message && (
                        <p className="text-sm text-red-600">
                          {String(errors.slug.message)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Brief description of your organization"
                      {...register("description")}
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        placeholder="https://acme-corp.com"
                        {...register("website")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="supportEmail">Support Email</Label>
                      <Input
                        id="supportEmail"
                        type="email"
                        placeholder="support@acme-corp.com"
                        {...register("supportEmail")}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={watch("timezone")}
                      onValueChange={(value) => setValue("timezone", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">
                          Eastern Time
                        </SelectItem>
                        <SelectItem value="America/Chicago">
                          Central Time
                        </SelectItem>
                        <SelectItem value="America/Los_Angeles">
                          Pacific Time
                        </SelectItem>
                        <SelectItem value="Europe/London">London</SelectItem>
                        <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>

                <TabsContent value="security" className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900 text-sm">
                          Security Settings
                        </h4>
                        <p className="text-xs text-blue-800 mt-1">
                          Configure security policies for your organization.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="enableMFA">
                          Require Multi-Factor Authentication
                        </Label>
                        <p className="text-xs text-gray-500">
                          Force MFA for all organization members
                        </p>
                      </div>
                      <Switch
                        id="enableMFA"
                        checked={watch("enableMFA") || false}
                        onCheckedChange={(checked) =>
                          setValue("enableMFA", checked)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="allowPasswordReset">
                          Allow Password Reset
                        </Label>
                        <p className="text-xs text-gray-500">
                          Allow users to reset passwords via email
                        </p>
                      </div>
                      <Switch
                        id="allowPasswordReset"
                        checked={watch("allowPasswordReset") || false}
                        onCheckedChange={(checked) =>
                          setValue("allowPasswordReset", checked)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="enforcePasswordComplexity">
                          Enforce Password Complexity
                        </Label>
                        <p className="text-xs text-gray-500">
                          Strict password validation rules
                        </p>
                      </div>
                      <Switch
                        id="enforcePasswordComplexity"
                        checked={watch("enforcePasswordComplexity") || false}
                        onCheckedChange={(checked) =>
                          setValue("enforcePasswordComplexity", checked)
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="sessionTimeout">
                        Session Timeout (minutes)
                      </Label>
                      <Input
                        id="sessionTimeout"
                        type="number"
                        min="5"
                        max="1440"
                        {...register("sessionTimeout", { valueAsNumber: true })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="minLength">Min Password Length</Label>
                      <Input
                        id="minLength"
                        type="number"
                        min="6"
                        max="128"
                        {...register("passwordPolicy.minLength", {
                          valueAsNumber: true,
                        })}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="domains" className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <Globe className="h-4 w-4 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-green-900 text-sm">
                          Domain Configuration
                        </h4>
                        <p className="text-xs text-green-800 mt-1">
                          Configure allowed domains and CORS settings.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="allowedDomains">Allowed Domains</Label>
                    <Textarea
                      id="allowedDomains"
                      placeholder="https://yourapp.com&#10;https://yourapp.vercel.app"
                      rows={3}
                      {...register("allowedDomains")}
                    />
                    <p className="text-xs text-gray-500">One domain per line</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="enableCORS">Enable CORS</Label>
                      <p className="text-xs text-gray-500">
                        Allow cross-origin requests
                      </p>
                    </div>
                    <Switch
                      id="enableCORS"
                      checked={watch("enableCORS") || false}
                      onCheckedChange={(checked) =>
                        setValue("enableCORS", checked)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="corsMaxAge">CORS Max Age (seconds)</Label>
                    <Input
                      id="corsMaxAge"
                      type="number"
                      min="0"
                      max="86400"
                      {...register("corsMaxAge", { valueAsNumber: true })}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="branding" className="space-y-4">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <Camera className="h-4 w-4 text-purple-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-purple-900 text-sm">
                          Brand Customization
                        </h4>
                        <p className="text-xs text-purple-800 mt-1">
                          Customize the appearance of authentication pages.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="primaryColor">Primary Color</Label>
                      <div className="flex space-x-2">
                        <Input
                          type="color"
                          className="w-12 h-10 p-1 border rounded"
                          {...register("primaryColor")}
                        />
                        <Input
                          placeholder="#4F46E5"
                          {...register("primaryColor")}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="secondaryColor">Secondary Color</Label>
                      <div className="flex space-x-2">
                        <Input
                          type="color"
                          className="w-12 h-10 p-1 border rounded"
                          {...register("secondaryColor")}
                        />
                        <Input
                          placeholder="#6B7280"
                          {...register("secondaryColor")}
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>

            {createError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {createError.message ||
                    "Failed to create organization. Please try again."}
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={createLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createLoading}>
                {createLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {createLoading ? "Creating..." : "Create Organization"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
