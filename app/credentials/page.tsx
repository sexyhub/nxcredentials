"use client";

import { useState, useRef } from "react";
import { Layout } from "@/components/layout";
import {
  useListCredentials,
  useListTags,
  useListSpaces,
  useListVaults,
  useListServiceTypes,
  useDeleteCredential,
  getListCredentialsQueryKey,
  getGetStatsQueryKey,
  getListSpacesQueryKey,
  type Credential,
  type ServiceType,
} from "@/hooks/use-api";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { CopyButton } from "@/components/copy-button";
import { CredentialModal } from "@/components/credential-modal";
import { DeleteConfirmModal } from "@/components/delete-confirm-modal";
import { Plus, Search, Eye, EyeOff, Pencil, Trash2, Key, Loader2, Download, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { getServiceType, getIconComponent } from "@/lib/service-types";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export default function Credentials() {
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [revealedIds, setRevealedIds] = useState<Set<number>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCredential, setSelectedCredential] = useState<Credential | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ title: string; description?: string; onConfirm: () => void } | null>(null);

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportScope, setExportScope] = useState<"global" | "space" | "vault">("global");
  const [exportScopeId, setExportScopeId] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);

  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importDragOver, setImportDragOver] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: allCredentials, isLoading } = useListCredentials({
    search: search || undefined,
    tag: tagFilter || undefined,
  });

  const { data: tags } = useListTags();
  const { data: spaces } = useListSpaces();
  const { data: vaults } = useListVaults();
  const { data: dbServiceTypes = [] } = useListServiceTypes();

  const credentials = typeFilter
    ? allCredentials?.filter((cred) => {
        const dbType = dbServiceTypes.find((t: ServiceType) => t.key === cred.title);
        const fallbackType = getServiceType(cred.title);
        return (dbType?.key ?? fallbackType.key) === typeFilter;
      })
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
    ...(tags?.map((t) => ({
      value: t.name,
      label: t.name,
      icon: <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />,
    })) || []),
  ];

  const usedTypeKeys = new Set(allCredentials?.map((c) => c.title) || []);
  const typeOptions = [
    { value: "", label: "All types" },
    ...dbServiceTypes
      .filter((t: ServiceType) => usedTypeKeys.has(t.key))
      .map((t: ServiceType) => {
        const Icon = getIconComponent(t.icon);
        return { value: t.key, label: t.label, icon: <Icon className="w-3.5 h-3.5" style={{ color: t.color }} /> };
      }),
  ];

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams({ scope: exportScope });
      if ((exportScope === "space" || exportScope === "vault") && exportScopeId) {
        params.set("id", exportScopeId);
      }
      const res = await fetch(`${BASE_PATH}/api/export?${params.toString()}`, { credentials: "include" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast({ title: "Export failed", description: err.error ?? "Unknown error", variant: "destructive" });
        return;
      }
      const blob = await res.blob();
      const contentDisposition = res.headers.get("Content-Disposition") ?? "";
      const fnMatch = contentDisposition.match(/filename="([^"]+)"/);
      const filename = fnMatch ? fnMatch[1] : "credential-vault-export.json";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Export complete", description: `Downloaded ${filename}` });
      setShowExportModal(false);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportFileChange = (file: File | null) => {
    setImportFile(file);
    setImportResult(null);
  };

  const handleImport = async () => {
    if (!importFile) return;
    setIsImporting(true);
    setImportResult(null);
    try {
      const text = await importFile.text();
      let parsed: any;
      try {
        parsed = JSON.parse(text);
      } catch {
        toast({ title: "Import failed", description: "File is not valid JSON", variant: "destructive" });
        return;
      }
      const res = await fetch(`${BASE_PATH}/api/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(parsed),
      });
      const result = await res.json();
      if (!res.ok) {
        toast({ title: "Import failed", description: result.error ?? "Unknown error", variant: "destructive" });
        return;
      }
      setImportResult(result);
      if (result.imported > 0) {
        queryClient.invalidateQueries({ queryKey: getListCredentialsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
        toast({ title: "Import complete", description: `${result.imported} credential${result.imported !== 1 ? "s" : ""} imported` });
      }
    } finally {
      setIsImporting(false);
    }
  };

  const renderCredCard = (cred: Credential) => {
    const dbType = dbServiceTypes.find((t: ServiceType) => t.key === cred.title);
    const stype = dbType ?? getServiceType(cred.title);
    const Icon = getIconComponent(stype.icon);
    return (
      <div key={cred.id} className="border rounded-xl bg-card px-3.5 py-3 group hover:border-foreground/20 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: stype.color + "18" }}>
              <Icon className="w-3.5 h-3.5" style={{ color: stype.color }} />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[13px] font-bold block truncate">{stype.label}</span>
              {cred.tagName && (
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cred.tagColor || "#999" }} />
                  <span className="text-[10px] text-muted-foreground truncate">{cred.tagName}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1">
            <button onClick={() => { setSelectedCredential(cred); setIsModalOpen(true); }} className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent">
              <Pencil className="w-3 h-3" />
            </button>
            <button onClick={() => setPendingDelete({ title: "Delete credential?", description: "This action cannot be undone.", onConfirm: () => deleteMutation.mutate({ id: cred.id }) })} className="p-1 text-muted-foreground hover:text-destructive transition-colors rounded-md hover:bg-accent">
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
  };

  return (
    <Layout>
      <div className="space-y-4">
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
              <Combobox options={tagOptions} value={tagFilter} onValueChange={setTagFilter} placeholder="All tags" searchPlaceholder="Filter tag..." emptyText="None found." />
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" className="h-9 text-[13px]" onClick={() => { setImportResult(null); setImportFile(null); setShowImportModal(true); }}>
              <Upload className="w-3.5 h-3.5 mr-1.5" /> Import
            </Button>
            <Button variant="outline" size="sm" className="h-9 text-[13px]" onClick={() => { setExportScope("global"); setExportScopeId(""); setShowExportModal(true); }}>
              <Download className="w-3.5 h-3.5 mr-1.5" /> Export
            </Button>
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
            <p className="text-[15px] font-semibold mb-1">No credentials</p>
            <p className="text-[13px] text-muted-foreground">Add your first credential to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
            {nonVaultCredentials.map((cred) => renderCredCard(cred))}
          </div>
        )}
      </div>

      <CredentialModal open={isModalOpen} onOpenChange={setIsModalOpen} credential={selectedCredential} />
      <DeleteConfirmModal
        open={!!pendingDelete}
        onOpenChange={(o) => { if (!o) setPendingDelete(null); }}
        title={pendingDelete?.title ?? ""}
        description={pendingDelete?.description}
        onConfirm={() => { pendingDelete?.onConfirm(); setPendingDelete(null); }}
        isPending={deleteMutation.isPending}
      />

      <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
        <DialogContent className="max-w-md">
          <DialogTitle className="text-[15px] font-semibold mb-0.5">Export credentials</DialogTitle>
          <DialogDescription className="text-[13px] text-muted-foreground -mt-3 mb-2">Download your credentials as a JSON file.</DialogDescription>
          <div className="space-y-4">
            <div>
              <Label className="text-[13px] mb-2 block">Scope</Label>
              <div className="flex gap-2">
                {(["global", "space", "vault"] as const).map((s) => (
                  <button key={s} onClick={() => { setExportScope(s); setExportScopeId(""); }} className={`px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-colors ${exportScope === s ? "bg-foreground text-background border-foreground" : "border-border hover:bg-accent"}`}>
                    {s === "global" ? "All credentials" : s === "space" ? "By space" : "By vault"}
                  </button>
                ))}
              </div>
            </div>
            {exportScope === "space" && (
              <div>
                <Label className="text-[13px] mb-2 block">Select space</Label>
                <select value={exportScopeId} onChange={(e) => setExportScopeId(e.target.value)} className="w-full h-9 rounded-lg border bg-background text-[13px] px-3 focus:outline-none focus:ring-1 focus:ring-ring">
                  <option value="">Choose a space...</option>
                  {spaces?.map((sp) => <option key={sp.id} value={String(sp.id)}>{sp.name}</option>)}
                </select>
              </div>
            )}
            {exportScope === "vault" && (
              <div>
                <Label className="text-[13px] mb-2 block">Select vault</Label>
                <select value={exportScopeId} onChange={(e) => setExportScopeId(e.target.value)} className="w-full h-9 rounded-lg border bg-background text-[13px] px-3 focus:outline-none focus:ring-1 focus:ring-ring">
                  <option value="">Choose a vault...</option>
                  {vaults?.map((v) => <option key={v.id} value={String(v.id)}>{v.name}</option>)}
                </select>
              </div>
            )}
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" size="sm" onClick={() => setShowExportModal(false)}>Cancel</Button>
            <Button size="sm" onClick={handleExport} disabled={isExporting || ((exportScope === "space" || exportScope === "vault") && !exportScopeId)}>
              {isExporting ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Exporting...</> : <><Download className="w-3.5 h-3.5 mr-1.5" /> Download JSON</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showImportModal} onOpenChange={(o) => { if (!o) { setShowImportModal(false); setImportFile(null); setImportResult(null); } }}>
        <DialogContent className="max-w-md">
          <DialogTitle className="text-[15px] font-semibold mb-0.5">Import credentials</DialogTitle>
          <DialogDescription className="text-[13px] text-muted-foreground -mt-3 mb-2">Upload a JSON export file to import credentials.</DialogDescription>
          <div className="space-y-4">
            <div
              onDragOver={(e) => { e.preventDefault(); setImportDragOver(true); }}
              onDragLeave={() => setImportDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setImportDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleImportFileChange(f); }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${importDragOver ? "border-foreground bg-accent" : "border-border hover:border-foreground/40 hover:bg-accent/50"}`}
            >
              <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
              {importFile ? (
                <div className="flex items-center justify-center gap-2">
                  <span className="text-[13px] font-medium truncate max-w-[200px]">{importFile.name}</span>
                  <button onClick={(e) => { e.stopPropagation(); handleImportFileChange(null); }} className="text-muted-foreground hover:text-foreground">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-[13px] font-medium">Drop JSON file here or click to browse</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Accepts Credential Vault export files</p>
                </>
              )}
              <input ref={fileInputRef} type="file" accept=".json,application/json" className="hidden" onChange={(e) => handleImportFileChange(e.target.files?.[0] ?? null)} />
            </div>
            {importResult && (
              <div className={`rounded-lg p-3 text-[12px] border ${importResult.skipped > 0 ? "bg-amber-50 border-amber-200 text-amber-800" : "bg-green-50 border-green-200 text-green-800"}`}>
                <p className="font-semibold mb-1">Import complete</p>
                <p>{importResult.imported} imported, {importResult.skipped} skipped</p>
                {importResult.errors.length > 0 && (
                  <ul className="mt-1 space-y-0.5 list-disc list-inside">
                    {importResult.errors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                )}
              </div>
            )}
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" size="sm" onClick={() => { setShowImportModal(false); setImportFile(null); setImportResult(null); }}>
              {importResult ? "Close" : "Cancel"}
            </Button>
            {!importResult && (
              <Button size="sm" onClick={handleImport} disabled={!importFile || isImporting}>
                {isImporting ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Importing...</> : <><Upload className="w-3.5 h-3.5 mr-1.5" /> Import</>}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
