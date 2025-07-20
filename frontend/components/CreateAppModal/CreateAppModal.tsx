// src/components/CreateAppModal.tsx
"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
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
  CheckCircle,
  Settings,
  Shield,
  Key,
  Webhook,
  BarChart3,
  Camera,
  X,
  Upload,
} from "lucide-react";
import Image from "next/image";

// Import auth service instead of app service
import { useCreateApp } from "@/services/authService";

interface CreateAppModalProps {
  /** Any React node you want to use to open the modal */
  trigger: React.ReactNode;
  /** Called after a successful create so parent can refetch */
  onCreated: () => void;
  /** Optional organization ID override */
  organizationId?: string;
}

enum AppType {
  WEB = "WEB",
  MOBILE = "MOBILE",
  API = "API",
  SERVICE = "SERVICE",
}

interface CreateAppInput {
  name: string;
  description?: string;
  type: AppType;
  organizationId: string;

  // Basic Settings
  logoUrl?: string;
  allowedOrigins?: string[];
  allowedCallbacks?: string[];
  allowedLogouts?: string[];

  // Authentication Settings
  enableSignUp?: boolean;
  requireEmailVerification?: boolean;
  allowSocialLogins?: boolean;
  socialProviders?: string[];
  sessionTimeout?: number;
  enableMFA?: boolean;

  // Security Settings
  enableRateLimit?: boolean;
  rateLimitRequests?: number;
  rateLimitWindow?: number;
  enableBruteForceProtection?: boolean;
  allowPasswordless?: boolean;

  // JWT Settings
  jwtAlgorithm?: string;
  jwtExpiration?: number;

  // Branding
  primaryColor?: string;
  secondaryColor?: string;
  customCss?: string;

  // Webhook Settings
  webhookUrl?: string;
  webhookEvents?: string[];
}

export function CreateAppModal({
  trigger,
  onCreated,
  organizationId,
}: CreateAppModalProps) {
  const params = useParams<{ orgId: string }>();
  const rawOrg = params.orgId;
  const urlOrgId = Array.isArray(rawOrg) ? rawOrg[0] : rawOrg ?? "personal";

  const effectiveOrgId = organizationId || urlOrgId;

  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [formData, setFormData] = useState<CreateAppInput>({
    name: "",
    description: "",
    type: AppType.WEB,
    organizationId: effectiveOrgId,
    logoUrl: "",
    allowedOrigins: [],
    allowedCallbacks: [],
    allowedLogouts: [],
    enableSignUp: true,
    requireEmailVerification: true,
    allowSocialLogins: false,
    socialProviders: [],
    sessionTimeout: 24,
    enableMFA: false,
    enableRateLimit: true,
    rateLimitRequests: 100,
    rateLimitWindow: 15,
    enableBruteForceProtection: true,
    allowPasswordless: false,
    jwtAlgorithm: "RS256",
    jwtExpiration: 24,
    primaryColor: "#4F46E5",
    secondaryColor: "#6B7280",
    customCss: "",
    webhookUrl: "",
    webhookEvents: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const {
    createApp,
    loading,
    error: createError,
  } = useCreateApp(effectiveOrgId);

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

  // Get type description
  const getTypeDescription = (type: AppType) => {
    switch (type) {
      case AppType.WEB:
        return "Single Page Applications, websites, and web apps";
      case AppType.MOBILE:
        return "iOS and Android mobile applications";
      case AppType.API:
        return "REST APIs and GraphQL endpoints";
      case AppType.SERVICE:
        return "Backend services and microservices";
      default:
        return "";
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Application name is required";
    } else if (formData.name.length < 2) {
      newErrors.name = "Application name must be at least 2 characters";
    } else if (formData.name.length > 50) {
      newErrors.name = "Application name must be less than 50 characters";
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = "Description must be less than 500 characters";
    }

    if (
      formData.logoUrl &&
      formData.logoUrl.trim() &&
      !isValidUrl(formData.logoUrl)
    ) {
      newErrors.logoUrl = "Please enter a valid URL";
    }

    if (
      formData.webhookUrl &&
      formData.webhookUrl.trim() &&
      !isValidUrl(formData.webhookUrl)
    ) {
      newErrors.webhookUrl = "Please enter a valid webhook URL";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await createApp(formData.name, formData.description || "", formData.type);

      setSuccess(true);
      setTimeout(() => {
        setOpen(false);
        resetForm();
        onCreated();
      }, 1500);
    } catch (error) {
      console.error("Failed to create application:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      type: AppType.WEB,
      organizationId: effectiveOrgId,
      logoUrl: "",
      allowedOrigins: [],
      allowedCallbacks: [],
      allowedLogouts: [],
      enableSignUp: true,
      requireEmailVerification: true,
      allowSocialLogins: false,
      socialProviders: [],
      sessionTimeout: 24,
      enableMFA: false,
      enableRateLimit: true,
      rateLimitRequests: 100,
      rateLimitWindow: 15,
      enableBruteForceProtection: true,
      allowPasswordless: false,
      jwtAlgorithm: "RS256",
      jwtExpiration: 24,
      primaryColor: "#4F46E5",
      secondaryColor: "#6B7280",
      customCss: "",
      webhookUrl: "",
      webhookEvents: [],
    });
    setErrors({});
    setSuccess(false);
    setActiveTab("general");
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetForm();
    }
  };

  const updateFormData = (updates: Partial<CreateAppInput>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  return (
    <>
      <div
        onClick={(e) => {
          e.stopPropagation();
          console.log("🚀 Create App Modal trigger clicked");
          setOpen(true);
        }}
        style={{
          pointerEvents: "auto",
          position: "relative",
          zIndex: 1,
        }}
      >
        {trigger}
      </div>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Create Application
            </DialogTitle>
            <DialogDescription>
              Create a new application with comprehensive authentication and
              security settings
            </DialogDescription>
          </DialogHeader>

          {success ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <div className="text-center">
                <h3 className="font-medium text-lg">Application Created!</h3>
                <p className="text-sm text-muted-foreground">
                  Your application has been created successfully.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger
                    value="general"
                    className="flex items-center gap-1"
                  >
                    <Settings className="h-3 w-3" />
                    General
                  </TabsTrigger>
                  <TabsTrigger value="auth" className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Auth
                  </TabsTrigger>
                  <TabsTrigger
                    value="security"
                    className="flex items-center gap-1"
                  >
                    <Key className="h-3 w-3" />
                    Security
                  </TabsTrigger>
                  <TabsTrigger
                    value="branding"
                    className="flex items-center gap-1"
                  >
                    <Camera className="h-3 w-3" />
                    Branding
                  </TabsTrigger>
                  <TabsTrigger
                    value="advanced"
                    className="flex items-center gap-1"
                  >
                    <BarChart3 className="h-3 w-3" />
                    Advanced
                  </TabsTrigger>
                </TabsList>

                <div className="max-h-[450px] overflow-y-auto">
                  <TabsContent value="general" className="space-y-4">
                    {/* Logo Section */}
                    <div className="space-y-3">
                      <Label>Application Logo</Label>
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          {formData.logoUrl ? (
                            <div className="relative w-16 h-16 rounded-lg overflow-hidden border">
                              {formData.logoUrl.includes(".svg") ||
                              formData.logoUrl.includes("api.dicebear.com") ? (
                                <img
                                  src={formData.logoUrl}
                                  alt="App logo"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Image
                                  src={formData.logoUrl}
                                  alt="App logo"
                                  width={64}
                                  height={64}
                                  className="w-full h-full object-cover"
                                />
                              )}
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
                                const defaultIcons = [
                                  "https://ui-avatars.com/api/?name=" +
                                    encodeURIComponent(formData.name || "App") +
                                    "&background=4F46E5&color=fff&size=200",
                                  "https://api.dicebear.com/7.x/shapes/svg?seed=" +
                                    encodeURIComponent(formData.name || "app"),
                                ];
                                updateFormData({
                                  logoUrl:
                                    defaultIcons[
                                      Math.floor(
                                        Math.random() * defaultIcons.length
                                      )
                                    ],
                                });
                              }}
                            >
                              Generate
                            </Button>
                          </div>
                        </div>
                      </div>
                      <Input
                        placeholder="Or enter logo URL"
                        value={formData.logoUrl}
                        onChange={(e) =>
                          updateFormData({ logoUrl: e.target.value })
                        }
                      />
                      {errors.logoUrl && (
                        <p className="text-sm text-red-600">{errors.logoUrl}</p>
                      )}
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label htmlFor="name">Application Name *</Label>
                      <Input
                        id="name"
                        placeholder="Enter application name"
                        value={formData.name}
                        onChange={(e) =>
                          updateFormData({ name: e.target.value })
                        }
                      />
                      {errors.name && (
                        <p className="text-sm text-red-600">{errors.name}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Brief description of your application"
                        value={formData.description}
                        onChange={(e) =>
                          updateFormData({ description: e.target.value })
                        }
                        rows={3}
                      />
                      {errors.description && (
                        <p className="text-sm text-red-600">
                          {errors.description}
                        </p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <Label>Application Type *</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {Object.values(AppType).map((type) => (
                          <div
                            key={type}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                              formData.type === type
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            }`}
                            onClick={() => updateFormData({ type })}
                          >
                            <div className="flex items-center space-x-2 mb-1">
                              {getAppTypeIcon(type)}
                              <span className="font-medium">{type}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {getTypeDescription(type)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="allowedOrigins">Allowed Origins</Label>
                      <Textarea
                        id="allowedOrigins"
                        placeholder="https://yourapp.com&#10;https://localhost:3000"
                        rows={3}
                        value={formData.allowedOrigins?.join("\n") || ""}
                        onChange={(e) =>
                          updateFormData({
                            allowedOrigins: e.target.value
                              .split("\n")
                              .filter((url) => url.trim()),
                          })
                        }
                      />
                      <p className="text-xs text-gray-500">
                        One origin per line
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="auth" className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-start space-x-2">
                        <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-blue-900 text-sm">
                            Authentication Settings
                          </h4>
                          <p className="text-xs text-blue-800 mt-1">
                            Configure how users authenticate with your
                            application.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="enableSignUp">
                            Allow User Registration
                          </Label>
                          <p className="text-xs text-gray-500">
                            Allow new users to sign up
                          </p>
                        </div>
                        <Switch
                          id="enableSignUp"
                          checked={formData.enableSignUp}
                          onCheckedChange={(checked) =>
                            updateFormData({ enableSignUp: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="requireEmailVerification">
                            Require Email Verification
                          </Label>
                          <p className="text-xs text-gray-500">
                            Users must verify email before accessing app
                          </p>
                        </div>
                        <Switch
                          id="requireEmailVerification"
                          checked={formData.requireEmailVerification}
                          onCheckedChange={(checked) =>
                            updateFormData({
                              requireEmailVerification: checked,
                            })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="allowSocialLogins">
                            Enable Social Logins
                          </Label>
                          <p className="text-xs text-gray-500">
                            Allow login with Google, GitHub, etc.
                          </p>
                        </div>
                        <Switch
                          id="allowSocialLogins"
                          checked={formData.allowSocialLogins}
                          onCheckedChange={(checked) =>
                            updateFormData({ allowSocialLogins: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="enableMFA">
                            Enable Multi-Factor Authentication
                          </Label>
                          <p className="text-xs text-gray-500">
                            Allow users to enable 2FA
                          </p>
                        </div>
                        <Switch
                          id="enableMFA"
                          checked={formData.enableMFA}
                          onCheckedChange={(checked) =>
                            updateFormData({ enableMFA: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="allowPasswordless">
                            Allow Passwordless Login
                          </Label>
                          <p className="text-xs text-gray-500">
                            Enable magic links and email-only login
                          </p>
                        </div>
                        <Switch
                          id="allowPasswordless"
                          checked={formData.allowPasswordless}
                          onCheckedChange={(checked) =>
                            updateFormData({ allowPasswordless: checked })
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sessionTimeout">
                        Session Timeout (hours)
                      </Label>
                      <Input
                        id="sessionTimeout"
                        type="number"
                        min="1"
                        max="168"
                        value={formData.sessionTimeout}
                        onChange={(e) =>
                          updateFormData({
                            sessionTimeout: parseInt(e.target.value) || 24,
                          })
                        }
                      />
                      <p className="text-xs text-gray-500">
                        How long users stay logged in
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="security" className="space-y-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-start space-x-2">
                        <Key className="h-4 w-4 text-red-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-red-900 text-sm">
                            Security Features
                          </h4>
                          <p className="text-xs text-red-800 mt-1">
                            Configure security protections and JWT settings.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="enableRateLimit">
                            Enable Rate Limiting
                          </Label>
                          <p className="text-xs text-gray-500">
                            Protect against abuse and DDoS
                          </p>
                        </div>
                        <Switch
                          id="enableRateLimit"
                          checked={formData.enableRateLimit}
                          onCheckedChange={(checked) =>
                            updateFormData({ enableRateLimit: checked })
                          }
                        />
                      </div>

                      {formData.enableRateLimit && (
                        <div className="grid grid-cols-2 gap-3 ml-4">
                          <div className="space-y-2">
                            <Label htmlFor="rateLimitRequests">
                              Requests per window
                            </Label>
                            <Input
                              id="rateLimitRequests"
                              type="number"
                              min="1"
                              max="10000"
                              value={formData.rateLimitRequests}
                              onChange={(e) =>
                                updateFormData({
                                  rateLimitRequests:
                                    parseInt(e.target.value) || 100,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="rateLimitWindow">
                              Window (minutes)
                            </Label>
                            <Input
                              id="rateLimitWindow"
                              type="number"
                              min="1"
                              max="60"
                              value={formData.rateLimitWindow}
                              onChange={(e) =>
                                updateFormData({
                                  rateLimitWindow:
                                    parseInt(e.target.value) || 15,
                                })
                              }
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="enableBruteForceProtection">
                            Brute Force Protection
                          </Label>
                          <p className="text-xs text-gray-500">
                            Block repeated failed login attempts
                          </p>
                        </div>
                        <Switch
                          id="enableBruteForceProtection"
                          checked={formData.enableBruteForceProtection}
                          onCheckedChange={(checked) =>
                            updateFormData({
                              enableBruteForceProtection: checked,
                            })
                          }
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <h4 className="font-medium">JWT Configuration</h4>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="jwtAlgorithm">JWT Algorithm</Label>
                          <Select
                            value={formData.jwtAlgorithm}
                            onValueChange={(value) =>
                              updateFormData({ jwtAlgorithm: value })
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
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="jwtExpiration">
                            JWT Expiration (hours)
                          </Label>
                          <Input
                            id="jwtExpiration"
                            type="number"
                            min="1"
                            max="168"
                            value={formData.jwtExpiration}
                            onChange={(e) =>
                              updateFormData({
                                jwtExpiration: parseInt(e.target.value) || 24,
                              })
                            }
                          />
                        </div>
                      </div>
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
                            Customize the appearance of login and signup pages.
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
                            value={formData.primaryColor}
                            onChange={(e) =>
                              updateFormData({ primaryColor: e.target.value })
                            }
                          />
                          <Input
                            placeholder="#4F46E5"
                            value={formData.primaryColor}
                            onChange={(e) =>
                              updateFormData({ primaryColor: e.target.value })
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="secondaryColor">Secondary Color</Label>
                        <div className="flex space-x-2">
                          <Input
                            type="color"
                            className="w-12 h-10 p-1 border rounded"
                            value={formData.secondaryColor}
                            onChange={(e) =>
                              updateFormData({ secondaryColor: e.target.value })
                            }
                          />
                          <Input
                            placeholder="#6B7280"
                            value={formData.secondaryColor}
                            onChange={(e) =>
                              updateFormData({ secondaryColor: e.target.value })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="customCss">Custom CSS</Label>
                      <Textarea
                        id="customCss"
                        placeholder="/* Custom CSS for auth pages */&#10;.auth-container {&#10;  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);&#10;}"
                        rows={6}
                        value={formData.customCss}
                        onChange={(e) =>
                          updateFormData({ customCss: e.target.value })
                        }
                      />
                      <p className="text-xs text-gray-500">
                        Custom CSS will be injected into auth pages
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="advanced" className="space-y-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <div className="flex items-start space-x-2">
                        <BarChart3 className="h-4 w-4 text-gray-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-gray-900 text-sm">
                            Advanced Features
                          </h4>
                          <p className="text-xs text-gray-800 mt-1">
                            Configure webhooks and integration settings.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="webhookUrl">Webhook URL</Label>
                      <Input
                        id="webhookUrl"
                        placeholder="https://yourapi.com/webhooks/auth"
                        value={formData.webhookUrl}
                        onChange={(e) =>
                          updateFormData({ webhookUrl: e.target.value })
                        }
                      />
                      {errors.webhookUrl && (
                        <p className="text-sm text-red-600">
                          {errors.webhookUrl}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        Receive real-time notifications for auth events
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Webhook Events</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: "user.created", label: "User Created" },
                          { id: "user.updated", label: "User Updated" },
                          { id: "user.deleted", label: "User Deleted" },
                          { id: "login.success", label: "Login Success" },
                          { id: "login.failed", label: "Login Failed" },
                          { id: "password.changed", label: "Password Changed" },
                        ].map((event) => (
                          <div
                            key={event.id}
                            className="flex items-center space-x-2"
                          >
                            <input
                              type="checkbox"
                              id={event.id}
                              checked={
                                formData.webhookEvents?.includes(event.id) ||
                                false
                              }
                              onChange={(e) => {
                                const events = formData.webhookEvents || [];
                                if (e.target.checked) {
                                  updateFormData({
                                    webhookEvents: [...events, event.id],
                                  });
                                } else {
                                  updateFormData({
                                    webhookEvents: events.filter(
                                      (ev) => ev !== event.id
                                    ),
                                  });
                                }
                              }}
                              className="rounded border-gray-300"
                            />
                            <Label htmlFor={event.id} className="text-sm">
                              {event.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="allowedCallbacks">
                        Allowed Callback URLs
                      </Label>
                      <Textarea
                        id="allowedCallbacks"
                        placeholder="https://yourapp.com/callback&#10;https://yourapp.com/auth/success"
                        rows={3}
                        value={formData.allowedCallbacks?.join("\n") || ""}
                        onChange={(e) =>
                          updateFormData({
                            allowedCallbacks: e.target.value
                              .split("\n")
                              .filter((url) => url.trim()),
                          })
                        }
                      />
                      <p className="text-xs text-gray-500">
                        URLs where users are redirected after login
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="allowedLogouts">
                        Allowed Logout URLs
                      </Label>
                      <Textarea
                        id="allowedLogouts"
                        placeholder="https://yourapp.com/&#10;https://yourapp.com/goodbye"
                        rows={3}
                        value={formData.allowedLogouts?.join("\n") || ""}
                        onChange={(e) =>
                          updateFormData({
                            allowedLogouts: e.target.value
                              .split("\n")
                              .filter((url) => url.trim()),
                          })
                        }
                      />
                      <p className="text-xs text-gray-500">
                        URLs where users are redirected after logout
                      </p>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>

              {createError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-red-900">
                        Creation Failed
                      </h4>
                      <p className="text-sm text-red-800 mt-1">
                        {createError.message ||
                          "Failed to create application. Please try again."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {loading ? "Creating..." : "Create Application"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
