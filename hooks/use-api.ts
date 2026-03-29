"use client";

import { useQuery, useMutation, type UseQueryOptions, type UseMutationOptions } from "@tanstack/react-query";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

async function apiFetch(url: string, options?: RequestInit) {
  const res = await fetch(`${BASE_PATH}${url}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
    credentials: "include",
  });
  if (res.status === 204) return undefined;
  const data = await res.json();
  if (!res.ok) throw { status: res.status, data };
  return data;
}

export type Credential = {
  id: number;
  title: string;
  email: string;
  password: string;
  tagId: number | null;
  tagName: string | null;
  tagColor: string | null;
  vaultId: number | null;
  spaceId: number | null;
  spaceName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Tag = {
  id: number;
  name: string;
  color: string;
  credentialCount: number;
};

export type Space = {
  id: number;
  name: string;
  defaultType: string | null;
  color: string;
  icon: string;
  credentialCount: number;
};

export type Vault = {
  id: number;
  name: string;
  color: string;
  icon: string;
  credentialCount: number;
  isUnlocked: boolean;
  createdAt: string;
};

export type User = {
  id: number;
  username: string;
  isAdmin: boolean;
};

export type Stats = {
  totalCredentials: number;
  totalTags: number;
  totalSpaces: number;
  totalVaults: number;
  recentlyAdded: number;
  vaultCredentials: number;
  spaceCredentials: number;
  taggedCredentials: number;
  uniqueTypes: number;
  oldestCredentialDays: number | null;
  averageAgeDays: number;
  tagBreakdown: { name: string; color: string; count: number }[];
  typeBreakdown: { type: string; count: number }[];
  spaceBreakdown: { name: string; color: string; icon: string; count: number }[];
};

export type Settings = {
  registrationEnabled: boolean;
  siteTitle: string;
  siteDescription: string;
  siteLogo: string;
  siteFavicon: string;
};

export type Branding = {
  siteTitle: string;
  siteDescription: string;
  siteLogo: string;
  siteFavicon: string;
};

export type ServiceType = {
  id: number;
  key: string;
  label: string;
  icon: string;
  color: string;
};

type MutOpts<TData = any, TVariables = any> = {
  mutation?: Omit<UseMutationOptions<TData, any, TVariables>, "mutationFn">;
};

type QueryOpts<T = any> = {
  query?: Omit<UseQueryOptions<T>, "queryKey" | "queryFn">;
};

export const getGetMeQueryKey = () => ["auth", "me"];
export const getListCredentialsQueryKey = (params?: Record<string, any>) => ["credentials", params ?? {}];
export const getListTagsQueryKey = () => ["tags"];
export const getListSpacesQueryKey = () => ["spaces"];
export const getListVaultsQueryKey = () => ["vaults"];
export const getGetStatsQueryKey = () => ["stats"];
export const getGetSettingsQueryKey = () => ["settings"];
export const getGetBrandingQueryKey = () => ["settings", "branding"];
export const getRegistrationStatusQueryKey = () => ["settings", "registration-status"];
export const getListServiceTypesQueryKey = () => ["service-types"];

export function useGetMe(opts?: QueryOpts<User>) {
  return useQuery<User>({
    queryKey: getGetMeQueryKey(),
    queryFn: () => apiFetch("/api/auth/me"),
    ...opts?.query,
  });
}

export function useLogin(opts?: MutOpts<{ user: User }, { data: { username: string; password: string; rememberMe?: boolean } }>) {
  return useMutation({
    mutationFn: ({ data }: { data: { username: string; password: string; rememberMe?: boolean } }) =>
      apiFetch("/api/auth/login", { method: "POST", body: JSON.stringify(data) }),
    ...opts?.mutation,
  });
}

export function useRegister(opts?: MutOpts<{ user: User }, { data: { username: string; password: string } }>) {
  return useMutation({
    mutationFn: ({ data }: { data: { username: string; password: string } }) =>
      apiFetch("/api/auth/register", { method: "POST", body: JSON.stringify(data) }),
    ...opts?.mutation,
  });
}

export function useLogout(opts?: MutOpts) {
  return useMutation({
    mutationFn: () => apiFetch("/api/auth/logout", { method: "POST" }),
    ...opts?.mutation,
  });
}

export function useListCredentials(params?: Record<string, any>, opts?: QueryOpts<Credential[]>) {
  const qs = params ? "?" + new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null).map(([k, v]) => [k, String(v)])
  ).toString() : "";
  return useQuery<Credential[]>({
    queryKey: getListCredentialsQueryKey(params),
    queryFn: () => apiFetch(`/api/credentials${qs}`),
    ...opts?.query,
  });
}

export function useCreateCredential(opts?: MutOpts<Credential, { data: any }>) {
  return useMutation({
    mutationFn: ({ data }: { data: any }) =>
      apiFetch("/api/credentials", { method: "POST", body: JSON.stringify(data) }),
    ...opts?.mutation,
  });
}

export function useUpdateCredential(opts?: MutOpts<Credential, { id: number; data: any }>) {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiFetch(`/api/credentials/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    ...opts?.mutation,
  });
}

export function useDeleteCredential(opts?: MutOpts<void, { id: number }>) {
  return useMutation({
    mutationFn: ({ id }: { id: number }) =>
      apiFetch(`/api/credentials/${id}`, { method: "DELETE" }),
    ...opts?.mutation,
  });
}

export function useListTags(opts?: QueryOpts<Tag[]>) {
  return useQuery<Tag[]>({
    queryKey: getListTagsQueryKey(),
    queryFn: () => apiFetch("/api/tags"),
    ...opts?.query,
  });
}

export function useCreateTag(opts?: MutOpts<Tag, { data: any }>) {
  return useMutation({
    mutationFn: ({ data }: { data: any }) =>
      apiFetch("/api/tags", { method: "POST", body: JSON.stringify(data) }),
    ...opts?.mutation,
  });
}

export function useUpdateTag(opts?: MutOpts<Tag, { id: number; data: any }>) {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiFetch(`/api/tags/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    ...opts?.mutation,
  });
}

export function useDeleteTag(opts?: MutOpts<void, { id: number }>) {
  return useMutation({
    mutationFn: ({ id }: { id: number }) =>
      apiFetch(`/api/tags/${id}`, { method: "DELETE" }),
    ...opts?.mutation,
  });
}

export function useListSpaces(opts?: QueryOpts<Space[]>) {
  return useQuery<Space[]>({
    queryKey: getListSpacesQueryKey(),
    queryFn: () => apiFetch("/api/spaces"),
    ...opts?.query,
  });
}

export function useCreateSpace(opts?: MutOpts<Space, { data: any }>) {
  return useMutation({
    mutationFn: ({ data }: { data: any }) =>
      apiFetch("/api/spaces", { method: "POST", body: JSON.stringify(data) }),
    ...opts?.mutation,
  });
}

export function useUpdateSpace(opts?: MutOpts<Space, { id: number; data: any }>) {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiFetch(`/api/spaces/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    ...opts?.mutation,
  });
}

export function useDeleteSpace(opts?: MutOpts<void, { id: number }>) {
  return useMutation({
    mutationFn: ({ id }: { id: number }) =>
      apiFetch(`/api/spaces/${id}`, { method: "DELETE" }),
    ...opts?.mutation,
  });
}

export function useListVaults(opts?: QueryOpts<Vault[]>) {
  return useQuery<Vault[]>({
    queryKey: getListVaultsQueryKey(),
    queryFn: () => apiFetch("/api/vaults"),
    ...opts?.query,
  });
}

export function useCreateVault(opts?: MutOpts<Vault, { data: any }>) {
  return useMutation({
    mutationFn: ({ data }: { data: any }) =>
      apiFetch("/api/vaults", { method: "POST", body: JSON.stringify(data) }),
    ...opts?.mutation,
  });
}

export function useUpdateVault(opts?: MutOpts<Vault, { id: number; data: any }>) {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiFetch(`/api/vaults/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    ...opts?.mutation,
  });
}

export function useDeleteVault(opts?: MutOpts<void, { id: number }>) {
  return useMutation({
    mutationFn: ({ id }: { id: number }) =>
      apiFetch(`/api/vaults/${id}`, { method: "DELETE" }),
    ...opts?.mutation,
  });
}

export function useVerifyVault(opts?: MutOpts<any, { id: number; data: any }>) {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiFetch(`/api/vaults/${id}/verify`, { method: "POST", body: JSON.stringify(data) }),
    ...opts?.mutation,
  });
}

export function useLockVault(opts?: MutOpts<any, { id: number }>) {
  return useMutation({
    mutationFn: ({ id }: { id: number }) =>
      apiFetch(`/api/vaults/${id}/lock`, { method: "POST", body: JSON.stringify({}) }),
    ...opts?.mutation,
  });
}

export function useChangeVaultPassword(opts?: MutOpts<any, { id: number; data: any }>) {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiFetch(`/api/vaults/${id}/change-password`, { method: "POST", body: JSON.stringify(data) }),
    ...opts?.mutation,
  });
}

export function useChangeVaultPin(opts?: MutOpts<any, { id: number; data: any }>) {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiFetch(`/api/vaults/${id}/change-pin`, { method: "POST", body: JSON.stringify(data) }),
    ...opts?.mutation,
  });
}

export function useGetStats(opts?: QueryOpts<Stats>) {
  return useQuery<Stats>({
    queryKey: getGetStatsQueryKey(),
    queryFn: () => apiFetch("/api/stats"),
    ...opts?.query,
  });
}

export function useGetSettings(opts?: QueryOpts<Settings>) {
  return useQuery<Settings>({
    queryKey: getGetSettingsQueryKey(),
    queryFn: () => apiFetch("/api/settings"),
    ...opts?.query,
  });
}

export function useUpdateSettings(opts?: MutOpts<Settings, { data: any }>) {
  return useMutation({
    mutationFn: ({ data }: { data: any }) =>
      apiFetch("/api/settings", { method: "PATCH", body: JSON.stringify(data) }),
    ...opts?.mutation,
  });
}

export function useGetBranding(opts?: QueryOpts<Branding>) {
  return useQuery<Branding>({
    queryKey: getGetBrandingQueryKey(),
    queryFn: () => apiFetch("/api/settings/branding"),
    ...opts?.query,
  });
}

export function useGetRegistrationStatus(opts?: QueryOpts<{ enabled: boolean }>) {
  return useQuery<{ enabled: boolean }>({
    queryKey: getRegistrationStatusQueryKey(),
    queryFn: () => apiFetch("/api/settings/registration-status"),
    ...opts?.query,
  });
}

export function useListServiceTypes(opts?: QueryOpts<ServiceType[]>) {
  return useQuery<ServiceType[]>({
    queryKey: getListServiceTypesQueryKey(),
    queryFn: () => apiFetch("/api/service-types"),
    ...opts?.query,
  });
}

export function useCreateServiceType(opts?: MutOpts<ServiceType, { data: any }>) {
  return useMutation({
    mutationFn: ({ data }: { data: any }) =>
      apiFetch("/api/service-types", { method: "POST", body: JSON.stringify(data) }),
    ...opts?.mutation,
  });
}

export function useUpdateServiceType(opts?: MutOpts<ServiceType, { id: number; data: any }>) {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiFetch(`/api/service-types/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    ...opts?.mutation,
  });
}

export function useDeleteServiceType(opts?: MutOpts<void, { id: number }>) {
  return useMutation({
    mutationFn: ({ id }: { id: number }) =>
      apiFetch(`/api/service-types/${id}`, { method: "DELETE" }),
    ...opts?.mutation,
  });
}
