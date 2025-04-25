"use client";

import React from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function CreateUserModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="default">Create user</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>Create new user</span>
            <Badge variant="outline">Development</Badge>
          </DialogTitle>
          <DialogDescription>
            Create a new user or invite a user to join your organization.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="create" className="mt-4">
          <TabsList>
            <TabsTrigger value="create">Create User</TabsTrigger>
            <TabsTrigger value="invite">Invite User</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="mt-4">
            <div className="grid gap-4">
              <div className="grid grid-cols-2 items-center gap-4">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="name@example.com" />
              </div>
              <div className="grid grid-cols-2 items-center gap-4">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" />
              </div>
              <div className="grid grid-cols-[auto_1fr] items-start gap-4">
                <Checkbox id="ignore" className="mt-1" />
                <div className="space-y-1">
                  <Label htmlFor="ignore">Ignore password policies</Label>
                  <p className="text-sm text-muted-foreground">
                    If checked, password policies will not be enforced on this
                    password.
                  </p>
                </div>
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
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6 flex justify-end space-x-2">
          <Button variant="outline">Cancel</Button>
          <Button>Create user</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
