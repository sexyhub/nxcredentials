import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import {
  useGetSettings,
  useUpdateSettings,
  getGetSettingsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Save, Image as ImageIcon, Link as LinkIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

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
      toast({
        title: "Access denied",
        description: "Administrator privileges required.",
        variant: "destructive",
      });
    }
  }, [user, setLocation, toast]);

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
          title: "Update failed",
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

  const inputClass =
    "w-full h-10 px-3 rounded-md bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-colors";

  return (
    <Layout>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your vault configuration</p>
        </div>

        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading settings...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-lg border border-border bg-card p-5 space-y-5">
              <h2 className="text-sm font-semibold text-muted-foreground">General</h2>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Site Title</label>
                <input
                  required
                  value={formData.siteTitle}
                  onChange={(e) => setFormData({ ...formData, siteTitle: e.target.value })}
                  className={inputClass}
                />
                <p className="text-xs text-muted-foreground">Displayed in the sidebar and browser tab.</p>
              </div>

              <div className="flex items-center justify-between p-3 rounded-md bg-accent/50 border border-border">
                <div>
                  <div className="text-sm font-medium">Open Registration</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {formData.registrationEnabled
                      ? "Anyone can create a new account."
                      : "Only existing users can access the vault."}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, registrationEnabled: !formData.registrationEnabled })}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    formData.registrationEnabled ? "bg-primary" : "bg-muted-foreground/30"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                      formData.registrationEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-5 space-y-5">
              <h2 className="text-sm font-semibold text-muted-foreground">Branding</h2>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-sm font-medium">
                  <ImageIcon className="w-3.5 h-3.5 text-muted-foreground" />
                  Logo URL
                </label>
                <input
                  value={formData.siteLogo}
                  onChange={(e) => setFormData({ ...formData, siteLogo: e.target.value })}
                  className={inputClass}
                  placeholder="https://example.com/logo.png"
                />
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-sm font-medium">
                  <LinkIcon className="w-3.5 h-3.5 text-muted-foreground" />
                  Favicon URL
                </label>
                <input
                  value={formData.siteFavicon}
                  onChange={(e) => setFormData({ ...formData, siteFavicon: e.target.value })}
                  className={inputClass}
                  placeholder="https://example.com/favicon.ico"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="flex items-center gap-2 h-9 px-5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {updateMutation.isPending ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        )}
      </div>
    </Layout>
  );
}
