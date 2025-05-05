// src/components/CreateOrgModal/CreateOrgModal.tsx
"use client";

import React, { useState } from "react";
import { useCreateOrg } from "@/services/authService";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface CreateOrgModalProps {
  /** The element that, when clicked, should open the modal */
  trigger: React.ReactNode;
  /** Optional callback after a successful creation */
  onCreated?: () => void;
}

export function CreateOrgModal({ trigger, onCreated }: CreateOrgModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    createOrg,
    error: createError,
    loading: createLoading,
  } = useCreateOrg();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) {
      setError("Organization name is required.");
      return;
    }
    setIsSubmitting(true);
    try {
      console.log("Creating organization:", { name: orgName, logo: logoFile });
      await createOrg(orgName);
      setIsOpen(false);
      onCreated?.();
    } catch {
      setError("Failed to create organization.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {/* This wraps your trigger node so clicking it opens the modal */}
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create organization</DialogTitle>
          <DialogDescription>Enter details below.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="logo">Logo (optional)</Label>
            <Input
              id="logo"
              type="file"
              accept="image/*"
              onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="orgName">Name</Label>
            <Input
              id="orgName"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Validation or mutation errors */}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {createError && (
            <p className="text-sm text-red-600">{createError.message}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting || createLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || createLoading}>
              {isSubmitting || createLoading ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
