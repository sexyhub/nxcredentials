import { useState } from "react";
import { useVerifyVault } from "@workspace/api-client-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, KeyRound, Hash } from "lucide-react";

interface VaultUnlockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUnlocked: () => void;
  vaultId: number;
  vaultName?: string;
}

export function VaultUnlockModal({ open, onOpenChange, onUnlocked, vaultId, vaultName }: VaultUnlockModalProps) {
  const [mode, setMode] = useState<"password" | "pin">("password");
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  const verifyMutation = useVerifyVault({
    mutation: {
      onSuccess: () => {
        setValue("");
        setError("");
        onUnlocked();
        onOpenChange(false);
      },
      onError: (err: any) => {
        setError(err?.data?.error || "Verification failed.");
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (mode === "password") {
      verifyMutation.mutate({ id: vaultId, data: { password: value } });
    } else {
      verifyMutation.mutate({ id: vaultId, data: { pin: value } });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setValue(""); setError(""); } onOpenChange(v); }}>
      <DialogContent className="sm:max-w-sm">
        <div className="flex flex-col items-center gap-3 pt-2 pb-1">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
            <Shield className="w-6 h-6 text-amber-500" />
          </div>
          <div className="text-center">
            <h3 className="text-[16px] font-bold">Unlock {vaultName || "vault"}</h3>
            <p className="text-[13px] text-muted-foreground mt-0.5">Enter your vault password or PIN</p>
          </div>
        </div>

        <div className="flex gap-1 bg-accent rounded-lg p-1">
          <button
            type="button"
            onClick={() => { setMode("password"); setValue(""); setError(""); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[12px] font-semibold rounded-md transition-colors ${
              mode === "password" ? "bg-background shadow-sm" : "text-muted-foreground"
            }`}
          >
            <KeyRound className="w-3 h-3" />
            Password
          </button>
          <button
            type="button"
            onClick={() => { setMode("pin"); setValue(""); setError(""); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[12px] font-semibold rounded-md transition-colors ${
              mode === "pin" ? "bg-background shadow-sm" : "text-muted-foreground"
            }`}
          >
            <Hash className="w-3 h-3" />
            PIN
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="vault-input" className="text-[13px]">
              {mode === "password" ? "Vault password" : "Vault PIN"}
            </Label>
            <Input
              id="vault-input"
              type="password"
              inputMode={mode === "pin" ? "numeric" : undefined}
              required
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={mode === "password" ? "Enter vault password" : "Enter 4-8 digit PIN"}
              className="h-10"
              autoFocus
            />
            {error && (
              <p className="text-[12px] text-destructive">{error}</p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-9 text-[13px]">Cancel</Button>
            <Button type="submit" disabled={verifyMutation.isPending} className="h-9 text-[13px]">
              {verifyMutation.isPending ? "Verifying..." : "Unlock"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
