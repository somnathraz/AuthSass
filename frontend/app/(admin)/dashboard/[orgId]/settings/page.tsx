"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Settings,
  Shield,
  Globe,
  Palette,
  Webhook,
  BarChart3,
  Bell,
  Crown,
  Save,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Home,
  Upload,
  Camera,
  X,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";
import { PageLoader } from "@/components/ui/loading";

// Import our real backend services
import {
  useOrganizationSettings,
  useUpdateOrganizationSettings,
  useUpdatePasswordPolicy,
  useUpdateDomainSettings,
  useUpdateBrandingSettings,
  useUpdateNotificationSettings,
  useUpdateAnalyticsSettings,
  type OrganizationSettings,
  type PasswordPolicy,
  type DomainSettings,
  type BrandingSettings,
  type NotificationSettings,
  type AnalyticsSettings,
} from "@/services/organization.service";

// Form schemas for different sections
const generalSettingsSchema = z.object({
  name: z.string().min(1, "Organization name is required").max(100),
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
});

const passwordPolicySchema = z.object({
  minLength: z.number().min(6).max(128),
  requireUppercase: z.boolean(),
  requireLowercase: z.boolean(),
  requireNumbers: z.boolean(),
  requireSpecialChars: z.boolean(),
  passwordHistory: z.number().min(0).max(24),
  passwordExpiration: z.number().min(0).max(365),
  maxLoginAttempts: z.number().min(1).max(20),
  lockoutDuration: z.number().min(1).max(1440), // minutes
  enableMFA: z.boolean().optional(),
  sessionTimeout: z.number().min(5).max(1440).optional(), // minutes
  allowPasswordReset: z.boolean().optional(),
  enforcePasswordComplexity: z.boolean().optional(),
});

const domainSettingsSchema = z.object({
  allowedCallbackUrls: z.string(),
  allowedLogoutUrls: z.string(),
  allowedWebOrigins: z.string(),
  customDomain: z.string().optional(),
  sdkAllowedDomains: z.string().optional(),
  enableCORS: z.boolean().optional(),
  corsMaxAge: z.number().min(0).max(86400).optional(), // seconds
});

const brandingSettingsSchema = z.object({
  primaryColor: z.string(),
  secondaryColor: z.string(),
  logoUrl: z.string().url().optional().or(z.literal("")),
  faviconUrl: z.string().url().optional().or(z.literal("")),
  customCss: z.string().optional(),
});

const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  securityAlerts: z.boolean(),
  marketingEmails: z.boolean(),
  weeklyReports: z.boolean(),
  systemUpdates: z.boolean(),
});

const analyticsSettingsSchema = z.object({
  enableTracking: z.boolean(),
  retentionPeriod: z.number().min(1).max(365),
  exportFormat: z.enum(["JSON", "CSV"]),
});

type GeneralSettings = z.infer<typeof generalSettingsSchema>;
type PasswordPolicyForm = z.infer<typeof passwordPolicySchema>;
type DomainSettingsForm = z.infer<typeof domainSettingsSchema>;
type BrandingSettingsForm = z.infer<typeof brandingSettingsSchema>;
type NotificationSettingsForm = z.infer<typeof notificationSettingsSchema>;
type AnalyticsSettingsForm = z.infer<typeof analyticsSettingsSchema>;

export default function OrganizationSettingsPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const [activeTab, setActiveTab] = useState("general");
  const [saveMessage, setSaveMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Load organization data
  const { organization, loading, error, refetch } =
    useOrganizationSettings(orgId);

  // Service hooks
  const { updateSettings: updateOrgSettings, loading: updatingGeneral } =
    useUpdateOrganizationSettings();
  const { updatePolicy, loading: updatingPassword } = useUpdatePasswordPolicy();
  const { updateDomainSettings, loading: updatingDomain } =
    useUpdateDomainSettings();
  const { updateBrandingSettings, loading: updatingBranding } =
    useUpdateBrandingSettings();
  const { updateNotificationSettings, loading: updatingNotifications } =
    useUpdateNotificationSettings();
  const { updateAnalyticsSettings, loading: updatingAnalytics } =
    useUpdateAnalyticsSettings();

  // Form hooks for different sections
  const generalForm = useForm<GeneralSettings>({
    resolver: zodResolver(generalSettingsSchema),
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
    },
  });

  const passwordForm = useForm<PasswordPolicyForm>({
    resolver: zodResolver(passwordPolicySchema),
    defaultValues: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: false,
      passwordHistory: 5,
      passwordExpiration: 90,
      maxLoginAttempts: 5,
      lockoutDuration: 30,
      enableMFA: false,
      sessionTimeout: 15,
      allowPasswordReset: false,
      enforcePasswordComplexity: false,
    },
  });

  const domainForm = useForm<DomainSettingsForm>({
    resolver: zodResolver(domainSettingsSchema),
    defaultValues: {
      allowedCallbackUrls: "",
      allowedLogoutUrls: "",
      allowedWebOrigins: "",
      customDomain: "",
      sdkAllowedDomains: "",
      enableCORS: false,
      corsMaxAge: 0,
    },
  });

  const brandingForm = useForm<BrandingSettingsForm>({
    resolver: zodResolver(brandingSettingsSchema),
    defaultValues: {
      primaryColor: "#4F46E5",
      secondaryColor: "#6B7280",
      logoUrl: "",
      faviconUrl: "",
      customCss: "",
    },
  });

  const notificationForm = useForm<NotificationSettingsForm>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      emailNotifications: true,
      securityAlerts: true,
      marketingEmails: false,
      weeklyReports: true,
      systemUpdates: true,
    },
  });

  const analyticsForm = useForm<AnalyticsSettingsForm>({
    resolver: zodResolver(analyticsSettingsSchema),
    defaultValues: {
      enableTracking: true,
      retentionPeriod: 90,
      exportFormat: "JSON",
    },
  });

  // Load organization data into forms when available
  useEffect(() => {
    if (organization) {
      // General settings
      generalForm.reset({
        name: organization.name || "",
        slug: organization.slug || "",
        description: organization.description || "",
        website: organization.website || "",
        supportEmail: organization.supportEmail || "",
        timezone: organization.timezone || "UTC",
        contactName: organization.contactName || "",
        contactEmail: organization.contactEmail || "",
        contactPhone: organization.contactPhone || "",
        imageUrl: organization.imageUrl || "",
      });

      // Password policy
      if (organization.passwordPolicy) {
        passwordForm.reset(organization.passwordPolicy);
      }

      // Domain settings
      if (organization.domainSettings) {
        domainForm.reset({
          allowedCallbackUrls:
            organization.domainSettings.allowedCallbackUrls?.join("\n") || "",
          allowedLogoutUrls:
            organization.domainSettings.allowedLogoutUrls?.join("\n") || "",
          allowedWebOrigins:
            organization.domainSettings.allowedWebOrigins?.join("\n") || "",
          customDomain: organization.domainSettings.customDomain || "",
          sdkAllowedDomains:
            organization.domainSettings.sdkAllowedDomains?.join("\n") || "",
          enableCORS: organization.domainSettings.enableCORS || false,
          corsMaxAge: organization.domainSettings.corsMaxAge || 0,
        });
      }

      // Branding settings
      if (organization.branding) {
        brandingForm.reset(organization.branding);
      }

      // Notification settings
      if (organization.notifications) {
        notificationForm.reset(organization.notifications);
      }

      // Analytics settings
      if (organization.analytics) {
        analyticsForm.reset(organization.analytics);
      }
    }
  }, [
    organization,
    generalForm,
    passwordForm,
    domainForm,
    brandingForm,
    notificationForm,
    analyticsForm,
  ]);

  // Show success/error messages
  const showMessage = (type: "success" | "error", message: string) => {
    setSaveMessage({ type, message });
    setTimeout(() => setSaveMessage(null), 5000);
  };

  // Save handlers
  const saveGeneralSettings = async (data: GeneralSettings) => {
    try {
      const result = await updateOrgSettings(orgId, data);
      if (result.success) {
        showMessage("success", "General settings saved successfully!");
        refetch(); // Refresh the data
      } else {
        showMessage(
          "error",
          result.errors?.[0]?.message || "Failed to save settings"
        );
      }
    } catch (error) {
      console.error("Failed to save general settings:", error);
      showMessage("error", "Failed to save general settings");
    }
  };

  const savePasswordPolicy = async (data: PasswordPolicyForm) => {
    try {
      const result = await updatePolicy(orgId, data);
      if (result.success) {
        showMessage("success", "Password policy saved successfully!");
        refetch();
      } else {
        showMessage(
          "error",
          result.errors?.[0]?.message || "Failed to save password policy"
        );
      }
    } catch (error) {
      console.error("Failed to save password policy:", error);
      showMessage("error", "Failed to save password policy");
    }
  };

  const saveDomainSettings = async (data: DomainSettingsForm) => {
    try {
      const domainData = {
        allowedCallbackUrls: data.allowedCallbackUrls
          .split("\n")
          .filter((url) => url.trim()),
        allowedLogoutUrls: data.allowedLogoutUrls
          .split("\n")
          .filter((url) => url.trim()),
        allowedWebOrigins: data.allowedWebOrigins
          .split("\n")
          .filter((url) => url.trim()),
        customDomain: data.customDomain,
        sdkAllowedDomains: data.sdkAllowedDomains
          ? data.sdkAllowedDomains.split("\n").filter((url) => url.trim())
          : [],
        enableCORS: data.enableCORS,
        corsMaxAge: data.corsMaxAge,
      };

      const result = await updateDomainSettings(orgId, domainData);
      if (result.success) {
        showMessage("success", "Domain settings saved successfully!");
        refetch();
      } else {
        showMessage(
          "error",
          result.errors?.[0]?.message || "Failed to save domain settings"
        );
      }
    } catch (error) {
      console.error("Failed to save domain settings:", error);
      showMessage("error", "Failed to save domain settings");
    }
  };

  const saveBrandingSettings = async (data: BrandingSettingsForm) => {
    try {
      const result = await updateBrandingSettings(orgId, data);
      if (result.success) {
        showMessage("success", "Branding settings saved successfully!");
        refetch();
      } else {
        showMessage(
          "error",
          result.errors?.[0]?.message || "Failed to save branding settings"
        );
      }
    } catch (error) {
      console.error("Failed to save branding settings:", error);
      showMessage("error", "Failed to save branding settings");
    }
  };

  const saveNotificationSettings = async (data: NotificationSettingsForm) => {
    try {
      const result = await updateNotificationSettings(orgId, data);
      if (result.success) {
        showMessage("success", "Notification settings saved successfully!");
        refetch();
      } else {
        showMessage(
          "error",
          result.errors?.[0]?.message || "Failed to save notification settings"
        );
      }
    } catch (error) {
      console.error("Failed to save notification settings:", error);
      showMessage("error", "Failed to save notification settings");
    }
  };

  const saveAnalyticsSettings = async (data: AnalyticsSettingsForm) => {
    try {
      const result = await updateAnalyticsSettings(orgId, data);
      if (result.success) {
        showMessage("success", "Analytics settings saved successfully!");
        refetch();
      } else {
        showMessage(
          "error",
          result.errors?.[0]?.message || "Failed to save analytics settings"
        );
      }
    } catch (error) {
      console.error("Failed to save analytics settings:", error);
      showMessage("error", "Failed to save analytics settings");
    }
  };

  if (loading) {
    return (
      <PageLoader
        title="Loading Organization Settings..."
        description="Please wait while we load your organization settings"
      />
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <div>
            <h3 className="font-medium text-lg">Failed to Load Settings</h3>
            <p className="text-sm text-muted-foreground">
              We couldn't load your organization settings. Please try again.
            </p>
          </div>
          <Button onClick={() => refetch()} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Navigation Breadcrumb */}
      <div className="mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link
              href={`/dashboard/${orgId}`}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Link>
          </Button>
        </div>

        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                href={`/dashboard/${orgId}`}
                className="flex items-center space-x-1"
              >
                <Home className="h-4 w-4" />
                <span>Dashboard</span>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="flex items-center space-x-1">
                <Settings className="h-4 w-4" />
                <span>Organization Settings</span>
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Organization Settings</h1>
        <p className="text-gray-600">
          Manage your organization's authentication and security settings
        </p>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <Alert
          className={
            saveMessage.type === "success"
              ? "border-green-200 bg-green-50"
              : "border-red-200 bg-red-50"
          }
        >
          {saveMessage.type === "success" ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription
            className={
              saveMessage.type === "success" ? "text-green-800" : "text-red-800"
            }
          >
            {saveMessage.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Settings Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="domains" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Domains
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Branding
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex items-center gap-2"
          >
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Webhook className="h-4 w-4" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Crown className="h-4 w-4" />
            Advanced
          </TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Information</CardTitle>
              <CardDescription>
                Basic information about your organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={generalForm.handleSubmit(saveGeneralSettings)}
                className="space-y-6"
              >
                {/* Organization Logo Section */}
                <div className="space-y-4">
                  <Label htmlFor="logo">Organization Logo</Label>
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      {generalForm.watch("imageUrl") ||
                      organization?.imageUrl ? (
                        <div className="relative w-24 h-24 rounded-lg overflow-hidden border">
                          <img
                            src={
                              generalForm.watch("imageUrl") ||
                              organization?.imageUrl ||
                              ""
                            }
                            alt="Organization logo"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => generalForm.setValue("imageUrl", "")}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                          <Camera className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex space-x-2">
                        <Button type="button" variant="outline" size="sm">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Logo
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Default organization icons
                            const defaultIcons = [
                              "https://ui-avatars.com/api/?name=" +
                                encodeURIComponent(
                                  generalForm.watch("name") || "Org"
                                ) +
                                "&background=4F46E5&color=fff&size=200",
                              "https://api.dicebear.com/7.x/shapes/svg?seed=" +
                                encodeURIComponent(
                                  generalForm.watch("name") || "org"
                                ),
                              "https://api.dicebear.com/7.x/bottts/svg?seed=" +
                                encodeURIComponent(
                                  generalForm.watch("name") || "org"
                                ),
                              "https://api.dicebear.com/7.x/identicon/svg?seed=" +
                                encodeURIComponent(
                                  generalForm.watch("name") || "org"
                                ),
                            ];
                            generalForm.setValue(
                              "imageUrl",
                              defaultIcons[
                                Math.floor(Math.random() * defaultIcons.length)
                              ]
                            );
                          }}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Generate Icon
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">
                        Recommended: 200x200px, PNG/JPG format
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="imageUrl">Logo URL (Optional)</Label>
                    <Input
                      id="imageUrl"
                      placeholder="https://yourcompany.com/logo.png"
                      {...generalForm.register("imageUrl")}
                    />
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Organization Name</Label>
                    <Input
                      id="name"
                      placeholder="Acme Corporation"
                      {...generalForm.register("name")}
                    />
                    {generalForm.formState.errors.name && (
                      <p className="text-sm text-red-600">
                        {generalForm.formState.errors.name.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Organization Slug</Label>
                    <Input
                      id="slug"
                      placeholder="acme-corp"
                      {...generalForm.register("slug")}
                    />
                    {generalForm.formState.errors.slug && (
                      <p className="text-sm text-red-600">
                        {generalForm.formState.errors.slug.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of your organization"
                    {...generalForm.register("description")}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="website">Website URL</Label>
                    <Input
                      id="website"
                      placeholder="https://acme-corp.com"
                      {...generalForm.register("website")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supportEmail">Support Email</Label>
                    <Input
                      id="supportEmail"
                      type="email"
                      placeholder="support@acme-corp.com"
                      {...generalForm.register("supportEmail")}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={generalForm.watch("timezone")}
                    onValueChange={(value) =>
                      generalForm.setValue("timezone", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">
                        Eastern Time
                      </SelectItem>
                      <SelectItem value="America/Chicago">
                        Central Time
                      </SelectItem>
                      <SelectItem value="America/Denver">
                        Mountain Time
                      </SelectItem>
                      <SelectItem value="America/Los_Angeles">
                        Pacific Time
                      </SelectItem>
                      <SelectItem value="Europe/London">London</SelectItem>
                      <SelectItem value="Europe/Paris">Paris</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                      <SelectItem value="Asia/Kolkata">India (IST)</SelectItem>
                      <SelectItem value="Australia/Sydney">Sydney</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-medium mb-4">
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contactName">Primary Contact Name</Label>
                      <Input
                        id="contactName"
                        placeholder="John Doe"
                        {...generalForm.register("contactName")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactEmail">
                        Primary Contact Email
                      </Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        placeholder="john@acme-corp.com"
                        {...generalForm.register("contactEmail")}
                      />
                    </div>
                  </div>
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="contactPhone">Phone Number</Label>
                    <Input
                      id="contactPhone"
                      placeholder="+1 (555) 123-4567"
                      {...generalForm.register("contactPhone")}
                    />
                  </div>
                </div>

                <Button type="submit" disabled={updatingGeneral}>
                  <Save className="h-4 w-4 mr-2" />
                  {updatingGeneral ? "Saving..." : "Save General Settings"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Password Policy & Security</CardTitle>
              <CardDescription>
                Configure password requirements and security policies for this
                organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={passwordForm.handleSubmit(savePasswordPolicy)}
                className="space-y-6"
              >
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">
                        Organization Security Settings
                      </h4>
                      <p className="text-sm text-blue-800 mt-1">
                        These settings apply only to users within this
                        organization and override global defaults.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minLength">Minimum Password Length</Label>
                    <Input
                      id="minLength"
                      type="number"
                      min="6"
                      max="128"
                      {...passwordForm.register("minLength", {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="passwordHistory">Password History</Label>
                    <Input
                      id="passwordHistory"
                      type="number"
                      min="0"
                      max="24"
                      {...passwordForm.register("passwordHistory", {
                        valueAsNumber: true,
                      })}
                    />
                    <p className="text-xs text-gray-500">
                      Prevent reusing the last N passwords
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Password Requirements</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="requireUppercase">
                        Require uppercase letters
                      </Label>
                      <Switch
                        id="requireUppercase"
                        {...passwordForm.register("requireUppercase")}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="requireLowercase">
                        Require lowercase letters
                      </Label>
                      <Switch
                        id="requireLowercase"
                        {...passwordForm.register("requireLowercase")}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="requireNumbers">Require numbers</Label>
                      <Switch
                        id="requireNumbers"
                        {...passwordForm.register("requireNumbers")}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="requireSpecialChars">
                        Require special characters
                      </Label>
                      <Switch
                        id="requireSpecialChars"
                        {...passwordForm.register("requireSpecialChars")}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">
                    Organization Authentication Settings
                  </h4>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="enableMFA">
                        Require Multi-Factor Authentication
                      </Label>
                      <p className="text-sm text-gray-500">
                        Force all organization members to enable MFA
                      </p>
                    </div>
                    <Switch
                      id="enableMFA"
                      {...passwordForm.register("enableMFA")}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="allowPasswordReset">
                        Allow Password Reset
                      </Label>
                      <p className="text-sm text-gray-500">
                        Allow users to reset passwords via email
                      </p>
                    </div>
                    <Switch
                      id="allowPasswordReset"
                      {...passwordForm.register("allowPasswordReset")}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="enforcePasswordComplexity">
                        Enforce Password Complexity
                      </Label>
                      <p className="text-sm text-gray-500">
                        Strict password validation rules
                      </p>
                    </div>
                    <Switch
                      id="enforcePasswordComplexity"
                      {...passwordForm.register("enforcePasswordComplexity")}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">
                      Session Timeout (minutes)
                    </Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      min="5"
                      max="1440"
                      {...passwordForm.register("sessionTimeout", {
                        valueAsNumber: true,
                      })}
                    />
                    <p className="text-xs text-gray-500">
                      Auto-logout after inactivity
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="passwordExpiration">
                      Password Expiration (days)
                    </Label>
                    <Input
                      id="passwordExpiration"
                      type="number"
                      min="0"
                      max="365"
                      {...passwordForm.register("passwordExpiration", {
                        valueAsNumber: true,
                      })}
                    />
                    <p className="text-xs text-gray-500">0 = Never expires</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                    <Input
                      id="maxLoginAttempts"
                      type="number"
                      min="1"
                      max="20"
                      {...passwordForm.register("maxLoginAttempts", {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lockoutDuration">
                      Lockout Duration (minutes)
                    </Label>
                    <Input
                      id="lockoutDuration"
                      type="number"
                      min="1"
                      max="1440"
                      {...passwordForm.register("lockoutDuration", {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                </div>

                <Button type="submit" disabled={updatingPassword}>
                  <Save className="h-4 w-4 mr-2" />
                  {updatingPassword ? "Saving..." : "Save Security Settings"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Domain Settings Tab */}
        <TabsContent value="domains">
          <Card>
            <CardHeader>
              <CardTitle>Domain Configuration</CardTitle>
              <CardDescription>
                Configure allowed URLs, custom domains, and SDK whitelisting for
                your authentication flows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={domainForm.handleSubmit(saveDomainSettings)}
                className="space-y-6"
              >
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Globe className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-900">
                        SDK Domain Whitelisting
                      </h4>
                      <p className="text-sm text-green-800 mt-1">
                        Control which domains can use your authentication SDK
                        and API endpoints.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sdkAllowedDomains">SDK Allowed Domains</Label>
                  <Textarea
                    id="sdkAllowedDomains"
                    placeholder="https://yourapp.com
https://yourapp.vercel.app
https://localhost:3000"
                    rows={4}
                    {...domainForm.register("sdkAllowedDomains")}
                  />
                  <p className="text-sm text-gray-500">
                    One domain per line. These domains can use your
                    authentication SDK. Leave empty to allow all domains (not
                    recommended for production).
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="enableCORS">Enable CORS</Label>
                      <p className="text-sm text-gray-500">
                        Allow cross-origin requests from SDK domains
                      </p>
                    </div>
                    <Switch
                      id="enableCORS"
                      {...domainForm.register("enableCORS")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="corsMaxAge">CORS Max Age (seconds)</Label>
                    <Input
                      id="corsMaxAge"
                      type="number"
                      min="0"
                      max="86400"
                      {...domainForm.register("corsMaxAge", {
                        valueAsNumber: true,
                      })}
                    />
                    <p className="text-xs text-gray-500">
                      How long browsers cache CORS preflight responses
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="allowedCallbackUrls">
                    Allowed Callback URLs
                  </Label>
                  <Textarea
                    id="allowedCallbackUrls"
                    placeholder="https://yourapp.com/callback
https://yourapp.com/auth/callback"
                    {...domainForm.register("allowedCallbackUrls")}
                  />
                  <p className="text-sm text-gray-500">
                    One URL per line. These are the URLs where users will be
                    redirected after authentication.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="allowedLogoutUrls">Allowed Logout URLs</Label>
                  <Textarea
                    id="allowedLogoutUrls"
                    placeholder="https://yourapp.com/
https://yourapp.com/login"
                    {...domainForm.register("allowedLogoutUrls")}
                  />
                  <p className="text-sm text-gray-500">
                    URLs where users will be redirected after logout.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="allowedWebOrigins">Allowed Web Origins</Label>
                  <Textarea
                    id="allowedWebOrigins"
                    placeholder="https://yourapp.com
https://localhost:3000"
                    {...domainForm.register("allowedWebOrigins")}
                  />
                  <p className="text-sm text-gray-500">
                    Origins allowed to make CORS requests to the authentication
                    API.
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="customDomain">Custom Domain (Optional)</Label>
                  <Input
                    id="customDomain"
                    placeholder="auth.yourcompany.com"
                    {...domainForm.register("customDomain")}
                  />
                  <p className="text-sm text-gray-500">
                    Use your own domain for authentication pages instead of our
                    default domain.
                  </p>
                </div>

                <Button type="submit" disabled={updatingDomain}>
                  <Save className="h-4 w-4 mr-2" />
                  {updatingDomain ? "Saving..." : "Save Domain Settings"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding Settings Tab */}
        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle>Branding & Customization</CardTitle>
              <CardDescription>
                Customize the appearance of your authentication pages and
                organization branding
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={brandingForm.handleSubmit(saveBrandingSettings)}
                className="space-y-6"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="primaryColor"
                        type="color"
                        className="w-16 h-10 p-1 border rounded"
                        {...brandingForm.register("primaryColor")}
                      />
                      <Input
                        placeholder="#4F46E5"
                        {...brandingForm.register("primaryColor")}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondaryColor">Secondary Color</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="secondaryColor"
                        type="color"
                        className="w-16 h-10 p-1 border rounded"
                        {...brandingForm.register("secondaryColor")}
                      />
                      <Input
                        placeholder="#6B7280"
                        {...brandingForm.register("secondaryColor")}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="logoUrl">Logo URL</Label>
                    <Input
                      id="logoUrl"
                      placeholder="https://yourcompany.com/logo.png"
                      {...brandingForm.register("logoUrl")}
                    />
                    <p className="text-sm text-gray-500">
                      Logo will be displayed on authentication pages
                      (recommended: 200x50px)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="faviconUrl">Favicon URL</Label>
                    <Input
                      id="faviconUrl"
                      placeholder="https://yourcompany.com/favicon.ico"
                      {...brandingForm.register("faviconUrl")}
                    />
                    <p className="text-sm text-gray-500">
                      Favicon for authentication pages (recommended: 32x32px)
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customCss">Custom CSS</Label>
                  <Textarea
                    id="customCss"
                    placeholder="/* Custom CSS for authentication pages */
.auth-container {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}"
                    rows={8}
                    {...brandingForm.register("customCss")}
                  />
                  <p className="text-sm text-gray-500">
                    Custom CSS will be injected into authentication pages. Use
                    carefully.
                  </p>
                </div>

                <Button type="submit" disabled={updatingBranding}>
                  <Save className="h-4 w-4 mr-2" />
                  {updatingBranding ? "Saving..." : "Save Branding Settings"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure email notifications and alerts for your organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={notificationForm.handleSubmit(
                  saveNotificationSettings
                )}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <h4 className="font-medium">Email Notifications</h4>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="emailNotifications">
                        General Email Notifications
                      </Label>
                      <p className="text-sm text-gray-500">
                        Receive general updates and announcements via email
                      </p>
                    </div>
                    <Switch
                      id="emailNotifications"
                      {...notificationForm.register("emailNotifications")}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="securityAlerts">Security Alerts</Label>
                      <p className="text-sm text-gray-500">
                        Important security notifications and alerts
                        (recommended)
                      </p>
                    </div>
                    <Switch
                      id="securityAlerts"
                      {...notificationForm.register("securityAlerts")}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="weeklyReports">Weekly Reports</Label>
                      <p className="text-sm text-gray-500">
                        Weekly summary of authentication activity and metrics
                      </p>
                    </div>
                    <Switch
                      id="weeklyReports"
                      {...notificationForm.register("weeklyReports")}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="systemUpdates">System Updates</Label>
                      <p className="text-sm text-gray-500">
                        Notifications about system maintenance and updates
                      </p>
                    </div>
                    <Switch
                      id="systemUpdates"
                      {...notificationForm.register("systemUpdates")}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="marketingEmails">
                        Marketing Communications
                      </Label>
                      <p className="text-sm text-gray-500">
                        Product updates, tips, and promotional content
                      </p>
                    </div>
                    <Switch
                      id="marketingEmails"
                      {...notificationForm.register("marketingEmails")}
                    />
                  </div>
                </div>

                <Button type="submit" disabled={updatingNotifications}>
                  <Save className="h-4 w-4 mr-2" />
                  {updatingNotifications
                    ? "Saving..."
                    : "Save Notification Settings"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Settings Tab */}
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics & Data</CardTitle>
              <CardDescription>
                Configure analytics tracking and data retention policies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={analyticsForm.handleSubmit(saveAnalyticsSettings)}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="enableTracking">
                        Enable Analytics Tracking
                      </Label>
                      <p className="text-sm text-gray-500">
                        Track authentication events and user behavior for
                        insights
                      </p>
                    </div>
                    <Switch
                      id="enableTracking"
                      {...analyticsForm.register("enableTracking")}
                    />
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="retentionPeriod">
                      Data Retention Period (days)
                    </Label>
                    <Input
                      id="retentionPeriod"
                      type="number"
                      min="1"
                      max="365"
                      {...analyticsForm.register("retentionPeriod", {
                        valueAsNumber: true,
                      })}
                    />
                    <p className="text-sm text-gray-500">
                      How long to keep analytics data before automatic deletion
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exportFormat">Export Format</Label>
                    <Select
                      value={analyticsForm.watch("exportFormat")}
                      onValueChange={(value: "JSON" | "CSV") =>
                        analyticsForm.setValue("exportFormat", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select export format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="JSON">JSON</SelectItem>
                        <SelectItem value="CSV">CSV</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-500">
                      Default format for analytics data exports
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">
                        Privacy & Compliance
                      </h4>
                      <p className="text-sm text-blue-800 mt-1">
                        We collect only essential analytics data and follow
                        GDPR/CCPA guidelines. Personal user data is anonymized
                        and can be deleted upon request.
                      </p>
                    </div>
                  </div>
                </div>

                <Button type="submit" disabled={updatingAnalytics}>
                  <Save className="h-4 w-4 mr-2" />
                  {updatingAnalytics ? "Saving..." : "Save Analytics Settings"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Placeholder tabs for future implementation */}
        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>Integrations & APIs</CardTitle>
              <CardDescription>
                Coming soon - Configure webhooks, social providers, and API
                settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 space-y-4">
                <Webhook className="h-12 w-12 mx-auto text-gray-400" />
                <div>
                  <h3 className="font-medium text-lg">
                    Integrations Coming Soon
                  </h3>
                  <p className="text-sm text-gray-500 max-w-md mx-auto">
                    Configure third-party integrations, webhooks, social login
                    providers, and API settings.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Features</CardTitle>
              <CardDescription>
                Coming soon - Enterprise SSO, compliance, and advanced security
                features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 space-y-4">
                <Crown className="h-12 w-12 mx-auto text-gray-400" />
                <div>
                  <h3 className="font-medium text-lg">
                    Enterprise Features Coming Soon
                  </h3>
                  <p className="text-sm text-gray-500 max-w-md mx-auto">
                    Advanced security features, enterprise SSO, compliance
                    tools, and audit controls.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
