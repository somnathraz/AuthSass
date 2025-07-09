# Migration Guide: From Legacy authService to Modern GraphQL Hooks

This guide provides step-by-step instructions for migrating from the legacy `authService.ts` approach to the new industry-standard GraphQL hooks.

## Why Migrate?

The new GraphQL architecture provides:
- Better type safety with comprehensive TypeScript types
- Consistent error handling with user-friendly messages
- Optimized caching and performance
- Reduced code duplication via fragments
- Better organization of GraphQL operations
- Enhanced developer experience

## Step 1: Update Imports

### Old Pattern:
```typescript
import { useLogin, useSignup /* etc. */ } from "@/services/authService";
```

### New Pattern:
```typescript
import { useLogin, useSignup /* etc. */ } from "@/graphql";
```

## Step 2: Migrate Common Hooks

Below are direct mappings from old to new hooks:

| Old Hook | New Hook | Notes |
|----------|----------|-------|
| `useLogin()` | `useLogin()` | Same API, improved error handling |
| `useSignup()` | `useSignup()` | Same API, improved error handling |
| `useSocialLogin()` | `useSocialLogin()` | Same API, improved error handling |
| `useCreateApp()` | `useCreateApp()` | Now accepts optional orgId parameter |
| `useUserAndOrg()` | `useUserAppsAndOrgs()` | Enhanced with more data |
| `useGetOrgMembers()` | `useGetOrgMembers()` | Type-safe query variables |

## Step 3: Leverage New Composite Hooks

The new architecture provides composite hooks that combine multiple operations:

```typescript
// Old pattern - multiple hook calls
const { user } = useUserAndOrg();
const { data: appsData } = useQuery(GET_MY_APPS);

// New pattern - single composite hook
const { user, apps, organizations, loading } = useUserAppsAndOrgs();
```

## Step 4: Use Improved Error Handling

### Old Pattern:
```typescript
const { login, error } = useLogin();

const handleLogin = async () => {
  try {
    await login(email, password);
  } catch (err) {
    console.error(err);
    // Manual error handling
  }
};
```

### New Pattern:
```typescript
import { useLogin, useErrorHandler } from "@/graphql";

const { handleError } = useErrorHandler();
const [login, { loading, error }] = useLogin();

const handleLogin = async () => {
  try {
    await login({ variables: { email, password } });
  } catch (err) {
    // Structured error with severity, user-friendly message, etc.
    const processedError = handleError(err);
    
    // Check if we should retry
    if (processedError.shouldRetry) {
      // Implement retry logic
    }
  }
};
```

## Step 5: Benefit from Fragment Usage

### Old Pattern (direct field selections):
```tsx
const { data } = useQuery(GET_USER);

return (
  <div>
    <p>{data?.user.username}</p>
    <p>{data?.user.email}</p>
  </div>
);
```

### New Pattern (with fragments):
```tsx
// The query already uses fragments internally
const { data } = useGetMe();

// Type-safe access with better autocompletion
return (
  <div>
    <p>{data?.me.username}</p>
    <p>{data?.me.email}</p>
  </div>
);
```

## Step 6: Use Enhanced Caching

The new architecture provides better cache management:

```typescript
import { evictFromCache, updateCacheAfterMutation } from "@/graphql";

// After deleting an item
evictFromCache("App", deletedAppId);

// After updating an item
updateCacheAfterMutation("User", userId, {
  isVerified: () => true
});
```

## Detailed Migration Examples

### Authentication Flow

#### Old:
```typescript
import { useLogin } from "@/services/authService";

function LoginForm() {
  const { login, error, loading } = useLogin();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await login(email, password);
      // Manual redirect
      router.push("/dashboard");
    } catch (err) {
      // Manual error handling
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      {error && <p className="error">{error.message}</p>}
      <button disabled={loading}>Login</button>
    </form>
  );
}
```

#### New:
```typescript
import { useLogin, useErrorHandler } from "@/graphql";
import { toast } from "sonner";

function LoginForm() {
  const [login, { loading }] = useLogin();
  const { handleError } = useErrorHandler();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login({ 
        variables: { email, password },
        // The token is stored automatically in localStorage via the hook
      });
      router.push("/dashboard");
    } catch (err) {
      // Error is automatically displayed via toast and logged
      const processedError = handleError(err);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button disabled={loading}>Login</button>
    </form>
  );
}
```

### Data Fetching

#### Old:
```typescript
import { useFetchApp } from "@/services/authService";

function AppsList({ orgId }) {
  const { apps, loading, error } = useFetchApp(orgId);
  
  if (loading) return <Loading />;
  if (error) return <Error message={error.message} />;
  
  return (
    <ul>
      {apps.map(app => (
        <li key={app.id}>{app.name}</li>
      ))}
    </ul>
  );
}
```

#### New:
```typescript
import { useGetMyApps } from "@/graphql";

function AppsList({ orgId }) {
  const { data, loading, error } = useGetMyApps({ orgId });
  
  if (loading) return <Loading />;
  if (error) return <Error message={error.message} />;
  
  return (
    <ul>
      {data?.myApps.map(app => (
        <li key={app.id}>{app.name}</li>
      ))}
    </ul>
  );
}
```

## Testing with the New Architecture

The new architecture makes testing easier:

```typescript
import { MockedProvider } from "@apollo/client/testing";
import { GET_ME } from "@/graphql";

const mocks = [
  {
    request: {
      query: GET_ME,
    },
    result: {
      data: {
        me: {
          id: "1",
          username: "testuser",
          email: "test@example.com",
          role: "user",
          // ... other fields
        },
      },
    },
  },
];

// In your test
render(
  <MockedProvider mocks={mocks} addTypename={false}>
    <YourComponent />
  </MockedProvider>
);
```

## Conclusion

This migration brings your codebase to industry standards with proper GraphQL architecture. The new approach provides better type safety, error handling, and developer experience while reducing code duplication and improving performance.

If you encounter any issues during migration, please check the full GraphQL architecture documentation in `GRAPHQL_IMPROVEMENTS.md`. 