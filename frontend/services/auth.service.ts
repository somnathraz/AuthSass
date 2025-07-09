import { useMutation, useQuery, useLazyQuery } from "@apollo/client";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/appStore";

// Import new auth mutations and queries
import {
  LOGIN_MUTATION,
  SIGNUP_MUTATION,
  SOCIAL_LOGIN_MUTATION,
  LOGOUT_MUTATION,
  CHANGE_PASSWORD_MUTATION,
  REQUEST_PASSWORD_RESET_MUTATION,
  RESET_PASSWORD_MUTATION,
  VERIFY_EMAIL_MUTATION,
  RESEND_VERIFICATION_EMAIL_MUTATION,
  REFRESH_TOKEN_MUTATION,
  REVOKE_ALL_TOKENS_MUTATION,
  type LoginInput,
  type SignupInput,
  type SocialLoginInput,
  type ChangePasswordInput,
  type PasswordResetRequestInput,
  type PasswordResetInput,
  type AuthPayload,
  type SignupPayload,
  type PasswordResetPayload,
  type RefreshTokenPayload,
  type SuccessPayload,
  type User,
} from "@/graphql/auth.mutations";

import {
  GET_ME,
  GET_CURRENT_USER,
  GET_USER_PROFILE,
  HEALTH_CHECK,
  VALIDATE_TOKEN,
  CHECK_PASSWORD_STRENGTH,
  GET_USER_ORGANIZATIONS,
  GET_USER_ORG_ACCESS,
  GET_USER_APP_ACCESS,
  GET_USER_APPS,
  type UserOrganizationsInput,
  type UserAppsInput,
  type HealthCheck,
  type TokenValidationResult,
  type PasswordStrengthResult,
  type UserOrganization,
  type UserOrgAccess,
  type UserAppAccess,
} from "@/graphql/auth.queries";

/**
 * Authentication Service
 * 
 * Comprehensive authentication service using all working backend resolvers.
 * Provides type-safe hooks for all authentication operations.
 */

// ========================================
// CORE AUTHENTICATION HOOKS
// ========================================

/**
 * Login Hook
 * Uses the working login mutation with proper error handling
 */
export const useLogin = () => {
  const [loginMutation, { loading, error }] = useMutation<{ login: AuthPayload }>(LOGIN_MUTATION);
  const setUser = useAppStore((state) => state.setUser);
  const router = useRouter();

  const login = async (input: LoginInput) => {
    try {
      const response = await loginMutation({
        variables: { input },
      });

      if (response.data?.login.success && response.data.login.user) {
        const { user, accessToken, refreshToken, requirePasswordReset } = response.data.login;

        // Store tokens
        if (accessToken) {
          localStorage.setItem("accessToken", accessToken);
          document.cookie = `token=${accessToken}; path=/; max-age=86400; secure; samesite=strict`;
        }
        if (refreshToken) {
          localStorage.setItem("refreshToken", refreshToken);
        }

        // Update app store
        setUser({
          id: user.id,
          name: user.username,
          email: user.email,
          image: user.profileImage,
        });

        // Handle password reset requirement
        if (requirePasswordReset) {
          router.push("/change-password");
          return response;
        }

        // Redirect based on organization
        if (user.organizationId) {
          router.push(`/dashboard/${user.organizationId}`);
        } else {
          router.push("/dashboard");
        }

        return response;
      } else {
        throw new Error(response.data?.login.errors?.[0]?.message || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      throw err;
    }
  };

  return { login, loading, error };
};

/**
 * Signup Hook
 * Uses the working signup mutation with proper error handling
 */
export const useSignup = () => {
  const [signupMutation, { loading, error }] = useMutation<{ signup: SignupPayload }>(SIGNUP_MUTATION);
  const setUser = useAppStore((state) => state.setUser);
  const router = useRouter();

  const signup = async (input: SignupInput) => {
    try {
      const response = await signupMutation({
        variables: { input },
      });

      if (response.data?.signup.success && response.data.signup.user) {
        const { user, accessToken, refreshToken, requiresEmailVerification } = response.data.signup;

        // Store tokens
        if (accessToken) {
          localStorage.setItem("accessToken", accessToken);
          document.cookie = `token=${accessToken}; path=/; max-age=86400; secure; samesite=strict`;
        }
        if (refreshToken) {
          localStorage.setItem("refreshToken", refreshToken);
        }

        // Update app store
        setUser({
          id: user.id,
          name: user.username,
          email: user.email,
          image: user.profileImage,
        });

        // Handle email verification requirement
        if (requiresEmailVerification) {
          router.push("/verify-email");
          return response;
        }

        // Redirect to dashboard
        if (user.organizationId) {
          router.push(`/dashboard/${user.organizationId}`);
        } else {
          router.push("/dashboard");
        }

        return response;
      } else {
        throw new Error(response.data?.signup.errors?.[0]?.message || "Signup failed");
      }
    } catch (err) {
      console.error("Signup error:", err);
      throw err;
    }
  };

  return { signup, loading, error };
};

/**
 * Social Login Hook
 * Uses the working social login mutation
 */
export const useSocialLogin = () => {
  const [socialLoginMutation, { loading, error }] = useMutation<{ socialLogin: AuthPayload }>(SOCIAL_LOGIN_MUTATION);
  const setUser = useAppStore((state) => state.setUser);
  const router = useRouter();

  const socialLogin = async (provider: string, token: string, redirectUri?: string) => {
    try {
      const input: SocialLoginInput = { provider, token, redirectUri };
      const response = await socialLoginMutation({
        variables: { input },
      });

      if (response.data?.socialLogin.success && response.data.socialLogin.user) {
        const { user, accessToken, refreshToken, requirePasswordReset } = response.data.socialLogin;

        // Store tokens
        if (accessToken) {
          localStorage.setItem("accessToken", accessToken);
          document.cookie = `token=${accessToken}; path=/; max-age=86400; secure; samesite=strict`;
        }
        if (refreshToken) {
          localStorage.setItem("refreshToken", refreshToken);
        }

        // Update app store
        setUser({
          id: user.id,
          name: user.username || user.email.split('@')[0],
          email: user.email,
          image: user.profileImage,
        });

        // Handle password reset requirement
        if (requirePasswordReset) {
          router.push("/change-password");
          return response;
        }

        // Redirect based on organization
        if (user.organizationId) {
          router.push(`/dashboard/${user.organizationId}`);
        } else {
          router.push("/dashboard");
        }

        return response;
      } else {
        throw new Error(response.data?.socialLogin.errors?.[0]?.message || "Social login failed");
      }
    } catch (err) {
      console.error("Social login error:", err);
      throw err;
    }
  };

  return { socialLogin, loading, error };
};

/**
 * Logout Hook
 * Uses the working logout mutation
 */
export const useLogout = () => {
  const [logoutMutation, { loading, error }] = useMutation<{ logout: SuccessPayload }>(LOGOUT_MUTATION);
  const clearUser = useAppStore((state) => state.clearUser);
  const router = useRouter();

  const logout = async () => {
    try {
      await logoutMutation();

      // Clear tokens
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

      // Clear app store
      clearUser();

      // Redirect to login
      router.push("/login");
    } catch (err) {
      console.error("Logout error:", err);
      // Even if logout fails on server, clear local state
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      clearUser();
      router.push("/login");
    }
  };

  return { logout, loading, error };
};

// ========================================
// PASSWORD MANAGEMENT HOOKS
// ========================================

/**
 * Change Password Hook
 */
export const useChangePassword = () => {
  const [changePasswordMutation, { loading, error }] = useMutation<{ changePassword: PasswordResetPayload }>(CHANGE_PASSWORD_MUTATION);

  const changePassword = async (input: ChangePasswordInput) => {
    try {
      const response = await changePasswordMutation({
        variables: { input },
      });

      if (response.data?.changePassword.success) {
        return response;
      } else {
        throw new Error(response.data?.changePassword.errors?.[0]?.message || "Password change failed");
      }
    } catch (err) {
      console.error("Change password error:", err);
      throw err;
    }
  };

  return { changePassword, loading, error };
};

/**
 * Request Password Reset Hook
 */
export const useRequestPasswordReset = () => {
  const [requestPasswordResetMutation, { loading, error }] = useMutation<{ requestPasswordReset: PasswordResetPayload }>(REQUEST_PASSWORD_RESET_MUTATION);

  const requestPasswordReset = async (input: PasswordResetRequestInput) => {
    try {
      const response = await requestPasswordResetMutation({
        variables: { input },
      });

      if (response.data?.requestPasswordReset.success) {
        return response;
      } else {
        throw new Error(response.data?.requestPasswordReset.errors?.[0]?.message || "Password reset request failed");
      }
    } catch (err) {
      console.error("Request password reset error:", err);
      throw err;
    }
  };

  return { requestPasswordReset, loading, error };
};

/**
 * Reset Password Hook
 */
export const useResetPassword = () => {
  const [resetPasswordMutation, { loading, error }] = useMutation<{ resetPassword: PasswordResetPayload }>(RESET_PASSWORD_MUTATION);

  const resetPassword = async (input: PasswordResetInput) => {
    try {
      const response = await resetPasswordMutation({
        variables: { input },
      });

      if (response.data?.resetPassword.success) {
        return response;
      } else {
        throw new Error(response.data?.resetPassword.errors?.[0]?.message || "Password reset failed");
      }
    } catch (err) {
      console.error("Reset password error:", err);
      throw err;
    }
  };

  return { resetPassword, loading, error };
};

// ========================================
// USER PROFILE HOOKS
// ========================================

/**
 * Get Current User Hook
 */
export const useMe = () => {
  return useQuery<{ me: User }>(GET_ME, {
    errorPolicy: "all",
    fetchPolicy: "cache-and-network",
  });
};

/**
 * Check if user is authenticated
 */
export const useIsAuthenticated = () => {
  const { data, loading, error } = useMe();
  
  return {
    isAuthenticated: !!data?.me?.id,
    user: data?.me,
    loading,
    error,
  };
};

/**
 * Get stored tokens
 */
export const getStoredTokens = () => {
  if (typeof window === "undefined") return { accessToken: null, refreshToken: null };
  
  return {
    accessToken: localStorage.getItem("accessToken"),
    refreshToken: localStorage.getItem("refreshToken"),
  };
};

/**
 * Clear stored tokens
 */
export const clearStoredTokens = () => {
  if (typeof window === "undefined") return;
  
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
}; 