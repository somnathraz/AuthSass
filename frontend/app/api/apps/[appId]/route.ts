import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { appId: string } }
) {
  try {
    const { appId } = params;

    // In a real implementation, this would fetch from your backend
    const response = await fetch(
      `${process.env.BACKEND_URL}/api/apps/${appId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch app data");
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      app: data.app,
    });
  } catch (error) {
    console.error("Error fetching app data:", error);

    // For demo purposes, return mock data
    // In production, this would be a real database fetch
    return NextResponse.json({
      success: true,
      app: {
        id: params.appId,
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
      },
    });
  }
}
