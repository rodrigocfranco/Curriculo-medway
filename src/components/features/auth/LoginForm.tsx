import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
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
import { loginFormSchema, type LoginFormValues } from "@/lib/schemas/login";
import { useLogin } from "@/lib/queries/auth";

const warningMessageClass = "text-warning";

export function LoginForm() {
  const navigate = useNavigate();
  const mutation = useLogin();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (values: LoginFormValues) => {
    mutation.mutate(values, {
      onSuccess: async ({ user }) => {
        // EXCEÇÃO arch regra 4: leitura síncrona de role para decidir redirect pós-login.
        // AuthContext refetch paralelo via onAuthStateChange → useCurrentProfile preenche.
        const { data: prof, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        if (error || !prof) {
          toast.error("Conta sem perfil. Contate suporte.");
          return;
        }
        navigate(prof.role === "admin" ? "/admin" : "/app", { replace: true });
      },
      onError: (err) => {
        toast.error(err.message);
        form.setValue("password", "");
        form.setFocus("password");
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

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="current-password"
                  placeholder="Sua senha"
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
              Entrando...
            </>
          ) : (
            "Entrar"
          )}
        </Button>

        <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
          <Link to="/forgot-password" className="text-primary underline">
            Esqueci minha senha
          </Link>
          <p>
            Não tem conta?{" "}
            <Link to="/signup" className="text-primary underline">
              Criar conta
            </Link>
          </p>
        </div>
      </form>
    </Form>
  );
}

export default LoginForm;
