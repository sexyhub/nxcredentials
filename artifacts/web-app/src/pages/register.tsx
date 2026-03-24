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
        toast({ title: "Account created" });
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
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-[360px] border p-8 text-center">
          <ShieldAlert className="w-8 h-8 mx-auto mb-4 text-destructive" />
          <h1 className="text-lg font-bold mb-2">Registration Closed</h1>
          <p className="text-sm text-muted-foreground mb-6">The administrator has disabled new registrations.</p>
          <Button asChild className="w-full h-11">
            <Link href="/login">Back to Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-[360px]">
        <div className="mb-8">
          <div className="w-10 h-10 bg-foreground flex items-center justify-center mb-6">
            <UserPlus className="w-5 h-5 text-background" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Create account</h1>
          <p className="text-sm text-muted-foreground mt-1">Set up your credential vault</p>
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
              placeholder="Choose a username"
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
              placeholder="Create a password"
              className="h-11"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-11"
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? "Creating..." : "Create account"}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t text-center">
          <span className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-foreground font-medium underline underline-offset-4">
              Sign in
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}
