"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserPlus, Loader2, CheckCircle, AlertCircle, Search } from "lucide-react";

// Import organization service
import {
  useAddOrganizationMember,
  type AddMemberInput,
  type Role,
} from "@/services/organization.service";

// Import user service for user search
import { useSearchUsers } from "@/services/user.service";

// Import user types
import { type User } from "@/graphql/user.queries";

// Form validation schema
const addMemberSchema = z.object({
  userId: z.string().min(1, "Please select a user"),
  role: z.enum(["ADMIN", "MEMBER"]),
});

type AddMemberFormData = z.infer<typeof addMemberSchema>;

interface AddMemberFormProps {
  organizationId: string;
  organizationName?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

export function AddMemberForm({
  organizationId,
  organizationName,
  onSuccess,
  onCancel,
  className,
}: AddMemberFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Add member hook
  const { addOrganizationMember, loading } = useAddOrganizationMember();

  // User search hook
  const { search: searchUsers, data: searchResults, loading: searchLoading } = useSearchUsers();

  // Form setup
  const form = useForm<AddMemberFormData>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: {
      userId: "",
      role: "MEMBER",
    },
  });

  // Handle user search
  const handleUserSearch = async (searchTerm: string) => {
    setUserSearchTerm(searchTerm);
    if (searchTerm.length >= 2) {
      try {
        await searchUsers(searchTerm, { limit: 10 });
      } catch (error) {
        console.error("User search error:", error);
      }
    }
  };

  // Handle user selection
  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    form.setValue("userId", user.id);
    setUserSearchTerm(user.username);
  };

  // Handle form submission
  const onSubmit = async (data: AddMemberFormData) => {
    try {
      setSubmitError(null);
      setSubmitSuccess(false);

      // Prepare input data
      const input: AddMemberInput = {
        orgId: organizationId,
        userId: data.userId,
        role: data.role as Role,
      };

      // Add member to organization
      const response = await addOrganizationMember(input);

      if (response.data?.addOrganizationMember.success) {
        setSubmitSuccess(true);
        form.reset();
        setSelectedUser(null);
        setUserSearchTerm("");
        
        // Call success callback
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error: unknown) {
      console.error("Add member error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to add member. Please try again.";
      setSubmitError(errorMessage);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <UserPlus className="w-5 h-5" />
          <span>Add Member</span>
        </CardTitle>
        <CardDescription>
          {organizationName 
            ? `Add a new member to ${organizationName}`
            : "Add a new member to the organization"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Success Message */}
        {submitSuccess && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Member added successfully! They now have access to the organization.
            </AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {submitError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* User Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search User</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by username or email..."
                  value={userSearchTerm}
                  onChange={(e) => handleUserSearch(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                />
                {searchLoading && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin" />
                )}
              </div>
              
              {/* Search Results */}
              {searchResults && userSearchTerm.length >= 2 && !selectedUser && (
                <div className="border rounded-md max-h-48 overflow-y-auto">
                  {searchResults.users.length === 0 ? (
                    <div className="p-3 text-center text-gray-500 text-sm">
                      No users found matching &quot;{userSearchTerm}&quot;
                    </div>
                  ) : (
                    searchResults.users.map((user: User) => (
                      <div
                        key={user.id}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                        onClick={() => handleUserSelect(user)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {user.username.substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">{user.username}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                            {user.fullName && (
                              <div className="text-sm text-gray-500">{user.fullName}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Selected User */}
              {selectedUser && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {selectedUser.username.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">{selectedUser.username}</div>
                        <div className="text-sm text-gray-600">{selectedUser.email}</div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(null);
                        setUserSearchTerm("");
                        form.setValue("userId", "");
                      }}
                    >
                      Change
                    </Button>
                  </div>
                </div>
              )}

              <p className="text-sm text-gray-500">
                Search for users by username or email address to add them to the organization.
              </p>
            </div>

            {/* Member Role */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Member Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select member role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="VIEWER">
                        <div className="space-y-1">
                          <div className="font-medium">Viewer</div>
                          <div className="text-sm text-gray-500">Can view organization and apps</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="MEMBER">
                        <div className="space-y-1">
                          <div className="font-medium">Member</div>
                          <div className="text-sm text-gray-500">Can view and manage apps</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="ADMIN">
                        <div className="space-y-1">
                          <div className="font-medium">Admin</div>
                          <div className="text-sm text-gray-500">Can manage organization and members</div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose the appropriate role for this member based on their responsibilities.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Role Permissions Info */}
            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
              <h4 className="font-medium text-sm">Role Permissions:</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <div><strong>Viewer:</strong> Read-only access to organization and applications</div>
                <div><strong>Member:</strong> Can create and manage applications, view organization</div>
                <div><strong>Admin:</strong> Full access to manage organization, members, and applications</div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="submit"
                disabled={loading || !selectedUser}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding Member...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Member
                  </>
                )}
              </Button>
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 