import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useLogin, useGetRegistrationStatus, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight } from "lucide-react";
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
    <div className="min-h-screen flex bg-background">
      <div className="hidden lg:flex lg:w-[44%] bg-[hsl(30,12%,10%)] relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-2">
            <div className="w-[6px] h-[6px] rounded-full bg-white/40" />
            <span className="text-[13px] font-medium text-white/50 tracking-wide">CREDENTIAL VAULT</span>
          </div>

          <div>
            <h2 className="text-[40px] font-bold text-white leading-[1.1] tracking-tight">
              Keep every<br />password in<br />one place.
            </h2>
            <p className="text-[15px] text-white/35 leading-relaxed mt-5 max-w-[320px]">
              A minimal, self-hosted credential manager with encrypted storage and session-based auth.
            </p>
          </div>

          <div className="flex gap-8">
            <div>
              <div className="text-[28px] font-bold text-white/90 font-mono tabular-nums">256</div>
              <div className="text-[11px] text-white/30 mt-0.5">bit encryption</div>
            </div>
            <div className="w-px bg-white/10" />
            <div>
              <div className="text-[28px] font-bold text-white/90 font-mono tabular-nums">0</div>
              <div className="text-[11px] text-white/30 mt-0.5">third parties</div>
            </div>
            <div className="w-px bg-white/10" />
            <div>
              <div className="text-[28px] font-bold text-white/90 font-mono tabular-nums">100%</div>
              <div className="text-[11px] text-white/30 mt-0.5">self-hosted</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-[360px]">
          <div className="lg:hidden mb-10">
            <div className="flex items-center gap-2">
              <div className="w-[6px] h-[6px] rounded-full bg-foreground/40" />
              <span className="text-[13px] font-medium text-muted-foreground tracking-wide">CREDENTIAL VAULT</span>
            </div>
          </div>

          <h1 className="text-[28px] font-bold tracking-tight">Welcome back</h1>
          <p className="text-muted-foreground text-[14px] mt-1">Enter your details to sign in.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-[13px]">Username</Label>
              <Input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your username"
                className="h-11 bg-transparent"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[13px]">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                className="h-11 bg-transparent"
              />
            </div>

            <div className="flex items-center gap-2.5">
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
              className="w-full h-11 text-[14px]"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Signing in..." : "Continue"}
              {!loginMutation.isPending && <ArrowRight className="w-4 h-4 ml-1" />}
            </Button>
          </form>

          {regStatus?.enabled && (
            <p className="text-center text-[13px] text-muted-foreground mt-8">
              No account yet?{" "}
              <Link href="/register" className="text-foreground font-medium hover:underline underline-offset-4">
                Create one
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
