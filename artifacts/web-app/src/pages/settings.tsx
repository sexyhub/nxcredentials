import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import {
  useGetSettings,
  useUpdateSettings,
  getGetSettingsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function Settings() {
  const { user } = useAuth();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useGetSettings({
    query: { enabled: user?.isAdmin },
  });

  const [formData, setFormData] = useState({
    siteTitle: "",
    siteLogo: "",
    siteFavicon: "",
    registrationEnabled: false,
  });

  useEffect(() => {
    if (!user?.isAdmin && user) setLocation("/");
  }, [user, setLocation]);

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

  if (!user?.isAdmin) return null;

  return (
    <Layout>
      <div className="max-w-6xl space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Settings</h1>
          <p className="text-muted-foreground text-[15px] mt-1">Vault configuration and access control.</p>
        </div>

        {isLoading ? (
          <div className="text-[13px] text-muted-foreground py-14 text-center">Loading...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="border rounded-xl bg-card p-5 space-y-4">
              <h2 className="text-[15px] font-bold">General</h2>
              <div>
                <Label htmlFor="siteTitle" className="text-[13px] font-medium mb-1.5 block">Site title</Label>
                <Input
                  id="siteTitle"
                  required
                  value={formData.siteTitle}
                  onChange={(e) => setFormData({ ...formData, siteTitle: e.target.value })}
                  className="h-10"
                />
                <p className="text-[12px] text-muted-foreground mt-1.5">Displayed in the header and browser tab.</p>
              </div>
            </div>

            <div className="border rounded-xl bg-card divide-y overflow-hidden">
              <div className="p-5">
                <h2 className="text-[15px] font-bold mb-4">Access control</h2>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[14px] font-semibold">Public registration</div>
                    <div className="text-[12px] text-muted-foreground mt-0.5">
                      {formData.registrationEnabled ? "Anyone can create an account" : "New signups disabled"}
                    </div>
                  </div>
                  <Switch
                    checked={formData.registrationEnabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, registrationEnabled: checked })}
                  />
                </div>
              </div>
              <div className="p-5 flex items-center justify-between">
                <div>
                  <div className="text-[14px] font-semibold">Your role</div>
                  <div className="text-[12px] text-muted-foreground mt-0.5">
                    Signed in as <span className="font-semibold text-foreground">{user?.username}</span>
                  </div>
                </div>
                <span className="text-[11px] font-bold bg-foreground text-background px-2.5 py-1 rounded-lg uppercase tracking-wider">Admin</span>
              </div>
            </div>

            <div className="border rounded-xl bg-card p-5 space-y-4">
              <h2 className="text-[15px] font-bold">Branding</h2>
              <div>
                <Label htmlFor="logoUrl" className="text-[13px] font-medium mb-1.5 block">Logo URL</Label>
                <Input
                  id="logoUrl"
                  value={formData.siteLogo}
                  onChange={(e) => setFormData({ ...formData, siteLogo: e.target.value })}
                  placeholder="https://example.com/logo.png"
                  className="h-10"
                />
                {formData.siteLogo && (
                  <div className="flex items-center gap-3 p-3 border rounded-lg mt-2">
                    <img
                      src={formData.siteLogo}
                      alt="Preview"
                      className="w-8 h-8 object-contain rounded"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                    <span className="text-[12px] text-muted-foreground">Preview</span>
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="faviconUrl" className="text-[13px] font-medium mb-1.5 block">Favicon URL</Label>
                <Input
                  id="faviconUrl"
                  value={formData.siteFavicon}
                  onChange={(e) => setFormData({ ...formData, siteFavicon: e.target.value })}
                  placeholder="https://example.com/favicon.ico"
                  className="h-10"
                />
              </div>
            </div>

            <Button type="submit" disabled={updateMutation.isPending} className="h-10 text-[13px] font-semibold px-6">
              <Save className="w-4 h-4 mr-1.5" />
              {updateMutation.isPending ? "Saving..." : "Save changes"}
            </Button>
          </form>
        )}
      </div>
    </Layout>
  );
}
