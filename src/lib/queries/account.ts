import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { supabase } from "../supabase";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DeleteAccountResponse = {
  data: { deleted: true } | null;
  error: { message: string; code: string } | null;
};

// ---------------------------------------------------------------------------
// useDeleteAccount — invoca Edge Function delete-account
// ---------------------------------------------------------------------------

export function useDeleteAccount(): UseMutationResult<
  DeleteAccountResponse,
  Error,
  void
> {
  return useMutation<DeleteAccountResponse, Error, void>({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke<DeleteAccountResponse>(
        "delete-account"
      );

      if (error) {
        throw new Error(error.message ?? "Erro ao excluir conta");
      }

      if (data?.error) {
        throw new Error(data.error.message ?? "Erro ao excluir conta");
      }

      return data as DeleteAccountResponse;
    },
  });
}
