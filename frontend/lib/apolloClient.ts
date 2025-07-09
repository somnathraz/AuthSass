// lib/apolloClient.ts
import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  from,
  ApolloLink,
  Observable,
  split,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";
import { RetryLink } from "@apollo/client/link/retry";
import { getMainDefinition } from "@apollo/client/utilities";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { createClient } from "graphql-ws";
import { toast } from "sonner";
import type { CacheConfig } from "@/graphql/types";

// Create WebSocket client for subscriptions (optional - for real-time features)
const wsClient = createClient({
  url: process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:4000/graphql",
  connectionParams: () => ({
    // WebSocket connections can't use HTTP-only cookies, so we'll handle auth differently if needed
    // For now, we'll leave this empty since most functionality uses HTTP requests
  }),
});

// Create WebSocket link for subscriptions
const wsLink = new GraphQLWsLink(wsClient);

// HTTP Link for queries and mutations
const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/graphql",
  credentials: "include", // This ensures cookies are sent with requests
});

// Auth link - simplified since we're using HTTP-only cookies
const authLink = setContext((_, { headers }) => {
  return {
    headers: {
      ...headers,
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
  };
});

// Retry link for network errors
const retryLink = new RetryLink({
  delay: {
    initial: 300,
    max: Infinity,
    jitter: true,
  },
  attempts: {
    max: 3,
    retryIf: (error, _operation) => {
      return !!error && (error as any).networkError?.statusCode !== 401;
    },
  },
});

// Error link for global error handling
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path, extensions }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      );

      // Handle specific error types
      switch (extensions?.code) {
        case "UNAUTHENTICATED":
          // TEMPORARILY DISABLED ALL REDIRECTS FOR TESTING
          console.log('🔒 UNAUTHENTICATED error detected - REDIRECTS DISABLED FOR TESTING');
          console.log('Operation:', operation.operationName);
          // Don't redirect to login for invitation acceptance operations
          const operationName = operation.operationName;
          const isInvitationOperation = operationName === 'AcceptInvite' || 
                                       operationName === 'AcceptOrganizationInvite' ||
                                       operationName === 'CheckOrgInvite';
          
          if (!isInvitationOperation && typeof window !== "undefined") {
            console.log('🔒 Authentication required - REDIRECT DISABLED FOR TESTING');
            // DISABLED: window.location.href = "/login";
          } else if (isInvitationOperation) {
            console.log('🎫 Invitation operation - allowing unauthenticated access');
          }
          break;
        
        case "FORBIDDEN":
          toast.error("You don't have permission to perform this action");
          break;
        
        case "VALIDATION_ERROR":
          toast.error(`Validation Error: ${message}`);
          break;
        
        case "RATE_LIMITED":
          toast.error("Too many requests. Please try again later.");
          break;
        
        default:
          // Show generic error for other GraphQL errors
          if (!message.includes("Network error")) {
            toast.error(message || "An unexpected error occurred");
          }
      }
    });
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
    
    // Handle different network error types
    const statusCode = (networkError as any)?.statusCode;
    if (statusCode === 401) {
      // TEMPORARILY DISABLED ALL REDIRECTS FOR TESTING
      console.log('🔒 401 Unauthorized detected - REDIRECTS DISABLED FOR TESTING');
      console.log('Operation:', operation.operationName);
      // Don't redirect to login for invitation operations
      const operationName = operation.operationName;
      const isInvitationOperation = operationName === 'AcceptInvite' || 
                                   operationName === 'AcceptOrganizationInvite' ||
                                   operationName === 'CheckOrgInvite';
      
      if (!isInvitationOperation && typeof window !== "undefined") {
        console.log('🔒 401 Unauthorized - REDIRECT DISABLED FOR TESTING');
        // DISABLED: window.location.href = "/login";
      } else if (isInvitationOperation) {
        console.log('🎫 401 on invitation operation - this may be expected');
      }
    } else if (statusCode >= 500) {
      toast.error("Server error. Please try again later.");
    } else if (!navigator.onLine) {
      toast.error("No internet connection. Please check your network.");
    } else {
      toast.error("Network error. Please try again.");
    }
  }
});

// Simplified link chain since we don't need token refresh with HTTP-only cookies
const linkChain = from([authLink, retryLink, errorLink, httpLink]);

// Split link to route queries/mutations to HTTP and subscriptions to WebSocket
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === "OperationDefinition" &&
      definition.operation === "subscription"
    );
  },
  wsLink,
  linkChain
);

// Enhanced cache configuration with proper normalization
const cacheConfig: CacheConfig = {
  typePolicies: {
    Query: {
      fields: {
        // CRITICAL FIX: Simplified cache merge to prevent missing field errors
        apps: {
          keyArgs: ["filter", ["organizationId", "search", "type", "status"], "sortBy", "sortOrder"],
          merge(existing: any, incoming: any) {
            // SIMPLIFIED: Always use incoming data to prevent cache issues
            console.log('🔄 Apollo cache merge for apps query: Using incoming data');
            return incoming;
          },
        },
        myApps: {
          merge(existing: any[] = [], incoming: any[]) {
            return incoming;
          },
        },
        userOrganizations: {
          merge(existing: any[] = [], incoming: any[]) {
            return incoming;
          },
        },
        myInvitations: {
          merge(existing: any[] = [], incoming: any[]) {
            return incoming;
          },
        },
        orgInvitations: {
          merge(existing: any[] = [], incoming: any[]) {
            return incoming;
          },
        },
        auditLogs: {
          merge(existing: any[] = [], incoming: any[]) {
            return incoming;
          },
        },
      },
    },
    User: {
      keyFields: ["id"],
    },
    Organization: {
      keyFields: ["id"],
    },
    App: {
      keyFields: ["id"],
    },
    Invitation: {
      keyFields: ["id"],
    },
    OrgInvitation: {
      keyFields: ["id"],
    },
    AuditLog: {
      keyFields: ["id"],
    },
  },
};

// Create Apollo Client instance
export const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(cacheConfig),
  defaultOptions: {
    watchQuery: {
      errorPolicy: "all",
      notifyOnNetworkStatusChange: true,
    },
    query: {
      errorPolicy: "all",
    },
    mutate: {
      errorPolicy: "all",
    },
  },
  connectToDevTools: process.env.NODE_ENV === "development",
});

// Helper functions for cache management
export const clearCache = () => {
  client.clearStore();
};

export const evictFromCache = (typename: string, id: string) => {
  client.cache.evict({
    id: client.cache.identify({ __typename: typename, id }),
  });
  client.cache.gc();
};

export const updateCacheAfterMutation = (
  typename: string,
  id: string,
  updatedFields: Record<string, any>
) => {
  client.cache.modify({
    id: client.cache.identify({ __typename: typename, id }),
    fields: updatedFields,
  });
};

// Helper to check if client is ready
export const isClientReady = () => {
  return client !== null;
};

// Export client as default
export default client;
