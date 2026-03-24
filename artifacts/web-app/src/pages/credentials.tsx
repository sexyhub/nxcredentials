import { useState } from "react";
import { Layout } from "@/components/layout";
import {
  useListCredentials,
  useListCategories,
  useListSpaces,
  useDeleteCredential,
  useCreateSpace,
  useDeleteSpace,
  getListCredentialsQueryKey,
  getGetStatsQueryKey,
  getListSpacesQueryKey,
  type Credential,
  type Space
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
import { Plus, Search, Eye, EyeOff, Pencil, Trash2, Key, Loader2, FolderOpen, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { getServiceType, SERVICE_TYPES } from "@/lib/service-types";
import { SPACE_ICONS, getSpaceIcon } from "@/lib/space-icons";

const SPACE_COLORS = [
  "#6366f1", "#8B5CF6", "#EC4899", "#EF4444", "#F59E0B",
  "#10B981", "#06B6D4", "#3B82F6", "#6B7280", "#1F2937"
];

export default function Credentials() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [activeSpaceId, setActiveSpaceId] = useState<number | null>(null);
  const [revealedIds, setRevealedIds] = useState<Set<number>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCredential, setSelectedCredential] = useState<Credential | null>(null);
  const [showSpaceModal, setShowSpaceModal] = useState(false);
  const [spaceForm, setSpaceForm] = useState({ name: "", defaultType: "", color: "#6366f1", icon: "folder" });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: allCredentials, isLoading } = useListCredentials({
    search: search || undefined,
    category: categoryFilter || undefined,
    ...(activeSpaceId ? { spaceId: activeSpaceId } : {}),
  });

  const { data: spaces } = useListSpaces();
  const { data: categories } = useListCategories();

  const credentials = typeFilter
    ? allCredentials?.filter((cred) => getServiceType(cred.title).key === typeFilter)
    : allCredentials;

  const nonVaultCredentials = credentials?.filter((c) => !c.vaultId) || [];

  const deleteMutation = useDeleteCredential({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCredentialsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListSpacesQueryKey() });
      },
    },
  });

  const createSpaceMutation = useCreateSpace({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListSpacesQueryKey() });
        toast({ title: "Space created" });
        setShowSpaceModal(false);
        setSpaceForm({ name: "", defaultType: "", color: "#6366f1", icon: "folder" });
        setActiveSpaceId((data as Space).id);
      },
    },
  });

  const deleteSpaceMutation = useDeleteSpace({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSpacesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListCredentialsQueryKey() });
        toast({ title: "Space deleted" });
        setActiveSpaceId(null);
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

  const activeSpace = spaces?.find((s) => s.id === activeSpaceId);

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
        return { value: t.key, label: t.label, icon: <Icon className="w-3.5 h-3.5" style={{ color: t.color }} /> };
      }),
  ];

  const spaceTypeOptions = [
    { value: "", label: "No default type" },
    ...SERVICE_TYPES.map((t) => {
      const Icon = t.icon;
      return { value: t.key, label: t.label, icon: <Icon className="w-3.5 h-3.5" style={{ color: t.color }} /> };
    }),
  ];

  const handleTypeChange = (val: string) => {
    const newType = val || "";
    const updates: any = { defaultType: newType };
    if (newType) {
      const st = getServiceType(newType);
      updates.color = st.color;
      const iconMatch = SPACE_ICONS.find((i) => {
        const stIcon = st.icon;
        return i.icon === stIcon;
      });
      updates.icon = iconMatch?.key || "folder";
    }
    setSpaceForm((prev) => ({ ...prev, ...updates }));
  };

  const renderCredCard = (cred: Credential) => {
    const stype = getServiceType(cred.title);
    const Icon = stype.icon;
    return (
      <div key={cred.id} className="border rounded-xl bg-card px-3.5 py-3 group hover:border-foreground/20 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: stype.color + '18' }}>
              <Icon className="w-3.5 h-3.5" style={{ color: stype.color }} />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[13px] font-bold block truncate">{stype.label}</span>
              {cred.categoryName && (
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cred.categoryColor || '#999' }} />
                  <span className="text-[10px] text-muted-foreground truncate">{cred.categoryName}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1">
            <button onClick={() => { setSelectedCredential(cred); setIsModalOpen(true); }} className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent">
              <Pencil className="w-3 h-3" />
            </button>
            <button onClick={() => { if (confirm("Delete this credential?")) deleteMutation.mutate({ id: cred.id }); }} className="p-1 text-muted-foreground hover:text-destructive transition-colors rounded-md hover:bg-accent">
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
  };

  const SpaceFormIcon = getSpaceIcon(spaceForm.icon);

  return (
    <Layout>
      <div className="space-y-4">
        {(spaces && spaces.length > 0) && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            <button
              onClick={() => setActiveSpaceId(null)}
              className={`border rounded-xl bg-card px-3 py-2.5 text-left transition-all ${
                !activeSpaceId ? "border-foreground/30 ring-1 ring-foreground/10" : "hover:border-foreground/20"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-accent">
                  <LayoutGrid className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-bold truncate">All</div>
                  <div className="text-[10px] text-muted-foreground">{allCredentials?.filter(c => !c.vaultId).length || 0}</div>
                </div>
              </div>
            </button>

            {spaces.map((space) => {
              const isActive = activeSpaceId === space.id;
              const SpaceIcon = getSpaceIcon(space.icon);
              const spaceColor = space.color || "#6366f1";
              return (
                <button
                  key={space.id}
                  onClick={() => setActiveSpaceId(isActive ? null : space.id)}
                  className={`border rounded-xl bg-card px-3 py-2.5 text-left transition-all group relative ${
                    isActive ? "ring-1" : "hover:border-foreground/20"
                  }`}
                  style={isActive ? { borderColor: spaceColor + '60', ringColor: spaceColor + '30' } : undefined}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: spaceColor + '18' }}>
                      <SpaceIcon className="w-3.5 h-3.5" style={{ color: spaceColor }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[12px] font-bold truncate">{space.name}</div>
                      <div className="text-[10px] text-muted-foreground">{space.credentialCount}</div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); if (confirm(`Delete space "${space.name}"? Credentials will remain but become unassigned.`)) deleteSpaceMutation.mutate({ id: space.id }); }}
                      className="p-0.5 text-muted-foreground/0 group-hover:text-muted-foreground/40 hover:!text-destructive transition-colors rounded shrink-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </button>
              );
            })}

            <button
              onClick={() => setShowSpaceModal(true)}
              className="border border-dashed rounded-xl px-3 py-2.5 text-left hover:border-foreground/20 hover:bg-accent/30 transition-all"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-accent/50">
                  <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div className="text-[12px] font-medium text-muted-foreground">New space</div>
              </div>
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex flex-col sm:flex-row gap-2.5 flex-1 w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
              <Input type="text" placeholder="Search credentials..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10" />
            </div>
            <div className="sm:w-[180px]">
              <Combobox options={typeOptions} value={typeFilter} onValueChange={setTypeFilter} placeholder="All types" searchPlaceholder="Filter type..." emptyText="None found." />
            </div>
            <div className="sm:w-[180px]">
              <Combobox options={tagOptions} value={categoryFilter} onValueChange={setCategoryFilter} placeholder="All tags" searchPlaceholder="Filter tag..." emptyText="None found." />
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!spaces?.length && (
              <Button variant="outline" onClick={() => setShowSpaceModal(true)} size="sm" className="h-9 text-[13px] font-semibold">
                <FolderOpen className="w-3.5 h-3.5 mr-1.5" /> New space
              </Button>
            )}
            <Button onClick={() => { setSelectedCredential(null); setIsModalOpen(true); }} size="sm" className="h-9 text-[13px] font-semibold">
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Add
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : nonVaultCredentials.length === 0 ? (
          <div className="border rounded-xl p-16 text-center bg-card">
            <Key className="w-8 h-8 text-border mx-auto mb-3" />
            <p className="text-[15px] font-semibold mb-1">No credentials{activeSpace ? ` in ${activeSpace.name}` : ""}</p>
            <p className="text-[13px] text-muted-foreground">
              {activeSpace ? "Add a credential to this space." : "Add your first credential to get started."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
            {nonVaultCredentials.map((cred) => renderCredCard(cred))}
          </div>
        )}
      </div>

      <CredentialModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        credential={selectedCredential}
        defaultSpaceId={activeSpaceId}
        defaultType={activeSpace?.defaultType}
      />

      <Dialog open={showSpaceModal} onOpenChange={setShowSpaceModal}>
        <DialogContent className="sm:max-w-sm">
          <form onSubmit={(e) => {
            e.preventDefault();
            createSpaceMutation.mutate({
              data: {
                name: spaceForm.name,
                defaultType: spaceForm.defaultType || undefined,
                color: spaceForm.color,
                icon: spaceForm.icon,
              }
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

            <div className="space-y-1.5">
              <Label className="text-[13px]">Color</Label>
              <div className="flex gap-2 flex-wrap">
                {SPACE_COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => setSpaceForm({ ...spaceForm, color: c })}
                    className={`w-6 h-6 rounded-lg transition-all ${spaceForm.color === c ? "ring-2 ring-offset-2 ring-foreground scale-110" : "hover:scale-105"}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[13px]">Icon</Label>
              <div className="flex gap-1.5 flex-wrap">
                {SPACE_ICONS.map((si) => {
                  const SIcon = si.icon;
                  const isSelected = spaceForm.icon === si.key;
                  return (
                    <button key={si.key} type="button" onClick={() => setSpaceForm({ ...spaceForm, icon: si.key })}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                        isSelected ? "ring-2 ring-offset-1 ring-foreground bg-accent" : "hover:bg-accent/50"
                      }`}
                    >
                      <SIcon className="w-4 h-4" style={{ color: isSelected ? spaceForm.color : undefined }} />
                    </button>
                  );
                })}
              </div>
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button type="button" variant="outline" onClick={() => setShowSpaceModal(false)} className="h-9 text-[13px]">Cancel</Button>
              <Button type="submit" disabled={createSpaceMutation.isPending} className="h-9 text-[13px]">
                {createSpaceMutation.isPending ? "Creating..." : "Create space"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
