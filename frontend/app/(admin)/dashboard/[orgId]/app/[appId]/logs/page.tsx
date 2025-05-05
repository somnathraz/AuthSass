// src/app/[orgId]/app/[appId]/logs/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useFetchLogs } from "@/services/authService";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";

interface LogItem {
  id: string;
  action: string;
  userId: string;
  // avoid `any`—at least use unknown or a more precise shape
  metadata: Record<string, unknown>;
  timestamp: string;
}

export default function LogsPage() {
  const { appId } = useParams<{ appId: string }>();
  const { runFetchLogs, data, loading, error } = useFetchLogs();
  const [globalFilter, setGlobalFilter] = useState("");

  useEffect(() => {
    runFetchLogs(appId);
  }, [appId, runFetchLogs]);

  if (loading) return <div className="p-6">Loading logs…</div>;
  if (error)
    return (
      <div className="p-6 text-red-600">
        Error loading logs: {error.message}
      </div>
    );

  const logs: LogItem[] = data?.auditLogs ?? [];

  const columns: ColumnDef<LogItem>[] = [
    { accessorKey: "action", header: "Action" },
    { accessorKey: "userId", header: "User" },
    {
      accessorKey: "metadata",
      header: "Details",
      cell: ({ row }) => (
        <pre className="whitespace-pre-wrap text-sm">
          {JSON.stringify(row.original.metadata, null, 2)}
        </pre>
      ),
    },
    {
      accessorKey: "timestamp",
      header: "When",
      cell: ({ row }) => new Date(row.original.timestamp).toLocaleString(),
    },
  ];

  return (
    <div className="">
      <h1 className="text-2xl font-semibold">Audit Logs</h1>
      <DataTable
        data={logs}
        columns={columns}
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        initialState={{ pagination: { pageSize: 10 } }}
      />
    </div>
  );
}
