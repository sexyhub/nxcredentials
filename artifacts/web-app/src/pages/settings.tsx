import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import {
  useGetSettings,
  useUpdateSettings,
  useGetVaultStatus,
  useSetupVault,
  useChangeVaultPassword,
  useChangeVaultPin,
  getGetSettingsQueryKey,
  getGetVaultStatusQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Save, Shield, KeyRound, Hash, Check } from "lucide-react";
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

  const { data: vaultStatus } = useGetVaultStatus();

  const [formData, setFormData] = useState({
    siteTitle: "",
    siteLogo: "",
    siteFavicon: "",
    registrationEnabled: false,
  });

  const [vaultSetup, setVaultSetup] = useState({ password: "", pin: "" });
  const [changePassword, setChangePassword] = useState({ oldPassword: "", newPassword: "" });
  const [changePin, setChangePin] = useState({ oldPin: "", newPin: "" });

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

  const setupVaultMutation = useSetupVault({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetVaultStatusQueryKey() });
        toast({ title: "Vault set up successfully" });
        setVaultSetup({ password: "", pin: "" });
      },
      onError: (err: any) => {
        toast({ title: "Setup failed", description: err?.data?.error || "Something went wrong.", variant: "destructive" });
      },
    },
  });

  const changePasswordMutation = useChangeVaultPassword({
    mutation: {
      onSuccess: () => {
        toast({ title: "Vault password changed" });
        setChangePassword({ oldPassword: "", newPassword: "" });
      },
      onError: (err: any) => {
        toast({ title: "Change failed", description: err?.data?.error || "Something went wrong.", variant: "destructive" });
      },
    },
  });

  const changePinMutation = useChangeVaultPin({
    mutation: {
      onSuccess: () => {
        toast({ title: "Vault PIN changed" });
        setChangePin({ oldPin: "", newPin: "" });
      },
      onError: (err: any) => {
        toast({ title: "Change failed", description: err?.data?.error || "Something went wrong.", variant: "destructive" });
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({ data: formData });
  };

  const handleVaultSetup = (e: React.FormEvent) => {
    e.preventDefault();
    setupVaultMutation.mutate({ data: vaultSetup });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    changePasswordMutation.mutate({ data: changePassword });
  };

  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    changePinMutation.mutate({ data: changePin });
  };

  const hasVault = vaultStatus?.hasPassword && vaultStatus?.hasPin;

  return (
    <Layout>
      <div className="w-full max-w-xl space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Settings</h1>
          <p className="text-muted-foreground text-[15px] mt-1">
            {isAdmin ? "Vault configuration and access control." : "Your vault settings."}
          </p>
        </div>

        {isAdmin && isLoading ? (
          <div className="text-[13px] text-muted-foreground py-14 text-center">Loading...</div>
        ) : (
          <>
            {isAdmin && (
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

            <div className="border rounded-xl bg-card p-5 space-y-5">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-500" />
                <h2 className="text-[15px] font-bold">Secure vault</h2>
                {hasVault && (
                  <span className="text-[11px] bg-green-500/10 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded-md font-semibold flex items-center gap-0.5">
                    <Check className="w-3 h-3" />
                    Active
                  </span>
                )}
              </div>
              <p className="text-[13px] text-muted-foreground">
                Protect high-value credentials with an additional password and PIN.
              </p>

              {!hasVault ? (
                <form onSubmit={handleVaultSetup} className="space-y-4 border-t pt-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="vault-pw" className="text-[13px] font-medium flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5" />
                      Vault password
                    </Label>
                    <Input
                      id="vault-pw"
                      type="password"
                      required
                      minLength={6}
                      value={vaultSetup.password}
                      onChange={(e) => setVaultSetup({ ...vaultSetup, password: e.target.value })}
                      placeholder="At least 6 characters"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="vault-pin" className="text-[13px] font-medium flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5" />
                      Vault PIN
                    </Label>
                    <Input
                      id="vault-pin"
                      type="password"
                      inputMode="numeric"
                      required
                      pattern="\d{4,8}"
                      value={vaultSetup.pin}
                      onChange={(e) => setVaultSetup({ ...vaultSetup, pin: e.target.value.replace(/\D/g, "").slice(0, 8) })}
                      placeholder="4-8 digit PIN"
                      className="h-10"
                    />
                  </div>
                  <Button type="submit" disabled={setupVaultMutation.isPending} className="h-9 text-[13px] font-semibold">
                    {setupVaultMutation.isPending ? "Setting up..." : "Set up vault"}
                  </Button>
                </form>
              ) : (
                <div className="space-y-5 border-t pt-5">
                  <form onSubmit={handleChangePassword} className="space-y-3">
                    <h3 className="text-[13px] font-bold flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5" />
                      Change vault password
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="old-pw" className="text-[12px] text-muted-foreground mb-1 block">Current password</Label>
                        <Input
                          id="old-pw"
                          type="password"
                          required
                          value={changePassword.oldPassword}
                          onChange={(e) => setChangePassword({ ...changePassword, oldPassword: e.target.value })}
                          className="h-9"
                        />
                      </div>
                      <div>
                        <Label htmlFor="new-pw" className="text-[12px] text-muted-foreground mb-1 block">New password</Label>
                        <Input
                          id="new-pw"
                          type="password"
                          required
                          minLength={6}
                          value={changePassword.newPassword}
                          onChange={(e) => setChangePassword({ ...changePassword, newPassword: e.target.value })}
                          className="h-9"
                        />
                      </div>
                    </div>
                    <Button type="submit" variant="outline" size="sm" disabled={changePasswordMutation.isPending} className="h-8 text-[12px]">
                      {changePasswordMutation.isPending ? "Changing..." : "Update password"}
                    </Button>
                  </form>

                  <form onSubmit={handleChangePin} className="space-y-3 border-t pt-5">
                    <h3 className="text-[13px] font-bold flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5" />
                      Change vault PIN
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="old-pin" className="text-[12px] text-muted-foreground mb-1 block">Current PIN</Label>
                        <Input
                          id="old-pin"
                          type="password"
                          inputMode="numeric"
                          required
                          value={changePin.oldPin}
                          onChange={(e) => setChangePin({ ...changePin, oldPin: e.target.value.replace(/\D/g, "").slice(0, 8) })}
                          className="h-9"
                        />
                      </div>
                      <div>
                        <Label htmlFor="new-pin" className="text-[12px] text-muted-foreground mb-1 block">New PIN</Label>
                        <Input
                          id="new-pin"
                          type="password"
                          inputMode="numeric"
                          required
                          pattern="\d{4,8}"
                          value={changePin.newPin}
                          onChange={(e) => setChangePin({ ...changePin, newPin: e.target.value.replace(/\D/g, "").slice(0, 8) })}
                          className="h-9"
                        />
                      </div>
                    </div>
                    <Button type="submit" variant="outline" size="sm" disabled={changePinMutation.isPending} className="h-8 text-[12px]">
                      {changePinMutation.isPending ? "Changing..." : "Update PIN"}
                    </Button>
                  </form>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
