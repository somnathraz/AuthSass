"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Key, 
  Plus, 
  Copy, 
  Eye, 
  EyeOff, 
  MoreHorizontal, 
  Trash2, 
  RefreshCw,
  CheckCircle,
  Loader2,
  Calendar,
  Activity,
} from "lucide-react";

// Import app service hooks
import {
  useAppApiKeys,
  useGenerateApiKey,
  useRevokeApiKey,
  useCanGenerateApiKeys,
  useApp,
  type Application,
  type ApiKey,
} from "@/services/app.service";

interface ApiKeyManagerProps {
  applicationId: string;
  applicationName?: string;
  className?: string;
}

const AVAILABLE_PERMISSIONS = [
  { id: "read", label: "Read", description: "View application data" },
  { id: "write", label: "Write", description: "Modify application data" },
  { id: "delete", label: "Delete", description: "Delete application data" },
  { id: "admin", label: "Admin", description: "Full administrative access" },
];

export function ApiKeyManager({ 
  applicationId, 
  applicationName,
  className,
}: ApiKeyManagerProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [keyToRevoke, setKeyToRevoke] = useState<ApiKey | null>(null);
  const [newKeyData, setNewKeyData] = useState<{
    name: string;
    permissions: string[];
    expiresAt?: string;
  }>({
    name: "",
    permissions: [],
  });
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});

  // Fetch full application data for permission checks
  const { data: appData, loading: appLoading, error: appError } = useApp(applicationId);
  
  // Fetch API keys
  const { data: apiKeysData, loading: apiKeysLoading, error: apiKeysError, refetch } = useAppApiKeys(applicationId);
  
  // Mutation hooks
  const { generateApiKey, loading: generateLoading } = useGenerateApiKey();
  const { revokeApiKey, loading: revokeLoading } = useRevokeApiKey();

  // Permission check - safely check if we have app data with proper structure
  const canGenerate = useCanGenerateApiKeys(appData || undefined);

  // FIXED: Safely extract API keys with proper null checks and enhanced debugging
  const apiKeys = useMemo(() => {
    console.log('🔑 ApiKeyManager Raw Data Debug:', {
      apiKeysData,
      hasApiKeysData: !!apiKeysData,
      apiKeysDataType: typeof apiKeysData,
      apiKeysDataKeys: apiKeysData ? Object.keys(apiKeysData) : null
    });
    
    if (!apiKeysData) {
      console.log('🔑 No apiKeysData available');
      return [];
    }
    
    // Handle multiple possible data structures with enhanced logging
    let keys = [];
    
    // Pattern 1: Direct apiKeys array
    if (apiKeysData.apiKeys && Array.isArray(apiKeysData.apiKeys)) {
      console.log('🔑 Found apiKeys directly in apiKeysData:', apiKeysData.apiKeys.length);
      keys = apiKeysData.apiKeys;
    } 
    // Pattern 2: Nested in app object
    else if (apiKeysData.app?.apiKeys && Array.isArray(apiKeysData.app.apiKeys)) {
      console.log('🔑 Found apiKeys in apiKeysData.app:', apiKeysData.app.apiKeys.length);
      keys = apiKeysData.app.apiKeys;
    } 
    // Pattern 3: Nested in appApiKeys response
    else if (apiKeysData.appApiKeys?.apiKeys && Array.isArray(apiKeysData.appApiKeys.apiKeys)) {
      console.log('🔑 Found apiKeys in apiKeysData.appApiKeys:', apiKeysData.appApiKeys.apiKeys.length);
      keys = apiKeysData.appApiKeys.apiKeys;
    }
    // Pattern 4: Check for any nested structure containing apiKeys
    else {
      console.log('🔑 Searching for apiKeys in nested structures...');
      const searchForApiKeys = (obj: any, path = ''): any[] => {
        if (!obj || typeof obj !== 'object') return [];
        
        for (const [key, value] of Object.entries(obj)) {
          const currentPath = path ? `${path}.${key}` : key;
          
          // Found apiKeys array
          if (key === 'apiKeys' && Array.isArray(value)) {
            console.log(`🔑 Found apiKeys at path: ${currentPath}`, value.length);
            return value;
          }
          
          // Recursively search in nested objects
          if (value && typeof value === 'object') {
            const nestedResult = searchForApiKeys(value, currentPath);
            if (nestedResult.length > 0) return nestedResult;
          }
        }
        return [];
      };
      
      keys = searchForApiKeys(apiKeysData);
    }
    
    // Filter out invalid keys and add validation
    const validKeys = keys.filter((key: any) => {
      if (!key) {
        console.warn('🔑 Filtering out null/undefined key');
        return false;
      }
      if (!key.id) {
        console.warn('🔑 Filtering out key without id:', key);
        return false;
      }
      return true;
    });
    
    console.log(`🔑 Final API keys result: ${validKeys.length} valid keys out of ${keys.length} total`);
    return validKeys;
  }, [apiKeysData]);

  console.log('🔑 ApiKeyManager Debug:', {
    applicationId,
    appData,
    apiKeysData,
    apiKeysCount: apiKeys.length,
    canGenerate,
    loading: appLoading || apiKeysLoading,
    error: appError?.message || apiKeysError?.message
  });

  const handleCreateKey = async () => {
    if (!newKeyData.name.trim() || newKeyData.permissions.length === 0) {
      return;
    }

    try {
      const result = await generateApiKey({
        appId: applicationId,
        name: newKeyData.name,
        permissions: newKeyData.permissions,
        expiresAt: newKeyData.expiresAt,
      });

      if (result.data?.generateApiKey?.success && result.data.generateApiKey.apiKey) {
        setGeneratedKey(result.data.generateApiKey.apiKey.key);
        setNewKeyData({ name: "", permissions: [] });
        refetch();
      }
    } catch (error) {
      console.error("Failed to generate API key:", error);
    }
  };

  const handleRevokeKey = async () => {
    if (!keyToRevoke) return;

    try {
      await revokeApiKey({
        appId: applicationId,
        keyId: keyToRevoke.id,
      });
      setKeyToRevoke(null);
      refetch();
    } catch (error) {
      console.error("Failed to revoke API key:", error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const toggleKeyVisibility = (keyId: string) => {
    setShowKey(prev => ({ ...prev, [keyId]: !prev[keyId] }));
  };

  const resetCreateForm = () => {
    setNewKeyData({ name: "", permissions: [] });
    setGeneratedKey(null);
    setShowCreateDialog(false);
  };

  if (appError || apiKeysError) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            <p>Error loading API keys: {appError?.message || apiKeysError?.message}</p>
            <Button onClick={() => refetch()} className="mt-2">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Key className="w-5 h-5" />
              <span>API Keys</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {apiKeys.length} key{apiKeys.length !== 1 ? 's' : ''}
              </Badge>
              {canGenerate && (
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Generate Key
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Generate API Key</DialogTitle>
                      <DialogDescription>
                        Create a new API key for {applicationName || "this application"}
                      </DialogDescription>
                    </DialogHeader>

                    {generatedKey ? (
                      <div className="space-y-4">
                        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                          <div className="flex items-center space-x-2 mb-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span className="font-medium text-green-900">API Key Generated!</span>
                          </div>
                          <p className="text-sm text-green-700 mb-3">
                            Copy this key now. You won&apos;t be able to see it again.
                          </p>
                          <div className="flex items-center space-x-2">
                            <Input
                              value={generatedKey}
                              readOnly
                              className="font-mono text-sm"
                            />
                            <Button
                              size="sm"
                              onClick={() => copyToClipboard(generatedKey)}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={resetCreateForm}>
                            Done
                          </Button>
                        </DialogFooter>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="keyName">Key Name</Label>
                          <Input
                            id="keyName"
                            value={newKeyData.name}
                            onChange={(e) => setNewKeyData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Production API Key"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Permissions</Label>
                          <div className="space-y-2">
                            {AVAILABLE_PERMISSIONS.map((permission) => (
                              <div key={permission.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={permission.id}
                                  checked={newKeyData.permissions.includes(permission.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setNewKeyData(prev => ({
                                        ...prev,
                                        permissions: [...prev.permissions, permission.id]
                                      }));
                                    } else {
                                      setNewKeyData(prev => ({
                                        ...prev,
                                        permissions: prev.permissions.filter(p => p !== permission.id)
                                      }));
                                    }
                                  }}
                                />
                                <div>
                                  <Label htmlFor={permission.id} className="font-medium">
                                    {permission.label}
                                  </Label>
                                  <p className="text-xs text-gray-500">{permission.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="expiresAt">Expiration Date (Optional)</Label>
                          <Input
                            id="expiresAt"
                            type="date"
                            value={newKeyData.expiresAt || ""}
                            onChange={(e) => setNewKeyData(prev => ({ ...prev, expiresAt: e.target.value }))}
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>

                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={resetCreateForm}
                            disabled={generateLoading}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleCreateKey}
                            disabled={generateLoading || !newKeyData.name.trim() || newKeyData.permissions.length === 0}
                          >
                            {generateLoading ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              "Generate Key"
                            )}
                          </Button>
                        </DialogFooter>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardTitle>
          <CardDescription>
            Manage API keys for {applicationName || "this application"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appLoading || apiKeysLoading ? (
                  // Loading skeleton
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <div className="w-12 h-5 bg-gray-200 rounded animate-pulse" />
                          <div className="w-12 h-5 bg-gray-200 rounded animate-pulse" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
                      </TableCell>
                      <TableCell>
                        <div className="w-16 h-4 bg-gray-200 rounded animate-pulse" />
                      </TableCell>
                      <TableCell>
                        <div className="w-16 h-5 bg-gray-200 rounded animate-pulse" />
                      </TableCell>
                      <TableCell>
                        <div className="w-8 h-8 bg-gray-200 rounded animate-pulse ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : apiKeys.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No API keys generated yet. {canGenerate && (
                        <Button 
                          variant="link" 
                          onClick={() => setShowCreateDialog(true)}
                          className="ml-1"
                        >
                          Generate your first key
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  apiKeys.map((apiKey: ApiKey) => (
                    <TableRow key={apiKey.id}>
                      <TableCell>
                        <div className="font-medium">{apiKey.name}</div>
                        {apiKey.key && (
                          <div className="flex items-center space-x-2 mt-1">
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {showKey[apiKey.id] 
                                ? apiKey.key 
                                : `${apiKey.key.substring(0, 8)}...${apiKey.key.substring(-4)}`
                              }
                            </code>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleKeyVisibility(apiKey.id)}
                            >
                              {showKey[apiKey.id] ? (
                                <EyeOff className="w-3 h-3" />
                              ) : (
                                <Eye className="w-3 h-3" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(apiKey.key!)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {apiKey.permissions.map((permission) => (
                            <Badge key={permission} variant="secondary" className="text-xs">
                              {permission}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span className="text-sm">
                            {new Date(apiKey.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {apiKey.lastUsedAt ? (
                          <div className="flex items-center space-x-1">
                            <Activity className="w-3 h-3 text-green-500" />
                            <span className="text-sm">
                              {new Date(apiKey.lastUsedAt).toLocaleDateString()}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Never</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Badge variant={apiKey.isActive ? "default" : "secondary"}>
                            {apiKey.isActive ? "Active" : "Inactive"}
                          </Badge>
                          {apiKey.expiresAt && (
                            <Badge variant="outline" className="text-xs">
                              Expires {new Date(apiKey.expiresAt).toLocaleDateString()}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {canGenerate && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem 
                                onClick={() => copyToClipboard(apiKey.key || "")}
                                disabled={!apiKey.key}
                              >
                                <Copy className="mr-2 h-4 w-4" />
                                Copy Key
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => setKeyToRevoke(apiKey)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Revoke Key
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Revoke Key Confirmation Dialog */}
      <AlertDialog open={!!keyToRevoke} onOpenChange={() => setKeyToRevoke(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke the API key <strong>&quot;{keyToRevoke?.name}&quot;</strong>? 
              This will immediately stop all requests using this key and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revokeLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRevokeKey}
              disabled={revokeLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {revokeLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Revoking...
                </>
              ) : (
                "Revoke Key"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 