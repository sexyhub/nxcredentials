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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
        toast({ title: "Settings saved successfully" });
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
      <div className="max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
            <Shield className="w-4 h-4 text-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Admin Settings</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage your vault configuration and access controls</p>
          </div>
        </div>

        {isLoading ? (
          <div className="text-sm text-muted-foreground py-8 text-center">Loading settings...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <CardTitle className="text-sm">General</CardTitle>
                </div>
                <CardDescription>Configure your vault identity and display name</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="siteTitle">Site Title</Label>
                  <Input
                    id="siteTitle"
                    required
                    value={formData.siteTitle}
                    onChange={(e) => setFormData({ ...formData, siteTitle: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">Displayed in the sidebar and browser tab</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <CardTitle className="text-sm">Access Control</CardTitle>
                </div>
                <CardDescription>Manage who can access your vault</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-1">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium">Open Registration</Label>
                      <Badge variant={formData.registrationEnabled ? "default" : "secondary"} className="text-[10px] h-5">
                        {formData.registrationEnabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formData.registrationEnabled
                        ? "Anyone with the link can create a new account"
                        : "No new accounts can be created"}
                    </p>
                  </div>
                  <Switch
                    checked={formData.registrationEnabled}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, registrationEnabled: checked })
                    }
                  />
                </div>

                <Separator />

                <div className="py-1">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Your Role</Label>
                      <p className="text-xs text-muted-foreground">
                        You are signed in as <span className="font-medium text-foreground">{user?.username}</span>
                      </p>
                    </div>
                    <Badge variant="default" className="text-[10px] h-5">
                      Administrator
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-muted-foreground" />
                  <CardTitle className="text-sm">Branding</CardTitle>
                </div>
                <CardDescription>Customize the look of your vault</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="logoUrl" className="flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-muted-foreground" />
                    Logo URL
                  </Label>
                  <Input
                    id="logoUrl"
                    value={formData.siteLogo}
                    onChange={(e) => setFormData({ ...formData, siteLogo: e.target.value })}
                    placeholder="https://example.com/logo.png"
                    className="font-mono text-xs"
                  />
                  {formData.siteLogo && (
                    <div className="flex items-center gap-2 mt-2 p-2 rounded-lg bg-accent/50">
                      <img src={formData.siteLogo} alt="Logo preview" className="w-8 h-8 object-contain rounded" onError={(e) => (e.currentTarget.style.display = 'none')} />
                      <span className="text-xs text-muted-foreground">Logo preview</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="faviconUrl" className="flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5 text-muted-foreground" />
                    Favicon URL
                  </Label>
                  <Input
                    id="faviconUrl"
                    value={formData.siteFavicon}
                    onChange={(e) => setFormData({ ...formData, siteFavicon: e.target.value })}
                    placeholder="https://example.com/favicon.ico"
                    className="font-mono text-xs"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end pt-1">
              <Button
                type="submit"
                disabled={updateMutation.isPending}
              >
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
