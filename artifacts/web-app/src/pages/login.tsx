import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useLogin, useGetRegistrationStatus, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: regStatus } = useGetRegistrationStatus();

  const loginMutation = useLogin({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setLocation("/");
      },
      onError: (error: any) => {
        toast({
          title: "Authentication failed",
          description: error?.data?.error || "Invalid credentials",
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
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-[480px] bg-[hsl(225,15%,11%)] flex-col justify-between p-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
            <Lock className="w-4 h-4 text-white/70" />
          </div>
          <span className="text-white/90 font-semibold text-sm">Credential Vault</span>
        </div>

        <div>
          <h2 className="text-[32px] font-bold text-white leading-[1.15] tracking-tight mb-4">
            Securely manage<br />all your credentials
          </h2>
          <p className="text-white/40 text-[15px] leading-relaxed max-w-[340px]">
            Store passwords, API keys, and sensitive data with session-based authentication and encrypted storage.
          </p>
        </div>

        <div className="flex items-center gap-6">
          <span className="text-[11px] font-medium text-white/25 uppercase tracking-wider">Encrypted</span>
          <span className="text-white/10">·</span>
          <span className="text-[11px] font-medium text-white/25 uppercase tracking-wider">Session-based</span>
          <span className="text-white/10">·</span>
          <span className="text-[11px] font-medium text-white/25 uppercase tracking-wider">Self-hosted</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-[380px]">
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="w-8 h-8 bg-foreground rounded-lg flex items-center justify-center">
              <Lock className="w-4 h-4 text-background" />
            </div>
            <span className="font-semibold text-sm">Credential Vault</span>
          </div>

          <div className="mb-8">
            <h1 className="text-[26px] font-bold tracking-tight">Welcome back</h1>
            <p className="text-muted-foreground text-[15px] mt-1.5">Sign in to access your vault</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-[13px] font-medium">Username</Label>
              <Input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[13px] font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="h-10"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
              />
              <Label htmlFor="remember" className="text-[13px] font-normal cursor-pointer text-muted-foreground">
                Remember me for 30 days
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full h-10 mt-2"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Signing in..." : "Sign in"}
              {!loginMutation.isPending && <ArrowRight className="w-4 h-4 ml-1.5" />}
            </Button>
          </form>

          {regStatus?.enabled && (
            <p className="text-center text-[13px] text-muted-foreground mt-8">
              Don't have an account?{" "}
              <Link href="/register" className="text-foreground font-medium hover:underline">
                Create one
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
