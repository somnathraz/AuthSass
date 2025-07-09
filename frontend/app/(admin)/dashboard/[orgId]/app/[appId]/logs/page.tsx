// src/app/[orgId]/app/[appId]/logs/page.tsx
"use client";

import React, { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useGetAppLogs, AppLog } from "@/graphql/app.mutations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Filter, Download, Search, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Log Event Types based on industry standards (Auth0, Clerk)
const LOG_EVENT_TYPES = [
  { value: "ALL", label: "All Events" },
  { value: "LOGIN_SUCCESS", label: "Successful Login" },
  { value: "LOGIN_FAILED", label: "Failed Login" },
  { value: "LOGOUT", label: "Logout" },
  { value: "SIGNUP_SUCCESS", label: "Successful Signup" },
  { value: "SIGNUP_FAILED", label: "Failed Signup" },
  { value: "PASSWORD_RESET_REQUEST", label: "Password Reset Request" },
  { value: "PASSWORD_RESET_SUCCESS", label: "Password Reset" },
  { value: "EMAIL_VERIFICATION", label: "Email Verification" },
  { value: "MFA_CHALLENGE", label: "MFA Challenge" },
  { value: "MFA_SUCCESS", label: "MFA Success" },
  { value: "MFA_FAILED", label: "MFA Failed" },
  { value: "APP_UPDATED", label: "App Updated" },
  { value: "API_KEY_CREATED", label: "API Key Created" },
  { value: "API_KEY_REVOKED", label: "API Key Revoked" },
  { value: "SETTINGS_UPDATED", label: "Settings Updated" },
  { value: "RATE_LIMIT_EXCEEDED", label: "Rate Limit Exceeded" },
  { value: "BRUTE_FORCE_DETECTED", label: "Brute Force Detected" },
  { value: "SUSPICIOUS_LOGIN", label: "Suspicious Login" },
];

const SEVERITY_COLORS = {
  INFO: "bg-blue-100 text-blue-800",
  WARNING: "bg-yellow-100 text-yellow-800", 
  ERROR: "bg-red-100 text-red-800",
  CRITICAL: "bg-purple-100 text-purple-800",
};

const CATEGORY_COLORS = {
  AUTHENTICATION: "bg-green-100 text-green-800",
  AUTHORIZATION: "bg-blue-100 text-blue-800",
  ADMIN: "bg-purple-100 text-purple-800",
  SECURITY: "bg-red-100 text-red-800",
  API: "bg-gray-100 text-gray-800",
  SYSTEM: "bg-orange-100 text-orange-800",
};

export default function AppLogsPage() {
  const { appId } = useParams<{ appId: string }>();
  const [filters, setFilters] = useState({
    eventType: "ALL",
    search: "",
    dateFrom: undefined as Date | undefined,
    dateTo: undefined as Date | undefined,
  });
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 25;

  const { logs, total, hasNextPage, loading, error, refetch } = useGetAppLogs(appId, {
    limit: pageSize,
    offset: currentPage * pageSize,
    eventType: filters.eventType === "ALL" ? undefined : filters.eventType,
    dateFrom: filters.dateFrom?.toISOString(),
    dateTo: filters.dateTo?.toISOString(),
  });

  // Filter logs by search term on the frontend (for displayed results)
  const filteredLogs = useMemo(() => {
    if (!filters.search) return logs;
    
    const searchLower = filters.search.toLowerCase();
    return logs.filter((log: AppLog) => 
      log.message.toLowerCase().includes(searchLower) ||
      log.user?.username?.toLowerCase().includes(searchLower) ||
      log.user?.email?.toLowerCase().includes(searchLower) ||
      log.ipAddress?.includes(searchLower)
    );
  }, [logs, filters.search]);

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(0); // Reset to first page when filtering
  };

  const clearFilters = () => {
    setFilters({
      eventType: "ALL",
      search: "",
      dateFrom: undefined,
      dateTo: undefined,
    });
    setCurrentPage(0);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: format(date, "MMM dd, yyyy"),
      time: format(date, "HH:mm:ss"),
    };
  };

  const getEventIcon = (eventType: string) => {
    if (eventType.includes("LOGIN")) return "🔑";
    if (eventType.includes("SIGNUP")) return "👤";
    if (eventType.includes("PASSWORD")) return "🔒";
    if (eventType.includes("MFA")) return "🛡️";
    if (eventType.includes("API")) return "🔧";
    if (eventType.includes("RATE_LIMIT")) return "⚡";
    if (eventType.includes("SECURITY") || eventType.includes("BRUTE_FORCE")) return "🚨";
    return "📝";
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading logs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Logs</CardTitle>
            <CardDescription>{error.message}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity Logs</h1>
          <p className="text-muted-foreground">
            Monitor authentication events, admin actions, and security activities
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Event Type */}
            <div>
              <label className="text-sm font-medium mb-2 block">Event Type</label>
              <Select
                value={filters.eventType}
                onValueChange={(value) => handleFilterChange("eventType", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All events" />
                </SelectTrigger>
                <SelectContent>
                  {LOG_EVENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date From */}
            <div>
              <label className="text-sm font-medium mb-2 block">From Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateFrom ? format(filters.dateFrom, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.dateFrom}
                    onSelect={(date) => handleFilterChange("dateFrom", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Date To */}
            <div>
              <label className="text-sm font-medium mb-2 block">To Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.dateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateTo ? format(filters.dateTo, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.dateTo}
                    onSelect={(date) => handleFilterChange("dateTo", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Clear Filters */}
          <div className="mt-4 flex justify-end">
            <Button variant="ghost" onClick={clearFilters}>
              Clear All Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredLogs.length} of {total} logs
        </p>
      </div>

      {/* Logs List */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <Filter className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No logs found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your filters or check back later
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredLogs.map((log: AppLog) => {
            const { date, time } = formatTimestamp(log.timestamp);
            return (
              <Card key={log.id} className="transition-colors hover:bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      {/* Event Icon */}
                      <div className="flex-shrink-0 mt-1">
                        <span className="text-lg" role="img" aria-label="event-icon">
                          {getEventIcon(log.eventType)}
                        </span>
                      </div>

                      {/* Log Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-foreground truncate">
                            {log.message}
                          </h3>
                          <Badge 
                            className={cn("text-xs", SEVERITY_COLORS[log.severity as keyof typeof SEVERITY_COLORS])}
                          >
                            {log.severity}
                          </Badge>
                          <Badge 
                            variant="outline"
                            className={cn("text-xs", CATEGORY_COLORS[log.eventCategory as keyof typeof CATEGORY_COLORS])}
                          >
                            {log.eventCategory}
                          </Badge>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          {log.user && (
                            <span>
                              <strong>User:</strong> {log.user.username || log.user.email}
                            </span>
                          )}
                          {log.ipAddress && (
                            <span>
                              <strong>IP:</strong> {log.ipAddress}
                            </span>
                          )}
                          {log.location?.city && (
                            <span>
                              <strong>Location:</strong> {log.location.city}, {log.location.country}
                            </span>
                          )}
                        </div>

                        {/* Metadata */}
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <details className="mt-3">
                            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                              View Details
                            </summary>
                            <pre className="mt-2 text-xs bg-muted p-3 rounded-md overflow-x-auto">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>

                    {/* Timestamp */}
                    <div className="text-right text-xs text-muted-foreground flex-shrink-0 ml-4">
                      <div>{date}</div>
                      <div className="font-mono">{time}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {total > pageSize && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
          >
            Previous
          </Button>
          
          <span className="text-sm text-muted-foreground">
            Page {currentPage + 1} of {Math.ceil(total / pageSize)}
          </span>
          
          <Button
            variant="outline"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={!hasNextPage}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
