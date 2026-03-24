import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useRegister, useGetRegistrationStatus, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ShieldAlert, ArrowRight } from "lucide-react";
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
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-[360px] text-center">
          <ShieldAlert className="w-8 h-8 text-destructive mx-auto mb-5" />
          <h1 className="text-xl font-bold mb-2">Registration Closed</h1>
          <p className="text-[14px] text-muted-foreground mb-6">New accounts are not available at this time.</p>
          <Button asChild className="h-11">
            <Link href="/login">Back to login</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-[360px]">
        <div className="mb-10">
          <div className="flex items-center gap-2">
            <div className="w-[6px] h-[6px] rounded-full bg-foreground/40" />
            <span className="text-[13px] font-medium text-muted-foreground tracking-wide">CREDENTIAL VAULT</span>
          </div>
        </div>

        <h1 className="text-[28px] font-bold tracking-tight">Create account</h1>
        <p className="text-muted-foreground text-[14px] mt-1">Set up your secure vault in seconds.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="username" className="text-[13px]">Username</Label>
            <Input
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
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
              placeholder="Create a password"
              className="h-11 bg-transparent"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-11 text-[14px]"
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? "Creating..." : "Create account"}
            {!registerMutation.isPending && <ArrowRight className="w-4 h-4 ml-1" />}
          </Button>
        </form>

        <p className="text-center text-[13px] text-muted-foreground mt-8">
          Already registered?{" "}
          <Link href="/login" className="text-foreground font-medium hover:underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
