"use client";

import React from "react";
import { useParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronDown, Filter, Trash } from "lucide-react";
import Link from "next/link";
import { CreateUserModal } from "@/components/CreateUserModal/CreateUserModal";
import {
  useAppMembers,
  useCancelInvite,
  useRemoveAppMember,
} from "@/services/authService";

export default function UsersPage() {
  // grab the dynamic [appId] from the route
  const { orgId, appId } = useParams<{ orgId: string; appId: string }>();
  const { members, loading, error, refetch } = useAppMembers(appId, orgId);
  const { removeAppMember, loading: removing } = useRemoveAppMember();
  const { cancelInvite, loading: cancelling } = useCancelInvite();

  const handleRemove = async (userId: string) => {
    if (!confirm("Remove this user from the app?")) return;
    await removeAppMember(appId, userId);
    refetch();
  };
  const handleCancelInvite = async (inviteId: string) => {
    if (!confirm("Cancel this invitation?")) return;
    await cancelInvite(inviteId);
    refetch();
  };
  if (loading) return <div>Loading users…</div>;
  if (error) return <div className="text-red-500">Error loading users.</div>;

  const hasUsers = members.length > 0;

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
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-10" placeholder="Search" />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center space-x-1"
          >
            <span>Sort by: Created</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="p-2">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
        <CreateUserModal />
      </div>

      {hasUsers ? (
        // Render a simple table of users

        <table className="w-full table-auto border-collapse">
          <thead>
            <tr>
              <th className="text-left px-4 py-2">User</th>
              <th className="text-left px-4 py-2">Email</th>
              <th className="text-left px-4 py-2">Role</th>
              <th className="text-left px-4 py-2">Status</th>
              <th className="px-4 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {members.map(({ id, email, username, role, status }) => (
              <tr key={id} className="border-t">
                <td className="px-4 py-2">{username || <em>—</em>}</td>
                <td className="px-4 py-2">{email}</td>
                <td className="px-4 py-2">{role}</td>
                <td
                  className={`
          px-4 py-2
          ${status === "joined" ? "text-green-600" : "text-yellow-600"}
        `}
                >
                  {status === "joined" ? "Joined" : "Pending"}
                </td>
                <td className="px-4 py-2 text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={removing || cancelling}
                    onClick={() =>
                      status === "joined"
                        ? handleRemove(id)
                        : handleCancelInvite(id)
                    }
                  >
                    <Trash className="h-4 w-4 text-red-500" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        // Empty state
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
      )}
    </div>
  );
}
