import { useQueryClient } from "@tanstack/react-query";
import { 
  useGetMe, 
  useLogout, 
  getGetMeQueryKey, 
  type User 
} from "@workspace/api-client-react";
import { useLocation } from "wouter";

export function useAuth() {
  const [_, setLocation] = useLocation();
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
        setLocation("/login");
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
