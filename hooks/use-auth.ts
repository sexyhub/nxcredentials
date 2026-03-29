"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  useGetMe,
  useLogout,
  getGetMeQueryKey,
  type User,
} from "./use-api";

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: user,
    isLoading,
    error,
    isError,
  } = useGetMe({
    query: {
      retry: false,
    },
  });

  const logoutMutation = useLogout({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        queryClient.clear();
        router.push("/login");
      },
    },
  });

  return {
    user: user as User | undefined,
    isLoading,
    isAuthenticated: !!user,
    isError,
    error,
    logout: () => logoutMutation.mutate({}),
    isLoggingOut: logoutMutation.isPending,
  };
}
