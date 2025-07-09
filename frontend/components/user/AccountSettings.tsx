"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { ButtonLoader } from "@/components/ui/loading";
import {
  Shield,
  Lock,
  Mail,
  Bell,
  CreditCard,
  Smartphone,
  Eye,
  EyeOff,
  Key,
  Download,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Settings,
  Globe,
  Moon,
  Sun
} from "lucide-react";

interface SecuritySettings {
  twoFactorEnabled: boolean;
  emailNotifications: boolean;
  securityAlerts: boolean;
  loginNotifications: boolean;
  marketingEmails: boolean;
}

interface AccountSettingsProps {
  user: {
    id: string;
    email: string;
    username: string;
    isEmailVerified: boolean;
    role: string;
    createdAt: string;
  };
  securitySettings: SecuritySettings;
  onUpdatePassword?: (currentPassword: string, newPassword: string) => Promise<void>;
  onUpdateEmail?: (newEmail: string, password: string) => Promise<void>;
  onUpdateSecuritySettings?: (settings: Partial<SecuritySettings>) => Promise<void>;
  onDeactivateAccount?: (password: string, reason: string) => Promise<void>;
  onDeleteAccount?: (confirmation: string, password: string) => Promise<void>;
  onExportData?: () => Promise<void>;
  onEnable2FA?: () => Promise<void>;
  onDisable2FA?: (password: string) => Promise<void>;
}

export function AccountSettings({
  user,
  securitySettings,
  onUpdatePassword,
  onUpdateEmail,
  onUpdateSecuritySettings,
  onDeactivateAccount,
  onDeleteAccount,
  onExportData,
  onEnable2FA,
  onDisable2FA
}: AccountSettingsProps) {
  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordChanging, setPasswordChanging] = useState(false);

  // Email change state
  const [emailForm, setEmailForm] = useState({
    newEmail: "",
    password: ""
  });
  const [emailChanging, setEmailChanging] = useState(false);

  // 2FA state
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);

  // Account deletion state
  const [deleteForm, setDeleteForm] = useState({
    confirmation: "",
    password: ""
  });
  const [deleting, setDeleting] = useState(false);

  // Preferences state
  const [preferences, setPreferences] = useState({
    theme: "light",
    language: "en",
    timezone: "UTC"
  });

  const handlePasswordChange = async () => {
    if (!onUpdatePassword) return;
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("New passwords don't match");
      return;
    }

    setPasswordChanging(true);
    try {
      await onUpdatePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      console.error("Failed to change password:", error);
    } finally {
      setPasswordChanging(false);
    }
  };

  const handleEmailChange = async () => {
    if (!onUpdateEmail) return;
    
    setEmailChanging(true);
    try {
      await onUpdateEmail(emailForm.newEmail, emailForm.password);
      setEmailForm({ newEmail: "", password: "" });
    } catch (error) {
      console.error("Failed to change email:", error);
    } finally {
      setEmailChanging(false);
    }
  };

  const handleSecuritySettingChange = async (key: keyof SecuritySettings, value: boolean) => {
    if (!onUpdateSecuritySettings) return;
    
    try {
      await onUpdateSecuritySettings({ [key]: value });
    } catch (error) {
      console.error("Failed to update security setting:", error);
    }
  };

  const handle2FAToggle = async () => {
    setTwoFactorLoading(true);
    try {
      if (securitySettings.twoFactorEnabled) {
        const password = prompt("Enter your password to disable 2FA:");
        if (password && onDisable2FA) {
          await onDisable2FA(password);
        }
      } else {
        if (onEnable2FA) {
          await onEnable2FA();
        }
      }
    } catch (error) {
      console.error("Failed to toggle 2FA:", error);
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!onDeleteAccount) return;
    
    if (deleteForm.confirmation !== user.username) {
      alert("Please type your username to confirm deletion");
      return;
    }

    setDeleting(true);
    try {
      await onDeleteAccount(deleteForm.confirmation, deleteForm.password);
    } catch (error) {
      console.error("Failed to delete account:", error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Security Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Security Overview</span>
          </CardTitle>
          <CardDescription>
            Manage your account security and authentication settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
              <div className={`w-3 h-3 rounded-full ${user.isEmailVerified ? 'bg-green-500' : 'bg-yellow-500'}`} />
              <div>
                <p className="text-sm font-medium">Email Verification</p>
                <p className="text-xs text-muted-foreground">
                  {user.isEmailVerified ? 'Verified' : 'Pending'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
              <div className={`w-3 h-3 rounded-full ${securitySettings.twoFactorEnabled ? 'bg-green-500' : 'bg-red-500'}`} />
              <div>
                <p className="text-sm font-medium">Two-Factor Auth</p>
                <p className="text-xs text-muted-foreground">
                  {securitySettings.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <div>
                <p className="text-sm font-medium">Account Status</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Password & Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lock className="h-5 w-5" />
            <span>Password & Authentication</span>
          </CardTitle>
          <CardDescription>
            Change your password and manage authentication methods
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Change Password */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Change Password</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showPasswords.current ? "text" : "password"}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder="Enter current password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                  >
                    {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPasswords.new ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Enter new password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                  >
                    {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showPasswords.confirm ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirm new password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                  >
                    {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={handlePasswordChange} 
              disabled={passwordChanging || !passwordForm.currentPassword || !passwordForm.newPassword}
            >
              <ButtonLoader loading={passwordChanging} loadingText="Changing...">
                <Key className="h-4 w-4 mr-2" />
                Change Password
              </ButtonLoader>
            </Button>
          </div>

          <Separator />

          {/* Two-Factor Authentication */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium">Two-Factor Authentication</h4>
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security to your account
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={securitySettings.twoFactorEnabled ? "default" : "secondary"}>
                  {securitySettings.twoFactorEnabled ? "Enabled" : "Disabled"}
                </Badge>
                <Switch
                  checked={securitySettings.twoFactorEnabled}
                  onCheckedChange={handle2FAToggle}
                  disabled={twoFactorLoading}
                />
              </div>
            </div>
            
            {securitySettings.twoFactorEnabled && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Two-factor authentication is enabled. Use your authenticator app to generate codes when signing in.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Email Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mail className="h-5 w-5" />
            <span>Email Settings</span>
          </CardTitle>
          <CardDescription>
            Manage your email address and notification preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Change Email */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium">Primary Email</h4>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              {user.isEmailVerified ? (
                <Badge variant="default" className="text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              ) : (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Unverified
                </Badge>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="email"
                placeholder="New email address"
                value={emailForm.newEmail}
                onChange={(e) => setEmailForm(prev => ({ ...prev, newEmail: e.target.value }))}
              />
              <Input
                type="password"
                placeholder="Current password"
                value={emailForm.password}
                onChange={(e) => setEmailForm(prev => ({ ...prev, password: e.target.value }))}
              />
            </div>
            
            <Button 
              onClick={handleEmailChange} 
              disabled={emailChanging || !emailForm.newEmail || !emailForm.password}
              variant="outline"
            >
              <ButtonLoader loading={emailChanging} loadingText="Updating...">
                <Mail className="h-4 w-4 mr-2" />
                Update Email
              </ButtonLoader>
            </Button>
          </div>

          <Separator />

          {/* Notification Preferences */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Notification Preferences</h4>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Email Notifications</p>
                  <p className="text-xs text-muted-foreground">Receive updates about your account</p>
                </div>
                <Switch
                  checked={securitySettings.emailNotifications}
                  onCheckedChange={(checked) => handleSecuritySettingChange("emailNotifications", checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Security Alerts</p>
                  <p className="text-xs text-muted-foreground">Get notified about suspicious activity</p>
                </div>
                <Switch
                  checked={securitySettings.securityAlerts}
                  onCheckedChange={(checked) => handleSecuritySettingChange("securityAlerts", checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Login Notifications</p>
                  <p className="text-xs text-muted-foreground">Get alerts when you sign in</p>
                </div>
                <Switch
                  checked={securitySettings.loginNotifications}
                  onCheckedChange={(checked) => handleSecuritySettingChange("loginNotifications", checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Marketing Emails</p>
                  <p className="text-xs text-muted-foreground">Receive product updates and tips</p>
                </div>
                <Switch
                  checked={securitySettings.marketingEmails}
                  onCheckedChange={(checked) => handleSecuritySettingChange("marketingEmails", checked)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Download className="h-5 w-5" />
            <span>Privacy & Data</span>
          </CardTitle>
          <CardDescription>
            Manage your data and privacy settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium">Export Account Data</h4>
              <p className="text-sm text-muted-foreground">
                Download a copy of your account data
              </p>
            </div>
            <Button variant="outline" onClick={onExportData}>
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Billing (Placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Billing & Subscription</span>
          </CardTitle>
          <CardDescription>
            Manage your subscription and billing information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
            <p className="text-sm text-muted-foreground">
              Billing and subscription management will be available soon.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <span>Danger Zone</span>
          </CardTitle>
          <CardDescription>
            Irreversible and destructive actions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Delete Account */}
          <Alert className="border-destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Delete Account:</strong> This action cannot be undone. All your data will be permanently removed.
            </AlertDescription>
          </Alert>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete My Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-destructive">
                  Are you absolutely sure?
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-4">
                  <p>
                    This action cannot be undone. This will permanently delete your account 
                    and remove all associated data from our servers.
                  </p>
                  
                  <div className="space-y-2">
                    <Label htmlFor="deleteConfirmation">
                      Type <strong>{user.username}</strong> to confirm:
                    </Label>
                    <Input
                      id="deleteConfirmation"
                      value={deleteForm.confirmation}
                      onChange={(e) => setDeleteForm(prev => ({ ...prev, confirmation: e.target.value }))}
                      placeholder={`Type "${user.username}" here`}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="deletePassword">Enter your password:</Label>
                    <Input
                      id="deletePassword"
                      type="password"
                      value={deleteForm.password}
                      onChange={(e) => setDeleteForm(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Your account password"
                    />
                  </div>
                  
                  <Alert className="border-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      <strong>This will delete:</strong>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Your profile and account information</li>
                        <li>All applications and data</li>
                        <li>API keys and access tokens</li>
                        <li>Billing and subscription data</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  disabled={deleteForm.confirmation !== user.username || !deleteForm.password || deleting}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  <ButtonLoader loading={deleting} loadingText="Deleting...">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </ButtonLoader>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
} 