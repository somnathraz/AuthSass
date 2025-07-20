"use client";
import React, { useEffect, useState } from "react";
import { useAppStore } from "@/store/appStore";
import { useFetchLogs } from "@/services/authService";

// Shadcn UI components (adjust the import paths as needed)
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import DialogModal from "../ DialogModal/DialogModal";
const PAGE_SIZE = 10;

const Logs = () => {
  const { selectedAppId } = useAppStore();
  const [open, setOpen] = useState(false);
  const { runFetchLogs, data, error, loading } = useFetchLogs();
  const [filterValue, setFilterValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLogIds, setSelectedLogIds] = useState<string[]>([]);

  // Fetch logs whenever the selected app changes
  useEffect(() => {
    if (selectedAppId) {
      runFetchLogs(selectedAppId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAppId]);

  if (!selectedAppId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center dark:bg-gray-900 px-4">
        <h1 className="text-3xl font-bold mb-4 text-gray-800 dark:text-white">
          Create Your First App
        </h1>
        <p className="text-lg mb-6 text-gray-600 dark:text-gray-300">
          Get started by creating your first application.
        </p>
        <button
          onClick={() => setOpen(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-500 focus:outline-none"
        >
          Create First App
        </button>
        <DialogModal open={open} setOpen={setOpen} />
      </div>
    );
  }

  if (loading) return <p>Loading logs...</p>;
  if (error) return <p>Error loading logs: {error.message}</p>;

  // Use the auditLogs returned from GraphQL (metadata removed)
  const logs = data?.auditLogs ?? [];

  // Filter logs by any field (Log ID, Action, User, Timestamp) using the filter input
  const filteredLogs = logs.filter((log: any) => {
    const searchTerm = filterValue.toLowerCase();
    return (
      (log.id && log.id.toString().toLowerCase().includes(searchTerm)) ||
      (log.action && log.action.toLowerCase().includes(searchTerm)) ||
      (log.userId && log.userId.toLowerCase().includes(searchTerm)) ||
      (log.timestamp &&
        new Date(log.timestamp).toLocaleString().toLowerCase().includes(searchTerm))
    );
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredLogs.length / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + PAGE_SIZE);

  // Toggle selection for an individual log
  const toggleSelectLog = (id: string) => {
    setSelectedLogIds((prev) =>
      prev.includes(id) ? prev.filter((logId) => logId !== id) : [...prev, id]
    );
  };

  // Toggle selection for all logs on the current page
  const toggleSelectAll = () => {
    const currentPageIds = paginatedLogs.map((log: any) => log.id);
    const areAllSelected = currentPageIds.every((id) =>
      selectedLogIds.includes(id)
    );
    if (areAllSelected) {
      // Deselect all on current page
      setSelectedLogIds((prev) =>
        prev.filter((id) => !currentPageIds.includes(id))
      );
    } else {
      // Select all on current page (avoid duplicates)
      setSelectedLogIds((prev) =>
        Array.from(new Set([...prev, ...currentPageIds]))
      );
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-semibold">Audit Logs for App</h2>

      {/* Top bar with filter input and a "Columns" button */}
      <div className="flex items-center justify-between">
        <Input
          type="text"
          placeholder="Filter logs..."
          className="max-w-sm"
          value={filterValue}
          onChange={(e) => {
            setFilterValue(e.target.value);
            setCurrentPage(1); // Reset to first page when filtering
          }}
        />
        <Button variant="secondary">Columns</Button>
      </div>

      {paginatedLogs.length > 0 ? (
        <Table>
          <TableCaption>
            Showing {paginatedLogs.length} of {filteredLogs.length} logs.
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>
                <input
                  type="checkbox"
                  className="rounded-full"
                  checked={
                    paginatedLogs.length > 0 &&
                    paginatedLogs.every((log: any) =>
                      selectedLogIds.includes(log.id)
                    )
                  }
                  onChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Log ID</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedLogs.map((log: any) => (
              <TableRow key={log.id}>
                <TableCell>
                  <input
                    type="checkbox"
                    className="rounded-full"
                    checked={selectedLogIds.includes(log.id)}
                    onChange={() => toggleSelectLog(log.id)}
                  />
                </TableCell>
                <TableCell>{log.id}</TableCell>
                <TableCell>{log.action || "N/A"}</TableCell>
                <TableCell>{log.userId || "N/A"}</TableCell>
                <TableCell>
                  {log.timestamp
                    ? new Date(log.timestamp).toLocaleString()
                    : "N/A"}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          navigator.clipboard.writeText(log.id);
                        }}
                      >
                        Copy Log ID
                      </DropdownMenuItem>
                      <DropdownMenuItem>View details</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p>No logs available for this app.</p>
      )}

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2">
          <Button
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          >
            Previous
          </Button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={currentPage === totalPages}
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default Logs;
