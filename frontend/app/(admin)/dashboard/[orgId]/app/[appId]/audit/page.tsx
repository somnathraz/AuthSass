"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ArrowLeft, Home, Shield, Smartphone } from "lucide-react";
import Link from "next/link";
import AuditAnalyticsDashboard from "@/components/audit/AuditAnalyticsDashboard";
import AuditLogsTable from "@/components/audit/AuditLogsTable";

export default function ApplicationAuditPage() {
  const { orgId, appId } = useParams<{ orgId: string; appId: string }>();
  const [timeRange, setTimeRange] = useState("7d");

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
              <span>Back to Application</span>
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
                <Smartphone className="h-4 w-4" />
                <span>Application</span>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="flex items-center space-x-1">
                <Shield className="h-4 w-4" />
                <span>Audit Logs</span>
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Application Audit Logs</h1>
        <p className="text-gray-600">
          Monitor authentication events and user activity for this application
        </p>
      </div>

      {/* Analytics Section */}
      <div className="space-y-6">
        <AuditAnalyticsDashboard
          customerId={orgId}
          applicationId={appId}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
        />

        {/* Application Events */}
        <AuditLogsTable
          customerId={orgId}
          applicationId={appId}
          title="Application Events"
          tier="APPLICATION"
        />
      </div>
    </div>
  );
}
