import { useState, useEffect } from "react";
import {
  useCreateCredential,
  useUpdateCredential,
  useListCategories,
  getListCredentialsQueryKey,
  getGetStatsQueryKey,
  type Credential
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { SERVICE_TYPES, getServiceType } from "@/lib/service-types";
import { Shield } from "lucide-react";

interface CredentialModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  credential?: Credential | null;
}

export function CredentialModal({ open, onOpenChange, credential }: CredentialModalProps) {
  const isEditing = !!credential;

  const [typeKey, setTypeKey] = useState("other");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [isVault, setIsVault] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: categories } = useListCategories();

  useEffect(() => {
    if (open) {
      if (credential) {
        setTypeKey(credential.title || "other");
        setEmail(credential.email);
        setPassword(credential.password);
        setCategoryId(credential.categoryId);
        setIsVault(credential.isVault ?? false);
      } else {
        setTypeKey("other");
        setEmail("");
        setPassword("");
        setCategoryId(null);
        setIsVault(false);
      }
    }
  }, [open, credential]);

  const createMutation = useCreateCredential({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCredentialsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
        toast({ title: "Credential added" });
        onOpenChange(false);
      },
    },
  });

  const updateMutation = useUpdateCredential({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCredentialsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
        toast({ title: "Credential updated" });
        onOpenChange(false);
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { title: typeKey, email, password, categoryId, isVault };
    if (isEditing && credential) {
      updateMutation.mutate({ id: credential.id, data });
    } else {
      createMutation.mutate({ data });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const typeOptions = SERVICE_TYPES.map((t) => {
    const Icon = t.icon;
    return {
      value: t.key,
      label: t.label,
      icon: <Icon className="w-3.5 h-3.5" style={{ color: t.color }} />,
    };
  });

  const tagOptions = [
    { value: "none", label: "No tag" },
    ...(categories?.map((cat) => ({
      value: String(cat.id),
      label: cat.name,
      icon: <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />,
    })) || []),
  ];

  const selectedType = getServiceType(typeKey);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label className="text-[13px]">Type</Label>
            <Combobox
              options={typeOptions}
              value={typeKey}
              onValueChange={(val) => setTypeKey(val || "other")}
              placeholder="Select service type"
              searchPlaceholder="Search services..."
              emptyText="No match."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cred-email" className="text-[13px]">Email / Username</Label>
              <Input id="cred-email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@email.com" className="h-10 bg-transparent" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cred-password" className="text-[13px]">Password</Label>
              <Input id="cred-password" type="text" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="h-10 bg-transparent" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[13px]">Tag</Label>
            <Combobox
              options={tagOptions}
              value={categoryId ? String(categoryId) : "none"}
              onValueChange={(val) => setCategoryId(val && val !== "none" ? Number(val) : null)}
              placeholder="Select tag"
              searchPlaceholder="Search tags..."
              emptyText="No tags."
            />
          </div>

          <button
            type="button"
            onClick={() => setIsVault(!isVault)}
            className={`w-full flex items-center gap-3 p-3 border rounded-xl transition-colors ${
              isVault
                ? "border-amber-500/40 bg-amber-500/5"
                : "hover:bg-accent/50"
            }`}
          >
            <Shield className={`w-4 h-4 shrink-0 ${isVault ? "text-amber-500" : "text-muted-foreground/40"}`} />
            <div className="text-left flex-1">
              <div className={`text-[13px] font-semibold ${isVault ? "text-amber-600 dark:text-amber-400" : ""}`}>
                Secure vault
              </div>
              <div className="text-[11px] text-muted-foreground">
                Requires vault password or PIN to view
              </div>
            </div>
            <div className={`w-8 h-5 rounded-full transition-colors flex items-center ${
              isVault ? "bg-amber-500 justify-end" : "bg-border justify-start"
            }`}>
              <div className="w-3.5 h-3.5 rounded-full bg-white mx-0.5" />
            </div>
          </button>

          <DialogFooter className="pt-3 gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-9 text-[13px]">Cancel</Button>
            <Button type="submit" disabled={isPending} className="h-9 text-[13px]">{isPending ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
