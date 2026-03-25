import { useState } from "react";
import { Layout } from "@/components/layout";
import {
  useListVaults,
  useCreateVault,
  useUpdateVault,
  useDeleteVault,
  useLockVault,
  useListCredentials,
  useDeleteCredential,
  getListVaultsQueryKey,
  getListCredentialsQueryKey,
  getGetStatsQueryKey,
  type VaultItem,
  type Credential
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { CredentialModal } from "@/components/credential-modal";
import { VaultUnlockModal } from "@/components/vault-unlock-modal";
import { CopyButton } from "@/components/copy-button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus, Shield, Lock, Key, Loader2, Eye, EyeOff, Pencil, Trash2,
  ChevronLeft, ArrowLeft
} from "lucide-react";
import { getServiceType } from "@/lib/service-types";

const VAULT_COLORS = [
  "#6366f1", "#8B5CF6", "#EC4899", "#EF4444", "#F59E0B",
  "#10B981", "#06B6D4", "#3B82F6", "#6B7280", "#1F2937"
];

const VAULT_ICONS = ["shield", "lock", "key", "star", "heart", "diamond", "crown", "gem"];

function getVaultIcon(icon: string) {
  return Shield;
}

export default function Vault() {
  const [selectedVault, setSelectedVault] = useState<VaultItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showCredModal, setShowCredModal] = useState(false);
  const [editingCred, setEditingCred] = useState<Credential | null>(null);
  const [revealedIds, setRevealedIds] = useState<Set<number>>(new Set());

  const [createForm, setCreateForm] = useState({ name: "", password: "", pin: "", color: "#6366f1", icon: "shield" });
  const [editForm, setEditForm] = useState({ name: "", color: "", icon: "" });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: vaults, isLoading } = useListVaults();
  const { data: allCredentials } = useListCredentials(
    selectedVault ? { vaultId: selectedVault.id } : undefined,
    { query: { enabled: !!selectedVault } }
  );

  const vaultCredentials = allCredentials || [];

  const createMutation = useCreateVault({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListVaultsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
        toast({ title: "Vault created" });
        setShowCreateModal(false);
        setCreateForm({ name: "", password: "", pin: "", color: "#6366f1", icon: "shield" });
      },
      onError: (err: any) => {
        toast({ title: "Failed", description: err?.data?.error || "Could not create vault.", variant: "destructive" });
      },
    },
  });

  const updateMutation = useUpdateVault({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListVaultsQueryKey() });
        setSelectedVault(data as VaultItem);
        toast({ title: "Vault updated" });
        setShowEditModal(false);
      },
    },
  });

  const deleteMutation = useDeleteVault({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListVaultsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
        toast({ title: "Vault deleted" });
        setSelectedVault(null);
      },
    },
  });

  const lockMutation = useLockVault({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListVaultsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListCredentialsQueryKey() });
        setRevealedIds(new Set());
      },
    },
  });

  const deleteCredMutation = useDeleteCredential({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCredentialsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListVaultsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
      },
    },
  });

  const handleVaultUnlocked = () => {
    queryClient.invalidateQueries({ queryKey: getListVaultsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListCredentialsQueryKey() });
  };

  const toggleReveal = (id: number) => {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (selectedVault) {
    const currentVault = vaults?.find(v => v.id === selectedVault.id) || selectedVault;
    const isUnlocked = currentVault.isUnlocked;

    return (
      <Layout>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setSelectedVault(null); setRevealedIds(new Set()); }}
              className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: currentVault.color + '18' }}>
              <Shield className="w-4 h-4" style={{ color: currentVault.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-extrabold tracking-tight truncate">{currentVault.name}</h1>
              <p className="text-[12px] text-muted-foreground">{currentVault.credentialCount} credential{currentVault.credentialCount !== 1 ? "s" : ""}</p>
            </div>
            <div className="flex items-center gap-2">
              {isUnlocked ? (
                <>
                  <Button size="sm" className="h-8 text-[12px]" onClick={() => { setEditingCred(null); setShowCredModal(true); }}>
                    <Plus className="w-3 h-3 mr-1" /> Add
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 text-[12px]" onClick={() => lockMutation.mutate({ id: currentVault.id })}>
                    <Lock className="w-3 h-3 mr-1" /> Lock
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 text-[12px]" onClick={() => { setEditForm({ name: currentVault.name, color: currentVault.color, icon: currentVault.icon }); setShowEditModal(true); }}>
                    <Pencil className="w-3 h-3" />
                  </Button>
                </>
              ) : (
                <Button size="sm" className="h-8 text-[12px] border-amber-500/30 text-amber-600" variant="outline" onClick={() => setShowUnlockModal(true)}>
                  <Key className="w-3 h-3 mr-1" /> Unlock
                </Button>
              )}
            </div>
          </div>

          {!isUnlocked ? (
            <div className="border rounded-xl p-16 text-center bg-card border-amber-500/20">
              <Lock className="w-8 h-8 text-amber-500/40 mx-auto mb-3" />
              <p className="text-[15px] font-semibold mb-1">Vault is locked</p>
              <p className="text-[13px] text-muted-foreground mb-4">Enter your password or PIN to view credentials.</p>
              <Button size="sm" className="h-9 text-[13px]" onClick={() => setShowUnlockModal(true)}>
                <Key className="w-3.5 h-3.5 mr-1.5" /> Unlock vault
              </Button>
            </div>
          ) : vaultCredentials.length === 0 ? (
            <div className="border rounded-xl p-16 text-center bg-card">
              <Key className="w-8 h-8 text-border mx-auto mb-3" />
              <p className="text-[15px] font-semibold mb-1">No credentials</p>
              <p className="text-[13px] text-muted-foreground">Add your first credential to this vault.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
              {vaultCredentials.map((cred) => {
                const stype = getServiceType(cred.title);
                const Icon = stype.icon;
                return (
                  <div key={cred.id} className="border rounded-xl bg-card px-3.5 py-3 group hover:border-foreground/20 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: stype.color + '18' }}>
                          <Icon className="w-3.5 h-3.5" style={{ color: stype.color }} />
                        </div>
                        <span className="text-[13px] font-bold truncate">{stype.label}</span>
                      </div>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1">
                        <button onClick={() => { setEditingCred(cred); setShowCredModal(true); }} className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent">
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button onClick={() => { if (confirm("Delete this credential?")) deleteCredMutation.mutate({ id: cred.id }); }} className="p-1 text-muted-foreground hover:text-destructive transition-colors rounded-md hover:bg-accent">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] font-mono text-muted-foreground truncate flex-1">{cred.email}</span>
                        <CopyButton value={cred.email} label="Copy" />
                      </div>
                      <div className="flex items-center gap-1">
                        <code className="text-[11px] font-mono text-muted-foreground truncate flex-1">
                          {revealedIds.has(cred.id) ? cred.password : "••••••••"}
                        </code>
                        <button onClick={() => toggleReveal(cred.id)} className="p-0.5 text-muted-foreground/40 hover:text-foreground transition-colors">
                          {revealedIds.has(cred.id) ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                        <CopyButton value={cred.password} label="Copy" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <VaultUnlockModal
          open={showUnlockModal}
          onOpenChange={setShowUnlockModal}
          onUnlocked={handleVaultUnlocked}
          vaultId={currentVault.id}
          vaultName={currentVault.name}
        />
        <CredentialModal
          open={showCredModal}
          onOpenChange={setShowCredModal}
          credential={editingCred}
          defaultVaultId={currentVault.id}
        />

        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="sm:max-w-sm">
            <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate({ id: currentVault.id, data: editForm }); }} className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <Label className="text-[13px]">Vault name</Label>
                <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px]">Color</Label>
                <div className="flex gap-2 flex-wrap">
                  {VAULT_COLORS.map((c) => (
                    <button key={c} type="button" onClick={() => setEditForm({ ...editForm, color: c })}
                      className={`w-7 h-7 rounded-lg transition-all ${editForm.color === c ? "ring-2 ring-offset-2 ring-foreground scale-110" : "hover:scale-105"}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <DialogFooter className="pt-2 gap-2">
                <Button type="button" variant="outline" size="sm" className="h-8 text-[12px] text-destructive hover:text-destructive"
                  onClick={() => { if (confirm(`Delete "${currentVault.name}" and all its credentials? This cannot be undone.`)) { deleteMutation.mutate({ id: currentVault.id }); setShowEditModal(false); } }}>
                  Delete vault
                </Button>
                <Button type="submit" size="sm" className="h-8 text-[12px]">Save</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Secure vaults</h1>
            <p className="text-muted-foreground text-[15px] mt-1">Independent encrypted vaults for your most sensitive credentials.</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} size="sm" className="h-9 text-[13px] font-semibold shrink-0">
            <Plus className="w-3.5 h-3.5 mr-1.5" /> New vault
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : !vaults?.length ? (
          <div className="border rounded-xl p-16 text-center bg-card">
            <Shield className="w-8 h-8 text-border mx-auto mb-3" />
            <p className="text-[15px] font-semibold mb-1">No vaults yet</p>
            <p className="text-[13px] text-muted-foreground">Create a vault to store high-security credentials with their own password and PIN.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {vaults.map((vault) => (
              <button
                key={vault.id}
                onClick={() => setSelectedVault(vault)}
                className="border rounded-lg bg-card px-3 py-2.5 text-left hover:border-foreground/20 transition-all cursor-pointer flex items-center gap-2.5"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: vault.color + '18' }}>
                  <Shield className="w-4 h-4" style={{ color: vault.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[17px] font-extrabold tracking-tight leading-none">{vault.credentialCount}</span>
                    <span className="text-[11px] text-muted-foreground font-medium">
                      {vault.isUnlocked ? (
                        <span className="text-green-600">open</span>
                      ) : (
                        <span className="flex items-center gap-0.5"><Lock className="w-2.5 h-2.5 inline" /> locked</span>
                      )}
                    </span>
                  </div>
                  <div className="text-[12px] font-semibold truncate mt-0.5">{vault.name}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-sm">
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate({ data: createForm }); }} className="space-y-4 pt-1">
            <div className="flex flex-col items-center gap-2 pb-2">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: createForm.color + '18' }}>
                <Shield className="w-6 h-6" style={{ color: createForm.color }} />
              </div>
              <h3 className="text-[16px] font-bold">New vault</h3>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[13px]">Name</Label>
              <Input value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} required placeholder="e.g. Banking, Top Secret" className="h-10" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[13px]">Color</Label>
              <div className="flex gap-2 flex-wrap">
                {VAULT_COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => setCreateForm({ ...createForm, color: c })}
                    className={`w-7 h-7 rounded-lg transition-all ${createForm.color === c ? "ring-2 ring-offset-2 ring-foreground scale-110" : "hover:scale-105"}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[13px]">Password</Label>
              <Input type="password" required minLength={6} value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} placeholder="At least 6 characters" className="h-10" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[13px]">PIN</Label>
              <Input type="password" inputMode="numeric" required pattern="\d{4,8}" value={createForm.pin} onChange={(e) => setCreateForm({ ...createForm, pin: e.target.value.replace(/\D/g, "").slice(0, 8) })} placeholder="4-8 digit PIN" className="h-10" />
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)} className="h-9 text-[13px]">Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending} className="h-9 text-[13px]">
                {createMutation.isPending ? "Creating..." : "Create vault"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
