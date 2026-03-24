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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";

interface CredentialModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  credential?: Credential | null;
}

export function CredentialModal({ open, onOpenChange, credential }: CredentialModalProps) {
  const isEditing = !!credential;

  const [title, setTitle] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: categories } = useListCategories();

  useEffect(() => {
    if (open) {
      if (credential) {
        setTitle(credential.title);
        setEmail(credential.email);
        setPassword(credential.password);
        setCategoryId(credential.categoryId);
      } else {
        setTitle("");
        setEmail("");
        setPassword("");
        setCategoryId(null);
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
    if (isEditing && credential) {
      updateMutation.mutate({ id: credential.id, data: { title, email, password, categoryId } });
    } else {
      createMutation.mutate({ data: { title, email, password, categoryId } });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const categoryOptions = [
    { value: "none", label: "None" },
    ...(categories?.map((cat) => ({
      value: String(cat.id),
      label: cat.name,
      icon: <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />,
    })) || []),
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[16px] font-semibold">{isEditing ? "Edit credential" : "New credential"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="cred-title" className="text-[13px]">Title</Label>
            <Input id="cred-title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Gmail, GitHub" className="h-10 bg-transparent" />
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
            <Label className="text-[13px]">Category</Label>
            <Combobox
              options={categoryOptions}
              value={categoryId ? String(categoryId) : "none"}
              onValueChange={(val) => setCategoryId(val && val !== "none" ? Number(val) : null)}
              placeholder="Select category"
              searchPlaceholder="Search..."
              emptyText="No categories."
            />
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
