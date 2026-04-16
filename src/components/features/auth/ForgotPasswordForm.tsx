import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
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

import {
  forgotPasswordFormSchema,
  type ForgotPasswordFormValues,
} from "@/lib/schemas/forgot-password";
import {
  RequestPasswordResetError,
  useRequestPasswordReset,
} from "@/lib/queries/auth";

const warningMessageClass = "text-warning";

export function ForgotPasswordForm() {
  const mutation = useRequestPasswordReset();
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: { email: "" },
  });

  const onSubmit = (values: ForgotPasswordFormValues) => {
    if (mutation.isPending) return;
    const email = values.email ?? "";
    mutation.mutate({ email }, {
      onSuccess: () => {
        // AC1 anti-enumeração: só mostra tela neutra após servidor aceitar (sucesso
        // real ou erro neutralizado em isNeutralizableError).
        setSubmittedEmail(email);
      },
      onError: (err) => {
        // Erros técnicos NÃO devem mostrar a tela neutra de "link enviado".
        if (err instanceof RequestPasswordResetError) {
          toast.error(err.message);
        } else {
          toast.error("Não foi possível enviar agora. Tente novamente.");
        }
      },
    });
  };

  if (submittedEmail) {
    return (
      <div className="mx-auto w-full max-w-md space-y-4 rounded-md border border-border bg-muted p-6 text-center">
        <p className="text-sm text-foreground">
          <strong>Se este email está cadastrado, enviamos um link.</strong>
        </p>
        <p className="text-sm text-muted-foreground">
          Verifique sua caixa de entrada em <strong>{submittedEmail}</strong>{" "}
          (e o spam). O link expira em 1 hora.
        </p>
        <Button
          variant="outline"
          onClick={() => {
            setSubmittedEmail(null);
            mutation.reset();
            form.reset({ email: "" });
          }}
        >
          Enviar para outro email
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mx-auto w-full max-w-md space-y-6"
        noValidate
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="seu@email.com"
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
              Enviando...
            </>
          ) : (
            "Enviar link de recuperação"
          )}
        </Button>

        <div className="text-center text-sm text-muted-foreground">
          <Link to="/login" className="text-primary underline">
            Voltar para o login
          </Link>
        </div>
      </form>
    </Form>
  );
}

export default ForgotPasswordForm;
