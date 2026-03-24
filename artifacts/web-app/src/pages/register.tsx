import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useRegister, useGetRegistrationStatus, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ShieldAlert, UserPlus } from "lucide-react";

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
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-card border border-border rounded-lg p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6 text-destructive" />
          </div>
          <h1 className="text-xl font-bold mb-2">Registration Closed</h1>
          <p className="text-sm text-muted-foreground mb-6">New account registration has been disabled by the administrator.</p>
          <Link href="/login" className="inline-block w-full h-10 leading-10 rounded-md bg-primary text-primary-foreground font-medium hover:brightness-110 transition-all text-center">
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
            <UserPlus className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Create Account</h1>
          <p className="text-sm text-muted-foreground mt-1">Set up your credential vault</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-muted-foreground">Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full h-10 px-3 rounded-md bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-colors"
                placeholder="Choose a username"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-muted-foreground">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-10 px-3 rounded-md bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-colors"
                placeholder="Choose a password"
              />
            </div>

            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full h-10 rounded-md bg-primary text-primary-foreground font-medium hover:brightness-110 transition-all disabled:opacity-50"
            >
              {registerMutation.isPending ? "Creating account..." : "Create account"}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
