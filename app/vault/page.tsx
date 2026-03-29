"use client";

import { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/layout";
import {
  useListVaults,
  useCreateVault,
  useUpdateVault,
  useDeleteVault,
  useLockVault,
  useChangeVaultPassword,
  useChangeVaultPin,
  useListCredentials,
  useDeleteCredential,
  getListVaultsQueryKey,
  getListCredentialsQueryKey,
  getGetStatsQueryKey,
  type Vault,
  type Credential
} from "@/hooks/use-api";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { CredentialModal } from "@/components/credential-modal";
import { VaultUnlockModal } from "@/components/vault-unlock-modal";
import { DeleteConfirmModal } from "@/components/delete-confirm-modal";
import { PinInput } from "@/components/pin-input";
import { AppearancePicker } from "@/components/appearance-picker";
import { CopyButton } from "@/components/copy-button";
import { Pagination } from "@/components/pagination";
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus, Shield, Lock, Key, Loader2, Eye, EyeOff, Pencil, Trash2, ArrowLeft, Tag, KeyRound, Timer
} from "lucide-react";
import { getServiceType, getIconComponent } from "@/lib/service-types";

const PAGE_SIZE = 16;

const AUTO_LOCK_OPTIONS = [
  { value: 15, label: "15 seconds" },
  { value: 30, label: "30 seconds" },
  { value: 60, label: "1 minute" },
  { value: 300, label: "5 minutes" },
  { value: 600, label: "10 minutes" },
  { value: 1800, label: "30 minutes" },
  { value: 0, label: "Never" },
];

const getAutoLockSeconds = (vaultId: number): number => {
  const stored = localStorage.getItem(`vault_al_${vaultId}`);
  return stored !== null ? parseInt(stored, 10) : 30;
};
const saveAutoLockSeconds = (vaultId: number, secs: number): void => {
  localStorage.setItem(`vault_al_${vaultId}`, String(secs));
};

interface PendingAutoLock {
  vaultId: number;
  lastActivity: number;
  autoLockSecs: number;
}
const PENDING_AL_KEY = "vault_al_pending";
const getPendingAutoLock = (): PendingAutoLock | null => {
  try {
    const s = localStorage.getItem(PENDING_AL_KEY);
    return s ? JSON.parse(s) : null;
  } catch { return null; }
};
const setPendingAutoLock = (data: PendingAutoLock | null) => {
  if (data) localStorage.setItem(PENDING_AL_KEY, JSON.stringify(data));
  else localStorage.removeItem(PENDING_AL_KEY);
};
const touchPendingActivity = () => {
  const p = getPendingAutoLock();
  if (p) { p.lastActivity = Date.now(); setPendingAutoLock(p); }
};

export default function VaultPage() {
  const [selectedVault, setSelectedVault] = useState<Vault | null>(null);
  const [unlockingVault, setUnlockingVault] = useState<Vault | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showCredModal, setShowCredModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [securityTab, setSecurityTab] = useState<"password" | "pin">("password");
  const [editingCred, setEditingCred] = useState<Credential | null>(null);
  const [revealedIds, setRevealedIds] = useState<Set<number>>(new Set());
  const [locallyUnlockedIds, setLocallyUnlockedIds] = useState<Set<number>>(new Set());
  const [vaultsPage, setVaultsPage] = useState(1);
  const [credsPage, setCredsPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<{ title: string; description?: string; onConfirm: () => void } | null>(null);

  const [createForm, setCreateForm] = useState({ name: "", password: "", pin: "", color: "#6366f1", icon: "shield", autoLockSeconds: 30 });
  const [editForm, setEditForm] = useState({ name: "", color: "", icon: "", autoLockSeconds: 30 });
  const [pwForm, setPwForm] = useState({ oldPassword: "", newPassword: "" });
  const [pinForm, setPinForm] = useState({ oldPin: "", newPin: "" });

  const autoLockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: vaults, isLoading } = useListVaults();
  const { data: allCredentials } = useListCredentials(
    selectedVault ? { vaultId: selectedVault.id } : undefined,
    { query: { enabled: !!selectedVault } }
  );

  const currentVault = selectedVault ? (vaults?.find(v => v.id === selectedVault.id) || selectedVault) : null;
  const isUnlocked = locallyUnlockedIds.has(currentVault?.id ?? -1) || (currentVault?.isUnlocked ?? false);
  const vaultCredentials = allCredentials || [];
  const pagedVaults = vaults?.slice((vaultsPage - 1) * PAGE_SIZE, vaultsPage * PAGE_SIZE) ?? [];
  const pagedCreds = vaultCredentials.slice((credsPage - 1) * PAGE_SIZE, credsPage * PAGE_SIZE);

  const lockMutation = useLockVault({
    mutation: {
      onSuccess: (_data: any, variables: any) => {
        const id = variables.id;
        if (autoLockTimerRef.current) {
          clearTimeout(autoLockTimerRef.current);
          autoLockTimerRef.current = null;
        }
        setPendingAutoLock(null);
        setLocallyUnlockedIds(prev => { const next = new Set(prev); next.delete(id); return next; });
        queryClient.invalidateQueries({ queryKey: getListVaultsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListCredentialsQueryKey() });
        setSelectedVault(null);
        setRevealedIds(new Set());
      },
    },
  });

  const createMutation = useCreateVault({
    mutation: {
      onSuccess: (data: any) => {
        saveAutoLockSeconds(data.id, createForm.autoLockSeconds);
        queryClient.invalidateQueries({ queryKey: getListVaultsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
        toast({ title: "Vault created" });
        setShowCreateModal(false);
        setCreateForm({ name: "", password: "", pin: "", color: "#6366f1", icon: "shield", autoLockSeconds: 30 });
      },
      onError: (err: any) => {
        toast({ title: "Failed", description: err?.data?.error || "Could not create vault.", variant: "destructive" });
      },
    },
  });

  const updateMutation = useUpdateVault({
    mutation: {
      onSuccess: (data: any) => {
        saveAutoLockSeconds(data.id, editForm.autoLockSeconds);
        queryClient.invalidateQueries({ queryKey: getListVaultsQueryKey() });
        setSelectedVault(data as Vault);
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

  const deleteCredMutation = useDeleteCredential({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCredentialsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListVaultsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
      },
    },
  });

  const changePasswordMutation = useChangeVaultPassword({
    mutation: {
      onSuccess: () => {
        toast({ title: "Password changed" });
        setShowSecurityModal(false);
        setPwForm({ oldPassword: "", newPassword: "" });
      },
      onError: (err: any) => {
        toast({ title: "Failed", description: err?.data?.error || "Could not change password.", variant: "destructive" });
      },
    },
  });

  const changePinMutation = useChangeVaultPin({
    mutation: {
      onSuccess: () => {
        toast({ title: "PIN changed" });
        setShowSecurityModal(false);
        setPinForm({ oldPin: "", newPin: "" });
      },
      onError: (err: any) => {
        toast({ title: "Failed", description: err?.data?.error || "Could not change PIN.", variant: "destructive" });
      },
    },
  });

  const lockIfExpired = () => {
    const pending = getPendingAutoLock();
    if (!pending || !pending.autoLockSecs) return;
    if (Date.now() - pending.lastActivity >= pending.autoLockSecs * 1000) {
      lockMutation.mutate({ id: pending.vaultId });
      toast({ title: "Vault auto-locked", description: "Locked after inactivity." });
    }
  };

  useEffect(() => {
    lockIfExpired();
    const onVisible = () => { if (document.visibilityState === "visible") lockIfExpired(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedVault && !isUnlocked) {
      setSelectedVault(null);
      setRevealedIds(new Set());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUnlocked]);

  useEffect(() => {
    if (!selectedVault?.id || !isUnlocked) return;

    const vaultId = selectedVault.id;
    const secs = getAutoLockSeconds(vaultId);

    if (autoLockTimerRef.current) {
      clearTimeout(autoLockTimerRef.current);
      autoLockTimerRef.current = null;
    }

    if (!secs) { setPendingAutoLock(null); return; }

    setPendingAutoLock({ vaultId, lastActivity: Date.now(), autoLockSecs: secs });

    const resetTimer = () => {
      touchPendingActivity();
      if (autoLockTimerRef.current) clearTimeout(autoLockTimerRef.current);
      autoLockTimerRef.current = setTimeout(() => {
        lockMutation.mutate({ id: vaultId });
        toast({ title: "Vault auto-locked", description: "Locked after inactivity." });
      }, secs * 1000);
    };

    resetTimer();
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"];
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));

    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVault?.id, isUnlocked]);

  const handleVaultUnlocked = () => {
    if (unlockingVault) {
      setLocallyUnlockedIds(prev => new Set([...prev, unlockingVault.id]));
      setSelectedVault(unlockingVault);
      setUnlockingVault(null);
    }
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

  const enterVault = (vault: Vault) => {
    setSelectedVault(vault);
    setCredsPage(1);
  };

  const openEditModal = () => {
    if (!currentVault) return;
    setEditForm({
      name: currentVault.name,
      color: currentVault.color,
      icon: currentVault.icon,
      autoLockSeconds: getAutoLockSeconds(currentVault.id),
    });
    setShowEditModal(true);
  };

  const openSecurityModal = (tab: "password" | "pin" = "password") => {
    setSecurityTab(tab);
    setPwForm({ oldPassword: "", newPassword: "" });
    setPinForm({ oldPin: "", newPin: "" });
    setShowSecurityModal(true);
  };

  if (selectedVault && currentVault) {
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
                  <Button variant="ghost" size="sm" className="h-8 text-[12px]" onClick={() => openSecurityModal()}>
                    <KeyRound className="w-3.5 h-3.5 mr-1" /> Security
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 text-[12px]" onClick={openEditModal}>
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
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
                {pagedCreds.map((cred) => {
                  const stype = getServiceType(cred.title);
                  const Icon = getIconComponent(stype.icon);
                  return (
                    <div key={cred.id} className="border rounded-xl bg-card px-3.5 py-3 group hover:border-foreground/20 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: stype.color + '18' }}>
                            <Icon className="w-3.5 h-3.5" style={{ color: stype.color }} />
                          </div>
                          <span className="text-[13px] font-bold truncate">{stype.label}</span>
                          {cred.tagName && (
                            <span className="shrink-0 flex items-center gap-0.5 text-[10px] font-semibold tracking-wide" style={{ color: cred.tagColor || '#888' }}>
                              <Tag className="w-2.5 h-2.5" />
                              {cred.tagName}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1">
                          <button onClick={() => { setEditingCred(cred); setShowCredModal(true); }} className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent">
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button onClick={() => setPendingDelete({ title: "Delete credential?", description: "This action cannot be undone.", onConfirm: () => deleteCredMutation.mutate({ id: cred.id }) })} className="p-1 text-muted-foreground hover:text-destructive transition-colors rounded-md hover:bg-accent">
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
                            {revealedIds.has(cred.id) ? cred.password : "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"}
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
              <Pagination page={credsPage} total={vaultCredentials.length} pageSize={PAGE_SIZE} onChange={setCredsPage} />
            </>
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
            <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate({ id: currentVault.id, data: { name: editForm.name, color: editForm.color, icon: editForm.icon } }); }} className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <Label className="text-[13px]">Vault name</Label>
                <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required className="h-10" />
              </div>
              <AppearancePicker
                color={editForm.color}
                onColorChange={(c) => setEditForm({ ...editForm, color: c })}
                fixedIcon={Shield}
              />
              <div className="space-y-1.5">
                <Label className="text-[13px] flex items-center gap-1.5"><Timer className="w-3.5 h-3.5 text-muted-foreground" />Auto-lock</Label>
                <Select
                  value={String(editForm.autoLockSeconds)}
                  onValueChange={(v) => setEditForm({ ...editForm, autoLockSeconds: parseInt(v, 10) })}
                >
                  <SelectTrigger className="h-10 text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AUTO_LOCK_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={String(o.value)} className="text-[13px]">{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">Lock vault after this period of inactivity.</p>
              </div>
              <DialogFooter className="pt-2 gap-2">
                <Button type="button" variant="outline" size="sm" className="h-8 text-[12px] text-destructive hover:text-destructive"
                  onClick={() => setPendingDelete({ title: `Delete "${currentVault.name}"?`, description: "All credentials inside will be permanently deleted.", onConfirm: () => { deleteMutation.mutate({ id: currentVault.id }); setShowEditModal(false); } })}>
                  Delete vault
                </Button>
                <Button type="submit" size="sm" className="h-8 text-[12px]">Save</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={showSecurityModal} onOpenChange={setShowSecurityModal}>
          <DialogContent className="sm:max-w-sm">
            <div className="space-y-4 pt-1">
              <div className="flex flex-col items-center gap-1.5 pb-1">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: currentVault.color + '18' }}>
                  <KeyRound className="w-5 h-5" style={{ color: currentVault.color }} />
                </div>
                <h3 className="text-[15px] font-bold">Change security</h3>
                <p className="text-[12px] text-muted-foreground text-center">Update your vault password or PIN.</p>
              </div>

              <div className="flex border-b">
                <button
                  onClick={() => setSecurityTab("password")}
                  className={`flex-1 py-2 text-[13px] font-medium border-b-2 -mb-px transition-colors ${securityTab === "password" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                >
                  Password
                </button>
                <button
                  onClick={() => setSecurityTab("pin")}
                  className={`flex-1 py-2 text-[13px] font-medium border-b-2 -mb-px transition-colors ${securityTab === "pin" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                >
                  PIN
                </button>
              </div>

              {securityTab === "password" ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    changePasswordMutation.mutate({ id: currentVault.id, data: { oldPassword: pwForm.oldPassword, newPassword: pwForm.newPassword } });
                  }}
                  className="space-y-3"
                >
                  <div className="space-y-1.5">
                    <Label className="text-[13px]">Current password</Label>
                    <Input type="password" required value={pwForm.oldPassword} onChange={(e) => setPwForm({ ...pwForm, oldPassword: e.target.value })} className="h-10" placeholder="Enter current password" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[13px]">New password</Label>
                    <Input type="password" required minLength={6} value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} className="h-10" placeholder="At least 6 characters" />
                  </div>
                  <Button type="submit" className="w-full h-10 text-[13px]" disabled={changePasswordMutation.isPending}>
                    {changePasswordMutation.isPending ? "Changing..." : "Change password"}
                  </Button>
                </form>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    changePinMutation.mutate({ id: currentVault.id, data: { oldPin: pinForm.oldPin, newPin: pinForm.newPin } });
                  }}
                  className="space-y-3"
                >
                  <div className="space-y-1.5">
                    <Label className="text-[13px]">Current PIN</Label>
                    <Input type="password" required maxLength={8} value={pinForm.oldPin} onChange={(e) => setPinForm({ ...pinForm, oldPin: e.target.value.replace(/\D/g, '') })} className="h-10 font-mono tracking-[0.4em] text-center" placeholder="\u00b7\u00b7\u00b7\u00b7" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[13px] block text-center">New PIN</Label>
                    <PinInput value={pinForm.newPin} onChange={(v) => setPinForm({ ...pinForm, newPin: v })} length={4} />
                  </div>
                  <Button type="submit" className="w-full h-10 text-[13px]" disabled={changePinMutation.isPending || pinForm.newPin.length < 4}>
                    {changePinMutation.isPending ? "Changing..." : "Change PIN"}
                  </Button>
                </form>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <DeleteConfirmModal
          open={!!pendingDelete}
          onOpenChange={(o) => { if (!o) setPendingDelete(null); }}
          title={pendingDelete?.title ?? ""}
          description={pendingDelete?.description}
          onConfirm={() => { pendingDelete?.onConfirm(); setPendingDelete(null); }}
          isPending={deleteMutation.isPending || deleteCredMutation.isPending}
        />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-5">
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
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {pagedVaults.map((vault) => (
                <button
                  key={vault.id}
                  onClick={() => {
                    if (vault.isUnlocked) {
                      enterVault(vault);
                    } else {
                      setUnlockingVault(vault);
                      setShowUnlockModal(true);
                    }
                  }}
                  className="border rounded-xl bg-card px-4 py-4 text-left hover:border-foreground/20 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: vault.color + '18' }}>
                      <Shield className="w-4.5 h-4.5" style={{ color: vault.color }} />
                    </div>
                    <div>
                      <span className="text-[32px] font-extrabold tracking-tight leading-none">{vault.credentialCount}</span>
                      <span className="text-[11px] text-muted-foreground font-medium ml-1.5">private credential{vault.credentialCount !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                  <div className="border-t pt-3 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[13px] font-bold truncate">{vault.name}</div>
                      <div className="text-[11px] text-muted-foreground shrink-0 whitespace-nowrap flex items-center gap-1">
                        {vault.isUnlocked ? <span className="text-green-600 font-semibold">Unlocked</span> : <><Lock className="w-3 h-3 shrink-0" /><span>Locked</span></>} <span>&middot; encrypted vault</span>
                      </div>
                    </div>
                    <div className="text-[11px] text-muted-foreground/60">{vault.isUnlocked ? "Tap to browse private credentials" : "Tap to unlock & view private credentials"}</div>
                  </div>
                </button>
              ))}
            </div>
            <Pagination page={vaultsPage} total={vaults.length} pageSize={PAGE_SIZE} onChange={setVaultsPage} />
          </>
        )}
      </div>

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-sm">
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate({ data: { name: createForm.name, password: createForm.password, pin: createForm.pin, color: createForm.color, icon: createForm.icon } }); }} className="space-y-4 pt-1">
            <div className="flex flex-col items-center gap-2 pb-2">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: createForm.color + '18' }}>
                <Shield className="w-6 h-6" style={{ color: createForm.color }} />
              </div>
              <h3 className="text-[16px] font-bold">New vault</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[13px]">Name</Label>
                <Input value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} required placeholder="e.g. Banking, Top Secret" className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px] flex items-center gap-1.5"><Timer className="w-3.5 h-3.5 text-muted-foreground" />Auto-lock</Label>
                <Select
                  value={String(createForm.autoLockSeconds)}
                  onValueChange={(v) => setCreateForm({ ...createForm, autoLockSeconds: parseInt(v, 10) })}
                >
                  <SelectTrigger className="h-10 text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AUTO_LOCK_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={String(o.value)} className="text-[13px]">{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <AppearancePicker
              color={createForm.color}
              onColorChange={(c) => setCreateForm({ ...createForm, color: c })}
              fixedIcon={Shield}
            />

            <div className="space-y-2">
              <Label className="text-[13px] block text-center">PIN</Label>
              <PinInput value={createForm.pin} onChange={(v) => setCreateForm({ ...createForm, pin: v })} length={4} />
              <p className="text-[11px] text-muted-foreground text-center">Choose a 4-digit PIN</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[13px]">Password</Label>
              <Input type="password" required minLength={6} value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} placeholder="At least 6 characters" className="h-10" />
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)} className="h-9 text-[13px]">Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || createForm.pin.length < 4} className="h-9 text-[13px]">
                {createMutation.isPending ? "Creating..." : "Create vault"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {unlockingVault && (
        <VaultUnlockModal
          open={showUnlockModal}
          onOpenChange={(open) => { setShowUnlockModal(open); if (!open) setUnlockingVault(null); }}
          onUnlocked={handleVaultUnlocked}
          vaultId={unlockingVault.id}
          vaultName={unlockingVault.name}
        />
      )}
      <DeleteConfirmModal
        open={!!pendingDelete}
        onOpenChange={(o) => { if (!o) setPendingDelete(null); }}
        title={pendingDelete?.title ?? ""}
        description={pendingDelete?.description}
        onConfirm={() => { pendingDelete?.onConfirm(); setPendingDelete(null); }}
        isPending={deleteMutation.isPending || deleteCredMutation.isPending}
      />
    </Layout>
  );
}
