import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import {
  useGetSettings,
  useUpdateSettings,
  getGetSettingsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Save, Globe, Users, Paintbrush } from "lucide-react";
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
        toast({ title: "Failed to save", description: err?.data?.error || "An error occurred.", variant: "destructive" });
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
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Settings</h1>
          <p className="text-[14px] text-muted-foreground mt-0.5">Manage your vault configuration</p>
        </div>

        {isLoading ? (
          <div className="text-[13px] text-muted-foreground py-12 text-center">Loading...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="bg-card border rounded-lg overflow-hidden">
              <div className="px-5 py-4 border-b bg-muted/30 flex items-center gap-2.5">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <span className="text-[13px] font-semibold">General</span>
              </div>
              <div className="p-5">
                <div className="space-y-2">
                  <Label htmlFor="siteTitle" className="text-[13px] font-medium">Site Title</Label>
                  <Input
                    id="siteTitle"
                    required
                    value={formData.siteTitle}
                    onChange={(e) => setFormData({ ...formData, siteTitle: e.target.value })}
                    className="h-10"
                  />
                  <p className="text-[12px] text-muted-foreground">Displayed in the sidebar and browser tab</p>
                </div>
              </div>
            </div>

            <div className="bg-card border rounded-lg overflow-hidden">
              <div className="px-5 py-4 border-b bg-muted/30 flex items-center gap-2.5">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-[13px] font-semibold">Access Control</span>
              </div>
              <div className="p-5 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[13px] font-medium">Public Registration</div>
                    <div className="text-[12px] text-muted-foreground mt-0.5">
                      {formData.registrationEnabled ? "Anyone can create an account" : "Registration is disabled"}
                    </div>
                  </div>
                  <Switch
                    checked={formData.registrationEnabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, registrationEnabled: checked })}
                  />
                </div>

                <div className="border-t pt-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[13px] font-medium">Your Role</div>
                      <div className="text-[12px] text-muted-foreground mt-0.5">
                        Signed in as <span className="font-medium text-foreground">{user?.username}</span>
                      </div>
                    </div>
                    <span className="text-[11px] font-medium bg-foreground text-background px-2.5 py-1 rounded-md">Admin</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card border rounded-lg overflow-hidden">
              <div className="px-5 py-4 border-b bg-muted/30 flex items-center gap-2.5">
                <Paintbrush className="w-4 h-4 text-muted-foreground" />
                <span className="text-[13px] font-semibold">Branding</span>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="logoUrl" className="text-[13px] font-medium">Logo URL</Label>
                  <Input
                    id="logoUrl"
                    value={formData.siteLogo}
                    onChange={(e) => setFormData({ ...formData, siteLogo: e.target.value })}
                    placeholder="https://example.com/logo.png"
                    className="h-10"
                  />
                  {formData.siteLogo && (
                    <div className="flex items-center gap-3 mt-2 p-3 border rounded-lg bg-muted/30">
                      <img
                        src={formData.siteLogo}
                        alt="Logo preview"
                        className="w-8 h-8 object-contain rounded"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                      <span className="text-[12px] text-muted-foreground">Preview</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="faviconUrl" className="text-[13px] font-medium">Favicon URL</Label>
                  <Input
                    id="faviconUrl"
                    value={formData.siteFavicon}
                    onChange={(e) => setFormData({ ...formData, siteFavicon: e.target.value })}
                    placeholder="https://example.com/favicon.ico"
                    className="h-10"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Button type="submit" disabled={updateMutation.isPending} className="h-9">
                <Save className="w-4 h-4 mr-1.5" />
                {updateMutation.isPending ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Layout>
  );
}
