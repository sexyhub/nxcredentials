import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import {
  useGetSettings,
  useUpdateSettings,
  getGetSettingsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Save, User, Globe, ShieldCheck, Palette, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isAdmin = user?.isAdmin ?? false;

  const { data: settings, isLoading } = useGetSettings({
    query: { enabled: isAdmin },
  });

  const [formData, setFormData] = useState({
    siteTitle: "",
    siteLogo: "",
    siteFavicon: "",
    registrationEnabled: false,
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        siteTitle: settings.siteTitle,
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
            <div className="border rounded-xl bg-card overflow-hidden">
              <div className="px-5 py-3.5 border-b flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                <div>
                  <h2 className="text-[13px] font-bold">General</h2>
                </div>
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
                    <p className="text-[11px] text-muted-foreground">Shown in the header and browser tab.</p>
                  </div>
                </div>
              </div>
            </div>

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
                    <p className="text-[11px] text-muted-foreground">Custom logo shown in the sidebar header.</p>
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
    </Layout>
  );
}
