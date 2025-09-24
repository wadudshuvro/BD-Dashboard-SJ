import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getActiveIntegration, fetchContacts, syncContacts, createContact } from "./api";
import { useAuth } from "@/hooks/useAuth";

export function useGHLIntegration() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["ghl:integration", user?.id],
    queryFn: async () => (user ? getActiveIntegration(user.id) : null),
    enabled: !!user
  });
}

export function useGHLContacts(integrationId?: string) {
  return useQuery({
    queryKey: ["ghl:contacts", integrationId],
    queryFn: async () => (integrationId ? fetchContacts(integrationId) : []),
    enabled: !!integrationId
  });
}

export function useGHLSync() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (integrationId: string) => syncContacts(integrationId),
    onSuccess: (_, integrationId) => {
      queryClient.invalidateQueries({ queryKey: ["ghl:contacts", integrationId] });
    }
  });
}

export function useGHLCreateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ integrationId, contactData }: { 
      integrationId: string; 
      contactData: { firstName: string; lastName?: string; email?: string; phone?: string }
    }) => createContact(integrationId, contactData),
    onSuccess: (_, { integrationId }) => {
      queryClient.invalidateQueries({ queryKey: ["ghl:contacts", integrationId] });
    }
  });
}