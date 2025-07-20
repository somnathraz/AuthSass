"use client";

import React, { useState } from "react";
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
  Download,
  TrendingUp,
  BarChart3,
  Clock,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

export default function AppDashboardPage() {
  const { orgId, appId } = useParams<{ orgId: string; appId: string }>();
  const [selectedTech, setSelectedTech] = useState<string | null>(null);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [checkStartTime, setCheckStartTime] = useState<number | null>(null);
  const [checkTimeout, setCheckTimeout] = useState<NodeJS.Timeout | null>(null);
  const [appData, setAppData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Handle integration completion
  const handleIntegrationComplete = async (technology: string) => {
    try {
      // Save selected technology to backend
      const response = await fetch(`/api/apps/${appId}/integration`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          selectedTechnology: technology,
          isCheckingConnection: true,
        }),
      });

      if (response.ok) {
        // Update local state
        setSelectedTech(technology);
        setAppData((prevData: any) => ({
          ...prevData,
          integrationStatus: {
            ...prevData.integrationStatus,
            selectedTechnology: technology,
            isCheckingConnection: true,
          },
        }));

        // Start connection checking
        startConnectionCheck(technology);
      } else {
        console.error("Failed to save integration status");
      }
    } catch (error) {
      console.error("Error saving integration status:", error);
    }
  };

  // Start checking for app connection
  const startConnectionCheck = (technology: string) => {
    setIsCheckingConnection(true);
    setCheckStartTime(Date.now());

    // Poll every 10 seconds for 15 minutes (90 intervals)
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/apps/${appId}/connection-status`);
        const data = await response.json();

        if (data.isConnected) {
          // App is connected! Stop polling and update state
          clearInterval(pollInterval);
          setIsCheckingConnection(false);
          setCheckStartTime(null);

          // Update backend state
          await fetch(`/api/apps/${appId}/integration`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              isConnected: true,
              connectedAt: data.lastRequestAt,
              lastLoginAttempt: data.lastRequestAt,
              totalLoginAttempts: data.totalRequests,
              isCheckingConnection: false,
            }),
          });

          // Update local state to show connected dashboard
          setAppData((prevData: any) => ({
            ...prevData,
            integrationStatus: {
              ...prevData.integrationStatus,
              isConnected: true,
              connectedAt: data.lastRequestAt,
              lastLoginAttempt: data.lastRequestAt,
              totalLoginAttempts: data.totalRequests,
              isCheckingConnection: false,
            },
          }));

          return;
        }

        // Check if 15 minutes have passed
        const elapsed = Date.now() - (checkStartTime || Date.now());
        if (elapsed >= 15 * 60 * 1000) {
          // 15 minutes
          clearInterval(pollInterval);
          setIsCheckingConnection(false);
          setCheckStartTime(null);
        }
      } catch (error) {
        console.error("Error checking connection status:", error);
      }
    }, 10000); // 10 seconds

    setCheckTimeout(pollInterval);
  };

  // Stop checking connection
  const stopConnectionCheck = () => {
    if (checkTimeout) {
      clearInterval(checkTimeout);
      setCheckTimeout(null);
    }
    setIsCheckingConnection(false);
    setCheckStartTime(null);
  };

  // Check again button handler
  const handleCheckAgain = () => {
    if (selectedTech) {
      startConnectionCheck(selectedTech);
    }
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (checkTimeout) {
        clearInterval(checkTimeout);
      }
    };
  }, [checkTimeout]);

  // Fetch app data on component mount
  React.useEffect(() => {
    fetchAppData();
  }, [appId]);

  const fetchAppData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/apps/${appId}`);
      if (response.ok) {
        const data = await response.json();

        // Ensure appData has all required fields with fallbacks
        const safeAppData = {
          id: appId,
          name: data.app?.name || "My Awesome App",
          description:
            data.app?.description ||
            "A modern web application with authentication",
          status: data.app?.status || "ACTIVE",
          type: data.app?.type || "WEB",
          apiKey: data.app?.apiKey || `auth_sk_${appId.slice(-12)}`,
          domain: data.app?.domain || "https://myapp.vercel.app",
          members: data.app?.members || 0,
          totalUsers: data.app?.totalUsers || 0,
          activeUsers: data.app?.activeUsers || 0,
          successRate: data.app?.successRate || 0,
          integrationStatus: {
            isConnected: data.app?.integrationStatus?.isConnected || false,
            selectedTechnology:
              data.app?.integrationStatus?.selectedTechnology || null,
            connectedAt: data.app?.integrationStatus?.connectedAt || null,
            lastLoginAttempt:
              data.app?.integrationStatus?.lastLoginAttempt || null,
            totalLoginAttempts:
              data.app?.integrationStatus?.totalLoginAttempts || 0,
            successfulLogins:
              data.app?.integrationStatus?.successfulLogins || 0,
            isCheckingConnection:
              data.app?.integrationStatus?.isCheckingConnection || false,
            checkStartedAt: data.app?.integrationStatus?.checkStartedAt || null,
          },
        };

        setAppData(safeAppData);

        // If app has selected technology, set it
        if (safeAppData.integrationStatus.selectedTechnology) {
          setSelectedTech(safeAppData.integrationStatus.selectedTechnology);
        }

        // If app is checking connection, resume the check
        if (safeAppData.integrationStatus.isCheckingConnection) {
          startConnectionCheck(
            safeAppData.integrationStatus.selectedTechnology
          );
        }
      } else {
        console.error("Failed to fetch app data");
        // Fallback to mock data for development
        setAppData({
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
          integrationStatus: {
            isConnected: false,
            selectedTechnology: null,
            connectedAt: null,
            lastLoginAttempt: null,
            totalLoginAttempts: 0,
            successfulLogins: 0,
            isCheckingConnection: false,
            checkStartedAt: null,
          },
        });
      }
    } catch (error) {
      console.error("Error fetching app data:", error);
      // Fallback to mock data for development
      setAppData({
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
        integrationStatus: {
          isConnected: false,
          selectedTechnology: null,
          connectedAt: null,
          lastLoginAttempt: null,
          totalLoginAttempts: 0,
          successfulLogins: 0,
          isCheckingConnection: false,
          checkStartedAt: null,
        },
      });
    } finally {
      setLoading(false);
    }
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
    <AuthProvider apiKey="${appData?.apiKey || "your_api_key_here"}">
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

  // Show loading state
  if (loading || !appData) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading app data...</p>
          </div>
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

      {/* Stats Overview - Only show when app is connected */}
      {appData.integrationStatus.isConnected && (
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
      )}

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
          {!appData.integrationStatus.isConnected ? (
            // Show technology selection only when app is not connected
            <div className="space-y-6">
              {/* Technology Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Choose Your Technology
                  </CardTitle>
                  <CardDescription>
                    Select your platform to get customized integration
                    instructions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {/* Webflow */}
                    <button
                      onClick={() => setSelectedTech("webflow")}
                      className={`p-4 border-2 rounded-lg text-center transition-all hover:shadow-md ${
                        selectedTech === "webflow"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Globe className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="font-semibold">Webflow</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        No-code platform
                      </p>
                    </button>

                    {/* WordPress */}
                    <button
                      onClick={() => setSelectedTech("wordpress")}
                      className={`p-4 border-2 rounded-lg text-center transition-all hover:shadow-md ${
                        selectedTech === "wordpress"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                        <Globe className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="font-semibold">WordPress</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        CMS platform
                      </p>
                    </button>

                    {/* React */}
                    <button
                      onClick={() => setSelectedTech("react")}
                      className={`p-4 border-2 rounded-lg text-center transition-all hover:shadow-md ${
                        selectedTech === "react"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                        <Code className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="font-semibold">React</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        JavaScript library
                      </p>
                    </button>

                    {/* Next.js */}
                    <button
                      onClick={() => setSelectedTech("nextjs")}
                      className={`p-4 border-2 rounded-lg text-center transition-all hover:shadow-md ${
                        selectedTech === "nextjs"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-gray-800 to-black rounded-lg flex items-center justify-center">
                        <Code className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="font-semibold">Next.js</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        React framework
                      </p>
                    </button>

                    {/* Vue.js */}
                    <button
                      onClick={() => setSelectedTech("vue")}
                      className={`p-4 border-2 rounded-lg text-center transition-all hover:shadow-md ${
                        selectedTech === "vue"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                        <Code className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="font-semibold">Vue.js</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        JavaScript framework
                      </p>
                    </button>

                    {/* Angular */}
                    <button
                      onClick={() => setSelectedTech("angular")}
                      className={`p-4 border-2 rounded-lg text-center transition-all hover:shadow-md ${
                        selectedTech === "angular"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                        <Code className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="font-semibold">Angular</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        TypeScript framework
                      </p>
                    </button>

                    {/* Node.js */}
                    <button
                      onClick={() => setSelectedTech("nodejs")}
                      className={`p-4 border-2 rounded-lg text-center transition-all hover:shadow-md ${
                        selectedTech === "nodejs"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center">
                        <Terminal className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="font-semibold">Node.js</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Server-side
                      </p>
                    </button>

                    {/* REST API */}
                    <button
                      onClick={() => setSelectedTech("rest")}
                      className={`p-4 border-2 rounded-lg text-center transition-all hover:shadow-md ${
                        selectedTech === "rest"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Terminal className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="font-semibold">REST API</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Direct integration
                      </p>
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* Integration Instructions */}
              {selectedTech && !isCheckingConnection && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      {getTechTitle(selectedTech)} Integration
                    </CardTitle>
                    <CardDescription>
                      {getTechDescription(selectedTech)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedTech === "webflow" ? (
                      <WebflowIntegrationSteps
                        appData={appData}
                        onIntegrationComplete={() =>
                          handleIntegrationComplete(selectedTech)
                        }
                      />
                    ) : selectedTech === "wordpress" ? (
                      <WordPressIntegrationSteps
                        appData={appData}
                        onIntegrationComplete={() =>
                          handleIntegrationComplete(selectedTech)
                        }
                      />
                    ) : selectedTech === "react" ? (
                      <ReactIntegrationSteps
                        appData={appData}
                        onIntegrationComplete={() =>
                          handleIntegrationComplete(selectedTech)
                        }
                      />
                    ) : selectedTech === "nextjs" ? (
                      <NextJSIntegrationSteps
                        appData={appData}
                        onIntegrationComplete={() =>
                          handleIntegrationComplete(selectedTech)
                        }
                      />
                    ) : selectedTech === "vue" ? (
                      <VueIntegrationSteps
                        appData={appData}
                        onIntegrationComplete={() =>
                          handleIntegrationComplete(selectedTech)
                        }
                      />
                    ) : selectedTech === "angular" ? (
                      <AngularIntegrationSteps
                        appData={appData}
                        onIntegrationComplete={() =>
                          handleIntegrationComplete(selectedTech)
                        }
                      />
                    ) : selectedTech === "nodejs" ? (
                      <NodeJSIntegrationSteps
                        appData={appData}
                        onIntegrationComplete={() =>
                          handleIntegrationComplete(selectedTech)
                        }
                      />
                    ) : (
                      <RESTIntegrationSteps
                        appData={appData}
                        onIntegrationComplete={() =>
                          handleIntegrationComplete(selectedTech)
                        }
                      />
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Connection Checking Status */}
              {isCheckingConnection && (
                <Card>
                  <CardContent className="p-8">
                    <div className="text-center space-y-4">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                      <div>
                        <h3 className="text-lg font-semibold mb-2">
                          Checking for First Request...
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          We're waiting for your{" "}
                          {selectedTech ? getTechTitle(selectedTech) : "app"}{" "}
                          app to make its first authentication request. This
                          usually takes a few minutes after you complete the
                          integration.
                        </p>

                        {/* Progress indicator */}
                        {checkStartTime && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Checking...</span>
                              <span>
                                {Math.floor(
                                  (Date.now() - checkStartTime) / 1000
                                )}
                                s / 900s
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full transition-all duration-1000"
                                style={{
                                  width: `${Math.min(
                                    ((Date.now() - checkStartTime) /
                                      (15 * 60 * 1000)) *
                                      100,
                                    100
                                  )}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Check Again Button - Show after 15 minutes */}
              {!isCheckingConnection &&
                selectedTech &&
                checkStartTime === null && (
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center space-y-4">
                        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
                          <Clock className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold mb-2">
                            Integration Timeout
                          </h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            We didn't receive a connection from your{" "}
                            {getTechTitle(selectedTech)} app within 15 minutes.
                            Please verify your integration and try again.
                          </p>
                          <div className="flex space-x-2 justify-center">
                            <Button onClick={handleCheckAgain}>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Check Again
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setSelectedTech(null)}
                            >
                              Choose Different Technology
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
            </div>
          ) : (
            // Show connected app dashboard when app is connected
            <ConnectedAppDashboard appData={appData} />
          )}
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

// Helper functions
function getTechTitle(tech: string): string {
  const titles: Record<string, string> = {
    webflow: "Webflow",
    wordpress: "WordPress",
    react: "React",
    nextjs: "Next.js",
    vue: "Vue.js",
    angular: "Angular",
    nodejs: "Node.js",
    rest: "REST API",
  };
  return titles[tech] || tech;
}

function getTechDescription(tech: string): string {
  const descriptions: Record<string, string> = {
    webflow: "Add authentication to your Webflow site with our no-code SDK",
    wordpress:
      "Integrate authentication into your WordPress site with our plugin",
    react: "Use our React hooks and components for seamless authentication",
    nextjs: "Leverage our Next.js SDK for server-side authentication",
    vue: "Integrate authentication with Vue.js using our Vue SDK",
    angular: "Add authentication to your Angular app with our Angular SDK",
    nodejs: "Protect your Node.js API routes with our server SDK",
    rest: "Use our REST API directly for custom authentication flows",
  };
  return descriptions[tech] || "Integration instructions for your platform";
}

// Integration Components
function WebflowIntegrationSteps({
  appData,
  onIntegrationComplete,
}: {
  appData: any;
  onIntegrationComplete?: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Step 1 */}
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-semibold">
          1
        </div>
        <div className="flex-1">
          <h4 className="font-semibold mb-2">Download the SDK</h4>
          <p className="text-sm text-muted-foreground mb-3">
            Download our Webflow SDK file and upload it to your Webflow project.
          </p>
          <div className="bg-muted p-3 rounded-md">
            <div className="flex items-center justify-between">
              <code className="text-sm">setauth-webflow.js</code>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Step 2 */}
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-semibold">
          2
        </div>
        <div className="flex-1">
          <h4 className="font-semibold mb-2">Add to your Webflow site</h4>
          <p className="text-sm text-muted-foreground mb-3">
            Add the SDK script to your Webflow site's custom code section.
          </p>
          <div className="bg-muted p-3 rounded-md">
            <code className="text-sm font-mono">
              {`<script src="https://cdn.yourauth.com/setauth-webflow.js"></script>
<script>
  window.YourAuthConfig = {
    appId: '${appData.apiKey}',
    apiUrl: 'https://api.yourauth.com'
  };
</script>`}
            </code>
            <Button variant="outline" size="sm" className="ml-2">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Step 3 */}
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-semibold">
          3
        </div>
        <div className="flex-1">
          <h4 className="font-semibold mb-2">Add login/signup forms</h4>
          <p className="text-sm text-muted-foreground mb-3">
            Add these HTML elements where you want the forms to appear.
          </p>
          <div className="bg-muted p-3 rounded-md">
            <code className="text-sm font-mono">
              {`<!-- Login Form -->
<div id="login-container"></div>

<!-- Signup Form -->
<div id="signup-container"></div>

<script>
  // Render forms
  window.YourAuthSDK.renderLoginForm(document.getElementById('login-container'));
  window.YourAuthSDK.renderSignupForm(document.getElementById('signup-container'));
</script>`}
            </code>
            <Button variant="outline" size="sm" className="ml-2">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Step 4 */}
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-semibold">
          4
        </div>
        <div className="flex-1">
          <h4 className="font-semibold mb-2">Test your integration</h4>
          <p className="text-sm text-muted-foreground mb-3">
            Test the authentication flow and check your logs.
          </p>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              Test Page
            </Button>
            <Button variant="outline" size="sm">
              <Activity className="h-4 w-4 mr-2" />
              View Logs
            </Button>
          </div>
        </div>
      </div>

      {/* Step 5 - Test Integration */}
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-semibold">
          5
        </div>
        <div className="flex-1">
          <h4 className="font-semibold mb-2">Verify Connection</h4>
          <p className="text-sm text-muted-foreground mb-3">
            Click the button below to check if your app is properly connected
            and receiving authentication requests.
          </p>
          <Button
            onClick={onIntegrationComplete}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Test Integration
          </Button>
        </div>
      </div>

      {/* Success Message */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <h4 className="font-semibold text-green-800">
            Integration Complete!
          </h4>
        </div>
        <p className="text-sm text-green-700 mt-1">
          Your Webflow site now has authentication. Users can sign up, log in,
          and you'll see all activity in your dashboard.
        </p>
      </div>
    </div>
  );
}

function WordPressIntegrationSteps({
  appData,
  onIntegrationComplete,
}: {
  appData: any;
  onIntegrationComplete?: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-semibold">
          1
        </div>
        <div className="flex-1">
          <h4 className="font-semibold mb-2">Install WordPress Plugin</h4>
          <p className="text-sm text-muted-foreground mb-3">
            Download and install our WordPress authentication plugin.
          </p>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download Plugin
          </Button>
        </div>
      </div>

      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-semibold">
          2
        </div>
        <div className="flex-1">
          <h4 className="font-semibold mb-2">Configure API Key</h4>
          <p className="text-sm text-muted-foreground mb-3">
            Add your API key in the plugin settings.
          </p>
          <div className="bg-muted p-3 rounded-md">
            <code className="text-sm font-mono">API Key: {appData.apiKey}</code>
            <Button variant="outline" size="sm" className="ml-2">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReactIntegrationSteps({
  appData,
  onIntegrationComplete,
}: {
  appData: any;
  onIntegrationComplete?: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-semibold">
          1
        </div>
        <div className="flex-1">
          <h4 className="font-semibold mb-2">Install React SDK</h4>
          <p className="text-sm text-muted-foreground mb-3">
            Install our React authentication SDK.
          </p>
          <div className="bg-muted p-3 rounded-md">
            <code className="text-sm font-mono">
              npm install @yourauth/react-sdk
            </code>
            <Button variant="outline" size="sm" className="ml-2">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NextJSIntegrationSteps({
  appData,
  onIntegrationComplete,
}: {
  appData: any;
  onIntegrationComplete?: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-semibold">
          1
        </div>
        <div className="flex-1">
          <h4 className="font-semibold mb-2">Install Next.js SDK</h4>
          <p className="text-sm text-muted-foreground mb-3">
            Install our Next.js authentication SDK.
          </p>
          <div className="bg-muted p-3 rounded-md">
            <code className="text-sm font-mono">
              npm install @yourauth/next-sdk
            </code>
            <Button variant="outline" size="sm" className="ml-2">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function VueIntegrationSteps({
  appData,
  onIntegrationComplete,
}: {
  appData: any;
  onIntegrationComplete?: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-semibold">
          1
        </div>
        <div className="flex-1">
          <h4 className="font-semibold mb-2">Install Vue SDK</h4>
          <p className="text-sm text-muted-foreground mb-3">
            Install our Vue.js authentication SDK.
          </p>
          <div className="bg-muted p-3 rounded-md">
            <code className="text-sm font-mono">
              npm install @yourauth/vue-sdk
            </code>
            <Button variant="outline" size="sm" className="ml-2">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AngularIntegrationSteps({
  appData,
  onIntegrationComplete,
}: {
  appData: any;
  onIntegrationComplete?: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-semibold">
          1
        </div>
        <div className="flex-1">
          <h4 className="font-semibold mb-2">Install Angular SDK</h4>
          <p className="text-sm text-muted-foreground mb-3">
            Install our Angular authentication SDK.
          </p>
          <div className="bg-muted p-3 rounded-md">
            <code className="text-sm font-mono">
              npm install @yourauth/angular-sdk
            </code>
            <Button variant="outline" size="sm" className="ml-2">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NodeJSIntegrationSteps({
  appData,
  onIntegrationComplete,
}: {
  appData: any;
  onIntegrationComplete?: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-semibold">
          1
        </div>
        <div className="flex-1">
          <h4 className="font-semibold mb-2">Install Node.js SDK</h4>
          <p className="text-sm text-muted-foreground mb-3">
            Install our Node.js authentication SDK.
          </p>
          <div className="bg-muted p-3 rounded-md">
            <code className="text-sm font-mono">
              npm install @yourauth/node-sdk
            </code>
            <Button variant="outline" size="sm" className="ml-2">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RESTIntegrationSteps({
  appData,
  onIntegrationComplete,
}: {
  appData: any;
  onIntegrationComplete?: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-semibold">
          1
        </div>
        <div className="flex-1">
          <h4 className="font-semibold mb-2">API Documentation</h4>
          <p className="text-sm text-muted-foreground mb-3">
            Use our REST API directly for custom integrations.
          </p>
          <div className="bg-muted p-3 rounded-md">
            <code className="text-sm font-mono">
              Base URL: https://api.yourauth.com
            </code>
            <Button variant="outline" size="sm" className="ml-2">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Connected App Dashboard Component
function ConnectedAppDashboard({ appData }: { appData: any }) {
  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <h3 className="text-lg font-semibold text-green-800">
                App Connected Successfully!
              </h3>
              <p className="text-sm text-green-700">
                Your{" "}
                {getTechTitle(appData.integrationStatus.selectedTechnology)} app
                is now connected and receiving authentication events.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Login Attempts
                </p>
                <p className="text-2xl font-bold">
                  {appData.integrationStatus.totalLoginAttempts}
                </p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Successful Logins
                </p>
                <p className="text-2xl font-bold">
                  {appData.integrationStatus.successfulLogins}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
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
                <p className="text-2xl font-bold">
                  {appData.integrationStatus.totalLoginAttempts > 0
                    ? Math.round(
                        (appData.integrationStatus.successfulLogins /
                          appData.integrationStatus.totalLoginAttempts) *
                          100
                      )
                    : 0}
                  %
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Manage your connected app</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="h-16 flex-col" asChild>
              <Link href={`/dashboard/${appData.orgId}/app/${appData.id}/logs`}>
                <Activity className="h-6 w-6 mb-2" />
                View Live Logs
              </Link>
            </Button>

            <Button variant="outline" className="h-16 flex-col" asChild>
              <Link
                href={`/dashboard/${appData.orgId}/app/${appData.id}/audit`}
              >
                <BarChart3 className="h-6 w-6 mb-2" />
                View Analytics
              </Link>
            </Button>

            <Button variant="outline" className="h-16 flex-col">
              <Settings className="h-6 w-6 mb-2" />
              App Settings
            </Button>

            <Button variant="outline" className="h-16 flex-col">
              <Users className="h-6 w-6 mb-2" />
              Manage Users
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Last Activity */}
      {appData.integrationStatus.lastLoginAttempt && (
        <Card>
          <CardHeader>
            <CardTitle>Last Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium">
                  Last login attempt:{" "}
                  {new Date(
                    appData.integrationStatus.lastLoginAttempt
                  ).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  Your app is actively receiving authentication events
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
