import { useState } from "react";
import { Layout } from "@/components/layout";
import {
  useListSpaces,
  useCreateSpace,
  useUpdateSpace,
  useDeleteSpace,
  useListCredentials,
  useDeleteCredential,
  getListSpacesQueryKey,
  getListCredentialsQueryKey,
  getGetStatsQueryKey,
  type Space,
  type Credential
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { CopyButton } from "@/components/copy-button";
import { CredentialModal } from "@/components/credential-modal";
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import {
  Plus, FolderOpen, Loader2, Eye, EyeOff, Pencil, Trash2, Key, ArrowLeft
} from "lucide-react";
import { getServiceType, SERVICE_TYPES } from "@/lib/service-types";
import { getSpaceIcon } from "@/lib/space-icons";
import { AppearancePicker } from "@/components/appearance-picker";


export default function Spaces() {
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCredModal, setShowCredModal] = useState(false);
  const [editingCred, setEditingCred] = useState<Credential | null>(null);
  const [revealedIds, setRevealedIds] = useState<Set<number>>(new Set());

  const [spaceForm, setSpaceForm] = useState({ name: "", defaultType: "", color: "#6366f1", icon: "folder" });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: spaces, isLoading } = useListSpaces();
  const { data: spaceCredentials } = useListCredentials(
    selectedSpace ? { spaceId: selectedSpace.id } : undefined,
    { query: { enabled: !!selectedSpace } }
  );

  const credentials = spaceCredentials || [];

  const createMutation = useCreateSpace({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSpacesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
        toast({ title: "Space created" });
        setShowCreateModal(false);
        setSpaceForm({ name: "", defaultType: "", color: "#6366f1", icon: "folder" });
      },
    },
  });

  const updateMutation = useUpdateSpace({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListSpacesQueryKey() });
        setSelectedSpace(data as Space);
        toast({ title: "Space updated" });
        setShowEditModal(false);
      },
    },
  });

  const deleteMutation = useDeleteSpace({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSpacesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
        toast({ title: "Space deleted" });
        setSelectedSpace(null);
      },
    },
  });

  const deleteCredMutation = useDeleteCredential({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCredentialsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListSpacesQueryKey() });
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

  const spaceTypeOptions = [
    { value: "", label: "No default type" },
    ...SERVICE_TYPES.map((t) => {
      const Icon = t.icon;
      return { value: t.key, label: t.label, icon: <Icon className="w-3.5 h-3.5" style={{ color: t.color }} /> };
    }),
  ];

  const handleTypeChange = (val: string) => {
    const newType = val || "";
    if (newType) {
      const st = getServiceType(newType);
      const iconMatch = SPACE_ICONS.find((i) => i.icon === st.icon);
      setSpaceForm((prev) => ({ ...prev, defaultType: newType, color: st.color, icon: iconMatch?.key || "folder" }));
    } else {
      setSpaceForm((prev) => ({ ...prev, defaultType: newType }));
    }
  };

  const openCreate = () => {
    setSpaceForm({ name: "", defaultType: "", color: "#6366f1", icon: "folder" });
    setShowCreateModal(true);
  };

  const openEdit = () => {
    if (!selectedSpace) return;
    setSpaceForm({
      name: selectedSpace.name,
      defaultType: selectedSpace.defaultType || "",
      color: selectedSpace.color || "#6366f1",
      icon: selectedSpace.icon || "folder",
    });
    setShowEditModal(true);
  };

  const SpaceFormIcon = getSpaceIcon(spaceForm.icon);

  if (selectedSpace) {
    const currentSpace = spaces?.find(s => s.id === selectedSpace.id) || selectedSpace;
    const CurrentIcon = getSpaceIcon(currentSpace.icon);

    return (
      <Layout>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setSelectedSpace(null); setRevealedIds(new Set()); }}
              className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: (currentSpace.color || '#6366f1') + '18' }}>
              <CurrentIcon className="w-4 h-4" style={{ color: currentSpace.color || '#6366f1' }} />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-extrabold tracking-tight truncate">{currentSpace.name}</h1>
              <p className="text-[12px] text-muted-foreground">{currentSpace.credentialCount} credential{currentSpace.credentialCount !== 1 ? "s" : ""}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" className="h-8 text-[12px]" onClick={() => { setEditingCred(null); setShowCredModal(true); }}>
                <Plus className="w-3 h-3 mr-1" /> Add
              </Button>
              <Button variant="ghost" size="sm" className="h-8 text-[12px]" onClick={openEdit}>
                <Pencil className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {credentials.length === 0 ? (
            <div className="border rounded-xl p-16 text-center bg-card">
              <Key className="w-8 h-8 text-border mx-auto mb-3" />
              <p className="text-[15px] font-semibold mb-1">No credentials</p>
              <p className="text-[13px] text-muted-foreground">Add your first credential to this space.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
              {credentials.map((cred) => {
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

        <CredentialModal
          open={showCredModal}
          onOpenChange={setShowCredModal}
          credential={editingCred}
          defaultSpaceId={currentSpace.id}
          defaultType={currentSpace.defaultType}
        />

        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="sm:max-w-sm">
            <form onSubmit={(e) => {
              e.preventDefault();
              updateMutation.mutate({
                id: currentSpace.id,
                data: {
                  name: spaceForm.name,
                  defaultType: spaceForm.defaultType || undefined,
                  color: spaceForm.color,
                  icon: spaceForm.icon,
                },
              });
            }} className="space-y-4 pt-1">
              <div className="flex flex-col items-center gap-2 pb-2">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: spaceForm.color + '18' }}>
                  <SpaceFormIcon className="w-6 h-6" style={{ color: spaceForm.color }} />
                </div>
                <h3 className="text-[16px] font-bold">Edit space</h3>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px]">Name</Label>
                <Input value={spaceForm.name} onChange={(e) => setSpaceForm({ ...spaceForm, name: e.target.value })} required placeholder="e.g. Gmail, Banking, Work" className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px]">Default type (optional)</Label>
                <Combobox
                  options={spaceTypeOptions}
                  value={spaceForm.defaultType}
                  onValueChange={handleTypeChange}
                  placeholder="None — choose per credential"
                  searchPlaceholder="Search types..."
                  emptyText="No match."
                />
              </div>
              <AppearancePicker
                color={spaceForm.color}
                onColorChange={(c) => setSpaceForm({ ...spaceForm, color: c })}
                icon={spaceForm.icon}
                onIconChange={(i) => setSpaceForm({ ...spaceForm, icon: i })}
                showIcons
              />
              <DialogFooter className="pt-2 gap-2">
                <Button type="button" variant="outline" size="sm" className="h-8 text-[12px] text-destructive hover:text-destructive"
                  onClick={() => { if (confirm(`Delete "${currentSpace.name}" and unassign its credentials? This cannot be undone.`)) { deleteMutation.mutate({ id: currentSpace.id }); setShowEditModal(false); } }}>
                  Delete space
                </Button>
                <Button type="submit" size="sm" className="h-8 text-[12px]" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Spaces</h1>
            <p className="text-muted-foreground text-[15px] mt-1">Organize credentials into open groups — no password required.</p>
          </div>
          <Button onClick={openCreate} size="sm" className="h-9 text-[13px] font-semibold shrink-0">
            <Plus className="w-3.5 h-3.5 mr-1.5" /> New space
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : !spaces?.length ? (
          <div className="border rounded-xl p-16 text-center bg-card">
            <FolderOpen className="w-8 h-8 text-border mx-auto mb-3" />
            <p className="text-[15px] font-semibold mb-1">No spaces yet</p>
            <p className="text-[13px] text-muted-foreground">Create a space to group and organize your credentials.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {spaces.map((space) => {
              const SpaceIcon = getSpaceIcon(space.icon);
              const color = space.color || "#6366f1";
              return (
                <button
                  key={space.id}
                  onClick={() => setSelectedSpace(space)}
                  className="border rounded-xl bg-card px-4 py-4 text-left hover:border-foreground/20 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: color + '18' }}>
                      <SpaceIcon className="w-4.5 h-4.5" style={{ color }} />
                    </div>
                    <div>
                      <span className="text-[32px] font-extrabold tracking-tight leading-none">{space.credentialCount}</span>
                      <span className="text-[11px] text-muted-foreground font-medium ml-1.5">{space.credentialCount === 1 ? "credential" : "credentials"}</span>
                    </div>
                  </div>
                  <div className="border-t pt-3 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[13px] font-bold truncate">{space.name}</div>
                      <div className="text-[11px] text-muted-foreground shrink-0">{space.defaultType ? getServiceType(space.defaultType).label : "Mixed types"} · open space</div>
                    </div>
                    <div className="text-[11px] text-muted-foreground/60">Tap to view & manage credentials</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-sm">
          <form onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate({
              data: {
                name: spaceForm.name,
                defaultType: spaceForm.defaultType || undefined,
                color: spaceForm.color,
                icon: spaceForm.icon,
              },
            });
          }} className="space-y-4 pt-1">
            <div className="flex flex-col items-center gap-2 pb-2">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: spaceForm.color + '18' }}>
                <SpaceFormIcon className="w-6 h-6" style={{ color: spaceForm.color }} />
              </div>
              <h3 className="text-[16px] font-bold">New space</h3>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[13px]">Name</Label>
              <Input value={spaceForm.name} onChange={(e) => setSpaceForm({ ...spaceForm, name: e.target.value })} required placeholder="e.g. Gmail, Banking, Work" className="h-10" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[13px]">Default type (optional)</Label>
              <Combobox
                options={spaceTypeOptions}
                value={spaceForm.defaultType}
                onValueChange={handleTypeChange}
                placeholder="None — choose per credential"
                searchPlaceholder="Search types..."
                emptyText="No match."
              />
              <p className="text-[11px] text-muted-foreground">
                If set, new credentials in this space will use this type by default.
              </p>
            </div>

            <AppearancePicker
              color={spaceForm.color}
              onColorChange={(c) => setSpaceForm({ ...spaceForm, color: c })}
              icon={spaceForm.icon}
              onIconChange={(i) => setSpaceForm({ ...spaceForm, icon: i })}
              showIcons
            />

            <DialogFooter className="pt-2 gap-2">
              <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)} className="h-9 text-[13px]">Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending} className="h-9 text-[13px]">
                {createMutation.isPending ? "Creating..." : "Create space"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
