// src/app/dashboard/[orgId]/members/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { Trash } from "lucide-react";

import {
  useGetOrgMembers,
  useGetOrgInvitations,
  useInviteOrganizationMember,
  useRemoveOrganizationMember,
  useCancelOrgInvitation,
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
import { ErrorModal } from "@/components/ErrorModal/ErrorModal";

type Role = "member" | "admin";
type RoleFilter = "all" | Role;

type FlatMember = {
  id: string;
  username: string;
  email: string;
  role: Role;
  status: "joined" | "pending";
};

interface InviteModalProps {
  orgId: string;
  inviting: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inviteFn: (orgId: string, email: string, role: Role) => Promise<void>;
  onSuccess: () => void;
}

function InviteModal({
  orgId,
  inviting,
  open,
  onOpenChange,
  inviteFn,
  onSuccess,
}: InviteModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("member");
  const [errorMsg, setErrorMsg] = useState("");
  const [errorOpen, setErrorOpen] = useState(false);

  const handleInvite = async () => {
    if (!email.trim()) {
      setErrorMsg("Please enter an email");
      setErrorOpen(true);
      return;
    }
    try {
      await inviteFn(orgId, email.trim(), role);
      onSuccess();
      onOpenChange(false);
      setEmail("");
      setRole("member");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e) || "Invite failed";
      setErrorMsg(msg);
      setErrorOpen(true);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
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

      <ErrorModal
        open={errorOpen}
        onOpenChange={setErrorOpen}
        message={errorMsg}
      />
    </>
  );
}

export default function OrgMembersPage() {
  const { orgId } = useParams<{ orgId: string }>();

  // 1) joined members
  const {
    owner,
    members: svcMembers,
    loading: loadingMembers,
    error: membersError,
    refetch: refetchMembers,
  } = useGetOrgMembers(orgId);

  // 2) pending invites
  const {
    invitations: pendingInvites,
    loading: loadingInvites,
    refetch: refetchInvites,
  } = useGetOrgInvitations(orgId);

  // 3) Invite / Remove / Cancel hooks
  const { inviteOrgMember, loading: inviting } = useInviteOrganizationMember();
  const { remove: removeOrgMember, loading: removing } =
    useRemoveOrganizationMember();
  const { cancelOrgInvitation, loading: canceling } = useCancelOrgInvitation();

  // error modal state
  const [errorMsg, setErrorMsg] = useState("");
  const [errorOpen, setErrorOpen] = useState(false);

  // dialog open
  const [inviteOpen, setInviteOpen] = useState(false);

  // search + filter
  const [rawSearch, setRawSearch] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  useEffect(() => {
    const id = setTimeout(() => setSearch(rawSearch.trim().toLowerCase()), 300);
    return () => clearTimeout(id);
  }, [rawSearch]);

  // flatten + dedupe
  const allMembers = useMemo<FlatMember[]>(() => {
    const list: FlatMember[] = [];
    if (owner) {
      list.push({
        id: owner.id,
        username: owner.username,
        email: owner.email,
        role: "admin",
        status: "joined",
      });
    }
    svcMembers.forEach((m) =>
      list.push({
        id: m.id,
        username: m.username,
        email: m.email,
        role: m.role as Role,
        status: "joined",
      })
    );
    pendingInvites.forEach((inv) =>
      list.push({
        id: inv.id,
        username: "",
        email: inv.email,
        role: inv.role as Role,
        status: "pending",
      })
    );
    return Array.from(new Map(list.map((m) => [m.id + m.status, m])).values());
  }, [owner, svcMembers, pendingInvites]);

  const filtered = useMemo(() => {
    return allMembers
      .filter((m) => `${m.username} ${m.email}`.toLowerCase().includes(search))
      .filter((m) => (roleFilter === "all" ? true : m.role === roleFilter));
  }, [allMembers, search, roleFilter]);

  if (loadingMembers || loadingInvites)
    return <div>Loading organization members…</div>;
  if (membersError) {
    return (
      <>
        <div className="text-red-500">Error loading members</div>
        <ErrorModal
          open={true}
          onOpenChange={() => {}}
          message={membersError.message}
        />
      </>
    );
  }

  const handleAction = async (m: FlatMember) => {
    try {
      if (m.status === "joined") {
        if (m.id === owner?.id) {
          throw new Error("You cannot remove the owner.");
        }
        await removeOrgMember(orgId, m.id);
      } else {
        await cancelOrgInvitation(m.id);
      }
      refetchMembers();
      refetchInvites();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e) || "Action failed";
      setErrorMsg(msg || "Action failed");
      setErrorOpen(true);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Organization Members</h1>

      <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Search…"
            value={rawSearch}
            onChange={(e) => setRawSearch(e.target.value)}
            className="w-48"
          />
          <Select
            value={roleFilter}
            onValueChange={(v) => setRoleFilter(v as RoleFilter)}
          >
            <SelectTrigger className="w-32">
              {roleFilter === "all"
                ? "All Roles"
                : roleFilter.charAt(0).toUpperCase() + roleFilter.slice(1)}
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
          open={inviteOpen}
          onOpenChange={setInviteOpen}
          inviteFn={(o, e, r) =>
            inviteOrgMember({ orgId: o, email: e, role: r }).then(() => {})
          }
          onSuccess={() => {
            refetchMembers();
            refetchInvites();
          }}
        />
      </div>

      <div className="overflow-auto rounded border">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={`${m.id}-${m.status}`} className="border-t">
                <td className="px-4 py-2">{m.username || "—"}</td>
                <td className="px-4 py-2">{m.email}</td>
                <td className="px-4 py-2">{m.role}</td>
                <td className="px-4 py-2 capitalize">{m.status}</td>
                <td className="px-4 py-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={removing || canceling}
                    onClick={() => handleAction(m)}
                  >
                    <Trash className="h-4 w-4 text-red-500" />
                  </Button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8">
                  No results.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ErrorModal
        open={errorOpen}
        onOpenChange={setErrorOpen}
        message={errorMsg}
      />
    </div>
  );
}
