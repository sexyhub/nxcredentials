"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRegister, useGetRegistrationStatus, useGetBranding, getGetMeQueryKey } from "@/hooks/use-api";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: regStatus, isLoading } = useGetRegistrationStatus();
  const { data: branding } = useGetBranding();

  const siteTitle = branding?.siteTitle || "Credential Vault";
  const siteLogo = branding?.siteLogo || "";

  const logoInitials = siteTitle
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "CV";

  const registerMutation = useRegister({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        toast({ title: "Account created" });
        router.push("/");
      },
      onError: (error: any) => {
        toast({
          title: "Registration failed",
          description: error?.data?.error || "Try a different username.",
          variant: "destructive",
        });
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate({ data: { username, password } });
  };

  if (isLoading) return null;

  if (regStatus && !regStatus.enabled) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="text-center max-w-sm">
          <ShieldAlert className="w-10 h-10 text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Registration Closed</h1>
          <p className="text-muted-foreground text-[14px] mb-6">New signups are currently disabled by the administrator.</p>
          <Button asChild className="h-11 px-8">
            <Link href="/login">Back to login</Link>
          </Button>
        </div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-extrabold tracking-tight">Create account</h1>
          <p className="text-muted-foreground mt-2 text-[15px]">Start managing your credentials securely</p>
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
              placeholder="Choose username"
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
              placeholder="Choose password"
              className="h-11"
            />
          </div>

          <Button type="submit" className="w-full h-11 text-[14px] font-semibold" disabled={registerMutation.isPending}>
            {registerMutation.isPending ? "Creating..." : "Create account"}
          </Button>
        </form>

        <p className="text-center text-[13px] text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-foreground hover:underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
