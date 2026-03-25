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
import { PinInput } from "@/components/pin-input";
import { Shield, KeyRound, Hash } from "lucide-react";

interface VaultUnlockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUnlocked: () => void;
  vaultId: number;
  vaultName?: string;
}

export function VaultUnlockModal({ open, onOpenChange, onUnlocked, vaultId, vaultName }: VaultUnlockModalProps) {
  const [mode, setMode] = useState<"password" | "pin">("pin");
  const [value, setValue] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const verifyMutation = useVerifyVault({
    mutation: {
      onSuccess: () => {
        setValue("");
        setPin("");
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
      if (pin.length < 4) { setError("PIN must be at least 4 digits."); return; }
      verifyMutation.mutate({ id: vaultId, data: { pin } });
    }
  };

  const reset = () => { setValue(""); setPin(""); setError(""); };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
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
            onClick={() => { setMode("pin"); reset(); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[12px] font-semibold rounded-md transition-colors ${
              mode === "pin" ? "bg-background shadow-sm" : "text-muted-foreground"
            }`}
          >
            <Hash className="w-3 h-3" />
            PIN
          </button>
          <button
            type="button"
            onClick={() => { setMode("password"); reset(); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[12px] font-semibold rounded-md transition-colors ${
              mode === "password" ? "bg-background shadow-sm" : "text-muted-foreground"
            }`}
          >
            <KeyRound className="w-3 h-3" />
            Password
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "password" ? (
            <div className="space-y-1.5">
              <Label htmlFor="vault-password" className="text-[13px]">Vault password</Label>
              <Input
                id="vault-password"
                type="password"
                required
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Enter vault password"
                className="h-10"
                autoFocus
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="text-[13px] block text-center">Vault PIN</Label>
              <PinInput value={pin} onChange={setPin} length={4} autoFocus />
              <p className="text-[11px] text-muted-foreground text-center">Enter your 4-digit PIN</p>
            </div>
          )}

          {error && <p className="text-[12px] text-destructive text-center">{error}</p>}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-9 text-[13px]">Cancel</Button>
            <Button
              type="submit"
              disabled={verifyMutation.isPending || (mode === "pin" && pin.length < 4)}
              className="h-9 text-[13px]"
            >
              {verifyMutation.isPending ? "Verifying..." : "Unlock"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
