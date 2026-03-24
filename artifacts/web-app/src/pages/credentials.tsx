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
import { Plus, Search, Eye, EyeOff, Edit, Trash2 } from "lucide-react";
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
      icon: <div className="w-2.5 h-2.5" style={{ backgroundColor: cat.color }} />,
    })) || []),
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Credentials</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your saved logins</p>
          </div>
          <Button onClick={() => { setSelectedCredential(null); setIsModalOpen(true); }} size="sm">
            <Plus className="w-4 h-4 mr-1.5" />
            Add credential
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search credentials..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <div className="sm:w-[200px]">
            <Combobox
              options={categoryOptions}
              value={categoryFilter}
              onValueChange={setCategoryFilter}
              placeholder="All categories"
              searchPlaceholder="Filter by category..."
              emptyText="No categories."
            />
          </div>
        </div>

        <div className="border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[680px]">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2.5 text-[10px] font-mono font-medium uppercase tracking-widest text-muted-foreground">Title</th>
                  <th className="px-4 py-2.5 text-[10px] font-mono font-medium uppercase tracking-widest text-muted-foreground">Identifier</th>
                  <th className="px-4 py-2.5 text-[10px] font-mono font-medium uppercase tracking-widest text-muted-foreground">Secret</th>
                  <th className="px-4 py-2.5 w-[80px]"></th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-sm text-muted-foreground">Loading...</td>
                  </tr>
                ) : credentials?.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-sm text-muted-foreground">
                      No credentials yet. Add your first one to get started.
                    </td>
                  </tr>
                ) : (
                  credentials?.map((cred) => (
                    <tr key={cred.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors group">
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-[13px]">{cred.title}</div>
                        {cred.categoryName && (
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <div className="w-2 h-2" style={{ backgroundColor: cred.categoryColor || '#888' }} />
                            <span className="text-[11px] text-muted-foreground">{cred.categoryName}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          <span className="text-[13px] font-mono text-muted-foreground truncate max-w-[180px]">{cred.email}</span>
                          <CopyButton value={cred.email} label="Copy" />
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          <code className="text-[13px] font-mono text-muted-foreground min-w-[80px]">
                            {revealedIds.has(cred.id) ? cred.password : "••••••••"}
                          </code>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleReveal(cred.id)}>
                            {revealedIds.has(cred.id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </Button>
                          <CopyButton value={cred.password} label="Copy" />
                        </div>
                        <div className="text-[10px] font-mono text-muted-foreground/50 mt-1">
                          {format(new Date(cred.updatedAt), "yyyy-MM-dd")}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedCredential(cred); setIsModalOpen(true); }}>
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:text-destructive"
                            onClick={() => { if (confirm("Delete this credential?")) deleteMutation.mutate({ id: cred.id }); }}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <CredentialModal open={isModalOpen} onOpenChange={setIsModalOpen} credential={selectedCredential} />
    </Layout>
  );
}
