// GraphQL operations
export * from "./fragments";
export * from "./queries";
export * from "./mutations";

// GraphQL types
export * from "./types";

// GraphQL hooks
export * from "./hooks";

// Error handling
export * from "./errorHandling";

// Re-export Apollo Client
export { default as apolloClient, client, clearCache, evictFromCache, updateCacheAfterMutation, isClientReady } from "../lib/apolloClient"; 