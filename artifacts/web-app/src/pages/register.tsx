import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useRegister, useGetRegistrationStatus, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ShieldAlert, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: regStatus, isLoading } = useGetRegistrationStatus();

  const registerMutation = useRegister({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        toast({ title: "Account created successfully" });
        setLocation("/");
      },
      onError: (error: any) => {
        toast({
          title: "Registration failed",
          description: error?.data?.error || "Could not create account",
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
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <div className="w-full max-w-[380px] bg-card border border-border rounded-xl p-8 text-center shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-destructive/10 flex items-center justify-center mx-auto mb-3">
            <ShieldAlert className="w-5 h-5 text-destructive" />
          </div>
          <h1 className="text-lg font-semibold mb-1.5">Registration Closed</h1>
          <p className="text-sm text-muted-foreground mb-5">New account registration has been disabled by the administrator.</p>
          <Button asChild className="w-full">
            <Link href="/login">Back to Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-[380px]">
        <div className="flex flex-col items-center mb-6">
          <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center mb-3">
            <UserPlus className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Create your account</h1>
          <p className="text-sm text-muted-foreground mt-1">Get started with Credential Vault</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <div className="mt-5 pt-4 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-foreground font-medium hover:underline underline-offset-4">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
