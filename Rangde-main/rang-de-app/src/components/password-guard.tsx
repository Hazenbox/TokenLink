"use client";

import * as React from "react";
import { useAuthStore } from "@/store/auth-store";
import { Input } from "@/components/ui/input";
import Image from "next/image";

export function PasswordGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, checkAuth, login } = useAuthStore();
  const [mounted, setMounted] = React.useState(false);
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  // Check authentication on mount
  React.useEffect(() => {
    setMounted(true);
    checkAuth();
  }, [checkAuth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const success = await login(password, false);
      
      if (!success) {
        setError("Incorrect password. Please try again.");
        setPassword("");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render anything until mounted (avoid hydration issues)
  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  // Show password form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-xs space-y-6">
          {/* Logo */}
          <div className="flex flex-col items-center space-y-2">
            <Image
              src="/logo.svg"
              alt="Rang De"
              width={120}
              height={36}
              className="dark:invert"
              priority
            />
            <p className="text-sm text-muted-foreground">Enter password to continue</p>
          </div>

          {/* Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Password Input with Unlock Button */}
            <div className="relative w-full">
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="rounded-full pr-24 h-10"
                autoFocus
                disabled={isLoading}
                required
              />
              <button
                type="submit"
                disabled={isLoading || !password}
                className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-white dark:bg-foreground text-black dark:text-background font-semibold text-sm py-1.5 px-4 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center gap-1.5">
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    <span className="text-xs">Wait</span>
                  </span>
                ) : (
                  "Unlock"
                )}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
          </form>
        </div>
      </div>
    );
  }

  // Show app content if authenticated
  return <>{children}</>;
}
