import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useRegister, useGetRegistrationStatus, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ShieldAlert, Lock, ArrowRight } from "lucide-react";
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
        <div className="w-full max-w-[380px] text-center">
          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-5">
            <ShieldAlert className="w-6 h-6 text-destructive" />
          </div>
          <h1 className="text-xl font-bold mb-2">Registration Closed</h1>
          <p className="text-[14px] text-muted-foreground mb-6">The administrator has disabled new account creation.</p>
          <Button asChild className="h-10">
            <Link href="/login">Back to Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-[380px]">
        <div className="flex items-center gap-2.5 mb-10">
          <div className="w-8 h-8 bg-foreground rounded-lg flex items-center justify-center">
            <Lock className="w-4 h-4 text-background" />
          </div>
          <span className="font-semibold text-sm">Credential Vault</span>
        </div>

        <div className="mb-8">
          <h1 className="text-[26px] font-bold tracking-tight">Create your account</h1>
          <p className="text-muted-foreground text-[15px] mt-1.5">Get started with your secure vault</p>
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
              placeholder="Choose a username"
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
              placeholder="Create a strong password"
              className="h-10"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-10 mt-2"
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? "Creating account..." : "Create account"}
            {!registerMutation.isPending && <ArrowRight className="w-4 h-4 ml-1.5" />}
          </Button>
        </form>

        <p className="text-center text-[13px] text-muted-foreground mt-8">
          Already have an account?{" "}
          <Link href="/login" className="text-foreground font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
