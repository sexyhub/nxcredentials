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
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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

  const handleEdit = (cred: Credential) => {
    setSelectedCredential(cred);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedCredential(null);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this credential? This action cannot be undone.")) {
      deleteMutation.mutate({ id });
    }
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
            <h1 className="text-xl font-semibold tracking-tight">Credentials</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage your saved logins and passwords</p>
          </div>
          <Button onClick={handleAdd} size="sm">
            <Plus className="w-4 h-4 mr-1.5" />
            Add credential
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by title, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="sm:w-[200px]">
            <Combobox
              options={categoryOptions}
              value={categoryFilter}
              onValueChange={setCategoryFilter}
              placeholder="All categories"
              searchPlaceholder="Search categories..."
              emptyText="No categories found."
            />
          </div>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[680px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">Title</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">Email / Username</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">Password</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground w-[100px]"></th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-sm text-muted-foreground">
                      Loading credentials...
                    </td>
                  </tr>
                ) : credentials?.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-sm text-muted-foreground">
                      No credentials found. Add your first credential to get started.
                    </td>
                  </tr>
                ) : (
                  credentials?.map((cred) => (
                    <tr key={cred.id} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="font-medium text-[13px]">{cred.title}</div>
                        {cred.categoryName && (
                          <Badge variant="outline" className="mt-1 text-[10px] font-medium h-5 gap-1">
                            <div
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: cred.categoryColor || '#888' }}
                            />
                            {cred.categoryName}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13px] text-muted-foreground truncate max-w-[180px]">{cred.email}</span>
                          <CopyButton value={cred.email} label="Copy email" />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13px] font-mono text-muted-foreground min-w-[80px]">
                            {revealedIds.has(cred.id) ? cred.password : "••••••••"}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => toggleReveal(cred.id)}
                          >
                            {revealedIds.has(cred.id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </Button>
                          <CopyButton value={cred.password} label="Copy password" />
                        </div>
                        <div className="text-[11px] text-muted-foreground/60 mt-0.5">
                          Updated {format(new Date(cred.updatedAt), "MMM d, yyyy")}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleEdit(cred)}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:text-destructive"
                            onClick={() => handleDelete(cred.id)}
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
        </Card>
      </div>

      <CredentialModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        credential={selectedCredential}
      />
    </Layout>
  );
}
