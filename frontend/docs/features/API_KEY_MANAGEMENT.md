# 🔑 API Key Management - Frontend Implementation

## 📋 **Overview**

The frontend API Key Management interface provides a comprehensive, user-friendly experience for managing API keys within applications. It integrates seamlessly with our multi-tenant authentication SaaS platform, offering secure key generation, management, and monitoring capabilities.

### **Key Features**
- ✅ **Intuitive UI**: Clean, professional interface following industry standards
- ✅ **Real-time Validation**: Instant feedback and error handling
- ✅ **Role-based Access**: Dynamic UI based on user permissions
- ✅ **Security Best Practices**: Secure key display and handling
- ✅ **Comprehensive Management**: Create, view, update, revoke API keys
- ✅ **Usage Analytics**: Visual representation of key usage and metrics

---

## 🏗️ **Component Architecture**

### **Component Hierarchy**

```
ApiKeyManager (Main Container)
├── ApiKeyHeader
│   ├── CreateApiKeyButton
│   └── ApiKeyStats
├── ApiKeyList
│   ├── ApiKeyCard[]
│   │   ├── KeyDisplay
│   │   ├── PermissionBadges
│   │   ├── UsageMetrics
│   │   └── ActionDropdown
│   └── EmptyState
├── CreateApiKeyModal
│   ├── KeyGenerationForm
│   ├── PermissionSelector
│   ├── ScopeConfiguration
│   └── ExpirationSettings
├── KeyDetailsModal
│   ├── KeyInformation
│   ├── UsageAnalytics
│   └── AuditLog
└── RevokeConfirmationModal
    ├── WarningDisplay
    └── ConfirmationInput
```

---

## 🔧 **Implementation Details**

### **1. Main ApiKeyManager Component**

```typescript
// components/app/ApiKeyManager.tsx
"use client";

import React, { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Key, 
  Plus, 
  Eye, 
  MoreHorizontal, 
  Shield, 
  Clock,
  Activity,
  AlertTriangle,
  Copy,
  RefreshCw 
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
  { 
    id: "read", 
    label: "Read", 
    description: "View application data and resources",
    icon: "👁️",
    color: "blue"
  },
  { 
    id: "write", 
    label: "Write", 
    description: "Create and modify application data",
    icon: "✏️",
    color: "green"
  },
  { 
    id: "delete", 
    label: "Delete", 
    description: "Remove application data and resources",
    icon: "🗑️",
    color: "red"
  },
  { 
    id: "admin", 
    label: "Admin", 
    description: "Full administrative access",
    icon: "🛡️",
    color: "purple"
  },
];

export function ApiKeyManager({ 
  applicationId, 
  applicationName, 
  className 
}: ApiKeyManagerProps) {
  // State management
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [keyToRevoke, setKeyToRevoke] = useState<ApiKey | null>(null);

  // Fetch application data for permissions
  const { data: appData, loading: appLoading } = useApp(applicationId);
  
  // Fetch API keys for this application
  const { 
    data: apiKeys, 
    loading: keysLoading, 
    error: keysError,
    refetch: refetchKeys 
  } = useAppApiKeys(applicationId);

  // Permission hooks
  const canGenerateApiKeys = useCanGenerateApiKeys(appData);

  // Mutation hooks
  const { generateApiKey, loading: generating } = useGenerateApiKey();
  const { revokeApiKey, loading: revoking } = useRevokeApiKey();

  // Memoized calculations
  const keyStats = useMemo(() => {
    if (!apiKeys) return { total: 0, active: 0, expired: 0 };
    
    const now = new Date();
    return {
      total: apiKeys.length,
      active: apiKeys.filter(key => key.isActive).length,
      expired: apiKeys.filter(key => 
        key.expiresAt && new Date(key.expiresAt) < now
      ).length
    };
  }, [apiKeys]);

  // Event handlers
  const handleCreateKey = useCallback(async (keyData: any) => {
    try {
      const result = await generateApiKey({
        applicationId,
        ...keyData
      });
      
      if (result.success) {
        setShowCreateModal(false);
        refetchKeys();
        
        // Show the generated key in a secure modal
        setSelectedKey(result.apiKey);
        setShowDetailsModal(true);
      }
    } catch (error) {
      console.error('Failed to generate API key:', error);
    }
  }, [applicationId, generateApiKey, refetchKeys]);

  const handleRevokeKey = useCallback(async (keyId: string) => {
    try {
      const result = await revokeApiKey(keyId);
      
      if (result.success) {
        setShowRevokeModal(false);
        setKeyToRevoke(null);
        refetchKeys();
      }
    } catch (error) {
      console.error('Failed to revoke API key:', error);
    }
  }, [revokeApiKey, refetchKeys]);

  // Loading and error states
  if (appLoading || keysLoading) {
    return <ApiKeyManagerSkeleton />;
  }

  if (keysError) {
    return <ApiKeyErrorState error={keysError} onRetry={refetchKeys} />;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Section */}
      <ApiKeyHeader
        applicationName={applicationName}
        stats={keyStats}
        canCreate={canGenerateApiKeys}
        onCreateClick={() => setShowCreateModal(true)}
        isGenerating={generating}
      />

      {/* API Keys List */}
      <ApiKeyList
        apiKeys={apiKeys || []}
        onViewDetails={(key) => {
          setSelectedKey(key);
          setShowDetailsModal(true);
        }}
        onRevokeKey={(key) => {
          setKeyToRevoke(key);
          setShowRevokeModal(true);
        }}
        isRevoking={revoking}
      />

      {/* Modals */}
      <CreateApiKeyModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateKey}
        isGenerating={generating}
        availablePermissions={AVAILABLE_PERMISSIONS}
      />

      <KeyDetailsModal
        open={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        apiKey={selectedKey}
      />

      <RevokeConfirmationModal
        open={showRevokeModal}
        onClose={() => setShowRevokeModal(false)}
        onConfirm={() => keyToRevoke && handleRevokeKey(keyToRevoke.id)}
        apiKey={keyToRevoke}
        isRevoking={revoking}
      />
    </div>
  );
}
```

### **2. Create API Key Modal**

```typescript
// components/app/CreateApiKeyModal.tsx
interface CreateApiKeyModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateApiKeyData) => void;
  isGenerating: boolean;
  availablePermissions: Permission[];
}

export function CreateApiKeyModal({
  open,
  onClose,
  onSubmit,
  isGenerating,
  availablePermissions
}: CreateApiKeyModalProps) {
  const [formData, setFormData] = useState<CreateApiKeyData>({
    name: "",
    description: "",
    permissions: [],
    scopes: [],
    expiresAt: null
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form validation
  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "API key name is required";
    } else if (formData.name.length > 50) {
      newErrors.name = "Name must be 50 characters or less";
    }

    if (formData.permissions.length === 0) {
      newErrors.permissions = "At least one permission is required";
    }

    if (formData.expiresAt && new Date(formData.expiresAt) <= new Date()) {
      newErrors.expiresAt = "Expiration date must be in the future";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(() => {
    if (validateForm()) {
      onSubmit(formData);
    }
  }, [formData, validateForm, onSubmit]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Key className="w-5 h-5 text-blue-600" />
            <span>Generate New API Key</span>
          </DialogTitle>
          <DialogDescription>
            Create a new API key for secure access to your application's API.
            The key will be shown only once for security reasons.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="keyName">API Key Name *</Label>
              <Input
                id="keyName"
                placeholder="e.g., Production API Key"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  name: e.target.value 
                }))}
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="keyDescription">Description (Optional)</Label>
              <Textarea
                id="keyDescription"
                placeholder="Brief description of this API key's purpose..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  description: e.target.value 
                }))}
                rows={3}
              />
            </div>
          </div>

          {/* Permissions Selection */}
          <div>
            <Label>Permissions *</Label>
            <p className="text-sm text-gray-600 mb-3">
              Select the permissions this API key should have
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              {availablePermissions.map((permission) => (
                <Card 
                  key={permission.id}
                  className={`cursor-pointer transition-all duration-200 ${
                    formData.permissions.includes(permission.id)
                      ? 'ring-2 ring-blue-500 bg-blue-50'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      permissions: prev.permissions.includes(permission.id)
                        ? prev.permissions.filter(p => p !== permission.id)
                        : [...prev.permissions, permission.id]
                    }));
                  }}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start space-x-2">
                      <span className="text-lg">{permission.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">
                          {permission.label}
                        </div>
                        <div className="text-xs text-gray-600">
                          {permission.description}
                        </div>
                      </div>
                      {formData.permissions.includes(permission.id) && (
                        <CheckCircle className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {errors.permissions && (
              <p className="text-sm text-red-600 mt-1">{errors.permissions}</p>
            )}
          </div>

          {/* Expiration Settings */}
          <div>
            <Label htmlFor="expiresAt">Expiration (Optional)</Label>
            <Input
              id="expiresAt"
              type="datetime-local"
              value={formData.expiresAt || ""}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                expiresAt: e.target.value || null 
              }))}
              className={errors.expiresAt ? "border-red-500" : ""}
            />
            {errors.expiresAt && (
              <p className="text-sm text-red-600 mt-1">{errors.expiresAt}</p>
            )}
            <p className="text-sm text-gray-600 mt-1">
              Leave empty for no expiration
            </p>
          </div>

          {/* Security Notice */}
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <div className="font-medium">Security Notice</div>
                <div>
                  The API key will be displayed only once after generation. 
                  Make sure to copy and store it securely.
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isGenerating}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Key className="w-4 h-4 mr-2" />
                Generate API Key
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### **3. API Key List Component**

```typescript
// components/app/ApiKeyList.tsx
interface ApiKeyListProps {
  apiKeys: ApiKey[];
  onViewDetails: (key: ApiKey) => void;
  onRevokeKey: (key: ApiKey) => void;
  isRevoking: boolean;
}

export function ApiKeyList({ 
  apiKeys, 
  onViewDetails, 
  onRevokeKey, 
  isRevoking 
}: ApiKeyListProps) {
  
  if (apiKeys.length === 0) {
    return <EmptyApiKeyState />;
  }

  return (
    <div className="space-y-4">
      {apiKeys.map((apiKey) => (
        <ApiKeyCard
          key={apiKey.id}
          apiKey={apiKey}
          onViewDetails={() => onViewDetails(apiKey)}
          onRevoke={() => onRevokeKey(apiKey)}
          isRevoking={isRevoking}
        />
      ))}
    </div>
  );
}

function ApiKeyCard({ 
  apiKey, 
  onViewDetails, 
  onRevoke, 
  isRevoking 
}: ApiKeyCardProps) {
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyKey = useCallback(async () => {
    if (apiKey.key) {
      await navigator.clipboard.writeText(apiKey.key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [apiKey.key]);

  const isExpired = apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date();
  const isInactive = !apiKey.isActive;

  return (
    <Card className={`transition-all duration-200 ${
      isExpired || isInactive ? 'opacity-60' : 'hover:shadow-md'
    }`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center space-x-3 mb-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Key className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate">
                  {apiKey.name}
                </h3>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-sm text-gray-500">
                    ••••{apiKey.lastFourChars}
                  </span>
                  {isExpired && (
                    <Badge variant="destructive" className="text-xs">
                      Expired
                    </Badge>
                  )}
                  {isInactive && (
                    <Badge variant="secondary" className="text-xs">
                      Revoked
                    </Badge>
                  )}
                  {apiKey.isActive && !isExpired && (
                    <Badge variant="default" className="text-xs">
                      Active
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Permissions */}
            <div className="mb-3">
              <div className="text-sm text-gray-600 mb-2">Permissions:</div>
              <div className="flex flex-wrap gap-1">
                {apiKey.permissions.map((permission) => (
                  <Badge 
                    key={permission} 
                    variant="outline" 
                    className="text-xs"
                  >
                    {permission.toLowerCase()}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Key Display (only if just created) */}
            {apiKey.key && (
              <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-green-800 mb-1">
                      🎉 API Key Generated Successfully!
                    </div>
                    <div className="text-sm text-green-700 mb-2">
                      Copy this key now - it won't be shown again for security reasons.
                    </div>
                    <div className="font-mono text-sm bg-white p-2 rounded border">
                      {showKey ? apiKey.key : "•".repeat(apiKey.key.length)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowKey(!showKey)}
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    {showKey ? 'Hide' : 'Show'}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCopyKey}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    {copied ? 'Copied!' : 'Copy Key'}
                  </Button>
                </div>
              </div>
            )}

            {/* Usage Stats */}
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Created</div>
                <div className="font-medium">
                  {new Date(apiKey.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div>
                <div className="text-gray-600">Last Used</div>
                <div className="font-medium">
                  {apiKey.lastUsedAt 
                    ? new Date(apiKey.lastUsedAt).toLocaleDateString()
                    : 'Never'
                  }
                </div>
              </div>
              <div>
                <div className="text-gray-600">Usage Count</div>
                <div className="font-medium">{apiKey.usageCount || 0}</div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex-shrink-0 ml-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onViewDetails}>
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                {apiKey.isActive && !isExpired && (
                  <DropdownMenuItem 
                    onClick={onRevoke}
                    className="text-red-600"
                    disabled={isRevoking}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Revoke Key
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## 🎨 **User Experience Design**

### **Design Principles**

1. **Security First**
   - API keys shown only once during creation
   - Clear visual indicators for key status
   - Prominent security warnings and notices

2. **Intuitive Interface**
   - Clean, card-based layout for easy scanning
   - Consistent iconography and color coding
   - Progressive disclosure of information

3. **Immediate Feedback**
   - Real-time form validation
   - Loading states for all async operations
   - Success/error notifications

4. **Accessible Design**
   - Proper ARIA labels and roles
   - Keyboard navigation support
   - Screen reader compatible

### **Visual Design System**

```scss
// API Key Management Color Palette
$primary-blue: #3b82f6;
$success-green: #10b981;
$warning-yellow: #f59e0b;
$danger-red: #ef4444;
$neutral-gray: #6b7280;

// Component Specific Styles
.api-key-card {
  &.active { border-left: 4px solid $success-green; }
  &.expired { border-left: 4px solid $warning-yellow; }
  &.revoked { border-left: 4px solid $danger-red; }
}

.permission-badge {
  &.read { background: rgba($primary-blue, 0.1); color: $primary-blue; }
  &.write { background: rgba($success-green, 0.1); color: $success-green; }
  &.delete { background: rgba($danger-red, 0.1); color: $danger-red; }
  &.admin { background: rgba(#8b5cf6, 0.1); color: #8b5cf6; }
}
```

---

## 🔌 **Integration Patterns**

### **GraphQL Operations**

```typescript
// services/apiKeyService.ts
import { gql } from '@apollo/client';

export const GET_APP_API_KEYS = gql`
  query GetAppApiKeys($applicationId: ID!) {
    appApiKeys(applicationId: $applicationId) {
      id
      name
      lastFourChars
      permissions
      scopes
      expiresAt
      isActive
      lastUsedAt
      usageCount
      createdAt
      createdBy {
        id
        username
        email
      }
    }
  }
`;

export const GENERATE_API_KEY = gql`
  mutation GenerateApiKey($input: GenerateApiKeyInput!) {
    generateApiKey(input: $input) {
      success
      apiKey {
        id
        name
        key
        lastFourChars
        permissions
        scopes
        expiresAt
        createdAt
      }
      errors {
        message
        code
        field
      }
    }
  }
`;

export const REVOKE_API_KEY = gql`
  mutation RevokeApiKey($id: ID!) {
    revokeApiKey(id: $id) {
      success
      errors {
        message
        code
      }
    }
  }
`;
```

### **Custom Hooks**

```typescript
// hooks/useApiKeyManager.ts
export function useApiKeyManager(applicationId: string) {
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { data: apiKeys, loading, error, refetch } = useAppApiKeys(applicationId);
  const { generateApiKey, loading: generating } = useGenerateApiKey();
  const { revokeApiKey, loading: revoking } = useRevokeApiKey();

  const handleCreateKey = useCallback(async (keyData: CreateApiKeyData) => {
    setIsCreating(true);
    try {
      const result = await generateApiKey({
        applicationId,
        ...keyData
      });
      
      if (result.success) {
        await refetch();
        return result.apiKey;
      }
      throw new Error(result.errors?.[0]?.message || 'Failed to create API key');
    } finally {
      setIsCreating(false);
    }
  }, [applicationId, generateApiKey, refetch]);

  const handleRevokeKey = useCallback(async (keyId: string) => {
    const result = await revokeApiKey(keyId);
    if (result.success) {
      await refetch();
    }
    return result;
  }, [revokeApiKey, refetch]);

  return {
    apiKeys,
    loading,
    error,
    selectedKey,
    setSelectedKey,
    isCreating,
    generating,
    revoking,
    handleCreateKey,
    handleRevokeKey,
    refetch
  };
}
```

---

## 🧪 **Testing Strategy**

### **Component Tests**

```typescript
// tests/components/ApiKeyManager.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { ApiKeyManager } from '@/components/app/ApiKeyManager';

const mockApiKeys = [
  {
    id: '1',
    name: 'Production API Key',
    lastFourChars: '1234',
    permissions: ['READ', 'WRITE'],
    isActive: true,
    usageCount: 150,
    createdAt: '2023-01-01T00:00:00Z'
  }
];

const mocks = [
  {
    request: {
      query: GET_APP_API_KEYS,
      variables: { applicationId: 'app-1' }
    },
    result: {
      data: { appApiKeys: mockApiKeys }
    }
  }
];

describe('ApiKeyManager', () => {
  it('renders API keys correctly', async () => {
    render(
      <MockedProvider mocks={mocks}>
        <ApiKeyManager applicationId="app-1" />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Production API Key')).toBeInTheDocument();
      expect(screen.getByText('••••1234')).toBeInTheDocument();
    });
  });

  it('opens create modal when create button is clicked', async () => {
    render(
      <MockedProvider mocks={mocks}>
        <ApiKeyManager applicationId="app-1" />
      </MockedProvider>
    );

    await waitFor(() => {
      fireEvent.click(screen.getByText('Generate API Key'));
    });

    expect(screen.getByText('Generate New API Key')).toBeInTheDocument();
  });
});
```

### **Integration Tests**

```typescript
// tests/integration/apiKeyFlow.test.tsx
describe('API Key Management Flow', () => {
  it('completes full create-view-revoke cycle', async () => {
    // Test the complete user flow
    // 1. Create new API key
    // 2. View key details
    // 3. Revoke the key
    // 4. Verify UI updates
  });
});
```

---

## 🚀 **Performance Optimizations**

### **Memoization and Caching**

```typescript
// Optimize expensive calculations
const keyStats = useMemo(() => {
  if (!apiKeys) return { total: 0, active: 0, expired: 0 };
  
  const now = new Date();
  return {
    total: apiKeys.length,
    active: apiKeys.filter(key => key.isActive).length,
    expired: apiKeys.filter(key => 
      key.expiresAt && new Date(key.expiresAt) < now
    ).length
  };
}, [apiKeys]);

// Memoize component renders
const MemoizedApiKeyCard = React.memo(ApiKeyCard, (prevProps, nextProps) => {
  return (
    prevProps.apiKey.id === nextProps.apiKey.id &&
    prevProps.apiKey.isActive === nextProps.apiKey.isActive &&
    prevProps.apiKey.usageCount === nextProps.apiKey.usageCount
  );
});
```

### **Virtual Scrolling (for large lists)**

```typescript
// For applications with many API keys
import { FixedSizeList as List } from 'react-window';

function VirtualizedApiKeyList({ apiKeys }: { apiKeys: ApiKey[] }) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <ApiKeyCard apiKey={apiKeys[index]} />
    </div>
  );

  return (
    <List
      height={600}
      itemCount={apiKeys.length}
      itemSize={200}
    >
      {Row}
    </List>
  );
}
```

---

## 📱 **Responsive Design**

```scss
// Responsive breakpoints
.api-key-manager {
  // Mobile first approach
  .api-key-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  // Tablet and up
  @media (min-width: 768px) {
    .create-modal {
      max-width: 600px;
    }
    
    .api-key-card {
      .actions {
        position: relative;
        right: 0;
      }
    }
  }

  // Desktop
  @media (min-width: 1024px) {
    .api-key-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 1.5rem;
    }
  }
}
```

---

## 🔗 **Related Documentation**

- [Backend API Key Management](../../backend/docs/features/API_KEY_MANAGEMENT.md)
- [Component Library](../components/COMPONENT_LIBRARY.md)
- [State Management](./STATE_MANAGEMENT.md)
- [Authentication Integration](./AUTHENTICATION_INTEGRATION.md)
- [UI/UX Guidelines](../ui-ux/DESIGN_SYSTEM.md)

---

*Last updated: [Current Date]*  
*Next review: [Review Date]* 