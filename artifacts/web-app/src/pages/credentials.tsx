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
import { Plus, Search, Eye, EyeOff, Pencil, Trash2, Key, Loader2, FolderOpen, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { getServiceType, SERVICE_TYPES } from "@/lib/service-types";

export default function Credentials() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [activeSpaceId, setActiveSpaceId] = useState<number | null>(null);
  const [revealedIds, setRevealedIds] = useState<Set<number>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCredential, setSelectedCredential] = useState<Credential | null>(null);
  const [showSpaceModal, setShowSpaceModal] = useState(false);
  const [spaceForm, setSpaceForm] = useState({ name: "", defaultType: "" });

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
        setSpaceForm({ name: "", defaultType: "" });
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

  return (
    <Layout>
      <div className="space-y-4">
        {spaces && spaces.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveSpaceId(null)}
              className={`shrink-0 px-3 py-1.5 text-[12px] font-semibold rounded-lg transition-colors ${
                !activeSpaceId ? "bg-foreground text-background" : "bg-accent text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </button>
            {spaces.map((space) => {
              const isActive = activeSpaceId === space.id;
              const stype = space.defaultType ? getServiceType(space.defaultType) : null;
              const SpaceIcon = stype?.icon;
              return (
                <button
                  key={space.id}
                  onClick={() => setActiveSpaceId(space.id)}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold rounded-lg transition-colors ${
                    isActive ? "bg-foreground text-background" : "bg-accent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {SpaceIcon && <SpaceIcon className="w-3 h-3" style={{ color: isActive ? undefined : stype?.color }} />}
                  {space.name}
                  <span className="text-[10px] opacity-60">{space.credentialCount}</span>
                </button>
              );
            })}
            <button
              onClick={() => setShowSpaceModal(true)}
              className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-colors"
            >
              <Plus className="w-3 h-3" /> Space
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

        {activeSpace && (
          <div className="flex items-center gap-2 text-[13px]">
            <FolderOpen className="w-4 h-4 text-muted-foreground" />
            <span className="font-semibold">{activeSpace.name}</span>
            {activeSpace.defaultType && (
              <span className="text-[11px] bg-accent px-1.5 py-0.5 rounded text-muted-foreground">
                Default: {getServiceType(activeSpace.defaultType).label}
              </span>
            )}
            <button onClick={() => setActiveSpaceId(null)} className="p-0.5 text-muted-foreground hover:text-foreground">
              <X className="w-3 h-3" />
            </button>
            <button
              onClick={() => { if (confirm(`Delete space "${activeSpace.name}"? Credentials will remain but become unassigned.`)) deleteSpaceMutation.mutate({ id: activeSpace.id }); }}
              className="p-0.5 text-muted-foreground hover:text-destructive ml-auto"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}

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
            const data: any = { name: spaceForm.name };
            if (spaceForm.defaultType) {
              data.defaultType = spaceForm.defaultType;
              const st = getServiceType(spaceForm.defaultType);
              data.color = st.color;
              data.icon = spaceForm.defaultType;
            }
            createSpaceMutation.mutate({ data });
          }} className="space-y-4 pt-1">
            <div className="flex flex-col items-center gap-2 pb-2">
              <FolderOpen className="w-8 h-8 text-muted-foreground" />
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
                onValueChange={(val) => setSpaceForm({ ...spaceForm, defaultType: val || "" })}
                placeholder="None — choose per credential"
                searchPlaceholder="Search types..."
                emptyText="No match."
              />
              <p className="text-[11px] text-muted-foreground">
                If set, new credentials in this space will use this type by default.
              </p>
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
