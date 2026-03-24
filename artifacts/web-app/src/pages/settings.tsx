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
      <div className="max-w-xl space-y-8">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight">Settings</h1>
          <p className="text-[14px] text-muted-foreground mt-0.5">Vault configuration and access.</p>
        </div>

        {isLoading ? (
          <div className="text-[13px] text-muted-foreground py-14 text-center">Loading...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="space-y-4">
              <h2 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">General</h2>
              <div className="border rounded-lg bg-card p-5 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="siteTitle" className="text-[13px]">Site title</Label>
                  <Input
                    id="siteTitle"
                    required
                    value={formData.siteTitle}
                    onChange={(e) => setFormData({ ...formData, siteTitle: e.target.value })}
                    className="h-10 bg-transparent"
                  />
                  <p className="text-[12px] text-muted-foreground">Shown in sidebar and browser tab.</p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">Access</h2>
              <div className="border rounded-lg bg-card divide-y">
                <div className="flex items-center justify-between p-5">
                  <div>
                    <div className="text-[13px] font-medium">Public registration</div>
                    <div className="text-[12px] text-muted-foreground mt-0.5">
                      {formData.registrationEnabled ? "Anyone can sign up" : "Closed to new users"}
                    </div>
                  </div>
                  <Switch
                    checked={formData.registrationEnabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, registrationEnabled: checked })}
                  />
                </div>
                <div className="flex items-center justify-between p-5">
                  <div>
                    <div className="text-[13px] font-medium">Current role</div>
                    <div className="text-[12px] text-muted-foreground mt-0.5">
                      Signed in as <span className="font-medium text-foreground">{user?.username}</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-medium bg-foreground text-background px-2 py-0.5 rounded-md">Admin</span>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">Branding</h2>
              <div className="border rounded-lg bg-card p-5 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="logoUrl" className="text-[13px]">Logo URL</Label>
                  <Input
                    id="logoUrl"
                    value={formData.siteLogo}
                    onChange={(e) => setFormData({ ...formData, siteLogo: e.target.value })}
                    placeholder="https://"
                    className="h-10 bg-transparent"
                  />
                  {formData.siteLogo && (
                    <div className="flex items-center gap-3 p-3 border rounded-lg mt-2">
                      <img
                        src={formData.siteLogo}
                        alt="Preview"
                        className="w-7 h-7 object-contain"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                      <span className="text-[12px] text-muted-foreground">Logo preview</span>
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="faviconUrl" className="text-[13px]">Favicon URL</Label>
                  <Input
                    id="faviconUrl"
                    value={formData.siteFavicon}
                    onChange={(e) => setFormData({ ...formData, siteFavicon: e.target.value })}
                    placeholder="https://"
                    className="h-10 bg-transparent"
                  />
                </div>
              </div>
            </section>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={updateMutation.isPending} className="h-9 text-[13px]">
                <Save className="w-3.5 h-3.5 mr-1.5" />
                {updateMutation.isPending ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Layout>
  );
}
