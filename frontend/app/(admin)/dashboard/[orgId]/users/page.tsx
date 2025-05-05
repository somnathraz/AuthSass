// src/app/dashboard/[orgId]/members/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { Trash } from "lucide-react";
import {
  useOrgMembers,
  useInviteOrgMember,
  useRemoveOrgMember,
} from "@/services/authService";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

type Role = "member" | "admin";
type RoleFilter = "all" | Role;

interface InviteModalProps {
  orgId: string;
  inviting: boolean;
  inviteFn: (orgId: string, email: string, role: Role) => Promise<void>;
  onSuccess: () => void;
}

function InviteModal({
  orgId,
  inviting,
  inviteFn,
  onSuccess,
}: InviteModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("member");

  const handleInvite = async () => {
    if (!email) {
      alert("Please enter an email address");
      return;
    }
    try {
      await inviteFn(orgId, email, role);
      setEmail("");
      onSuccess();
    } catch (err: unknown) {
      // Narrow `err` before reading `.message`
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert(String(err));
      }
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Invite</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Invite a Team Member</DialogTitle>
          <DialogDescription>
            Enter their email and role below.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          <Input
            placeholder="user@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />
          <Select value={role} onValueChange={(v) => setRole(v as Role)}>
            <SelectTrigger className="w-full">
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="member">Member</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter className="mt-4">
          <Button onClick={handleInvite} disabled={inviting}>
            {inviting ? "Inviting…" : "Send Invite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function OrgMembersPage() {
  const { orgId } = useParams<{ orgId: string }>();

  // 1) fetch joined members
  const {
    members,
    loading: loadingMembers,
    error: membersError,
    refetch: refetchMembers,
  } = useOrgMembers(orgId);

  // 2) hook to send an invite
  const { invite: rawInviteOrgMember, loading: inviting } =
    useInviteOrgMember();

  // wrap so it returns Promise<void>
  const inviteOrgMember = async (
    orgId: string,
    email: string,
    role: Role
  ): Promise<void> => {
    await rawInviteOrgMember(orgId, email, role);
  };

  // 3) hook to remove a member
  const { remove: rawRemoveOrgMember, loading: removing } =
    useRemoveOrgMember();

  // wrap so it returns Promise<void>
  const removeOrgMember = async (
    orgId: string,
    userId: string
  ): Promise<void> => {
    await rawRemoveOrgMember(orgId, userId);
  };

  // filters + search
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [rawSearch, setRawSearch] = useState("");
  const [search, setSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(rawSearch.trim().toLowerCase());
    }, 300);
    return () => clearTimeout(t);
  }, [rawSearch]);

  const filtered = useMemo(
    () =>
      members
        .filter((m) =>
          (m.username + " " + m.email).toLowerCase().includes(search)
        )
        .filter((m) => (roleFilter === "all" ? true : m.role === roleFilter)),
    [members, search, roleFilter]
  );

  if (loadingMembers) return <div>Loading members…</div>;
  if (membersError)
    return <div className="text-red-500">Error loading members</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Organization Members</h1>

      {/* filter bar + invite */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Search by name or email…"
            value={rawSearch}
            onChange={(e) => setRawSearch(e.target.value)}
            className="w-48"
          />
          <Select
            value={roleFilter}
            onValueChange={(v) => setRoleFilter(v as RoleFilter)}
          >
            <SelectTrigger className="w-32">
              {roleFilter === "all" ? "All Roles" : roleFilter}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="member">Member</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <InviteModal
          orgId={orgId}
          inviting={inviting}
          inviteFn={inviteOrgMember}
          onSuccess={() => {
            refetchMembers();
          }}
        />
      </div>

      {/* members table */}
      <div className="overflow-auto rounded border">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id} className="border-t">
                <td className="px-4 py-2">{m.username}</td>
                <td className="px-4 py-2">{m.email}</td>
                <td className="px-4 py-2">{m.role}</td>
                <td className="px-4 py-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={removing}
                    onClick={async () => {
                      if (!confirm("Remove this user?")) return;
                      await removeOrgMember(orgId, m.id);
                      refetchMembers();
                    }}
                  >
                    <Trash className="h-4 w-4 text-red-500" />
                  </Button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-8">
                  No results.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
