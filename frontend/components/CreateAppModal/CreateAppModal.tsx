// src/components/CreateAppModal.tsx
"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useCreateApp } from "@/services/authService";

export function CreateAppModal({
  trigger,
  onCreated,
}: {
  /** Any React node you want to use to open the modal */
  trigger: React.ReactNode;
  /** Called after a successful create so parent can refetch */
  onCreated: () => void;
}) {
  const params = useParams<{ orgId: string }>();
  const rawOrg = params.orgId;
  const orgId = Array.isArray(rawOrg) ? rawOrg[0] : rawOrg ?? "personal";

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { createApp, loading, error: createError } = useCreateApp(orgId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    setError(null);

    await createApp(name, description);

    if (!createError) {
      setOpen(false);
      setName("");
      setDescription("");
      onCreated();
    }
  };

  return (
    <>
      <div onClick={() => setOpen(true)}>{trigger}</div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create application</DialogTitle>
            <DialogDescription>Enter a name & description.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="appName">Name</Label>
              <Input
                id="appName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="appDesc">Description</Label>
              <Textarea
                id="appDesc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1"
              />
            </div>
            {(error || createError) && (
              <p className="text-sm text-red-600">
                {error ?? createError?.message}
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating…" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
