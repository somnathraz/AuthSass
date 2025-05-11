"use client";

import React, { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronDown, Filter, Trash } from "lucide-react";
import { CreateUserModal } from "@/components/CreateUserModal/CreateUserModal";
import {
  useAppMembers,
  useRemoveAppMember,
  useCancelInvite,
  useGetOrgMembers,
  useUserAndOrg,
} from "@/services/authService";
import { ErrorModal } from "@/components/ErrorModal/ErrorModal";

export default function UsersPage() {
  const { orgId, appId } = useParams<{ orgId: string; appId: string }>();
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { user: me } = useUserAndOrg(); // add this near top of component
  const currentUserId = me?.id;
  const currentUserRole = me?.role; // typically 'admin' | 'member' etc.
  // 1) load app members + invites
  const {
    members: rawAppMembers,
    loading,
    error,
    refetch,
  } = useAppMembers(appId!, orgId!);

  // 2) load org members
  const {
    members: orgMembersRaw,
    // optional if you want to highlight owner
    loading: orgLoading,
    error: orgError,
  } = useGetOrgMembers(orgId!);

  // 3) build a merged list with `source` flag
  const mergedMembers = useMemo(() => {
    // map app members/invites
    const appList = rawAppMembers.map((m) => ({
      ...m,
      source: "app" as const,
    }));
    // set of IDs already in app
    const appIds = new Set(appList.map((m) => m.id));
    // map org members (exclude owner if you like)
    const orgList = orgMembersRaw
      .filter((m) => !appIds.has(m.id))
      .map((m) => ({
        id: m.id,
        username: m.username,
        email: m.email,
        role: m.role,
        status: "joined" as const,
        source: "org" as const,
      }));
    return [...appList, ...orgList];
  }, [rawAppMembers, orgMembersRaw]);

  // 4) member-type filter state
  const [memberFilter, setMemberFilter] = useState<"all" | "app" | "org">(
    "all"
  );

  // 5) filtered list
  const displayMembers = useMemo(() => {
    if (memberFilter === "all") return mergedMembers;
    return mergedMembers.filter((m) => m.source === memberFilter);
  }, [mergedMembers, memberFilter]);

  const { removeAppMember, loading: removing } = useRemoveAppMember();
  const { cancelInvite, loading: cancelling } = useCancelInvite();

  const handleRemove = async (userId: string) => {
    if (!me) return;

    if (userId === currentUserId) {
      setErrorMessage("You cannot remove yourself.");
      return setErrorModalOpen(true);
    }

    if (currentUserRole !== "admin") {
      setErrorMessage("Only admins can remove users.");
      return setErrorModalOpen(true);
    }

    if (!confirm("Remove this user from the app?")) return;

    try {
      await removeAppMember(appId!, userId);
      refetch();
    } catch (err: unknown) {
      let message = "Failed to remove user.";
      if (err instanceof Error) {
        message = err.message;
      } else if (typeof err === "string") {
        message = err;
      }
      setErrorMessage(message);
      setErrorModalOpen(true);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    if (!me) return;

    if (currentUserRole !== "admin") {
      setErrorMessage("Only admins can cancel invitations.");
      return setErrorModalOpen(true);
    }

    if (!confirm("Cancel this invitation?")) return;

    try {
      await cancelInvite(inviteId);
      refetch();
    } catch (err: unknown) {
      let message = "Failed to remove user.";
      if (err instanceof Error) {
        message = err.message;
      } else if (typeof err === "string") {
        message = err;
      }
      setErrorMessage(message);
      setErrorModalOpen(true);
    }
  };

  if (loading || orgLoading) return <div>Loading users…</div>;
  if (error || orgError)
    return <div className="text-red-500">Error loading users.</div>;

  const hasUsers = displayMembers.length > 0;

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

      {/* Controls (search, sort, filter, member-type selector) */}
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
          {/* ← NEW: member-type filter */}
          <Select
            value={memberFilter}
            onValueChange={(v) => setMemberFilter(v as "all" | "app" | "org")}
          >
            <SelectTrigger className="w-40">
              {memberFilter === "all"
                ? "All Members"
                : memberFilter === "app"
                ? "App Members"
                : "Org Members"}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Members</SelectItem>
              <SelectItem value="app">App Members</SelectItem>
              <SelectItem value="org">Org Members</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <CreateUserModal />
      </div>

      {hasUsers ? (
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
            {displayMembers.map(
              ({ id, email, username, role, status, source }) => (
                <tr key={id} className="border-t">
                  <td className="px-4 py-2">{username || <em>—</em>}</td>
                  <td className="px-4 py-2">{email}</td>
                  <td className="px-4 py-2">{role}</td>
                  <td
                    className={`
                    px-4 py-2
                    ${
                      status === "joined" ? "text-green-600" : "text-yellow-600"
                    }
                  `}
                  >
                    {status === "joined" ? "Joined" : "Pending"}{" "}
                    <span className="ml-2 text-xs italic">
                      ({source === "app" ? "App" : "Org"})
                    </span>
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
              )
            )}
          </tbody>
        </table>
      ) : (
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
      <ErrorModal
        open={errorModalOpen}
        onOpenChange={setErrorModalOpen}
        message={errorMessage}
      />
    </div>
  );
}
