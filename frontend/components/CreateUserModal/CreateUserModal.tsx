// src/components/users/CreateUserModal.tsx
"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAdminCreateUser, useInviteUser } from "@/services/authService";

type Mode = "create" | "invite";

export function CreateUserModal() {
  const { appId } = useParams<{ appId: string }>();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("create");

  const [email, setEmail] = useState("");

  const { adminCreateUser } = useAdminCreateUser();
  const { inviteUser } = useInviteUser();

  const handleCreate = async () => {
    try {
      // Admin-create user (+ temp pass + auto-add to this app)
      await adminCreateUser(appId, email, "member");

      // reset + close
      setEmail("");

      setOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert("Error creating user: " + msg);
    }
  };

  const handleInvite = async () => {
    try {
      // Send invite link (whether or not user exists)
      await inviteUser(appId, email, "member");
      setEmail("");
      setOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert("Error sending invite: " + msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create user</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>Create new user</span>
            <Badge variant="outline">Development</Badge>
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Admin-create a user with a temporary password, email it, and add them to this app."
              : "Invite an existing user to join the app via magic link."}
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={mode}
          onValueChange={(v) => setMode(v as Mode)}
          className="mt-4"
        >
          <TabsList>
            <TabsTrigger value="create">Create User</TabsTrigger>
            <TabsTrigger value="invite">Invite User</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="mt-4">
            <div className="grid gap-4">
              <div className="grid grid-cols-2 items-center gap-4">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="invite" className="mt-4">
            <div className="grid gap-4">
              <div className="grid grid-cols-2 items-center gap-4">
                <Label htmlFor="inviteEmail">Email</Label>
                <Input
                  id="inviteEmail"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6 flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={mode === "create" ? handleCreate : handleInvite}>
            {mode === "create" ? "Create & Email Temp Pass" : "Send Invite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
