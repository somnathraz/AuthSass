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
  Key,
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
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  Code,
  Smartphone,
  Monitor,
  Server,
  Package,
  ImageIcon,
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
import { Badge } from "@/components/ui/badge";
import { useFetchAppWithSettings } from "@/services/authService";
import {
  useUpdateAppGeneralSettings,
  useUpdateAppAuthSettings,
  useUpdateAppSecuritySettings,
  useUpdateAppBrandingSettings,
} from "@/graphql/app.mutations";
import { SettingsPageShimmer } from "@/components/ui/loading";

// TODO: Import real app services when available
// For now using mock data structure

// Form schemas for different sections
const generalSettingsSchema = z.object({
  name: z.string().min(1, "App name is required").max(100),
  description: z.string().max(500).optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
  type: z.enum(["WEB", "MOBILE", "API", "SERVICE"]),
});

const authSettingsSchema = z.object({
  enableSignUp: z.boolean(),
  requireEmailVerification: z.boolean(),
  allowSocialLogins: z.boolean(),
  socialProviders: z.array(z.string()),
  sessionTimeout: z.number().min(1).max(168),
  enableMFA: z.boolean(),
  allowPasswordless: z.boolean(),
  passwordPolicy: z.object({
    minLength: z.number().min(6).max(128),
    requireUppercase: z.boolean(),
    requireLowercase: z.boolean(),
    requireNumbers: z.boolean(),
    requireSpecialChars: z.boolean(),
  }),
});

const securitySettingsSchema = z.object({
  enableRateLimit: z.boolean(),
  rateLimitRequests: z.number().min(1).max(10000),
  rateLimitWindow: z.number().min(1).max(60),
  enableBruteForceProtection: z.boolean(),
  maxLoginAttempts: z.number().min(1).max(20),
  lockoutDuration: z.number().min(1).max(1440),
  jwtAlgorithm: z.enum(["RS256", "HS256", "ES256"]),
  jwtExpiration: z.number().min(1).max(168),
});

const domainSettingsSchema = z.object({
  allowedOrigins: z.string(),
  allowedCallbacks: z.string(),
  allowedLogouts: z.string(),
  enableCORS: z.boolean(),
  corsMaxAge: z.number().min(0).max(86400),
});

const brandingSettingsSchema = z.object({
  primaryColor: z.string(),
  secondaryColor: z.string(),
  customCss: z.string().optional(),
  loginPageUrl: z.string().url().optional().or(z.literal("")),
});

type GeneralSettings = z.infer<typeof generalSettingsSchema>;
type AuthSettings = z.infer<typeof authSettingsSchema>;
type SecuritySettings = z.infer<typeof securitySettingsSchema>;
type DomainSettings = z.infer<typeof domainSettingsSchema>;
type BrandingSettings = z.infer<typeof brandingSettingsSchema>;

// Mock app data structure
interface AppSettings {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  type: "WEB" | "MOBILE" | "API" | "SERVICE";
  clientId: string;
  clientSecret: string;

  // Auth settings
  enableSignUp: boolean;
  requireEmailVerification: boolean;
  allowSocialLogins: boolean;
  socialProviders: string[];
  sessionTimeout: number;
  enableMFA: boolean;
  allowPasswordless: boolean;

  // Security settings
  enableRateLimit: boolean;
  rateLimitRequests: number;
  rateLimitWindow: number;
  enableBruteForceProtection: boolean;
  maxLoginAttempts: number;
  lockoutDuration: number;
  jwtAlgorithm: string;
  jwtExpiration: number;

  // Domain settings
  allowedOrigins: string[];
  allowedCallbacks: string[];
  allowedLogouts: string[];
  enableCORS: boolean;
  corsMaxAge: number;

  // Branding
  primaryColor: string;
  secondaryColor: string;
  customCss?: string;
  loginPageUrl?: string;

  // Advanced
  webhookUrl?: string;
  webhookEvents: string[];
  analyticsEnabled: boolean;
}

export default function AppSettingsPage() {
  const { orgId, appId } = useParams<{ orgId: string; appId: string }>();
  const [loading, setLoading] = useState(true);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [activeTab, setActiveTab] = useState("general");
  const [saveMessage, setSaveMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [showClientSecret, setShowClientSecret] = useState(false);

  // Add mutation hooks
  const {
    updateAppGeneralSettings,
    loading: updatingGeneral,
    error: generalError,
  } = useUpdateAppGeneralSettings();
  const {
    updateAppAuthSettings,
    loading: updatingAuth,
    error: authError,
  } = useUpdateAppAuthSettings();
  const {
    updateAppSecuritySettings,
    loading: updatingSecurity,
    error: securityError,
  } = useUpdateAppSecuritySettings();
  const {
    updateAppBrandingSettings,
    loading: updatingBranding,
    error: brandingError,
  } = useUpdateAppBrandingSettings();

  // Fetch real app data
  const {
    app: currentApp,
    loading: fetchingApps,
    error: fetchError,
    refetch,
  } = useFetchAppWithSettings(appId);

  // Debug logging to investigate logoUrl issue
  useEffect(() => {
    if (currentApp) {
      console.log("🔍 DEBUG: Current app data:", {
        id: currentApp.id,
        name: currentApp.name,
        generalSettings: currentApp.generalSettings,
        logoUrl: currentApp.generalSettings?.logoUrl,
        hasGeneralSettings: !!currentApp.generalSettings,
        allFields: Object.keys(currentApp.generalSettings || {}),
      });
    }
  }, [currentApp]);

  useEffect(() => {
    if (!fetchingApps && currentApp) {
      // Convert real app data to our AppSettings interface with reasonable defaults
      setAppSettings({
        id: currentApp.id,
        name: currentApp.name,
        description: currentApp.description || "",
        logoUrl: currentApp.generalSettings?.logoUrl || "",
        type: currentApp.type as "WEB" | "MOBILE" | "API" | "SERVICE",
        clientId: `${currentApp.id}_client`,
        clientSecret: `sk_${Math.random().toString(36).substr(2, 32)}`,

        // Auth settings from backend or defaults
        enableSignUp: currentApp.authSettings?.enableSignUp ?? true,
        requireEmailVerification:
          currentApp.authSettings?.requireEmailVerification ?? true,
        allowSocialLogins: currentApp.authSettings?.allowSocialLogins ?? false,
        socialProviders: currentApp.authSettings?.socialProviders ?? [],
        sessionTimeout: currentApp.authSettings?.sessionTimeout ?? 24,
        enableMFA: currentApp.securitySettings?.enableMFA ?? false,
        allowPasswordless: currentApp.authSettings?.enablePasswordless ?? false,

        // Security settings from backend or defaults
        enableRateLimit: currentApp.securitySettings?.enableRateLimit ?? true,
        rateLimitRequests:
          currentApp.securitySettings?.rateLimitRequests ?? 100,
        rateLimitWindow: currentApp.securitySettings?.rateLimitWindow ?? 15,
        enableBruteForceProtection:
          currentApp.securitySettings?.enableBruteForceProtection ?? true,
        maxLoginAttempts: currentApp.securitySettings?.maxLoginAttempts ?? 5,
        lockoutDuration: currentApp.securitySettings?.lockoutDuration ?? 30,
        jwtAlgorithm: currentApp.authSettings?.jwtAlgorithm ?? "RS256",
        jwtExpiration: currentApp.authSettings?.jwtExpiration ?? 24,

        // Domain settings from backend or defaults
        allowedOrigins: currentApp.generalSettings?.allowedOrigins ?? [],
        allowedCallbacks: currentApp.generalSettings?.allowedCallbacks ?? [],
        allowedLogouts: currentApp.generalSettings?.allowedLogouts ?? [],
        enableCORS: true, // Default since not in schema
        corsMaxAge: 3600, // Default since not in schema

        // Branding settings from backend or defaults
        primaryColor: currentApp.brandingSettings?.primaryColor ?? "#4F46E5",
        secondaryColor:
          currentApp.brandingSettings?.secondaryColor ?? "#6B7280",
        customCss: currentApp.brandingSettings?.customCss ?? "",
        loginPageUrl: "", // Not in current schema

        // Advanced settings with defaults (not in current schema)
        webhookUrl: "",
        webhookEvents: [],
        analyticsEnabled: true,
      });
      setLoading(false);
    } else if (!fetchingApps && !currentApp) {
      setLoading(false);
    }
  }, [fetchingApps, currentApp, appId]);

  // Form hooks for different sections
  const generalForm = useForm<GeneralSettings>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      name: "",
      description: "",
      logoUrl: "",
      type: "WEB",
    },
  });

  const authForm = useForm<AuthSettings>({
    resolver: zodResolver(authSettingsSchema),
    defaultValues: {
      enableSignUp: true,
      requireEmailVerification: true,
      allowSocialLogins: false,
      socialProviders: [],
      sessionTimeout: 24,
      enableMFA: false,
      allowPasswordless: false,
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
      },
    },
  });

  const securityForm = useForm<SecuritySettings>({
    resolver: zodResolver(securitySettingsSchema),
    defaultValues: {
      enableRateLimit: true,
      rateLimitRequests: 100,
      rateLimitWindow: 15,
      enableBruteForceProtection: true,
      maxLoginAttempts: 5,
      lockoutDuration: 30,
      jwtAlgorithm: "RS256",
      jwtExpiration: 24,
    },
  });

  const domainForm = useForm<DomainSettings>({
    resolver: zodResolver(domainSettingsSchema),
    defaultValues: {
      allowedOrigins: "",
      allowedCallbacks: "",
      allowedLogouts: "",
      enableCORS: true,
      corsMaxAge: 3600,
    },
  });

  const brandingForm = useForm<BrandingSettings>({
    resolver: zodResolver(brandingSettingsSchema),
    defaultValues: {
      primaryColor: "#4F46E5",
      secondaryColor: "#6B7280",
      customCss: "",
      loginPageUrl: "",
    },
  });

  // Load app data into forms when available
  useEffect(() => {
    if (currentApp) {
      console.log("🔧 Loading app data into forms:", {
        appId: currentApp.id,
        logoUrlFromGeneralSettings: currentApp.generalSettings?.logoUrl,
        hasGeneralSettings: !!currentApp.generalSettings,
      });

      generalForm.reset({
        name: currentApp.name,
        description: currentApp.description || "",
        logoUrl: currentApp.generalSettings?.logoUrl || "",
        type:
          (currentApp.type as "WEB" | "MOBILE" | "API" | "SERVICE") || "WEB",
      });

      // Log what was actually set in the form
      setTimeout(() => {
        console.log("📝 Form values after reset:", {
          logoUrl: generalForm.getValues("logoUrl"),
          formData: generalForm.getValues(),
        });
      }, 100);

      authForm.reset({
        enableSignUp: currentApp.authSettings?.enableSignUp ?? true,
        requireEmailVerification:
          currentApp.authSettings?.requireEmailVerification ?? true,
        allowSocialLogins: currentApp.authSettings?.allowSocialLogins ?? false,
        socialProviders: currentApp.authSettings?.socialProviders ?? [],
        sessionTimeout: currentApp.authSettings?.sessionTimeout ?? 24,
        enableMFA: currentApp.securitySettings?.enableMFA ?? false,
        allowPasswordless: currentApp.authSettings?.enablePasswordless ?? false,
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: false,
        },
      });

      securityForm.reset({
        enableRateLimit: currentApp.securitySettings?.enableRateLimit ?? true,
        rateLimitRequests:
          currentApp.securitySettings?.rateLimitRequests ?? 100,
        rateLimitWindow: currentApp.securitySettings?.rateLimitWindow ?? 15,
        enableBruteForceProtection:
          currentApp.securitySettings?.enableBruteForceProtection ?? true,
        maxLoginAttempts: currentApp.securitySettings?.maxLoginAttempts ?? 5,
        lockoutDuration: currentApp.securitySettings?.lockoutDuration ?? 30,
        jwtAlgorithm:
          (currentApp.authSettings?.jwtAlgorithm as
            | "RS256"
            | "HS256"
            | "ES256") ?? "RS256",
        jwtExpiration: currentApp.authSettings?.jwtExpiration ?? 24,
      });

      domainForm.reset({
        allowedOrigins: (currentApp.generalSettings?.allowedOrigins ?? []).join(
          "\n"
        ),
        allowedCallbacks: (
          currentApp.generalSettings?.allowedCallbacks ?? []
        ).join("\n"),
        allowedLogouts: (currentApp.generalSettings?.allowedLogouts ?? []).join(
          "\n"
        ),
        enableCORS: true, // Default since not in schema
        corsMaxAge: 3600, // Default since not in schema
      });

      brandingForm.reset({
        primaryColor: currentApp.brandingSettings?.primaryColor ?? "#4F46E5",
        secondaryColor:
          currentApp.brandingSettings?.secondaryColor ?? "#6B7280",
        customCss: currentApp.brandingSettings?.customCss ?? "",
        loginPageUrl: "", // Not in current schema
      });
    }
  }, [
    currentApp,
    generalForm,
    authForm,
    securityForm,
    domainForm,
    brandingForm,
  ]);

  const showMessage = (type: "success" | "error", message: string) => {
    setSaveMessage({ type, message });
    setTimeout(() => setSaveMessage(null), 5000);
  };

  const getAppTypeIcon = (type: string) => {
    switch (type) {
      case "WEB":
        return <Globe className="h-4 w-4" />;
      case "MOBILE":
        return <Smartphone className="h-4 w-4" />;
      case "API":
        return <Code className="h-4 w-4" />;
      case "SERVICE":
        return <Server className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showMessage("success", "Copied to clipboard!");
  };

  const regenerateSecret = () => {
    const newSecret = `sk_${Math.random().toString(36).substr(2, 32)}`;
    if (appSettings) {
      setAppSettings({ ...appSettings, clientSecret: newSecret });
      showMessage("success", "Client secret regenerated!");
    }
  };

  // Save functions for each settings section
  const saveGeneralSettings = async (data: GeneralSettings) => {
    try {
      console.log("Saving general settings with data:", data);

      const result = await updateAppGeneralSettings({
        variables: {
          id: appId,
          input: {
            description: data.description || "",
            logoUrl: data.logoUrl || "",
            // Include any additional fields that might be needed
            website: "", // Add website if available in form
          },
        },
      });

      console.log("Update result:", result);

      if (result.data?.updateAppGeneralSettings?.success) {
        showMessage("success", "General settings saved successfully!");
        await refetch(); // Refresh app data with await to ensure it completes
      } else {
        const errorMsg =
          result.data?.updateAppGeneralSettings?.errors?.[0]?.message ||
          "Failed to save general settings";
        console.error(
          "Save failed:",
          result.data?.updateAppGeneralSettings?.errors
        );
        showMessage("error", errorMsg);
      }
    } catch (error) {
      console.error("Failed to save general settings:", error);
      showMessage("error", "Failed to save general settings");
    }
  };

  const saveAuthSettings = async (data: AuthSettings) => {
    try {
      const result = await updateAppAuthSettings({
        variables: {
          id: appId,
          input: {
            enableSignUp: data.enableSignUp,
            requireEmailVerification: data.requireEmailVerification,
            allowSocialLogins: data.allowSocialLogins,
            socialProviders: data.socialProviders,
            sessionTimeout: data.sessionTimeout,
            enablePasswordless: data.allowPasswordless,
            jwtExpiration: 24, // Default
          },
        },
      });

      if (result.data?.updateAppAuthSettings?.success) {
        showMessage("success", "Authentication settings saved successfully!");
        refetch();
      } else {
        const errorMsg =
          result.data?.updateAppAuthSettings?.errors?.[0]?.message ||
          "Failed to save auth settings";
        showMessage("error", errorMsg);
      }
    } catch (error) {
      console.error("Failed to save auth settings:", error);
      showMessage("error", "Failed to save authentication settings");
    }
  };

  const saveSecuritySettings = async (data: SecuritySettings) => {
    try {
      const result = await updateAppSecuritySettings({
        variables: {
          id: appId,
          input: {
            enableRateLimit: data.enableRateLimit,
            rateLimitRequests: data.rateLimitRequests,
            rateLimitWindow: data.rateLimitWindow,
            enableBruteForceProtection: data.enableBruteForceProtection,
            maxLoginAttempts: data.maxLoginAttempts,
            lockoutDuration: data.lockoutDuration,
          },
        },
      });

      if (result.data?.updateAppSecuritySettings?.success) {
        showMessage("success", "Security settings saved successfully!");
        refetch();
      } else {
        const errorMsg =
          result.data?.updateAppSecuritySettings?.errors?.[0]?.message ||
          "Failed to save security settings";
        showMessage("error", errorMsg);
      }
    } catch (error) {
      console.error("Failed to save security settings:", error);
      showMessage("error", "Failed to save security settings");
    }
  };

  const saveDomainSettings = async (data: DomainSettings) => {
    try {
      const result = await updateAppGeneralSettings({
        variables: {
          id: appId,
          input: {
            allowedOrigins: data.allowedOrigins
              .split("\n")
              .filter((url) => url.trim()),
            allowedCallbacks: data.allowedCallbacks
              .split("\n")
              .filter((url) => url.trim()),
            allowedLogouts: data.allowedLogouts
              .split("\n")
              .filter((url) => url.trim()),
          },
        },
      });

      if (result.data?.updateAppGeneralSettings?.success) {
        showMessage("success", "Domain settings saved successfully!");
        refetch();
      } else {
        const errorMsg =
          result.data?.updateAppGeneralSettings?.errors?.[0]?.message ||
          "Failed to save domain settings";
        showMessage("error", errorMsg);
      }
    } catch (error) {
      console.error("Failed to save domain settings:", error);
      showMessage("error", "Failed to save domain settings");
    }
  };

  const saveBrandingSettings = async (data: BrandingSettings) => {
    try {
      const result = await updateAppBrandingSettings({
        variables: {
          id: appId,
          input: {
            primaryColor: data.primaryColor,
            secondaryColor: data.secondaryColor,
            customCss: data.customCss,
          },
        },
      });

      if (result.data?.updateAppBrandingSettings?.success) {
        showMessage("success", "Branding settings saved successfully!");
        refetch();
      } else {
        const errorMsg =
          result.data?.updateAppBrandingSettings?.errors?.[0]?.message ||
          "Failed to save branding settings";
        showMessage("error", errorMsg);
      }
    } catch (error) {
      console.error("Failed to save branding settings:", error);
      showMessage("error", "Failed to save branding settings");
    }
  };

  if (loading) {
    return <SettingsPageShimmer />;
  }

  if (!currentApp) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <div>
            <h3 className="font-medium text-lg">Application Not Found</h3>
            <p className="text-sm text-muted-foreground">
              The application you're looking for doesn't exist or you don't have
              access to it.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={`/dashboard/${orgId}`}>Back to Dashboard</Link>
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
              href={`/dashboard/${orgId}/app/${appId}`}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to App</span>
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
              <BreadcrumbLink
                href={`/dashboard/${orgId}/app/${appId}`}
                className="flex items-center space-x-1"
              >
                {getAppTypeIcon(appSettings?.type || "WEB")}
                <span>{currentApp?.name}</span>
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

      {/* Current Logo Display Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Current Application Logo
          </CardTitle>
          <CardDescription>
            Your application's current branding and logo display
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-6">
            {/* Large Logo Display */}
            <div className="relative">
              {currentApp?.generalSettings?.logoUrl ? (
                <div className="relative w-32 h-32 rounded-xl overflow-hidden border-2 border-gray-200 bg-white">
                  <img
                    src={currentApp.generalSettings.logoUrl}
                    alt={`${currentApp.name} logo`}
                    className="w-full h-full object-contain p-2"
                    onError={(e) => {
                      // Handle broken image URLs
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      // Show fallback icon instead
                      const container = target.parentElement;
                      if (container) {
                        container.innerHTML = `
                          <div class="w-full h-full flex items-center justify-center bg-gray-100">
                            <svg class="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        `;
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="w-32 h-32 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                  {getAppTypeIcon(appSettings?.type || "WEB")}
                </div>
              )}
            </div>

            {/* Logo Information */}
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="text-lg font-semibold">{currentApp?.name}</h3>
                <p className="text-sm text-gray-500">
                  {currentApp?.generalSettings?.logoUrl
                    ? "Custom logo configured"
                    : "Using default app icon"}
                </p>
              </div>

              {/* Debug Information */}
              <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 space-y-1">
                <div>
                  <strong>Debug Info:</strong>
                </div>
                <div>
                  Logo URL: {currentApp?.generalSettings?.logoUrl || "Not set"}
                </div>
                <div>
                  Has General Settings:{" "}
                  {currentApp?.generalSettings ? "Yes" : "No"}
                </div>
                <div>
                  Settings Fields:{" "}
                  {currentApp?.generalSettings
                    ? Object.keys(currentApp.generalSettings).join(", ")
                    : "None"}
                </div>
              </div>

              {/* Logo URL Display */}
              {currentApp?.generalSettings?.logoUrl && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Current Logo URL
                  </Label>
                  <div className="flex space-x-2">
                    <Input
                      value={currentApp.generalSettings.logoUrl}
                      readOnly
                      className="font-mono text-xs"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(
                          currentApp.generalSettings?.logoUrl || ""
                        )
                      }
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Quick Preview Sizes */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Preview in different sizes
                </Label>
                <div className="flex items-center space-x-3">
                  {[16, 24, 32, 48].map((size) => (
                    <div
                      key={size}
                      className="flex flex-col items-center space-y-1"
                    >
                      <div
                        className="rounded border bg-white flex items-center justify-center"
                        style={{ width: `${size}px`, height: `${size}px` }}
                      >
                        {currentApp?.generalSettings?.logoUrl ? (
                          <img
                            src={currentApp.generalSettings.logoUrl}
                            alt={`${currentApp.name} ${size}px`}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                              const container = target.parentElement;
                              if (container) {
                                const icon = getAppTypeIcon(
                                  appSettings?.type || "WEB"
                                );
                                container.innerHTML = `<div class="w-full h-full flex items-center justify-center text-gray-400">${icon}</div>`;
                              }
                            }}
                          />
                        ) : (
                          <div
                            className="text-gray-400"
                            style={{ fontSize: `${size / 2}px` }}
                          >
                            {getAppTypeIcon(appSettings?.type || "WEB")}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">{size}px</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Header */}
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 rounded-lg overflow-hidden border bg-white flex items-center justify-center">
          {currentApp?.generalSettings?.logoUrl ? (
            <img
              src={currentApp.generalSettings.logoUrl}
              alt={currentApp.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Handle broken image URLs
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                // Show fallback icon instead
                const container = target.parentElement;
                if (container) {
                  container.innerHTML = `
                    <div class="w-full h-full flex items-center justify-center bg-gray-100">
                      <svg class="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  `;
                }
              }}
            />
          ) : (
            getAppTypeIcon(appSettings?.type || "WEB")
          )}
        </div>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            {currentApp?.name}
            <Badge variant="secondary">{appSettings?.type || "WEB"}</Badge>
          </h1>
          <p className="text-gray-600">
            Configure authentication and security settings
          </p>
        </div>
      </div>

      {/* API Credentials Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Credentials
          </CardTitle>
          <CardDescription>
            Use these credentials to integrate with your application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientId">Client ID</Label>
              <div className="flex space-x-2">
                <Input
                  id="clientId"
                  value={appSettings?.clientId || `${currentApp.id}_client`}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(
                      appSettings?.clientId || `${currentApp.id}_client`
                    )
                  }
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientSecret">Client Secret</Label>
              <div className="flex space-x-2">
                <Input
                  id="clientSecret"
                  type={showClientSecret ? "text" : "password"}
                  value={
                    appSettings?.clientSecret ||
                    `sk_${Math.random().toString(36).substr(2, 32)}`
                  }
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowClientSecret(!showClientSecret)}
                >
                  {showClientSecret ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(
                      appSettings?.clientSecret ||
                        `sk_${Math.random().toString(36).substr(2, 32)}`
                    )
                  }
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={regenerateSecret}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-orange-600">
                ⚠️ Keep your client secret secure. Regenerating will invalidate
                the current secret.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

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
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="auth" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Authentication
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
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
          <TabsTrigger value="webhooks" className="flex items-center gap-2">
            <Webhook className="h-4 w-4" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Information</CardTitle>
              <CardDescription>
                Basic information about your application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={generalForm.handleSubmit((data) => {
                  console.log("General settings:", data);
                  saveGeneralSettings(data);
                })}
                className="space-y-6"
              >
                {/* Enhanced App Logo Section in General Tab */}
                <div className="space-y-4">
                  <Label htmlFor="logo">Application Logo</Label>

                  {/* Current Logo vs Form Logo Comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Current Saved Logo */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Currently Saved
                      </Label>
                      <div className="relative">
                        {currentApp?.generalSettings?.logoUrl ? (
                          <div className="relative w-24 h-24 rounded-lg overflow-hidden border">
                            <img
                              src={currentApp.generalSettings.logoUrl}
                              alt="Current app logo"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                                const container = target.parentElement;
                                if (container) {
                                  container.innerHTML = `
                                    <div class="w-full h-full flex items-center justify-center bg-red-50 border border-red-200">
                                      <span class="text-red-500 text-xs">Broken</span>
                                    </div>
                                  `;
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                            <Camera className="h-8 w-8 text-gray-400" />
                            <span className="sr-only">No logo set</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {currentApp?.generalSettings?.logoUrl
                          ? "Logo active"
                          : "No logo set"}
                      </p>
                    </div>

                    {/* Form Preview */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Preview (Form)
                      </Label>
                      <div className="relative">
                        {generalForm.watch("logoUrl") ? (
                          <div className="relative w-24 h-24 rounded-lg overflow-hidden border">
                            <img
                              src={generalForm.watch("logoUrl")}
                              alt="Form logo preview"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                                const container = target.parentElement;
                                if (container) {
                                  container.innerHTML = `
                                    <div class="w-full h-full flex items-center justify-center bg-red-50 border border-red-200">
                                      <span class="text-red-500 text-xs">Invalid URL</span>
                                    </div>
                                  `;
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={() =>
                                generalForm.setValue("logoUrl", "")
                              }
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
                      <p className="text-xs text-gray-500">
                        {generalForm.watch("logoUrl")
                          ? "New logo preview"
                          : "Enter URL below"}
                      </p>
                    </div>
                  </div>

                  {/* Logo Actions */}
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
                          const appName =
                            generalForm.watch("name") ||
                            currentApp?.name ||
                            "App";
                          const defaultIcons = [
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              appName
                            )}&background=4F46E5&color=fff&size=200`,
                            `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(
                              appName.toLowerCase()
                            )}`,
                          ];
                          generalForm.setValue(
                            "logoUrl",
                            defaultIcons[
                              Math.floor(Math.random() * defaultIcons.length)
                            ]
                          );
                        }}
                      >
                        Generate Icon
                      </Button>
                      {currentApp?.generalSettings?.logoUrl && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            generalForm.setValue(
                              "logoUrl",
                              currentApp.generalSettings?.logoUrl || ""
                            );
                          }}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Reset to Saved
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      Recommended: 200x200px, PNG/JPG format. Maximum file size:
                      5MB
                    </p>
                  </div>

                  {/* Logo URL Input */}
                  <div className="space-y-2">
                    <Label htmlFor="logoUrl">Logo URL (Optional)</Label>
                    <Input
                      id="logoUrl"
                      placeholder="https://yourapp.com/logo.png"
                      {...generalForm.register("logoUrl")}
                    />
                    {generalForm.formState.errors.logoUrl && (
                      <p className="text-sm text-red-600">
                        {generalForm.formState.errors.logoUrl.message}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      Enter a direct URL to your logo image. The image should be
                      publicly accessible.
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Application Name</Label>
                    <Input
                      id="name"
                      placeholder="My Awesome App"
                      {...generalForm.register("name")}
                    />
                    {generalForm.formState.errors.name && (
                      <p className="text-sm text-red-600">
                        {generalForm.formState.errors.name.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Application Type</Label>
                    <Select
                      value={generalForm.watch("type")}
                      onValueChange={(
                        value: "WEB" | "MOBILE" | "API" | "SERVICE"
                      ) => generalForm.setValue("type", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WEB">
                          <div className="flex items-center space-x-2">
                            <Globe className="h-4 w-4" />
                            <span>Web Application</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="MOBILE">
                          <div className="flex items-center space-x-2">
                            <Smartphone className="h-4 w-4" />
                            <span>Mobile Application</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="API">
                          <div className="flex items-center space-x-2">
                            <Code className="h-4 w-4" />
                            <span>API / Backend</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="SERVICE">
                          <div className="flex items-center space-x-2">
                            <Server className="h-4 w-4" />
                            <span>Service</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of your application"
                    {...generalForm.register("description")}
                  />
                </div>

                <Button type="submit">
                  <Save className="h-4 w-4 mr-2" />
                  Save General Settings
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Authentication Settings Tab */}
        <TabsContent value="auth">
          <Card>
            <CardHeader>
              <CardTitle>Authentication Configuration</CardTitle>
              <CardDescription>
                Configure how users authenticate with your application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={authForm.handleSubmit((data) => {
                  console.log("Auth settings:", data);
                  saveAuthSettings(data);
                })}
                className="space-y-6"
              >
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">
                        User Registration & Login
                      </h4>
                      <p className="text-sm text-blue-800 mt-1">
                        Control how users can access your application.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="enableSignUp">
                        Allow User Registration
                      </Label>
                      <p className="text-sm text-gray-500">
                        Allow new users to create accounts
                      </p>
                    </div>
                    <Switch
                      id="enableSignUp"
                      checked={authForm.watch("enableSignUp") || false}
                      onCheckedChange={(checked) =>
                        authForm.setValue("enableSignUp", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="requireEmailVerification">
                        Require Email Verification
                      </Label>
                      <p className="text-sm text-gray-500">
                        Users must verify their email before accessing the app
                      </p>
                    </div>
                    <Switch
                      id="requireEmailVerification"
                      checked={
                        authForm.watch("requireEmailVerification") || false
                      }
                      onCheckedChange={(checked) =>
                        authForm.setValue("requireEmailVerification", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="allowSocialLogins">
                        Enable Social Logins
                      </Label>
                      <p className="text-sm text-gray-500">
                        Allow login with Google, GitHub, and other providers
                      </p>
                    </div>
                    <Switch
                      id="allowSocialLogins"
                      checked={authForm.watch("allowSocialLogins") || false}
                      onCheckedChange={(checked) =>
                        authForm.setValue("allowSocialLogins", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="enableMFA">
                        Multi-Factor Authentication
                      </Label>
                      <p className="text-sm text-gray-500">
                        Allow users to enable 2FA for enhanced security
                      </p>
                    </div>
                    <Switch
                      id="enableMFA"
                      checked={authForm.watch("enableMFA") || false}
                      onCheckedChange={(checked) =>
                        authForm.setValue("enableMFA", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="allowPasswordless">
                        Passwordless Login
                      </Label>
                      <p className="text-sm text-gray-500">
                        Enable magic links and email-only authentication
                      </p>
                    </div>
                    <Switch
                      id="allowPasswordless"
                      checked={authForm.watch("allowPasswordless") || false}
                      onCheckedChange={(checked) =>
                        authForm.setValue("allowPasswordless", checked)
                      }
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Session Configuration</h4>

                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">
                      Session Timeout (hours)
                    </Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      min="1"
                      max="168"
                      {...authForm.register("sessionTimeout", {
                        valueAsNumber: true,
                      })}
                    />
                    <p className="text-xs text-gray-500">
                      How long users stay logged in (1-168 hours)
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Password Policy</h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="minLength">Minimum Length</Label>
                      <Input
                        id="minLength"
                        type="number"
                        min="6"
                        max="128"
                        {...authForm.register("passwordPolicy.minLength", {
                          valueAsNumber: true,
                        })}
                      />
                    </div>
                    <div className="space-y-3">
                      <Label>Requirements</Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="requireUppercase"
                            {...authForm.register(
                              "passwordPolicy.requireUppercase"
                            )}
                            className="rounded border-gray-300"
                          />
                          <Label htmlFor="requireUppercase" className="text-sm">
                            Uppercase letters
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="requireLowercase"
                            {...authForm.register(
                              "passwordPolicy.requireLowercase"
                            )}
                            className="rounded border-gray-300"
                          />
                          <Label htmlFor="requireLowercase" className="text-sm">
                            Lowercase letters
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="requireNumbers"
                            {...authForm.register(
                              "passwordPolicy.requireNumbers"
                            )}
                            className="rounded border-gray-300"
                          />
                          <Label htmlFor="requireNumbers" className="text-sm">
                            Numbers
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="requireSpecialChars"
                            {...authForm.register(
                              "passwordPolicy.requireSpecialChars"
                            )}
                            className="rounded border-gray-300"
                          />
                          <Label
                            htmlFor="requireSpecialChars"
                            className="text-sm"
                          >
                            Special characters
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Button type="submit">
                  <Save className="h-4 w-4 mr-2" />
                  Save Authentication Settings
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security & Protection</CardTitle>
              <CardDescription>
                Configure security features and JWT settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={securityForm.handleSubmit((data) => {
                  console.log("Security settings:", data);
                  saveSecuritySettings(data);
                })}
                className="space-y-6"
              >
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Key className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-red-900">
                        Protection Features
                      </h4>
                      <p className="text-sm text-red-800 mt-1">
                        Guard against abuse, brute force attacks, and
                        unauthorized access.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="enableRateLimit">Rate Limiting</Label>
                      <p className="text-sm text-gray-500">
                        Limit the number of requests per time window
                      </p>
                    </div>
                    <Switch
                      id="enableRateLimit"
                      checked={securityForm.watch("enableRateLimit") || false}
                      onCheckedChange={(checked) =>
                        securityForm.setValue("enableRateLimit", checked)
                      }
                    />
                  </div>

                  {securityForm.watch("enableRateLimit") && (
                    <div className="grid grid-cols-2 gap-4 ml-6">
                      <div className="space-y-2">
                        <Label htmlFor="rateLimitRequests">
                          Requests per window
                        </Label>
                        <Input
                          id="rateLimitRequests"
                          type="number"
                          min="1"
                          max="10000"
                          {...securityForm.register("rateLimitRequests", {
                            valueAsNumber: true,
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rateLimitWindow">
                          Window duration (minutes)
                        </Label>
                        <Input
                          id="rateLimitWindow"
                          type="number"
                          min="1"
                          max="60"
                          {...securityForm.register("rateLimitWindow", {
                            valueAsNumber: true,
                          })}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="enableBruteForceProtection">
                        Brute Force Protection
                      </Label>
                      <p className="text-sm text-gray-500">
                        Block accounts after repeated failed login attempts
                      </p>
                    </div>
                    <Switch
                      id="enableBruteForceProtection"
                      checked={
                        securityForm.watch("enableBruteForceProtection") ||
                        false
                      }
                      onCheckedChange={(checked) =>
                        securityForm.setValue(
                          "enableBruteForceProtection",
                          checked
                        )
                      }
                    />
                  </div>

                  {securityForm.watch("enableBruteForceProtection") && (
                    <div className="grid grid-cols-2 gap-4 ml-6">
                      <div className="space-y-2">
                        <Label htmlFor="maxLoginAttempts">
                          Max login attempts
                        </Label>
                        <Input
                          id="maxLoginAttempts"
                          type="number"
                          min="1"
                          max="20"
                          {...securityForm.register("maxLoginAttempts", {
                            valueAsNumber: true,
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lockoutDuration">
                          Lockout duration (minutes)
                        </Label>
                        <Input
                          id="lockoutDuration"
                          type="number"
                          min="1"
                          max="1440"
                          {...securityForm.register("lockoutDuration", {
                            valueAsNumber: true,
                          })}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">JWT Configuration</h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="jwtAlgorithm">Signing Algorithm</Label>
                      <Select
                        value={securityForm.watch("jwtAlgorithm")}
                        onValueChange={(value: "RS256" | "HS256" | "ES256") =>
                          securityForm.setValue("jwtAlgorithm", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="RS256">
                            RS256 (Recommended)
                          </SelectItem>
                          <SelectItem value="HS256">HS256</SelectItem>
                          <SelectItem value="ES256">ES256</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">
                        RS256 is recommended for production applications
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="jwtExpiration">
                        Token Expiration (hours)
                      </Label>
                      <Input
                        id="jwtExpiration"
                        type="number"
                        min="1"
                        max="168"
                        {...securityForm.register("jwtExpiration", {
                          valueAsNumber: true,
                        })}
                      />
                      <p className="text-xs text-gray-500">
                        How long access tokens remain valid
                      </p>
                    </div>
                  </div>
                </div>

                <Button type="submit">
                  <Save className="h-4 w-4 mr-2" />
                  Save Security Settings
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Domains Settings Tab */}
        <TabsContent value="domains">
          <Card>
            <CardHeader>
              <CardTitle>Domain Configuration</CardTitle>
              <CardDescription>
                Configure allowed URLs and CORS settings for your application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={domainForm.handleSubmit((data) => {
                  console.log("Domain settings:", data);
                  saveDomainSettings(data);
                })}
                className="space-y-6"
              >
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Globe className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-900">
                        URL Configuration
                      </h4>
                      <p className="text-sm text-green-800 mt-1">
                        Configure which domains can integrate with your
                        authentication system.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="allowedOrigins">Allowed Origins</Label>
                  <Textarea
                    id="allowedOrigins"
                    placeholder="https://yourapp.com&#10;https://localhost:3000&#10;https://yourapp.vercel.app"
                    rows={4}
                    {...domainForm.register("allowedOrigins")}
                  />
                  <p className="text-sm text-gray-500">
                    One URL per line. These origins can make CORS requests to
                    your authentication API.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="allowedCallbacks">
                    Allowed Callback URLs
                  </Label>
                  <Textarea
                    id="allowedCallbacks"
                    placeholder="https://yourapp.com/callback&#10;https://yourapp.com/auth/success"
                    rows={4}
                    {...domainForm.register("allowedCallbacks")}
                  />
                  <p className="text-sm text-gray-500">
                    URLs where users will be redirected after successful
                    authentication.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="allowedLogouts">Allowed Logout URLs</Label>
                  <Textarea
                    id="allowedLogouts"
                    placeholder="https://yourapp.com/&#10;https://yourapp.com/goodbye"
                    rows={4}
                    {...domainForm.register("allowedLogouts")}
                  />
                  <p className="text-sm text-gray-500">
                    URLs where users will be redirected after logout.
                  </p>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="enableCORS">Enable CORS</Label>
                      <p className="text-sm text-gray-500">
                        Allow cross-origin requests from specified origins
                      </p>
                    </div>
                    <Switch
                      id="enableCORS"
                      checked={domainForm.watch("enableCORS") || false}
                      onCheckedChange={(checked) =>
                        domainForm.setValue("enableCORS", checked)
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
                      {...domainForm.register("corsMaxAge", {
                        valueAsNumber: true,
                      })}
                    />
                    <p className="text-xs text-gray-500">
                      How long browsers cache CORS preflight responses (0-86400
                      seconds)
                    </p>
                  </div>
                </div>

                <Button type="submit">
                  <Save className="h-4 w-4 mr-2" />
                  Save Domain Settings
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
                Customize the appearance of your authentication pages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={brandingForm.handleSubmit((data) => {
                  console.log("Branding settings:", data);
                  saveBrandingSettings(data);
                })}
                className="space-y-6"
              >
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Palette className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-purple-900">
                        Visual Customization
                      </h4>
                      <p className="text-sm text-purple-800 mt-1">
                        Make the authentication experience match your brand.
                      </p>
                    </div>
                  </div>
                </div>

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
                    <p className="text-xs text-gray-500">
                      Used for buttons and accents
                    </p>
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
                    <p className="text-xs text-gray-500">
                      Used for text and borders
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="loginPageUrl">Custom Login Page URL</Label>
                  <Input
                    id="loginPageUrl"
                    placeholder="https://yourapp.com/custom-login"
                    {...brandingForm.register("loginPageUrl")}
                  />
                  <p className="text-sm text-gray-500">
                    Optional: Redirect users to your custom login page instead
                    of the default
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customCss">Custom CSS</Label>
                  <Textarea
                    id="customCss"
                    placeholder="/* Custom CSS for authentication pages */&#10;.auth-container {&#10;  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);&#10;}"
                    rows={8}
                    {...brandingForm.register("customCss")}
                    className="font-mono text-sm"
                  />
                  <p className="text-sm text-gray-500">
                    Custom CSS will be injected into authentication pages. Use
                    with caution.
                  </p>
                </div>

                <Button type="submit">
                  <Save className="h-4 w-4 mr-2" />
                  Save Branding Settings
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks">
          <Card>
            <CardHeader>
              <CardTitle>Webhooks</CardTitle>
              <CardDescription>
                Receive real-time notifications about authentication events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Webhook className="h-5 w-5 text-gray-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Event Notifications
                      </h4>
                      <p className="text-sm text-gray-800 mt-1">
                        Get notified when users sign up, log in, or perform
                        other actions.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="webhookUrl">Webhook URL</Label>
                    <Input
                      id="webhookUrl"
                      placeholder="https://yourapi.com/webhooks/auth"
                      value={appSettings?.webhookUrl || ""}
                      onChange={(e) =>
                        setAppSettings(
                          appSettings
                            ? { ...appSettings, webhookUrl: e.target.value }
                            : null
                        )
                      }
                    />
                    <p className="text-sm text-gray-500">
                      Your endpoint that will receive webhook events
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label>Events to Subscribe</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        {
                          id: "user.created",
                          label: "User Created",
                          description: "When a new user signs up",
                        },
                        {
                          id: "user.updated",
                          label: "User Updated",
                          description: "When user profile is modified",
                        },
                        {
                          id: "user.deleted",
                          label: "User Deleted",
                          description: "When a user account is deleted",
                        },
                        {
                          id: "login.success",
                          label: "Login Success",
                          description: "When user logs in successfully",
                        },
                        {
                          id: "login.failed",
                          label: "Login Failed",
                          description: "When login attempt fails",
                        },
                        {
                          id: "password.changed",
                          label: "Password Changed",
                          description: "When user changes password",
                        },
                        {
                          id: "mfa.enabled",
                          label: "MFA Enabled",
                          description: "When user enables 2FA",
                        },
                        {
                          id: "session.expired",
                          label: "Session Expired",
                          description: "When user session expires",
                        },
                      ].map((event) => (
                        <div key={event.id} className="border rounded-lg p-3">
                          <div className="flex items-center space-x-2 mb-1">
                            <input
                              type="checkbox"
                              id={event.id}
                              checked={
                                appSettings?.webhookEvents?.includes(
                                  event.id
                                ) || false
                              }
                              onChange={(
                                e: React.ChangeEvent<HTMLInputElement>
                              ) => {
                                if (!appSettings) return;
                                const events = appSettings.webhookEvents || [];
                                if (e.target.checked) {
                                  setAppSettings({
                                    ...appSettings,
                                    webhookEvents: [...events, event.id],
                                  });
                                } else {
                                  setAppSettings({
                                    ...appSettings,
                                    webhookEvents: events.filter(
                                      (ev: string) => ev !== event.id
                                    ),
                                  });
                                }
                              }}
                              className="rounded border-gray-300"
                            />
                            <Label
                              htmlFor={event.id}
                              className="text-sm font-medium"
                            >
                              {event.label}
                            </Label>
                          </div>
                          <p className="text-xs text-gray-500 ml-6">
                            {event.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={() =>
                      showMessage(
                        "success",
                        "Webhook settings saved successfully!"
                      )
                    }
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Webhook Settings
                  </Button>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Testing</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Test Webhook</p>
                        <p className="text-sm text-gray-600">
                          Send a test event to your webhook URL
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() =>
                          showMessage("success", "Test webhook sent!")
                        }
                      >
                        Send Test Event
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics & Monitoring</CardTitle>
              <CardDescription>
                Configure analytics tracking and monitoring for your application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <BarChart3 className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-900">
                        Usage Analytics
                      </h4>
                      <p className="text-sm text-green-800 mt-1">
                        Track authentication events and user behavior to improve
                        your application.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="analyticsEnabled">Enable Analytics</Label>
                      <p className="text-sm text-gray-500">
                        Track login attempts, user registration, and other auth
                        events
                      </p>
                    </div>
                    <Switch
                      id="analyticsEnabled"
                      checked={appSettings?.analyticsEnabled || false}
                      onCheckedChange={(checked) =>
                        setAppSettings(
                          appSettings
                            ? { ...appSettings, analyticsEnabled: checked }
                            : null
                        )
                      }
                    />
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">7d</span>
                      </div>
                      <span className="font-medium">Data Retention</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Analytics data is kept for 7 days by default
                    </p>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <Shield className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-medium">Privacy First</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      No PII is stored in analytics data
                    </p>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-medium">Real-time</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Analytics update in real-time
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() =>
                    showMessage(
                      "success",
                      "Analytics settings saved successfully!"
                    )
                  }
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Analytics Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
