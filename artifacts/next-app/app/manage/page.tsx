"use client";

import { useState } from "react";
import { Layout } from "@/components/layout";
import {
  useListTags,
  useDeleteTag,
  useListServiceTypes,
  useDeleteServiceType,
  getListTagsQueryKey,
  getGetStatsQueryKey,
  getListServiceTypesQueryKey,
  type Tag,
  type ServiceType,
} from "@/hooks/use-api";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { TagModal } from "@/components/tag-modal";
import { ServiceTypeModal } from "@/components/service-type-modal";
import { DeleteConfirmModal } from "@/components/delete-confirm-modal";
import { Plus, Pencil, Trash2, Tag as TagIcon, Grid3X3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getIconComponent } from "@/lib/service-types";
import { Pagination } from "@/components/pagination";

const PAGE_SIZE = 20;

export default function Manage() {
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [selectedType, setSelectedType] = useState<ServiceType | null>(null);
  const [activeTab, setActiveTab] = useState<"tags" | "types">("tags");
  const [tagsPage, setTagsPage] = useState(1);
  const [typesPage, setTypesPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<{ title: string; description?: string; onConfirm: () => void } | null>(null);

  const { data: tags, isLoading: tagsLoading } = useListTags();
  const { data: serviceTypes, isLoading: typesLoading } = useListServiceTypes();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const deleteTagMutation = useDeleteTag({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTagsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
        toast({ title: "Tag deleted" });
      },
    },
  });

  const deleteTypeMutation = useDeleteServiceType({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListServiceTypesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
        toast({ title: "Service type deleted" });
      },
      onError: () => {
        toast({ title: "Failed to delete service type", variant: "destructive" });
      },
    },
  });

  const pagedTags = tags?.slice((tagsPage - 1) * PAGE_SIZE, tagsPage * PAGE_SIZE) ?? [];
  const pagedTypes = (serviceTypes ?? []).slice((typesPage - 1) * PAGE_SIZE, typesPage * PAGE_SIZE);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Manage</h1>
          <p className="text-muted-foreground text-[15px] mt-1">Tags and service types for organizing credentials.</p>
        </div>

        <div className="flex items-center gap-1 border-b">
          <button
            onClick={() => { setActiveTab("tags"); setTagsPage(1); }}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors ${
              activeTab === "tags" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <TagIcon className="w-3.5 h-3.5" />
            Tags
            {tags && (
              <span className="text-[11px] bg-accent px-1.5 py-0.5 rounded-md font-mono tabular-nums">{tags.length}</span>
            )}
          </button>
          <button
            onClick={() => { setActiveTab("types"); setTypesPage(1); }}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors ${
              activeTab === "types" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Grid3X3 className="w-3.5 h-3.5" />
            Service types
            {serviceTypes && (
              <span className="text-[11px] bg-accent px-1.5 py-0.5 rounded-md font-mono tabular-nums">{serviceTypes.length}</span>
            )}
          </button>
        </div>

        {activeTab === "tags" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[13px] text-muted-foreground">Custom tags to label and filter your credentials.</p>
              <Button onClick={() => { setSelectedTag(null); setIsTagModalOpen(true); }} size="sm" className="h-9 text-[13px] font-semibold">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Add tag
              </Button>
            </div>

            {tagsLoading ? (
              <div className="text-[13px] text-muted-foreground py-14 text-center">Loading...</div>
            ) : tags?.length === 0 ? (
              <div className="border rounded-xl p-16 text-center bg-card">
                <TagIcon className="w-8 h-8 text-border mx-auto mb-3" />
                <p className="text-[15px] font-semibold mb-1">No tags yet</p>
                <p className="text-[13px] text-muted-foreground">Create your first tag to organize credentials.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
                  {pagedTags.map((t) => (
                    <div key={t.id} className="border rounded-xl bg-card px-3.5 py-3 flex items-center gap-2.5 group hover:border-foreground/20 transition-colors">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: t.color + '18' }}>
                        <TagIcon className="w-4 h-4" style={{ color: t.color }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[13px] font-semibold block truncate">{t.name}</span>
                        <span className="text-[11px] text-muted-foreground tabular-nums">{t.credentialCount} credential{t.credentialCount !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          onClick={() => { setSelectedTag(t); setIsTagModalOpen(true); }}
                          className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (t.credentialCount > 0) {
                              toast({ title: `Can't delete — ${t.credentialCount} credential(s) use this tag.`, variant: "destructive" });
                              return;
                            }
                            setPendingDelete({ title: "Delete tag?", description: `"${t.name}" will be removed from all credentials.`, onConfirm: () => deleteTagMutation.mutate({ id: t.id }) });
                          }}
                          className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-accent"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <Pagination page={tagsPage} total={tags?.length ?? 0} pageSize={PAGE_SIZE} onChange={setTagsPage} />
              </>
            )}
          </div>
        )}

        {activeTab === "types" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[13px] text-muted-foreground">Service types available when creating credentials.</p>
              <Button
                onClick={() => { setSelectedType(null); setIsTypeModalOpen(true); }}
                size="sm"
                className="h-9 text-[13px] font-semibold"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Add type
              </Button>
            </div>

            {typesLoading ? (
              <div className="text-[13px] text-muted-foreground py-14 text-center">Loading...</div>
            ) : (serviceTypes?.length ?? 0) === 0 ? (
              <div className="border rounded-xl p-16 text-center bg-card">
                <Grid3X3 className="w-8 h-8 text-border mx-auto mb-3" />
                <p className="text-[15px] font-semibold mb-1">No service types</p>
                <p className="text-[13px] text-muted-foreground">Add your first service type.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
                  {pagedTypes.map((t) => {
                    const Icon = getIconComponent(t.icon);
                    return (
                      <div key={t.id} className="border rounded-xl bg-card px-3.5 py-3 flex items-center gap-2.5 group hover:border-foreground/20 transition-colors">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: t.color + '18' }}>
                          <Icon className="w-4 h-4" style={{ color: t.color }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[13px] font-semibold block truncate">{t.label}</span>
                          <span className="text-[11px] text-muted-foreground font-mono">{t.key}</span>
                        </div>
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button
                            onClick={() => { setSelectedType(t); setIsTypeModalOpen(true); }}
                            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setPendingDelete({ title: `Delete "${t.label}"?`, description: "Credentials using this type will still exist but show as unknown.", onConfirm: () => deleteTypeMutation.mutate({ id: t.id! }) });
                            }}
                            className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-accent"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <Pagination page={typesPage} total={serviceTypes?.length ?? 0} pageSize={PAGE_SIZE} onChange={setTypesPage} />
              </>
            )}
          </div>
        )}
      </div>

      <TagModal open={isTagModalOpen} onOpenChange={setIsTagModalOpen} tag={selectedTag} />
      <ServiceTypeModal open={isTypeModalOpen} onOpenChange={setIsTypeModalOpen} serviceType={selectedType} />
      <DeleteConfirmModal
        open={!!pendingDelete}
        onOpenChange={(o) => { if (!o) setPendingDelete(null); }}
        title={pendingDelete?.title ?? ""}
        description={pendingDelete?.description}
        onConfirm={() => { pendingDelete?.onConfirm(); setPendingDelete(null); }}
        isPending={deleteTagMutation.isPending || deleteTypeMutation.isPending}
      />
    </Layout>
  );
}
