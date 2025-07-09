import { ApolloError } from "@apollo/client";
import { toast } from "sonner";

// Error types enumeration
export enum ErrorType {
  NETWORK = "NETWORK",
  AUTHENTICATION = "AUTHENTICATION",
  AUTHORIZATION = "AUTHORIZATION",
  VALIDATION = "VALIDATION",
  SERVER = "SERVER",
  RATE_LIMIT = "RATE_LIMIT",
  NOT_FOUND = "NOT_FOUND",
  UNKNOWN = "UNKNOWN",
}

// Error severity levels
export enum ErrorSeverity {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

// Structured error interface
export interface ProcessedError {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  originalError: ApolloError | Error;
  code?: string;
  fields?: string[];
  shouldRetry: boolean;
  userAction?: string;
}

// Error code mappings
const ERROR_CODE_MAPPINGS: Record<string, ErrorType> = {
  UNAUTHENTICATED: ErrorType.AUTHENTICATION,
  FORBIDDEN: ErrorType.AUTHORIZATION,
  VALIDATION_ERROR: ErrorType.VALIDATION,
  BAD_USER_INPUT: ErrorType.VALIDATION,
  RATE_LIMITED: ErrorType.RATE_LIMIT,
  INTERNAL_SERVER_ERROR: ErrorType.SERVER,
  NOT_FOUND: ErrorType.NOT_FOUND,
};

// User-friendly error messages
const ERROR_MESSAGES: Record<ErrorType, string> = {
  [ErrorType.NETWORK]: "Connection problem. Please check your internet connection.",
  [ErrorType.AUTHENTICATION]: "Please log in to continue.",
  [ErrorType.AUTHORIZATION]: "You don't have permission to perform this action.",
  [ErrorType.VALIDATION]: "Please check your input and try again.",
  [ErrorType.SERVER]: "Server error. Please try again later.",
  [ErrorType.RATE_LIMIT]: "Too many requests. Please wait a moment before trying again.",
  [ErrorType.NOT_FOUND]: "The requested resource was not found.",
  [ErrorType.UNKNOWN]: "An unexpected error occurred. Please try again.",
};

// Error severity mappings
const ERROR_SEVERITY_MAPPINGS: Record<ErrorType, ErrorSeverity> = {
  [ErrorType.NETWORK]: ErrorSeverity.MEDIUM,
  [ErrorType.AUTHENTICATION]: ErrorSeverity.HIGH,
  [ErrorType.AUTHORIZATION]: ErrorSeverity.MEDIUM,
  [ErrorType.VALIDATION]: ErrorSeverity.LOW,
  [ErrorType.SERVER]: ErrorSeverity.HIGH,
  [ErrorType.RATE_LIMIT]: ErrorSeverity.LOW,
  [ErrorType.NOT_FOUND]: ErrorSeverity.MEDIUM,
  [ErrorType.UNKNOWN]: ErrorSeverity.MEDIUM,
};

/**
 * Processes Apollo GraphQL errors and returns structured error information
 */
export function processGraphQLError(error: ApolloError): ProcessedError {
  // Handle network errors
  if (error.networkError) {
    return processNetworkError(error);
  }

  // Handle GraphQL errors
  if (error.graphQLErrors && error.graphQLErrors.length > 0) {
    return processGraphQLErrors(error.graphQLErrors, error);
  }

  // Unknown error
  return {
    type: ErrorType.UNKNOWN,
    severity: ErrorSeverity.MEDIUM,
    message: error.message || ERROR_MESSAGES[ErrorType.UNKNOWN],
    originalError: error,
    shouldRetry: true,
    userAction: "Please try again or contact support if the problem persists.",
  };
}

/**
 * Processes network errors
 */
function processNetworkError(error: ApolloError): ProcessedError {
  const networkError = error.networkError as any;
  
  // Check if it's an authentication error
  if (networkError?.statusCode === 401) {
    return {
      type: ErrorType.AUTHENTICATION,
      severity: ErrorSeverity.HIGH,
      message: "Your session has expired. Please log in again.",
      originalError: error,
      shouldRetry: false,
      userAction: "Please log in again.",
    };
  }

  // Check if it's a server error
  if (networkError?.statusCode >= 500) {
    return {
      type: ErrorType.SERVER,
      severity: ErrorSeverity.HIGH,
      message: "Server is temporarily unavailable. Please try again later.",
      originalError: error,
      shouldRetry: true,
      userAction: "Please wait a moment and try again.",
    };
  }

  // Check if it's offline
  if (!navigator.onLine) {
    return {
      type: ErrorType.NETWORK,
      severity: ErrorSeverity.MEDIUM,
      message: "You appear to be offline. Please check your internet connection.",
      originalError: error,
      shouldRetry: true,
      userAction: "Check your internet connection and try again.",
    };
  }

  return {
    type: ErrorType.NETWORK,
    severity: ErrorSeverity.MEDIUM,
    message: ERROR_MESSAGES[ErrorType.NETWORK],
    originalError: error,
    shouldRetry: true,
    userAction: "Check your connection and try again.",
  };
}

/**
 * Processes GraphQL errors array
 */
function processGraphQLErrors(
  graphQLErrors: readonly any[],
  originalError: ApolloError
): ProcessedError {
  // Take the first error for primary processing
  const primaryError = graphQLErrors[0];
  const errorCode = primaryError.extensions?.code as string;
  
  // Determine error type
  const errorType = errorCode ? 
    ERROR_CODE_MAPPINGS[errorCode] || ErrorType.UNKNOWN : 
    ErrorType.UNKNOWN;

  // Extract validation fields if it's a validation error
  const fields = errorType === ErrorType.VALIDATION ? 
    extractValidationFields(graphQLErrors) : 
    undefined;

  // Create user-friendly message
  let message = primaryError.message;
  if (errorType !== ErrorType.UNKNOWN && !isUserFriendlyMessage(message)) {
    message = ERROR_MESSAGES[errorType];
  }

  // Add field-specific validation messages
  if (errorType === ErrorType.VALIDATION && fields && fields.length > 0) {
    message = `${message} (Fields: ${fields.join(", ")})`;
  }

  return {
    type: errorType,
    severity: ERROR_SEVERITY_MAPPINGS[errorType],
    message,
    originalError,
    code: errorCode,
    fields,
    shouldRetry: shouldRetryError(errorType),
    userAction: getUserAction(errorType),
  };
}

/**
 * Extracts field names from validation errors
 */
function extractValidationFields(errors: readonly any[]): string[] {
  const fields: string[] = [];
  
  errors.forEach(error => {
    if (error.path) {
      const fieldPath = error.path.join(".");
      if (!fields.includes(fieldPath)) {
        fields.push(fieldPath);
      }
    }
  });
  
  return fields;
}

/**
 * Checks if error message is user-friendly
 */
function isUserFriendlyMessage(message: string): boolean {
  const technicalTerms = [
    "GraphQL",
    "resolver",
    "schema",
    "validation",
    "null",
    "undefined",
    "TypeError",
    "ReferenceError",
  ];
  
  return !technicalTerms.some(term => 
    message.toLowerCase().includes(term.toLowerCase())
  );
}

/**
 * Determines if an error type should trigger a retry
 */
function shouldRetryError(errorType: ErrorType): boolean {
  const retryableErrors = [
    ErrorType.NETWORK,
    ErrorType.SERVER,
    ErrorType.RATE_LIMIT,
    ErrorType.UNKNOWN,
  ];
  
  return retryableErrors.includes(errorType);
}

/**
 * Gets user action suggestion for error type
 */
function getUserAction(errorType: ErrorType): string {
  const actions: Record<ErrorType, string> = {
    [ErrorType.NETWORK]: "Check your internet connection and try again.",
    [ErrorType.AUTHENTICATION]: "Please log in again.",
    [ErrorType.AUTHORIZATION]: "Contact an administrator for access.",
    [ErrorType.VALIDATION]: "Please correct the highlighted fields and try again.",
    [ErrorType.SERVER]: "Please wait a moment and try again.",
    [ErrorType.RATE_LIMIT]: "Please wait a moment before trying again.",
    [ErrorType.NOT_FOUND]: "Please check if the resource exists and try again.",
    [ErrorType.UNKNOWN]: "Please try again or contact support if the problem persists.",
  };
  
  return actions[errorType];
}

/**
 * Shows appropriate toast notification for error
 */
export function showErrorToast(processedError: ProcessedError): void {
  const { severity, message, userAction } = processedError;
  
  switch (severity) {
    case ErrorSeverity.CRITICAL:
    case ErrorSeverity.HIGH:
      toast.error(message, {
        description: userAction,
        duration: 6000,
      });
      break;
    
    case ErrorSeverity.MEDIUM:
      toast.error(message, {
        duration: 4000,
      });
      break;
    
    case ErrorSeverity.LOW:
      toast.warning(message, {
        duration: 3000,
      });
      break;
  }
}

/**
 * Logs error for debugging and monitoring
 */
export function logError(processedError: ProcessedError): void {
  const { type, severity, message, originalError, code } = processedError;
  
  const errorInfo = {
    type,
    severity,
    message,
    code,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
  };
  
  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.group(`🚨 GraphQL Error [${severity}]`);
    console.error("Processed Error:", errorInfo);
    console.error("Original Error:", originalError);
    console.groupEnd();
  }
  
  // Send to error tracking service in production
  if (process.env.NODE_ENV === "production") {
    // TODO: Integrate with error tracking service (e.g., Sentry, LogRocket)
    // sendToErrorTracking(errorInfo, originalError);
  }
}

/**
 * Main error handler function
 */
export function handleGraphQLError(error: ApolloError): ProcessedError {
  const processedError = processGraphQLError(error);
  
  // Show toast notification
  showErrorToast(processedError);
  
  // Log error
  logError(processedError);
  
  return processedError;
}

/**
 * React hook for handling errors
 */
export function useErrorHandler() {
  return {
    handleError: handleGraphQLError,
    processError: processGraphQLError,
    showToast: showErrorToast,
    logError,
  };
}

/**
 * Utility to check if error is retryable
 */
export function isRetryableError(error: ApolloError): boolean {
  const processedError = processGraphQLError(error);
  return processedError.shouldRetry;
}

/**
 * Utility to extract error message for display
 */
export function getErrorMessage(error: ApolloError): string {
  const processedError = processGraphQLError(error);
  return processedError.message;
}

/**
 * Utility to check if error requires authentication
 */
export function isAuthenticationError(error: ApolloError): boolean {
  const processedError = processGraphQLError(error);
  return processedError.type === ErrorType.AUTHENTICATION;
} 