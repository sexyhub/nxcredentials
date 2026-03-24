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
import { Plus, Search, Eye, EyeOff, Edit, Trash2, ChevronDown } from "lucide-react";

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

  const handleEdit = (cred: Credential) => {
    setSelectedCredential(cred);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedCredential(null);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this credential?")) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <Layout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold">Credentials</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage your saved logins</p>
          </div>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add credential
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search credentials..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-md bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-colors"
            />
          </div>
          <div className="relative sm:w-48">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full h-9 pl-3 pr-8 rounded-md bg-card border border-border text-sm text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-colors"
            >
              <option value="">All categories</option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          </div>
        </div>

        <div className="rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[700px]">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Title</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Email / Username</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Password</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">
                      Loading...
                    </td>
                  </tr>
                ) : credentials?.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">
                      No credentials found
                    </td>
                  </tr>
                ) : (
                  credentials?.map((cred) => (
                    <tr key={cred.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-sm">{cred.title}</div>
                        {cred.categoryName && (
                          <span
                            className="inline-flex items-center mt-1 text-[11px] font-medium px-1.5 py-0.5 rounded"
                            style={{
                              backgroundColor: (cred.categoryColor || '#666') + '20',
                              color: cred.categoryColor || '#999',
                            }}
                          >
                            {cred.categoryName}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground truncate max-w-[200px]">{cred.email}</span>
                          <CopyButton value={cred.email} label="Copy email" />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono text-muted-foreground min-w-[100px]">
                            {revealedIds.has(cred.id) ? cred.password : "••••••••"}
                          </span>
                          <button
                            onClick={() => toggleReveal(cred.id)}
                            className="p-1 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                          >
                            {revealedIds.has(cred.id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <CopyButton value={cred.password} label="Copy password" />
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-1">
                          Updated {format(new Date(cred.updatedAt), "MMM d, yyyy")}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => handleEdit(cred)}
                            className="p-1.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(cred.id)}
                            className="p-1.5 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                            title="Delete"
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
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
      </div>

      <CredentialModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        credential={selectedCredential}
      />
    </Layout>
  );
}
