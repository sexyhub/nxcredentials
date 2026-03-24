import { useState } from "react";
import { Layout } from "@/components/layout";
import {
  useListCredentials,
  useListCategories,
  useDeleteCredential,
  getListCredentialsQueryKey,
  getGetStatsQueryKey,
  type Credential
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { CopyButton } from "@/components/copy-button";
import { CredentialModal } from "@/components/credential-modal";
import { format } from "date-fns";
import { Plus, Search, Eye, EyeOff, Pencil, Trash2, Key, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";

export default function Credentials() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [revealedIds, setRevealedIds] = useState<Set<number>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCredential, setSelectedCredential] = useState<Credential | null>(null);

  const { data: credentials, isLoading } = useListCredentials({
    search: search || undefined,
    category: categoryFilter || undefined,
  });

  const { data: categories } = useListCategories();
  const queryClient = useQueryClient();

  const deleteMutation = useDeleteCredential({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCredentialsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
      },
    },
  });

  const toggleReveal = (id: number) => {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const categoryOptions = [
    { value: "", label: "All categories" },
    ...(categories?.map((cat) => ({
      value: cat.name,
      label: cat.name,
      icon: <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />,
    })) || []),
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Credentials</h1>
            <p className="text-muted-foreground text-[15px] mt-1">Your saved passwords and logins.</p>
          </div>
          <Button onClick={() => { setSelectedCredential(null); setIsModalOpen(true); }} size="sm" className="h-9 text-[13px] font-semibold">
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add credential
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
            <Input
              type="text"
              placeholder="Search credentials..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <div className="sm:w-[200px]">
            <Combobox
              options={categoryOptions}
              value={categoryFilter}
              onValueChange={setCategoryFilter}
              placeholder="All categories"
              searchPlaceholder="Filter..."
              emptyText="None found."
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : credentials?.length === 0 ? (
          <div className="border rounded-xl p-16 text-center bg-card">
            <Key className="w-8 h-8 text-border mx-auto mb-3" />
            <p className="text-[15px] font-semibold mb-1">No credentials yet</p>
            <p className="text-[13px] text-muted-foreground">Add your first credential to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {credentials?.map((cred) => (
              <div key={cred.id} className="border rounded-xl bg-card p-4 flex flex-col justify-between group hover:border-foreground/20 transition-colors">
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[15px] font-bold truncate">{cred.title}</h3>
                      {cred.categoryName && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cred.categoryColor || '#999' }} />
                          <span className="text-[11px] text-muted-foreground truncate">{cred.categoryName}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                      <button
                        onClick={() => { setSelectedCredential(cred); setIsModalOpen(true); }}
                        className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => { if (confirm("Delete this credential?")) deleteMutation.mutate({ id: cred.id }); }}
                        className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-accent"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[12px] font-mono text-muted-foreground truncate flex-1">{cred.email}</span>
                      <CopyButton value={cred.email} label="Copy" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <code className="text-[12px] font-mono text-muted-foreground truncate flex-1">
                        {revealedIds.has(cred.id) ? cred.password : "••••••••••"}
                      </code>
                      <button
                        onClick={() => toggleReveal(cred.id)}
                        className="p-0.5 text-muted-foreground/50 hover:text-foreground transition-colors"
                      >
                        {revealedIds.has(cred.id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <CopyButton value={cred.password} label="Copy" />
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-muted-foreground/40 font-mono mt-3 pt-3 border-t">
                  Updated {format(new Date(cred.updatedAt), "MMM d, yyyy")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CredentialModal open={isModalOpen} onOpenChange={setIsModalOpen} credential={selectedCredential} />
    </Layout>
  );
}
