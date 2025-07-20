"use client";

import React from "react";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Settings,
  Users,
  Activity,
  Key,
  Copy,
  ExternalLink,
  Code,
  Zap,
  CheckCircle,
  Circle,
  ArrowRight,
  ArrowLeft,
  Home,
  Globe,
  Smartphone,
  Terminal,
} from "lucide-react";
import Link from "next/link";

export default function AppDashboardPage() {
  const { orgId, appId } = useParams<{ orgId: string; appId: string }>();

  // Mock app data - replace with real data fetching
  const appData = {
    id: appId,
    name: "My Awesome App",
    description: "A modern web application with authentication",
    status: "ACTIVE",
    type: "WEB",
    apiKey: "auth_sk_test_1234567890abcdef",
    domain: "https://myapp.vercel.app",
    members: 3,
    totalUsers: 1247,
    activeUsers: 892,
    successRate: 99.2,
  };

  const integrationSteps = [
    {
      id: 1,
      title: "Install SDK",
      description: "Add our authentication SDK to your project",
      completed: true,
      code: "npm install @myauth/react-sdk",
    },
    {
      id: 2,
      title: "Configure Provider",
      description: "Wrap your app with the AuthProvider",
      completed: true,
      code: `import { AuthProvider } from '@myauth/react-sdk';

function App() {
  return (
    <AuthProvider apiKey="${appData.apiKey}">
      <YourApp />
    </AuthProvider>
  );
}`,
    },
    {
      id: 3,
      title: "Add Login Component",
      description: "Implement login functionality in your app",
      completed: false,
      code: `import { useAuth, LoginButton } from '@myauth/react-sdk';

function LoginPage() {
  const { user, isAuthenticated } = useAuth();
  
  if (isAuthenticated) {
    return <div>Welcome, {user.email}!</div>;
  }
  
  return <LoginButton />;
}`,
    },
    {
      id: 4,
      title: "Test Authentication",
      description: "Verify that users can sign up and log in",
      completed: false,
      code: "",
    },
  ];

  const quickActions = [
    {
      title: "View Users",
      description: "Manage your app users",
      icon: Users,
      href: `/dashboard/${orgId}/app/${appId}/users`,
    },
    {
      title: "Check Logs",
      description: "View authentication logs",
      icon: Activity,
      href: `/dashboard/${orgId}/app/${appId}/logs`,
    },
    {
      title: "App Settings",
      description: "Configure app preferences",
      icon: Settings,
      href: `/dashboard/${orgId}/app/${appId}/settings`,
    },
  ];

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
                <Code className="h-4 w-4" />
                <span>{appData.name}</span>
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{appData.name}</h1>
          <p className="text-muted-foreground">{appData.description}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge
            variant={appData.status === "ACTIVE" ? "default" : "secondary"}
          >
            {appData.status}
          </Badge>
          <Badge variant="outline">{appData.type}</Badge>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Users
                </p>
                <p className="text-2xl font-bold">
                  {appData.totalUsers.toLocaleString()}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Active Users
                </p>
                <p className="text-2xl font-bold">
                  {appData.activeUsers.toLocaleString()}
                </p>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Success Rate
                </p>
                <p className="text-2xl font-bold">{appData.successRate}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Team Members
                </p>
                <p className="text-2xl font-bold">{appData.members}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="integration" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="integration" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Integration
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Quick Settings
          </TabsTrigger>
        </TabsList>

        {/* Integration Tab */}
        <TabsContent value="integration">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Integration Steps */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Quick Integration
                </CardTitle>
                <CardDescription>
                  Get your app up and running in minutes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {integrationSteps.map((step, index) => (
                  <div key={step.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {step.completed ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{step.title}</h4>
                        {!step.completed &&
                          index ===
                            integrationSteps.findIndex((s) => !s.completed) && (
                            <Badge variant="secondary" className="text-xs">
                              Next
                            </Badge>
                          )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {step.description}
                      </p>
                      {step.code && (
                        <div className="mt-2 p-3 bg-muted rounded-md">
                          <code className="text-xs font-mono">{step.code}</code>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-2 h-6 w-6 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* SDK Options */}
            <Card>
              <CardHeader>
                <CardTitle>Choose Your Platform</CardTitle>
                <CardDescription>
                  Select the SDK that matches your tech stack
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  asChild
                >
                  <a href="#" target="_blank">
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4" />
                      <span>React / Next.js</span>
                    </div>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-between"
                  asChild
                >
                  <a href="#" target="_blank">
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4" />
                      <span>Vue.js / Nuxt</span>
                    </div>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-between"
                  asChild
                >
                  <a href="#" target="_blank">
                    <div className="flex items-center space-x-2">
                      <Smartphone className="h-4 w-4" />
                      <span>React Native</span>
                    </div>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-between"
                  asChild
                >
                  <a href="#" target="_blank">
                    <div className="flex items-center space-x-2">
                      <Terminal className="h-4 w-4" />
                      <span>REST API</span>
                    </div>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {quickActions.map((action) => (
              <Card
                key={action.title}
                className="hover:shadow-md transition-shadow cursor-pointer"
              >
                <Link href={action.href}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <action.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{action.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {action.description}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto" />
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
              <CardDescription>
                Your app's API key and authentication settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">API Key</label>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 p-2 bg-muted rounded text-sm font-mono">
                    {appData.apiKey}
                  </code>
                  <Button variant="outline" size="sm">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">App Domain</label>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 p-2 bg-muted rounded text-sm">
                    {appData.domain}
                  </code>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quick Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common app management tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-16 flex-col" asChild>
                  <Link href={`/dashboard/${orgId}/app/${appId}/settings`}>
                    <Settings className="h-6 w-6 mb-2" />
                    App Settings
                  </Link>
                </Button>

                <Button variant="outline" className="h-16 flex-col" asChild>
                  <Link href={`/dashboard/${orgId}/app/${appId}/users`}>
                    <Users className="h-6 w-6 mb-2" />
                    Manage Users
                  </Link>
                </Button>

                <Button variant="outline" className="h-16 flex-col">
                  <Key className="h-6 w-6 mb-2" />
                  Regenerate API Key
                </Button>

                <Button variant="outline" className="h-16 flex-col">
                  <Activity className="h-6 w-6 mb-2" />
                  View Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
