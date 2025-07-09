"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  UserPlus, 
  Shield, 
  Code, 
  Eye, 
  Loader2,
  AlertCircle,
  CheckCircle,
  Mail,
  Info,
} from "lucide-react";

import {
  Role,
} from "@/graphql/app.queries";

interface AddAppMemberFormProps {
  applicationId: string;
  applicationName?: string;
  organizationId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

export function AddAppMemberForm({
  applicationId,
  applicationName,
  organizationId,
  onSuccess,
  onCancel,
  className,
}: AddAppMemberFormProps) {
  const [formData, setFormData] = useState({
    email: "",
    role: Role.MEMBER,
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (formData.message && formData.message.length > 250) {
      newErrors.message = "Message must be less than 250 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    // TODO: Implement proper invitation backend endpoint
    try {
      // Simulate loading for demo purposes
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Show info message that backend needs implementation
      setErrors({ 
        general: "Email invitation feature needs backend implementation. This would send a magic link to join the application." 
      });
    } catch (error) {
      console.error("Failed to invite app member:", error);
      setErrors({ general: "Failed to send invitation. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: "",
      role: Role.MEMBER,
      message: "",
    });
    setErrors({});
  };

  // Helper functions for role display
  const getRoleDescription = (role: Role) => {
    switch (role) {
      case Role.ADMIN:
        return "Full application management access";
      case Role.MEMBER:
        return "Can modify data and generate API keys";
      case Role.VIEWER:
        return "Read-only access to application data";
      default:
        return "Standard member access";
    }
  };

  const getRoleBadgeColor = (role: Role) => {
    switch (role) {
      case Role.ADMIN:
        return "bg-red-100 text-red-800 border-red-200";
      case Role.MEMBER:
        return "bg-blue-100 text-blue-800 border-blue-200";
      case Role.VIEWER:
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <UserPlus className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-xl">Invite Team Member</CardTitle>
            <CardDescription>
              Send an invitation to join <span className="font-medium">{applicationName}</span>. They'll receive a magic link to get started.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Backend Implementation Notice */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Email Invitation System</h4>
              <p className="text-sm text-blue-700 mt-1">
                This form demonstrates the improved UI for email-based app member invitations. 
                The backend needs an <code className="bg-blue-100 px-1 rounded">inviteAppMember</code> mutation 
                to send magic link invitations (similar to organization invitations).
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleInvite} className="space-y-6">
          {/* Email Address */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email Address <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="colleague@company.com"
              className={`h-11 ${errors.email ? "border-red-500" : ""}`}
              autoFocus
            />
            {errors.email && (
              <p className="text-sm text-red-600 flex items-center space-x-1">
                <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                  <span className="text-white text-xs">!</span>
                </div>
                <span>{errors.email}</span>
              </p>
            )}
            <p className="text-xs text-gray-500">
              We'll send them a magic link to join the application
            </p>
          </div>

          {/* Application Role */}
          <div className="space-y-2">
            <Label htmlFor="role" className="text-sm font-medium text-gray-700">
              Application Role <span className="text-red-500">*</span>
            </Label>
            <Select 
              value={formData.role} 
              onValueChange={(value: Role) => 
                setFormData(prev => ({ ...prev, role: value }))
              }
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select application role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Role.VIEWER}>
                  <div className="flex items-center space-x-3 py-2">
                    <span className="text-lg">👁️</span>
                    <div>
                      <div className="font-medium">Viewer</div>
                      <div className="text-xs text-gray-500">Read-only access to application data</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value={Role.MEMBER}>
                  <div className="flex items-center space-x-3 py-2">
                    <span className="text-lg">👨‍💻</span>
                    <div>
                      <div className="font-medium">Member</div>
                      <div className="text-xs text-gray-500">Can modify data and generate API keys</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value={Role.ADMIN}>
                  <div className="flex items-center space-x-3 py-2">
                    <span className="text-lg">🛡️</span>
                    <div>
                      <div className="font-medium">Admin</div>
                      <div className="text-xs text-gray-500">Full application management access</div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span className="text-lg">
                {formData.role === Role.ADMIN ? '🛡️' : formData.role === Role.MEMBER ? '👨‍💻' : '👁️'}
              </span>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(formData.role)}`}>
                {formData.role}
              </span>
            </div>
          </div>

          {/* Personal Message (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="message" className="text-sm font-medium text-gray-700">
              Personal Message
            </Label>
            <textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Add a personal note to the invitation..."
              rows={3}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                errors.message ? "border-red-500" : ""
              }`}
            />
            {errors.message && (
              <p className="text-sm text-red-600 flex items-center space-x-1">
                <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                  <span className="text-white text-xs">!</span>
                </div>
                <span>{errors.message}</span>
              </p>
            )}
            <p className="text-xs text-gray-500">
              {formData.message?.length || 0}/250 characters
            </p>
          </div>

          {/* Role Preview */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start space-x-3">
              <span className="text-xl">
                {formData.role === Role.ADMIN ? '🛡️' : formData.role === Role.MEMBER ? '👨‍💻' : '👁️'}
              </span>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium text-sm">
                    {formData.role} Permissions
                  </h4>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(formData.role)}`}>
                    {formData.role}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {getRoleDescription(formData.role)}
                </p>
              </div>
            </div>
          </div>

          {/* Ready to Invite Preview */}
          {formData.email && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2 text-green-800">
                <Mail className="w-4 h-4" />
                <span className="text-sm font-medium">Ready to invite</span>
              </div>
              <div className="mt-2 text-sm text-green-700">
                <div><strong>Email:</strong> {formData.email}</div>
                <div><strong>Application:</strong> {applicationName}</div>
                <div><strong>Role:</strong> {formData.role}</div>
                {formData.message && (
                  <div><strong>Message:</strong> "{formData.message.substring(0, 50)}{formData.message.length > 50 ? '...' : ''}"</div>
                )}
              </div>
            </div>
          )}

          {/* Error/Info Display */}
          {errors.general && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-700 flex items-center space-x-1">
                <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-white text-xs">i</span>
                </div>
                <span>{errors.general}</span>
              </p>
            </div>
          )}

          {/* Form Actions */}
          <Separator />
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 h-11"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.email.trim()}
              className="flex-1 h-11"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending Invitation...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Demo Invitation
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 