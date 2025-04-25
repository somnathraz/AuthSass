import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Plus, ChevronDown, Settings, LogOut } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateOrg } from "@/services/authService";

interface Organization {
  id: string;
  name: string;
  imageUrl?: string;
}

interface User {
  name: string;
  email: string;
  image?: string;
}

interface NavbarProps {
  logoText: string;
  user: User;
  currentOrg: Organization;
  organizations: Organization[];
}

export function Navbar({
  logoText,
  user,
  currentOrg,
  organizations,
}: NavbarProps) {
  const router = useRouter();

  // Create Org modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const switchOrg = (org: Organization) => {
    router.push(`/dashboard?org=${org.id}`);
  };
  const goToAccount = () => {
    router.push("/account");
  };
  const signOut = async () => {
    await fetch("/api/auth/signout");
    // now client‐side navigate to /login (or let the redirect do it)
    router.push("/login");
  };
  const {
    createOrg,
    error: createError,
    loading: createLoading,
  } = useCreateOrg();

  const openCreate = () => {
    setError(null);
    setOrgName("");
    setLogoFile(null);
    setIsCreateOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) {
      setError("Organization name is required.");
      return;
    }
    setIsSubmitting(true);
    try {
      console.log("Creating organization:", { name: orgName, logo: logoFile });
      // TODO: call your createOrganization mutation
      await createOrg(orgName);
      setIsCreateOpen(false);
    } catch (err) {
      console.error(err);
      setError("Failed to create organization.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <nav className="w-full border-b bg-white px-6 py-3 flex items-center justify-between">
        {/* Logo + Org selector */}
        <div className="flex items-center space-x-6">
          <Link href="/" className="text-xl font-bold">
            {logoText}
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center">
                <Avatar className="mr-2 h-5 w-5">
                  {currentOrg.imageUrl ? (
                    <AvatarImage
                      src={currentOrg.imageUrl}
                      alt={currentOrg.name}
                    />
                  ) : (
                    <AvatarFallback>{currentOrg.name[0]}</AvatarFallback>
                  )}
                </Avatar>
                <span className="truncate text-sm">{currentOrg.name}</span>
                <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent side="bottom" align="start" className="w-64">
              {organizations.map((org) => (
                <DropdownMenuItem
                  key={org.id}
                  onSelect={() => switchOrg(org)}
                  className={`flex items-center justify-between
                    ${org.id === currentOrg.id ? "bg-gray-100" : ""}
                    hover:bg-gray-50`}
                >
                  <Avatar className="mr-2 h-5 w-5">
                    {org.imageUrl ? (
                      <AvatarImage src={org.imageUrl} alt={org.name} />
                    ) : (
                      <AvatarFallback>{org.name[0]}</AvatarFallback>
                    )}
                  </Avatar>
                  {org.name}
                </DropdownMenuItem>
              ))}

              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={openCreate}
                className="flex items-center"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create organization
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <div className="px-3 py-2 text-xs text-muted-foreground">
                Secured by SecureAuth
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="p-0">
              <Avatar className="h-8 w-8">
                {user.image ? (
                  <AvatarImage src={user.image} alt={user.name} />
                ) : (
                  <AvatarFallback>{user.name[0]}</AvatarFallback>
                )}
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="end" className="w-56">
            <div className="flex items-center space-x-3 px-4 py-3">
              <Avatar className="h-10 w-10">
                {user.image ? (
                  <AvatarImage src={user.image} alt={user.name} />
                ) : (
                  <AvatarFallback>{user.name[0]}</AvatarFallback>
                )}
              </Avatar>
              <div className="flex flex-col">
                <span className="font-medium">{user.name}</span>
                <span className="text-sm text-muted-foreground">
                  {user.email}
                </span>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={goToAccount}
              className="flex items-center"
            >
              <Settings className="mr-2 h-4 w-4" /> Manage account
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={signOut} className="flex items-center">
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>

      {/* Create Organization Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create organization</DialogTitle>
            <DialogDescription>Enter details below.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4">
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
            {/* local “name required” error */}
            {error && <p className="text-sm text-red-600">{error}</p>}
            {/* mutation error from the hook */}
            {createError && (
              <p className="text-sm text-red-600">{createError.message}</p>
            )}

            <DialogFooter>
              <Button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                disabled={isSubmitting || createLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting || createLoading
                  ? "Creating..."
                  : "Create organization"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
