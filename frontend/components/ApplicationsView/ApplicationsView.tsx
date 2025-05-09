// src/components/ApplicationsView.tsx
"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useFetchApp } from "@/services/authService";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreateAppModal } from "../CreateAppModal/CreateAppModal";
import { Badge } from "@/components/ui/badge";

export function ApplicationsView() {
  const { orgId } = useParams<{ orgId: string }>();
  const router = useRouter();

  const { apps, loading, error, refetch } = useFetchApp(orgId);
  console.log(apps);

  if (loading) return <div className="p-4">Loading applications…</div>;
  if (error)
    return (
      <div className="p-4 text-red-600">
        Error fetching apps: {error.message}
      </div>
    );

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Applications</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* “Create application” trigger */}
        <CreateAppModal
          trigger={
            <Card className="border-dashed border-2 border-gray-300 hover:border-gray-400 cursor-pointer">
              <div className="flex h-48 flex-col items-center justify-center text-gray-500 hover:text-gray-700">
                <Plus className="h-6 w-6 mb-2" />
                <span>Create application</span>
              </div>
            </Card>
          }
          onCreated={() => refetch()}
        />

        {apps.length === 0 && (
          <div className="col-span-full text-center text-gray-500">
            No applications yet.
          </div>
        )}

        {apps.map((app) => (
          <Card
            key={app.id}
            className="flex flex-col h-48 cursor-pointer"
            onClick={() => router.push(`/dashboard/${orgId}/app/${app.id}`)}
          >
            <CardHeader className="flex justify-between items-start">
              <CardTitle className="truncate">{app.name}</CardTitle>
              <Badge
                variant={app.status === "pending" ? "outline" : "secondary"}
              >
                {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
              </Badge>
            </CardHeader>

            <CardContent className="flex-1 text-sm text-muted-foreground">
              {app.description ?? <em>No description</em>}
            </CardContent>

            <CardFooter className="flex justify-between items-center">
              <span className="text-xs text-gray-400">
                {new Date(app.createdAt).toLocaleDateString()}
              </span>
              <Button
                variant="link"
                size="sm"
                onClick={() => router.push(`/dashboard/${orgId}/app/${app.id}`)}
              >
                View →
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
