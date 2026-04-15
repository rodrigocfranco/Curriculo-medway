import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { supabase } from "@/lib/supabase";
import {
  resetPasswordFormSchema,
  type ResetPasswordFormValues,
} from "@/lib/schemas/reset-password";
import { useResetPassword } from "@/lib/queries/auth";

const warningMessageClass = "text-warning";

export function ResetPasswordForm() {
  const navigate = useNavigate();
  const mutation = useResetPassword();

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = (values: ResetPasswordFormValues) => {
    if (mutation.isPending) return;
    mutation.mutate(values, {
      onSuccess: async () => {
        // Força novo login com a senha recém-criada (AC2). Falha de signOut não
        // deve bloquear feedback/navigate — sessão expira naturalmente.
        try {
          await supabase.auth.signOut({ scope: "local" });
        } catch (err) {
          console.error("signOut pós-reset falhou (ignorado):", err);
        }
        toast.success("Senha alterada com sucesso. Entre com a nova senha.");
        navigate("/login", { replace: true });
      },
      onError: (err) => {
        if (err.field) {
          form.setError(err.field, { message: err.message });
          return;
        }
        toast.error(err.message);
        if (/link inválido|expirado|session missing/i.test(err.message)) {
          navigate("/forgot-password", { replace: true });
        }
      },
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mx-auto w-full max-w-md space-y-6"
        noValidate
      >
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nova senha</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Nova senha"
                  {...field}
                />
              </FormControl>
              <p className="text-xs text-muted-foreground">
                Mínimo 8 caracteres.
              </p>
              <FormMessage className={warningMessageClass} />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmar nova senha</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Repita a nova senha"
                  {...field}
                />
              </FormControl>
              <FormMessage className={warningMessageClass} />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Alterando...
            </>
          ) : (
            "Alterar senha"
          )}
        </Button>
      </form>
    </Form>
  );
}

export default ResetPasswordForm;
