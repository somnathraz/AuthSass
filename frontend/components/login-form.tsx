"use client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AiOutlineEyeInvisible, AiOutlineEye } from "react-icons/ai";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Theme } from "@/Theme/Theme";

// Import new auth service
import { useLogin, useSocialLogin } from "@/services/auth.service";
import type { LoginInput } from "@/graphql/auth.mutations";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { login, loading: loginLoading } = useLogin();
  const { socialLogin, loading: socialLoginLoading } = useSocialLogin();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // State object for field errors
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({}); // reset previous errors
    
    try {
      const input: LoginInput = {
        email,
        password,
        rememberMe: true, // Default to true for better UX
      };
      
      await login(input);
      // Navigation is handled in the login hook
    } catch (error: unknown) {
      if (error instanceof Error) {
        const errMsg = error.message;
        const fieldErrors: {
          email?: string;
          password?: string;
          general?: string;
        } = {};

        // Check error message for known error types
        if (errMsg.toLowerCase().includes("password")) {
          fieldErrors.password = errMsg;
        } else if (errMsg.toLowerCase().includes("not found") || errMsg.toLowerCase().includes("email")) {
          fieldErrors.email = errMsg;
        } else {
          fieldErrors.general = errMsg;
        }
        setErrors(fieldErrors);
        console.error("Login error:", errMsg);
      } else {
        console.error("Login error:", error);
        setErrors({ general: "An unexpected error occurred. Please try again." });
      }
    }
  };

  const handleGoogleSignIn = async () => {
    if (
      typeof window !== "undefined" &&
      window.google &&
      window.google.accounts &&
      window.google.accounts.id
    ) {
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        callback: async (response: { credential: string }) => {
          try {
            const googleIdToken = response.credential;
            console.log("Google ID Token received:", googleIdToken.substring(0, 20) + "...");

            await socialLogin("google", googleIdToken);
            // Navigation is handled in the socialLogin hook
          } catch (err) {
            console.error("Google login error:", err);
            setErrors({ 
              general: err instanceof Error ? err.message : "Social login failed. Please try again." 
            });
          }
        },
      });
      // Trigger the prompt to show the Google One Tap dialog
      window.google.accounts.id.prompt();
    } else {
      console.error("Google Identity Services not loaded");
      setErrors({ general: "Google Sign-In is not available. Please try again." });
    }
  };

  const isLoading = loginLoading || socialLoginLoading;

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>
            Login with your Apple or Google account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="flex flex-col gap-4">
              <Button variant="outline" className="w-full" disabled={isLoading}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path
                    d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
                    fill="currentColor"
                  />
                </svg>
                Login with Apple
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path
                    d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                    fill="currentColor"
                  />
                </svg>
                {socialLoginLoading ? "Signing in..." : "Login with Google"}
              </Button>
            </div>
            <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
              <span className="bg-card text-muted-foreground relative z-10 px-2">
                Or continue with
              </span>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email)
                        setErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    placeholder="m@example.com"
                    required
                    disabled={isLoading}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email}</p>
                  )}
                </div>
                <div className="grid gap-3 relative">
                  <div className="flex items-center relative">
                    <Label htmlFor="password">Password</Label>
                    <a
                      href="/forgot-password"
                      className="ml-auto text-sm underline-offset-4 hover:underline"
                    >
                      Forgot your password?
                    </a>
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password)
                        setErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    disabled={isLoading}
                  />
                  {errors.password && (
                    <p className="text-sm text-red-500">{errors.password}</p>
                  )}
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute bottom-[0.6rem] right-2 cursor-pointer"
                  >
                    {showPassword ? (
                      <AiOutlineEyeInvisible color={Theme.colors.inactive} />
                    ) : (
                      <AiOutlineEye color={Theme.colors.inactive} />
                    )}
                  </span>
                </div>
                {errors.general && (
                  <p className="text-sm text-red-500 text-center">
                    {errors.general}
                  </p>
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {loginLoading ? "Signing in..." : "Login"}
                </Button>
              </div>
              <div className="text-center text-sm">
                Don&apos;t have an account?{" "}
                <a href="/signup" className="underline underline-offset-4">
                  Sign up
                </a>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
      <div className="text-muted-foreground text-center text-xs">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
}
