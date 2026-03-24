import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useLogin, useGetRegistrationStatus, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Lock } from "lucide-react";
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
      <div className="hidden lg:flex lg:w-1/2 bg-foreground items-center justify-center p-12">
        <div className="max-w-md">
          <div className="w-12 h-12 border border-white/20 flex items-center justify-center mb-8">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-white tracking-tight leading-tight mb-4">
            Your credentials,<br />locked down.
          </h2>
          <p className="text-white/50 text-sm leading-relaxed">
            A secure vault for all your passwords, keys, and sensitive data. Zero-knowledge, session-based authentication.
          </p>
          <div className="mt-12 flex gap-4">
            <div className="border border-white/10 px-3 py-2">
              <div className="text-xs text-white/40 font-mono">ENCRYPTED</div>
            </div>
            <div className="border border-white/10 px-3 py-2">
              <div className="text-xs text-white/40 font-mono">SESSION-BASED</div>
            </div>
            <div className="border border-white/10 px-3 py-2">
              <div className="text-xs text-white/40 font-mono">SELF-HOSTED</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[360px]">
          <div className="mb-8">
            <div className="lg:hidden w-10 h-10 bg-foreground flex items-center justify-center mb-6">
              <Lock className="w-5 h-5 text-background" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Sign in</h1>
            <p className="text-sm text-muted-foreground mt-1">Enter your credentials to access the vault</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Username</Label>
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

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Password</Label>
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

            <div className="flex items-center gap-2.5">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
              />
              <Label htmlFor="remember" className="text-sm font-normal cursor-pointer text-muted-foreground">
                Keep me signed in for 30 days
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full h-11"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Authenticating..." : "Sign in"}
            </Button>
          </form>

          {regStatus?.enabled && (
            <div className="mt-8 pt-6 border-t text-center">
              <span className="text-sm text-muted-foreground">
                No account?{" "}
                <Link href="/register" className="text-foreground font-medium underline underline-offset-4">
                  Register
                </Link>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
