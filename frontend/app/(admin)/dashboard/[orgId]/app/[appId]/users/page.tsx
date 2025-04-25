// app/dashboard/[orgId]/users/page.tsx
"use client";

import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronDown, Filter } from "lucide-react";
import Link from "next/link";
import { CreateUserModal } from "@/components/CreateUserModal/CreateUserModal";

export default function UsersPage() {
  return (
    <div className="space-y-6 p-6">
      {/* Title & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold">Users</h1>
        <Tabs defaultValue="all" className="w-full sm:w-auto">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="invitations">Invitations</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-10" placeholder="Search" />
          </div>

          {/* Sort dropdown */}
          <Button
            variant="outline"
            size="sm"
            className="flex items-center space-x-1"
          >
            <span>Sort by: Created</span>
            <ChevronDown className="h-4 w-4" />
          </Button>

          {/* Filter */}
          <Button variant="outline" size="sm" className="p-2">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {/* Create user button */}
        <CreateUserModal />
      </div>

      {/* Empty state */}
      <div className="rounded-lg border bg-white p-8 flex flex-col items-center justify-center space-y-4">
        <div className="text-muted-foreground">
          <Search className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-medium">No users yet</h3>
        <p className="text-sm text-muted-foreground">
          Create a new user or learn how to{" "}
          <Link href="#" className="font-medium text-primary hover:underline">
            migrate existing users
          </Link>
        </p>
        <CreateUserModal />
      </div>
    </div>
  );
}
