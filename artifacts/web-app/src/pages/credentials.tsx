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
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-[24px] font-bold tracking-tight">Credentials</h1>
            <p className="text-[14px] text-muted-foreground mt-0.5">Your saved passwords and logins.</p>
          </div>
          <Button onClick={() => { setSelectedCredential(null); setIsModalOpen(true); }} size="sm" className="h-9 text-[13px]">
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add credential
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <Input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 bg-transparent"
            />
          </div>
          <div className="sm:w-[180px]">
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

        <div className="border rounded-lg bg-card overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-2.5 text-[12px] font-medium text-muted-foreground">Title</th>
                <th className="px-4 py-2.5 text-[12px] font-medium text-muted-foreground hidden sm:table-cell">Email / Username</th>
                <th className="px-4 py-2.5 text-[12px] font-medium text-muted-foreground hidden md:table-cell">Password</th>
                <th className="px-4 py-2.5 w-[90px]"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-14 text-center text-[13px] text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
                    Loading...
                  </td>
                </tr>
              ) : credentials?.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-14 text-center">
                    <Key className="w-6 h-6 text-border mx-auto mb-2" />
                    <p className="text-[13px] text-muted-foreground">No credentials found.</p>
                  </td>
                </tr>
              ) : (
                credentials?.map((cred) => (
                  <tr key={cred.id} className="border-b last:border-0 group hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-[13px] font-medium">{cred.title}</div>
                      {cred.categoryName && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cred.categoryColor || '#999' }} />
                          <span className="text-[11px] text-muted-foreground">{cred.categoryName}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="flex items-center gap-1">
                        <span className="text-[13px] font-mono text-muted-foreground truncate max-w-[200px]">{cred.email}</span>
                        <CopyButton value={cred.email} label="Copy" />
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex items-center gap-1">
                        <code className="text-[13px] font-mono text-muted-foreground">
                          {revealedIds.has(cred.id) ? cred.password : "••••••••"}
                        </code>
                        <button
                          onClick={() => toggleReveal(cred.id)}
                          className="p-1 text-muted-foreground/50 hover:text-foreground transition-colors"
                        >
                          {revealedIds.has(cred.id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <CopyButton value={cred.password} label="Copy" />
                      </div>
                      <div className="text-[11px] text-muted-foreground/40 font-mono mt-0.5">
                        {format(new Date(cred.updatedAt), "MMM d, yyyy")}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setSelectedCredential(cred); setIsModalOpen(true); }}
                          className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { if (confirm("Delete this credential?")) deleteMutation.mutate({ id: cred.id }); }}
                          className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-md hover:bg-accent"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CredentialModal open={isModalOpen} onOpenChange={setIsModalOpen} credential={selectedCredential} />
    </Layout>
  );
}
