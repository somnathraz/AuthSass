// src/components/ApplicationsView.tsx
"use client";

import React from "react";
import { useSearchParams, useRouter } from "next/navigation";
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

export function ApplicationsView() {
  const params = useSearchParams();
  const router = useRouter();
  const orgId = params.get("org") ?? "personal";

  const { apps, loading, error, refetch } = useFetchApp(orgId);

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
        {/* “Create application” card now lives inside CreateAppModal */}
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

        {/* if no apps */}
        {apps.length === 0 && (
          <div className="col-span-full text-center text-gray-500">
            No applications yet.
          </div>
        )}

        {/* list your apps */}
        {apps.map((app) => (
          <Card
            key={app.id}
            className="flex flex-col h-48 cursor-pointer"
            onClick={() => router.push(`/dashboard/${orgId}/app/${app.id}`)}
          >
            <CardHeader>
              <CardTitle className="truncate">{app.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 text-sm text-muted-foreground">
              {app.description ?? <em>No description</em>}
            </CardContent>
            <CardFooter className="flex justify-between items-center">
              <span className="text-xs text-gray-400">
                {new Date(
                  typeof app.createdAt === "number"
                    ? app.createdAt
                    : Number(app.createdAt)
                ).toLocaleDateString()}
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
