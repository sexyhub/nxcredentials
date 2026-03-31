"use client";

import { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/layout";
import {
  useGetSettings,
  useUpdateSettings,
  useListSpaces,
  useListVaults,
  getGetSettingsQueryKey,
  getGetBrandingQueryKey,
} from "@/hooks/use-api";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Save, User, Globe, ShieldCheck, Palette, Loader2, Download, Upload, Database, FileJson } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Combobox } from "@/components/ui/combobox";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isAdmin = user?.isAdmin ?? false;

  const { data: settings, isLoading } = useGetSettings({
    query: { enabled: isAdmin },
  });
  const { data: spaces = [] } = useListSpaces();
  const { data: vaults = [] } = useListVaults();

  const [formData, setFormData] = useState({
    siteTitle: "",
    siteDescription: "",
    siteLogo: "",
    siteFavicon: "",
    registrationEnabled: false,
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        siteTitle: settings.siteTitle,
        siteDescription: settings.siteDescription,
        siteLogo: settings.siteLogo,
        siteFavicon: settings.siteFavicon,
        registrationEnabled: settings.registrationEnabled,
      });
    }
  }, [settings]);

  const updateMutation = useUpdateSettings({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetBrandingQueryKey() });
        toast({ title: "Settings saved" });
      },
      onError: (err: any) => {
        toast({ title: "Save failed", description: err?.data?.error || "Something went wrong.", variant: "destructive" });
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({ data: formData });
  };

  // ── Export state ──────────────────────────────────────────────────────────
  const [exportOpen, setExportOpen] = useState(false);
  const [exportScope, setExportScope] = useState("global");
  const [exportSpaceId, setExportSpaceId] = useState("");
  const [exportVaultId, setExportVaultId] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      let url = "/api/export?scope=" + exportScope;
      if (exportScope === "space" && exportSpaceId) url += "&id=" + exportSpaceId;
      if (exportScope === "vault" && exportVaultId) url += "&id=" + exportVaultId;
      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Export failed");
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="?([^"]+)"?/);
      const filename = match?.[1] || "export.json";
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
      toast({ title: "Export complete", description: `Saved as ${filename}` });
      setExportOpen(false);
    } catch (err: any) {
      toast({ title: "Export failed", description: err.message, variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  // ── Import state ──────────────────────────────────────────────────────────
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setImportFile(file);
      setImportResult(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
      setImportResult(null);
    }
  };

  const handleImport = async () => {
    if (!importFile) return;
    setIsImporting(true);
    setImportResult(null);
    try {
      const text = await importFile.text();
      const data = JSON.parse(text);
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Import failed");
      setImportResult(result);
      toast({ title: `Imported ${result.imported} credential${result.imported !== 1 ? "s" : ""}` });
    } catch (err: any) {
      toast({ title: "Import failed", description: err.message, variant: "destructive" });
    } finally {
      setIsImporting(false);
    }
  };

  const scopeOptions = [
    { value: "global", label: "All credentials" },
    { value: "space", label: "By space" },
    { value: "vault", label: "By vault" },
  ];

  const spaceOptions = spaces.map((s: any) => ({ value: String(s.id), label: s.name }));
  const vaultOptions = vaults.map((v: any) => ({ value: String(v.id), label: v.name }));

  const exportDisabled =
    isExporting ||
    (exportScope === "space" && !exportSpaceId) ||
    (exportScope === "vault" && !exportVaultId);

  return (
    <Layout>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Settings</h1>
            <p className="text-muted-foreground text-[15px] mt-1">
              {isAdmin ? "Site configuration and access control." : "Your account and role information."}
            </p>
          </div>
          {isAdmin && (
            <Button type="submit" disabled={updateMutation.isPending} className="h-9 text-[13px] font-semibold shrink-0">
              <Save className="w-3.5 h-3.5 mr-1.5" />
              {updateMutation.isPending ? "Saving..." : "Save changes"}
            </Button>
          )}
        </div>

        {/* Account */}
        <div className="border rounded-xl bg-card overflow-hidden">
          <div className="px-5 py-3.5 border-b flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-muted-foreground" />
            <h2 className="text-[13px] font-bold">Account</h2>
          </div>
          <div className="px-5 py-4 flex items-center justify-between">
            <div>
              <div className="text-[15px] font-bold">{user?.username}</div>
              <div className="text-[12px] text-muted-foreground mt-0.5">Currently signed in</div>
            </div>
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider ${isAdmin ? "bg-foreground text-background" : "bg-accent text-muted-foreground"}`}>
              {isAdmin ? "Admin" : "User"}
            </span>
          </div>
        </div>

        {!isAdmin && (
          <div className="border rounded-xl bg-card px-5 py-8 text-center">
            <ShieldCheck className="w-8 h-8 text-border mx-auto mb-3" />
            <p className="text-[15px] font-semibold mb-1">Admin access required</p>
            <p className="text-[13px] text-muted-foreground">Only administrators can view and change site settings.</p>
          </div>
        )}

        {isAdmin && isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {isAdmin && !isLoading && (
          <>
            {/* General */}
            <div className="border rounded-xl bg-card overflow-hidden">
              <div className="px-5 py-3.5 border-b flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                <h2 className="text-[13px] font-bold">General</h2>
              </div>
              <div className="px-5 py-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="siteTitle" className="text-[13px]">Site title</Label>
                    <Input
                      id="siteTitle"
                      required
                      value={formData.siteTitle}
                      onChange={(e) => setFormData({ ...formData, siteTitle: e.target.value })}
                      className="h-10"
                      placeholder="Credential Vault"
                    />
                    <p className="text-[11px] text-muted-foreground">Shown in the header, browser tab, and login page.</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="siteDescription" className="text-[13px]">Site description</Label>
                    <Input
                      id="siteDescription"
                      value={formData.siteDescription}
                      onChange={(e) => setFormData({ ...formData, siteDescription: e.target.value })}
                      className="h-10"
                      placeholder="Access your credential vault"
                    />
                    <p className="text-[11px] text-muted-foreground">Subtitle shown on the login page beneath the heading.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Access control */}
            <div className="border rounded-xl bg-card overflow-hidden">
              <div className="px-5 py-3.5 border-b flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground" />
                <h2 className="text-[13px] font-bold">Access control</h2>
              </div>
              <div className="px-5 py-4 flex items-center justify-between">
                <div>
                  <div className="text-[14px] font-semibold">Public registration</div>
                  <div className="text-[12px] text-muted-foreground mt-0.5">
                    {formData.registrationEnabled
                      ? "Anyone can create a new account"
                      : "New account signups are disabled"}
                  </div>
                </div>
                <Switch
                  checked={formData.registrationEnabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, registrationEnabled: checked })}
                />
              </div>
            </div>

            {/* Branding */}
            <div className="border rounded-xl bg-card overflow-hidden">
              <div className="px-5 py-3.5 border-b flex items-center gap-2">
                <Palette className="w-3.5 h-3.5 text-muted-foreground" />
                <h2 className="text-[13px] font-bold">Branding</h2>
              </div>
              <div className="px-5 py-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="logoUrl" className="text-[13px]">Logo URL</Label>
                    <Input
                      id="logoUrl"
                      value={formData.siteLogo}
                      onChange={(e) => setFormData({ ...formData, siteLogo: e.target.value })}
                      placeholder="https://example.com/logo.png"
                      className="h-10"
                    />
                    <p className="text-[11px] text-muted-foreground">Custom logo shown in the header and login page.</p>
                    {formData.siteLogo && (
                      <div className="flex items-center gap-3 px-3 py-2.5 border rounded-lg bg-accent/40">
                        <img
                          src={formData.siteLogo}
                          alt="Logo preview"
                          className="w-7 h-7 object-contain rounded"
                          onError={(e) => (e.currentTarget.style.display = "none")}
                        />
                        <span className="text-[11px] text-muted-foreground">Logo preview</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="faviconUrl" className="text-[13px]">Favicon URL</Label>
                    <Input
                      id="faviconUrl"
                      value={formData.siteFavicon}
                      onChange={(e) => setFormData({ ...formData, siteFavicon: e.target.value })}
                      placeholder="https://example.com/favicon.ico"
                      className="h-10"
                    />
                    <p className="text-[11px] text-muted-foreground">Browser tab icon for the site.</p>
                    {formData.siteFavicon && (
                      <div className="flex items-center gap-3 px-3 py-2.5 border rounded-lg bg-accent/40">
                        <img
                          src={formData.siteFavicon}
                          alt="Favicon preview"
                          className="w-4 h-4 object-contain"
                          onError={(e) => (e.currentTarget.style.display = "none")}
                        />
                        <span className="text-[11px] text-muted-foreground">Favicon preview</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pb-2">
              <Button type="submit" disabled={updateMutation.isPending} className="h-9 text-[13px] font-semibold">
                <Save className="w-3.5 h-3.5 mr-1.5" />
                {updateMutation.isPending ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </>
        )}
      </form>

      {/* Data — always visible */}
      <div className="border rounded-xl bg-card overflow-hidden mt-6">
        <div className="px-5 py-3.5 border-b flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-muted-foreground" />
          <h2 className="text-[13px] font-bold">Data</h2>
        </div>
        <div className="px-5 py-5 space-y-5">
          {/* Export */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[14px] font-semibold">Export credentials</div>
              <div className="text-[12px] text-muted-foreground mt-0.5">Download all your credentials as a JSON file.</div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-9 text-[13px] font-semibold shrink-0"
              onClick={() => { setExportScope("global"); setExportSpaceId(""); setExportVaultId(""); setExportOpen(true); }}
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export
            </Button>
          </div>

          <div className="border-t" />

          {/* Import */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[14px] font-semibold">Import credentials</div>
              <div className="text-[12px] text-muted-foreground mt-0.5">Restore credentials from a previously exported JSON file.</div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-9 text-[13px] font-semibold shrink-0"
              onClick={() => { setImportFile(null); setImportResult(null); setImportOpen(true); }}
            >
              <Upload className="w-3.5 h-3.5 mr-1.5" />
              Import
            </Button>
          </div>
        </div>
      </div>

      {/* Export dialog */}
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="p-0 gap-0 max-w-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b flex items-center gap-2">
            <Download className="w-3.5 h-3.5 text-muted-foreground" />
            <DialogTitle className="text-[13px] font-bold">Export Credentials</DialogTitle>
          </div>
          <div className="px-5 py-4 space-y-3.5">
            <div className="space-y-1.5">
              <Label className="text-[13px]">Scope</Label>
              <Combobox
                options={scopeOptions}
                value={exportScope}
                onValueChange={(v) => { setExportScope(v || "global"); setExportSpaceId(""); setExportVaultId(""); }}
                placeholder="Select scope"
                searchPlaceholder="Search scope..."
              />
            </div>
            {exportScope === "space" && (
              <div className="space-y-1.5">
                <Label className="text-[13px]">Space</Label>
                <Combobox
                  options={spaceOptions}
                  value={exportSpaceId}
                  onValueChange={(v) => setExportSpaceId(v)}
                  placeholder="Select a space"
                  searchPlaceholder="Search spaces..."
                  emptyText="No spaces found."
                />
              </div>
            )}
            {exportScope === "vault" && (
              <div className="space-y-1.5">
                <Label className="text-[13px]">Vault</Label>
                <Combobox
                  options={vaultOptions}
                  value={exportVaultId}
                  onValueChange={(v) => setExportVaultId(v)}
                  placeholder="Select a vault"
                  searchPlaceholder="Search vaults..."
                  emptyText="No vaults found."
                />
              </div>
            )}
          </div>
          <div className="px-5 py-3.5 border-t flex justify-end gap-2">
            <Button type="button" variant="outline" className="h-9 text-[13px]" onClick={() => setExportOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="h-9 text-[13px] font-semibold"
              disabled={exportDisabled}
              onClick={handleExport}
            >
              {isExporting ? (
                <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Exporting…</>
              ) : (
                <><Download className="w-3.5 h-3.5 mr-1.5" />Download</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import dialog */}
      <Dialog open={importOpen} onOpenChange={(v) => { setImportOpen(v); if (!v) { setImportFile(null); setImportResult(null); } }}>
        <DialogContent className="p-0 gap-0 max-w-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b flex items-center gap-2">
            <Upload className="w-3.5 h-3.5 text-muted-foreground" />
            <DialogTitle className="text-[13px] font-bold">Import Credentials</DialogTitle>
          </div>
          <div className="px-5 py-4 space-y-3.5">
            <button
              type="button"
              className={`w-full border-2 border-dashed rounded-xl px-4 py-7 text-center transition-colors cursor-pointer ${
                isDragging
                  ? "border-foreground/40 bg-accent/60"
                  : "border-border hover:border-foreground/25 hover:bg-accent/40"
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <FileJson className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
              {importFile ? (
                <>
                  <p className="text-[13px] font-semibold truncate max-w-[200px] mx-auto">{importFile.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Click to change file</p>
                </>
              ) : (
                <>
                  <p className="text-[13px] font-semibold">Drop a JSON file here</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">or click to browse</p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={handleFileChange}
              />
            </button>

            {importResult && (
              <div className="border rounded-xl bg-accent/40 px-4 py-3 space-y-1">
                <p className="text-[13px] font-semibold">
                  {importResult.imported} imported · {importResult.skipped} skipped
                </p>
                {importResult.errors.length > 0 && (
                  <ul className="space-y-0.5">
                    {importResult.errors.map((e, i) => (
                      <li key={i} className="text-[11px] text-muted-foreground">{e}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
          <div className="px-5 py-3.5 border-t flex justify-end gap-2">
            <Button type="button" variant="outline" className="h-9 text-[13px]" onClick={() => setImportOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="h-9 text-[13px] font-semibold"
              disabled={!importFile || isImporting}
              onClick={handleImport}
            >
              {isImporting ? (
                <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Importing…</>
              ) : (
                <><Upload className="w-3.5 h-3.5 mr-1.5" />Import</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
