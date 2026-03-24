import { useState } from "react";
import { Layout } from "@/components/layout";
import {
  useListCredentials,
  useListCategories,
  useDeleteCredential,
  useGetVaultStatus,
  useLockVault,
  getListCredentialsQueryKey,
  getGetStatsQueryKey,
  getGetVaultStatusQueryKey,
  type Credential
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { CopyButton } from "@/components/copy-button";
import { CredentialModal } from "@/components/credential-modal";
import { VaultUnlockModal } from "@/components/vault-unlock-modal";
import { Plus, Search, Eye, EyeOff, Pencil, Trash2, Key, Loader2, Shield, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { getServiceType, SERVICE_TYPES } from "@/lib/service-types";

export default function Credentials() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [revealedIds, setRevealedIds] = useState<Set<number>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCredential, setSelectedCredential] = useState<Credential | null>(null);
  const [showVaultModal, setShowVaultModal] = useState(false);

  const queryClient = useQueryClient();

  const { data: allCredentials, isLoading } = useListCredentials({
    search: search || undefined,
    category: categoryFilter || undefined,
  });

  const { data: vaultStatus } = useGetVaultStatus();

  const credentials = typeFilter
    ? allCredentials?.filter((cred) => getServiceType(cred.title).key === typeFilter)
    : allCredentials;

  const { data: categories } = useListCategories();

  const deleteMutation = useDeleteCredential({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCredentialsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
      },
    },
  });

  const lockMutation = useLockVault({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetVaultStatusQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListCredentialsQueryKey() });
        setRevealedIds(new Set());
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

  const tagOptions = [
    { value: "", label: "All tags" },
    ...(categories?.map((cat) => ({
      value: cat.name,
      label: cat.name,
      icon: <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />,
    })) || []),
  ];

  const usedTypeKeys = new Set(allCredentials?.map((c) => getServiceType(c.title).key) || []);
  const typeOptions = [
    { value: "", label: "All types" },
    ...SERVICE_TYPES
      .filter((t) => usedTypeKeys.has(t.key))
      .map((t) => {
        const Icon = t.icon;
        return {
          value: t.key,
          label: t.label,
          icon: <Icon className="w-3.5 h-3.5" style={{ color: t.color }} />,
        };
      }),
  ];

  const regularCreds = credentials?.filter((c) => !c.isVault) || [];
  const vaultCreds = credentials?.filter((c) => c.isVault) || [];
  const hasVaultSetup = vaultStatus?.hasPassword && vaultStatus?.hasPin;
  const vaultUnlocked = vaultStatus?.isUnlocked ?? false;

  const handleVaultUnlocked = () => {
    queryClient.invalidateQueries({ queryKey: getGetVaultStatusQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListCredentialsQueryKey() });
  };

  const renderCredCard = (cred: Credential, isVaultItem: boolean) => {
    const stype = getServiceType(cred.title);
    const Icon = stype.icon;
    const locked = isVaultItem && !vaultUnlocked;

    return (
      <div key={cred.id} className={`border rounded-xl bg-card px-3.5 py-3 group hover:border-foreground/20 transition-colors ${
        isVaultItem ? "border-amber-500/20" : ""
      }`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: stype.color + '18' }}>
              <Icon className="w-3.5 h-3.5" style={{ color: stype.color }} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-bold block truncate">{stype.label}</span>
                {isVaultItem && <Shield className="w-3 h-3 text-amber-500 shrink-0" />}
              </div>
              {cred.categoryName && (
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cred.categoryColor || '#999' }} />
                  <span className="text-[10px] text-muted-foreground truncate">{cred.categoryName}</span>
                </div>
              )}
            </div>
          </div>
          {!locked && (
            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1">
              <button
                onClick={() => { setSelectedCredential(cred); setIsModalOpen(true); }}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
              >
                <Pencil className="w-3 h-3" />
              </button>
              <button
                onClick={() => { if (confirm("Delete this credential?")) deleteMutation.mutate({ id: cred.id }); }}
                className="p-1 text-muted-foreground hover:text-destructive transition-colors rounded-md hover:bg-accent"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
        {locked ? (
          <div className="flex items-center gap-2 py-1">
            <Lock className="w-3 h-3 text-muted-foreground/40" />
            <span className="text-[11px] text-muted-foreground">Unlock vault to view</span>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-mono text-muted-foreground truncate flex-1">{cred.email}</span>
              <CopyButton value={cred.email} label="Copy" />
            </div>
            <div className="flex items-center gap-1">
              <code className="text-[11px] font-mono text-muted-foreground truncate flex-1">
                {revealedIds.has(cred.id) ? cred.password : "••••••••"}
              </code>
              <button
                onClick={() => toggleReveal(cred.id)}
                className="p-0.5 text-muted-foreground/40 hover:text-foreground transition-colors"
              >
                {revealedIds.has(cred.id) ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              </button>
              <CopyButton value={cred.password} label="Copy" />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex flex-col sm:flex-row gap-2.5 flex-1 w-full">
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
            <div className="sm:w-[180px]">
              <Combobox
                options={typeOptions}
                value={typeFilter}
                onValueChange={setTypeFilter}
                placeholder="All types"
                searchPlaceholder="Filter type..."
                emptyText="None found."
              />
            </div>
            <div className="sm:w-[180px]">
              <Combobox
                options={tagOptions}
                value={categoryFilter}
                onValueChange={setCategoryFilter}
                placeholder="All tags"
                searchPlaceholder="Filter tag..."
                emptyText="None found."
              />
            </div>
          </div>
          <Button onClick={() => { setSelectedCredential(null); setIsModalOpen(true); }} size="sm" className="h-9 text-[13px] font-semibold shrink-0">
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add
          </Button>
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
          <div className="space-y-6">
            {regularCreds.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
                {regularCreds.map((cred) => renderCredCard(cred, false))}
              </div>
            )}

            {vaultCreds.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-amber-500" />
                    <span className="text-[14px] font-bold">Secure vault</span>
                    <span className="text-[11px] bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-md font-mono tabular-nums">
                      {vaultCreds.length}
                    </span>
                  </div>
                  {hasVaultSetup && (
                    <Button
                      variant="outline"
                      size="sm"
                      className={`h-8 text-[12px] ${vaultUnlocked ? "" : "border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/5"}`}
                      onClick={() => {
                        if (vaultUnlocked) {
                          lockMutation.mutate();
                        } else {
                          setShowVaultModal(true);
                        }
                      }}
                    >
                      {vaultUnlocked ? (
                        <>
                          <Lock className="w-3 h-3 mr-1" />
                          Lock
                        </>
                      ) : (
                        <>
                          <Key className="w-3 h-3 mr-1" />
                          Unlock
                        </>
                      )}
                    </Button>
                  )}
                  {!hasVaultSetup && (
                    <span className="text-[11px] text-muted-foreground">Set up vault in Settings</span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
                  {vaultCreds.map((cred) => renderCredCard(cred, true))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <CredentialModal open={isModalOpen} onOpenChange={setIsModalOpen} credential={selectedCredential} />
      <VaultUnlockModal open={showVaultModal} onOpenChange={setShowVaultModal} onUnlocked={handleVaultUnlocked} />
    </Layout>
  );
}
