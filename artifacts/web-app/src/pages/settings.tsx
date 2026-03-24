import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import {
  useGetSettings,
  useUpdateSettings,
  getGetSettingsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Save, Image as ImageIcon, Link as LinkIcon, Shield, Users, Globe } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

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
    if (!user?.isAdmin && user) {
      setLocation("/");
    }
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
        toast({
          title: "Failed to save",
          description: err?.data?.error || "An error occurred.",
          variant: "destructive",
        });
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
      <div className="max-w-2xl space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Vault configuration and access controls</p>
        </div>

        {isLoading ? (
          <div className="text-sm text-muted-foreground py-12 text-center">Loading...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="border bg-card">
              <div className="px-5 py-4 border-b flex items-center gap-2.5">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <div>
                  <div className="text-[13px] font-semibold">General</div>
                  <div className="text-[11px] text-muted-foreground">Site identity and display</div>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="siteTitle" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Site Title</Label>
                  <Input
                    id="siteTitle"
                    required
                    value={formData.siteTitle}
                    onChange={(e) => setFormData({ ...formData, siteTitle: e.target.value })}
                    className="h-10"
                  />
                  <p className="text-[11px] text-muted-foreground">Shown in sidebar and browser tab</p>
                </div>
              </div>
            </div>

            <div className="border bg-card">
              <div className="px-5 py-4 border-b flex items-center gap-2.5">
                <Users className="w-4 h-4 text-muted-foreground" />
                <div>
                  <div className="text-[13px] font-semibold">Access Control</div>
                  <div className="text-[11px] text-muted-foreground">Registration and user management</div>
                </div>
              </div>
              <div className="p-5 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-[13px] font-medium">Open Registration</div>
                    <div className="text-[11px] text-muted-foreground">
                      {formData.registrationEnabled
                        ? "Anyone can create a new account"
                        : "New account creation is disabled"}
                    </div>
                  </div>
                  <Switch
                    checked={formData.registrationEnabled}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, registrationEnabled: checked })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-[13px] font-medium">Your Role</div>
                    <div className="text-[11px] text-muted-foreground">
                      Signed in as <span className="font-mono font-medium text-foreground">{user?.username}</span>
                    </div>
                  </div>
                  <div className="bg-foreground text-background px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider">
                    Admin
                  </div>
                </div>
              </div>
            </div>

            <div className="border bg-card">
              <div className="px-5 py-4 border-b flex items-center gap-2.5">
                <ImageIcon className="w-4 h-4 text-muted-foreground" />
                <div>
                  <div className="text-[13px] font-semibold">Branding</div>
                  <div className="text-[11px] text-muted-foreground">Customize appearance</div>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="logoUrl" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Logo URL</Label>
                  <Input
                    id="logoUrl"
                    value={formData.siteLogo}
                    onChange={(e) => setFormData({ ...formData, siteLogo: e.target.value })}
                    placeholder="https://..."
                    className="h-10 font-mono text-xs"
                  />
                  {formData.siteLogo && (
                    <div className="flex items-center gap-3 mt-2 p-3 border bg-muted/30">
                      <img
                        src={formData.siteLogo}
                        alt="Preview"
                        className="w-8 h-8 object-contain"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                      <span className="text-[11px] text-muted-foreground font-mono">Preview</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="faviconUrl" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Favicon URL</Label>
                  <Input
                    id="faviconUrl"
                    value={formData.siteFavicon}
                    onChange={(e) => setFormData({ ...formData, siteFavicon: e.target.value })}
                    placeholder="https://..."
                    className="h-10 font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={updateMutation.isPending}>
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
