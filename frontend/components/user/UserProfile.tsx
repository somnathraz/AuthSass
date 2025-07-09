"use client";

import React, { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AvatarUpload } from "@/components/ui/file-upload";
import { AvatarGenerator } from "@/components/ui/avatar-generator";
import { SpinnerLoader, ButtonLoader } from "@/components/ui/loading";
import {
  User,
  Mail,
  Calendar,
  MapPin,
  Link,
  Shield,
  CheckCircle,
  Camera,
  Edit,
  Save,
  X
} from "lucide-react";

interface UserProfileData {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  location?: string;
  website?: string;
  avatar?: string;
  role: string;
  isVerified: boolean;
  joinedAt: string;
  lastLoginAt?: string;
}

interface UserProfileProps {
  user: UserProfileData;
  isOwner?: boolean;
  loading?: boolean;
  onUpdateProfile?: (data: Partial<UserProfileData>) => Promise<void>;
  onAvatarUpload?: (file: File) => Promise<string>;
}

export function UserProfile({
  user,
  isOwner = false,
  loading = false,
  onUpdateProfile,
  onAvatarUpload
}: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    bio: user.bio || "",
    location: user.location || "",
    website: user.website || ""
  });
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    if (!onUpdateProfile) return;
    
    setSaving(true);
    try {
      await onUpdateProfile(formData);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!onAvatarUpload) return;
    
    setAvatarUploading(true);
    try {
      await onAvatarUpload(file);
    } catch (error) {
      console.error("Failed to upload avatar:", error);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleAvatarSelect = async (avatarUrl: string) => {
    if (!onUpdateProfile) return;
    
    setAvatarUploading(true);
    try {
      await onUpdateProfile({ avatar: avatarUrl });
      setShowAvatarSelector(false);
    } catch (error) {
      console.error("Failed to update avatar:", error);
    } finally {
      setAvatarUploading(false);
    }
  };

  const getInitials = (firstName?: string, lastName?: string, username?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (username) {
      return username.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  const getDefaultAvatar = () => {
    const name = user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}` 
      : user.username;
    
    // Generate initials
    const words = (name || "User").trim().split(/\s+/);
    let initials;
    if (words.length >= 2) {
      initials = `${words[0][0]}${words[1][0]}`.toUpperCase();
    } else if (words[0] && words[0].length >= 2) {
      initials = words[0].substring(0, 2).toUpperCase();
    } else {
      initials = words[0]?.[0]?.toUpperCase() || 'U';
    }
    
    // Generate clean SVG avatar
    const svg = `
      <svg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <circle cx="40" cy="40" r="40" fill="#4ECDC4"/>
        <text x="40" y="50" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
              font-size="24" font-weight="600" text-anchor="middle" fill="#FFFFFF">${initials}</text>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <SpinnerLoader text="Loading profile..." />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user.avatar || getDefaultAvatar()} alt={user.username} />
                  <AvatarFallback className="text-xl">
                    {getInitials(user.firstName, user.lastName, user.username)}
                  </AvatarFallback>
                </Avatar>
                
                {isOwner && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                    onClick={() => setShowAvatarSelector(true)}
                    disabled={avatarUploading}
                  >
                    {avatarUploading ? (
                      <SpinnerLoader size="sm" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl font-bold">
                    {user.firstName && user.lastName 
                      ? `${user.firstName} ${user.lastName}` 
                      : user.username
                    }
                  </h1>
                  {user.isVerified && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                </div>
                <p className="text-muted-foreground">@{user.username}</p>
                <Badge variant="secondary" className="w-fit">
                  <Shield className="h-3 w-3 mr-1" />
                  {user.role}
                </Badge>
              </div>
            </div>
            
            {isOwner && (
              <Button
                variant={isEditing ? "destructive" : "outline"}
                size="sm"
                onClick={() => {
                  if (isEditing) {
                    setFormData({
                      firstName: user.firstName || "",
                      lastName: user.lastName || "",
                      bio: user.bio || "",
                      location: user.location || "",
                      website: user.website || ""
                    });
                  }
                  setIsEditing(!isEditing);
                }}
              >
                {isEditing ? (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Enhanced Avatar Selector Modal */}
      {showAvatarSelector && (
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Choose Profile Picture</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAvatarSelector(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>
              Upload a custom image or choose from AI-generated avatars
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-sm font-medium mb-3 block">Upload Custom Avatar</Label>
              <AvatarUpload
                currentAvatar={user.avatar}
                onAvatarChange={handleAvatarUpload}
              />
            </div>
            
            <Separator />
            
            <div>
              <Label className="text-sm font-medium mb-3 block">AI-Generated Avatars</Label>
              <AvatarGenerator
                seed={user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username}
                onAvatarSelect={handleAvatarSelect}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Your personal details and contact information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              {isEditing ? (
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  placeholder="Enter your first name"
                />
              ) : (
                <div className="flex items-center space-x-2 py-2 px-3 bg-muted rounded-md">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{user.firstName || "Not provided"}</span>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              {isEditing ? (
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  placeholder="Enter your last name"
                />
              ) : (
                <div className="flex items-center space-x-2 py-2 px-3 bg-muted rounded-md">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{user.lastName || "Not provided"}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="flex items-center space-x-2 py-2 px-3 bg-muted rounded-md">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{user.email}</span>
              {user.isVerified && (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            {isEditing ? (
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                placeholder="Tell us about yourself..."
                rows={3}
              />
            ) : (
              <div className="py-2 px-3 bg-muted rounded-md min-h-[80px]">
                <span className="text-sm">
                  {user.bio || "No bio provided"}
                </span>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              {isEditing ? (
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  placeholder="City, Country"
                />
              ) : (
                <div className="flex items-center space-x-2 py-2 px-3 bg-muted rounded-md">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{user.location || "Not provided"}</span>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              {isEditing ? (
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => handleInputChange("website", e.target.value)}
                  placeholder="https://yourwebsite.com"
                />
              ) : (
                <div className="flex items-center space-x-2 py-2 px-3 bg-muted rounded-md">
                  <Link className="h-4 w-4 text-muted-foreground" />
                  {user.website ? (
                    <a 
                      href={user.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {user.website}
                    </a>
                  ) : (
                    <span>Not provided</span>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {isEditing && (
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setFormData({
                    firstName: user.firstName || "",
                    lastName: user.lastName || "",
                    bio: user.bio || "",
                    location: user.location || "",
                    website: user.website || ""
                  });
                  setIsEditing(false);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveProfile} disabled={saving}>
                <ButtonLoader loading={saving} loadingText="Saving...">
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </ButtonLoader>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            Account details and activity information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Account Created</Label>
              <div className="flex items-center space-x-2 py-2 px-3 bg-muted rounded-md">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{new Date(user.joinedAt).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Last Login</Label>
              <div className="flex items-center space-x-2 py-2 px-3 bg-muted rounded-md">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {user.lastLoginAt 
                    ? new Date(user.lastLoginAt).toLocaleDateString()
                    : "Never"
                  }
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 