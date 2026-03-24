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
import { Plus, Search, Eye, EyeOff, Pencil, Trash2, Key } from "lucide-react";
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
      icon: <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: cat.color }} />,
    })) || []),
  ];

  return (
    <Layout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight">Credentials</h1>
            <p className="text-[14px] text-muted-foreground mt-0.5">Manage your saved passwords and logins</p>
          </div>
          <Button onClick={() => { setSelectedCredential(null); setIsModalOpen(true); }} size="sm" className="h-9">
            <Plus className="w-4 h-4 mr-1.5" />
            Add credential
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by title or email..."
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
              searchPlaceholder="Filter category..."
              emptyText="No categories."
            />
          </div>
        </div>

        <div className="bg-card border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[640px]">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-[12px] font-medium text-muted-foreground">Title</th>
                  <th className="px-4 py-3 text-[12px] font-medium text-muted-foreground">Email / Username</th>
                  <th className="px-4 py-3 text-[12px] font-medium text-muted-foreground">Password</th>
                  <th className="px-4 py-3 w-[80px]"></th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-[13px] text-muted-foreground">Loading...</td>
                  </tr>
                ) : credentials?.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-16 text-center">
                      <Key className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-[13px] text-muted-foreground">No credentials yet</p>
                      <p className="text-[12px] text-muted-foreground/60 mt-1">Add your first credential to get started</p>
                    </td>
                  </tr>
                ) : (
                  credentials?.map((cred) => (
                    <tr key={cred.id} className="border-b last:border-0 hover:bg-muted/40 transition-colors group">
                      <td className="px-4 py-3.5">
                        <div className="text-[13px] font-medium">{cred.title}</div>
                        {cred.categoryName && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: cred.categoryColor || '#888' }} />
                            <span className="text-[11px] text-muted-foreground">{cred.categoryName}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13px] text-muted-foreground font-mono truncate max-w-[180px]">{cred.email}</span>
                          <CopyButton value={cred.email} label="Copy" />
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <code className="text-[13px] font-mono text-muted-foreground min-w-[70px]">
                            {revealedIds.has(cred.id) ? cred.password : "••••••••"}
                          </code>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleReveal(cred.id)}>
                            {revealedIds.has(cred.id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </Button>
                          <CopyButton value={cred.password} label="Copy" />
                        </div>
                        <div className="text-[11px] text-muted-foreground/50 font-mono mt-1">
                          {format(new Date(cred.updatedAt), "MMM d, yyyy")}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedCredential(cred); setIsModalOpen(true); }}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => { if (confirm("Delete this credential?")) deleteMutation.mutate({ id: cred.id }); }}
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
