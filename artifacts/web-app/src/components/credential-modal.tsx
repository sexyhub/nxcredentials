import { useState, useEffect } from "react";
import {
  useCreateCredential,
  useUpdateCredential,
  useListTags,
  useListSpaces,
  getListCredentialsQueryKey,
  getGetStatsQueryKey,
  getListSpacesQueryKey,
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
import { SERVICE_TYPES, getServiceType, getIconComponent } from "@/lib/service-types";

interface CredentialModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  credential?: Credential | null;
  defaultSpaceId?: number | null;
  defaultVaultId?: number | null;
  defaultType?: string | null;
}

export function CredentialModal({ open, onOpenChange, credential, defaultSpaceId, defaultVaultId, defaultType }: CredentialModalProps) {
  const isEditing = !!credential;

  const [typeKey, setTypeKey] = useState("other");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tagId, setTagId] = useState<number | null>(null);
  const [spaceId, setSpaceId] = useState<number | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: tags } = useListTags();
  const { data: spaces } = useListSpaces();

  useEffect(() => {
    if (open) {
      if (credential) {
        setTypeKey(credential.title || "other");
        setEmail(credential.email);
        setPassword(credential.password);
        setTagId(credential.tagId);
        setSpaceId(credential.spaceId);
      } else {
        setTypeKey(defaultType || "other");
        setEmail("");
        setPassword("");
        setTagId(null);
        setSpaceId(defaultSpaceId ?? null);
      }
    }
  }, [open, credential, defaultSpaceId, defaultType]);

  const createMutation = useCreateCredential({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCredentialsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListSpacesQueryKey() });
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
        queryClient.invalidateQueries({ queryKey: getListSpacesQueryKey() });
        toast({ title: "Credential updated" });
        onOpenChange(false);
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = { title: typeKey, email, password, tagId, spaceId, vaultId: defaultVaultId ?? null };
    if (isEditing && credential) {
      updateMutation.mutate({ id: credential.id, data });
    } else {
      createMutation.mutate({ data });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const typeOptions = SERVICE_TYPES.map((t) => {
    const Icon = getIconComponent(t.icon);
    return {
      value: t.key,
      label: t.label,
      icon: <Icon className="w-3.5 h-3.5" style={{ color: t.color }} />,
    };
  });

  const tagOptions = [
    { value: "none", label: "No tag" },
    ...(tags?.map((t) => ({
      value: String(t.id),
      label: t.name,
      icon: <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />,
    })) || []),
  ];

  const spaceOptions = [
    { value: "none", label: "No space" },
    ...(spaces?.map((sp) => ({
      value: String(sp.id),
      label: sp.name,
    })) || []),
  ];

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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[13px]">Tag</Label>
              <Combobox
                options={tagOptions}
                value={tagId ? String(tagId) : "none"}
                onValueChange={(val) => setTagId(val && val !== "none" ? Number(val) : null)}
                placeholder="Select tag"
                searchPlaceholder="Search tags..."
                emptyText="No tags."
              />
            </div>
            {!defaultSpaceId && !defaultVaultId && (
              <div className="space-y-1.5">
                <Label className="text-[13px]">Space</Label>
                <Combobox
                  options={spaceOptions}
                  value={spaceId ? String(spaceId) : "none"}
                  onValueChange={(val) => setSpaceId(val && val !== "none" ? Number(val) : null)}
                  placeholder="Select space"
                  searchPlaceholder="Search spaces..."
                  emptyText="No spaces."
                />
              </div>
            )}
          </div>

          <DialogFooter className="pt-3 gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-9 text-[13px]">Cancel</Button>
            <Button type="submit" disabled={isPending} className="h-9 text-[13px]">{isPending ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
