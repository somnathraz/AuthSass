import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { appId: string } }
) {
  try {
    const { appId } = params;

    // In a real implementation, this would check your database
    // for the first authentication request from this app
    const response = await fetch(
      `${process.env.BACKEND_URL}/api/apps/${appId}/connection-status`,
      {
        headers: {
          Authorization: `Bearer ${process.env.API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch connection status");
    }

    const data = await response.json();

    return NextResponse.json({
      isConnected: data.isConnected,
      lastRequestAt: data.lastRequestAt,
      totalRequests: data.totalRequests,
    });
  } catch (error) {
    console.error("Error checking connection status:", error);

    // For demo purposes, return mock data
    // In production, this would be a real database check
    return NextResponse.json({
      isConnected: false,
      lastRequestAt: null,
      totalRequests: 0,
    });
  }
}
