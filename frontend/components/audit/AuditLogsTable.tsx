import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Search,
  Eye,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Activity,
} from "lucide-react";
import {
  useCustomerAuditLogs,
  formatEventType,
  getEventTypeIcon,
  getSeverityColor,
  getActorTypeIcon,
  formatRelativeTime,
  type AuditFilter,
  type AuditLog,
} from "@/services/audit.service";

interface AuditLogsTableProps {
  customerId: string;
  applicationId?: string;
  showApplicationFilter?: boolean;
  title?: string;
  tier?: "CUSTOMER" | "APPLICATION" | "ALL";
}

export const AuditLogsTable: React.FC<AuditLogsTableProps> = ({
  customerId,
  applicationId,
  showApplicationFilter = false,
  title = "Audit Logs",
  tier = "CUSTOMER",
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [selectedSeverity, setSelectedSeverity] = useState<string>("");
  const [selectedActorType, setSelectedActorType] = useState<string>("");
  const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>(
    {}
  );

  // Build filter object
  const filter: AuditFilter = useMemo(() => {
    const f: AuditFilter = {};

    if (searchTerm) f.search = searchTerm;
    if (selectedEventTypes.length > 0) f.eventTypes = selectedEventTypes;
    if (selectedSeverity) f.severity = [selectedSeverity];
    if (selectedActorType) f.actorTypes = [selectedActorType];
    if (dateRange.from) f.dateFrom = dateRange.from;
    if (dateRange.to) f.dateTo = dateRange.to;
    if (tier !== "ALL") f.logTier = tier;

    return f;
  }, [
    searchTerm,
    selectedEventTypes,
    selectedSeverity,
    selectedActorType,
    dateRange,
    tier,
  ]);

  // Fetch audit logs
  const { data, loading, error, refetch } = useCustomerAuditLogs(
    customerId,
    filter,
    { page: currentPage, limit: pageSize }
  );

  const logs = data?.customerAuditLogs?.logs || [];
  const pagination = data?.customerAuditLogs?.pagination;

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedEventTypes([]);
    setSelectedSeverity("");
    setSelectedActorType("");
    setDateRange({});
    setCurrentPage(1);
  };

  // Export logs (placeholder)
  const exportLogs = () => {
    console.log("Exporting logs...");
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Failed to load audit logs: {error.message}</p>
            <Button onClick={() => refetch()} className="mt-2">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>{title}</span>
            {pagination && (
              <Badge variant="outline" className="ml-2">
                {pagination.totalCount} events
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
            <Button variant="outline" size="sm" onClick={exportLogs}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Filters */}
        <div className="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select
              value={selectedSeverity}
              onValueChange={setSelectedSeverity}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={selectedActorType}
              onValueChange={setSelectedActorType}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Actor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All</SelectItem>
                <SelectItem value="USER">User</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="SYSTEM">System</SelectItem>
                <SelectItem value="API_KEY">API Key</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="text-gray-600"
            >
              Clear
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}>
                      <div className="flex items-center space-x-3 animate-pulse">
                        <div className="w-8 h-8 bg-gray-200 rounded"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-gray-500"
                  >
                    No audit logs found for the selected criteria.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">
                          {getEventTypeIcon(log.eventType)}
                        </span>
                        <div>
                          <div className="font-medium">
                            {formatEventType(log.eventType)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {log.eventCategory}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span>{getActorTypeIcon(log.actor.type)}</span>
                        <div>
                          <div className="font-medium text-sm">
                            {log.actor.email || log.actor.name || "Unknown"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {log.actor.type}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="max-w-md">
                        <p className="text-sm truncate" title={log.description}>
                          {log.description}
                        </p>
                        {log.metadata.applicationName && (
                          <p className="text-xs text-gray-500">
                            App: {log.metadata.applicationName}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge className={getSeverityColor(log.severity)}>
                        {log.severity}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="text-sm">
                        {formatRelativeTime(log.timestamp)}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                          <DialogHeader>
                            <DialogTitle>Audit Log Details</DialogTitle>
                          </DialogHeader>
                          <AuditLogDetailView log={log} />
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-500">
              Showing {(currentPage - 1) * pageSize + 1} to{" "}
              {Math.min(currentPage * pageSize, pagination.totalCount)} of{" "}
              {pagination.totalCount} results
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={!pagination.hasPreviousPage}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Page {currentPage} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={!pagination.hasNextPage}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Detailed log view component
const AuditLogDetailView: React.FC<{ log: AuditLog }> = ({ log }) => {
  const formatMetadata = (metadata: any) => {
    if (!metadata) return "None";

    try {
      return JSON.stringify(metadata, null, 2);
    } catch {
      return String(metadata);
    }
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium text-gray-900">Event Type</h4>
          <p className="text-sm text-gray-600">
            {getEventTypeIcon(log.eventType)} {formatEventType(log.eventType)}
          </p>
        </div>
        <div>
          <h4 className="font-medium text-gray-900">Category</h4>
          <p className="text-sm text-gray-600">{log.eventCategory}</p>
        </div>
        <div>
          <h4 className="font-medium text-gray-900">Severity</h4>
          <Badge className={getSeverityColor(log.severity)}>
            {log.severity}
          </Badge>
        </div>
        <div>
          <h4 className="font-medium text-gray-900">Timestamp</h4>
          <p className="text-sm text-gray-600">
            {new Date(log.timestamp).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Description */}
      <div>
        <h4 className="font-medium text-gray-900 mb-2">Description</h4>
        <p className="text-sm text-gray-600 p-3 bg-gray-50 rounded">
          {log.description}
        </p>
      </div>

      {/* Actor Information */}
      <div>
        <h4 className="font-medium text-gray-900 mb-2">Actor</h4>
        <div className="p-3 bg-gray-50 rounded space-y-2">
          <div className="flex items-center space-x-2">
            <span>{getActorTypeIcon(log.actor.type)}</span>
            <span className="font-medium">{log.actor.type}</span>
          </div>
          {log.actor.email && (
            <p className="text-sm text-gray-600">Email: {log.actor.email}</p>
          )}
          {log.actor.ip && (
            <p className="text-sm text-gray-600">IP: {log.actor.ip}</p>
          )}
          {log.actor.userAgent && (
            <p className="text-sm text-gray-600 truncate">
              User Agent: {log.actor.userAgent}
            </p>
          )}
        </div>
      </div>

      {/* Metadata */}
      {log.metadata && Object.keys(log.metadata).length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Additional Data</h4>
          <pre className="text-xs text-gray-600 p-3 bg-gray-50 rounded overflow-auto max-h-48">
            {formatMetadata(log.metadata)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default AuditLogsTable;
