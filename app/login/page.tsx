"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLogin, useGetRegistrationStatus, useGetBranding, getGetMeQueryKey } from "@/hooks/use-api";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: regStatus } = useGetRegistrationStatus();
  const { data: branding } = useGetBranding();

  const siteTitle = branding?.siteTitle || "Credential Vault";
  const siteDescription = branding?.siteDescription || "";
  const siteLogo = branding?.siteLogo || "";

  const logoInitials = siteTitle
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "CV";

  const loginMutation = useLogin({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        router.push("/");
      },
      onError: (error: any) => {
        toast({
          title: "Login failed",
          description: error?.data?.error || "Check your credentials and try again.",
          variant: "destructive",
        });
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ data: { username, password, rememberMe } });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          {siteLogo ? (
            <img src={siteLogo} alt="" className="w-14 h-14 object-contain mx-auto mb-5 rounded-2xl" />
          ) : (
            <div className="inline-flex items-center justify-center w-14 h-14 bg-foreground text-background rounded-2xl text-xl font-extrabold mb-5">
              {logoInitials}
            </div>
          )}
          <h1 className="text-3xl font-extrabold tracking-tight">Sign in</h1>
          <p className="text-muted-foreground mt-2 text-[15px]">
            {siteDescription || `Access your ${siteTitle.toLowerCase()}`}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="username" className="text-[13px] font-medium mb-1.5 block">Username</Label>
            <Input
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              className="h-11"
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-[13px] font-medium mb-1.5 block">Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="h-11"
            />
          </div>

          <div className="flex items-center gap-2.5 py-1">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked === true)}
            />
            <Label htmlFor="remember" className="text-[13px] font-normal cursor-pointer text-muted-foreground">
              Stay signed in for 30 days
            </Label>
          </div>

          <Button type="submit" className="w-full h-11 text-[14px] font-semibold" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        {regStatus?.enabled && (
          <p className="text-center text-[13px] text-muted-foreground mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold text-foreground hover:underline underline-offset-4">
              Register
            </Link>
          </p>
        )}
      </div>

      <div className="absolute bottom-6 text-[11px] text-muted-foreground/50 font-mono">
        {siteTitle} — Self-hosted password manager
      </div>
    </div>
  );
}
