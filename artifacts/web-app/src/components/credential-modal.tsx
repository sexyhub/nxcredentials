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
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, ChevronDown } from "lucide-react";

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
      updateMutation.mutate({
        id: credential.id,
        data: { title, email, password, categoryId },
      });
    } else {
      createMutation.mutate({
        data: { title, email, password, categoryId },
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const inputClass =
    "w-full h-10 px-3 rounded-md bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-colors";

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-card p-6 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <DialogPrimitive.Title className="text-lg font-semibold mb-4">
            {isEditing ? "Edit Credential" : "New Credential"}
          </DialogPrimitive.Title>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Title</label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputClass}
                placeholder="e.g. Work Email, Netflix"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">Email / Username</label>
                <input
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">Password</label>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Category</label>
              <div className="relative">
                <select
                  value={categoryId || ""}
                  onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
                  className={`${inputClass} appearance-none pr-8`}
                >
                  <option value="">None</option>
                  {categories?.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <DialogPrimitive.Close asChild>
                <button
                  type="button"
                  className="h-9 px-4 rounded-md border border-border bg-transparent text-sm font-medium text-foreground hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
              </DialogPrimitive.Close>
              <button
                type="submit"
                disabled={isPending}
                className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50"
              >
                {isPending ? "Saving..." : "Save"}
              </button>
            </div>
          </form>

          <DialogPrimitive.Close className="absolute right-3 top-3 p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
