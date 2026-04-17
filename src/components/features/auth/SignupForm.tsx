import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";

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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

import { BRAZIL_STATES } from "@/lib/brazil-states";
import { getGraduationYearOptions } from "@/lib/graduation-year";
import { useSpecialtiesPublic, useMedicalSchools } from "@/lib/queries/public";
import { formatPhone } from "@/lib/formatters/phone";
import {
  signupFormSchema,
  type SignupFormValues,
} from "@/lib/schemas/signup";
import { useSignup } from "@/lib/queries/auth";

const warningMessageClass = "text-warning";

export function SignupForm() {
  const navigate = useNavigate();
  const mutation = useSignup();
  const [universityOpen, setUniversityOpen] = useState(false);
  const [universityQuery, setUniversityQuery] = useState("");
  const graduationYears = useMemo(() => getGraduationYearOptions(), []);
  const { data: specialties, isLoading: specialtiesLoading } = useSpecialtiesPublic();
  const { data: medicalSchools, isLoading: schoolsLoading } = useMedicalSchools();

  // Build display list for combobox: "SIGLA - Nome"
  const schoolOptions = useMemo(
    () =>
      medicalSchools?.map((s) => `${s.abbreviation} - ${s.name}`) ?? [],
    [medicalSchools],
  );

  // defaultValues usa Partial para evitar casts inseguros em campos obrigatórios
  // (state/specialty enums, graduation_year number, lgpd_accepted literal(true)).
  // Zod rejeita os undefined no submit — que é exatamente o comportamento desejado.
  // mode: "onSubmit" evita flashear erros enquanto o usuário digita;
  // reValidateMode: "onChange" re-roda a validação após o primeiro submit.
  // O CTA usa presença-de-campos como proxy de validade (AC1 — "validação falha"
  // = qualquer required vazio); o Zod ainda re-valida o schema completo no submit.
  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      university: "",
      password: "",
      confirmPassword: "",
    } as Partial<SignupFormValues> as SignupFormValues,
  });

  const values = form.watch();
  const lgpdAccepted = values.lgpd_accepted === true;
  const password = values.password;
  const confirmPassword = values.confirmPassword;
  // AC1 — "validação falha" = algum required vazio. Zod ainda re-valida no submit.
  const hasAllRequired = Boolean(
    values.name &&
      values.email &&
      values.phone &&
      values.state &&
      values.university &&
      values.graduation_year &&
      values.specialty_interest &&
      values.password &&
      values.confirmPassword,
  );
  const isInvalid = !hasAllRequired;

  // Revalida confirmPassword sempre que password muda depois (refine cross-field
  // do Zod não re-dispara automaticamente quando o outro campo é editado).
  useEffect(() => {
    if (confirmPassword) {
      void form.trigger("confirmPassword");
    }
  }, [password, confirmPassword, form]);

  const onSubmit = (values: SignupFormValues) => {
    // Guard double-click: mutation.isPending ainda não é true no mesmo tick do clique.
    if (mutation.isPending) return;
    mutation.mutate(values, {
      onSuccess: () => navigate("/app"),
      onError: (err) => {
        if (err.field) {
          form.setError(err.field, { type: "server", message: err.message });
          form.setFocus(err.field);
        } else {
          toast.error(err.message);
        }
      },
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mx-auto w-full max-w-xl space-y-6"
        noValidate
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome completo</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="name"
                    placeholder="Lucas Silva"
                    {...field}
                  />
                </FormControl>
                <FormMessage className={warningMessageClass} />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder="seu@email.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage className={warningMessageClass} />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="(11) 98765-4321"
                    value={field.value}
                    onChange={(e) => field.onChange(formatPhone(e.target.value))}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                </FormControl>
                <FormMessage className={warningMessageClass} />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? ""}
                >
                  <FormControl>
                    <SelectTrigger tabIndex={0}>
                      <SelectValue placeholder="Selecione o estado" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {BRAZIL_STATES.map((s) => (
                      <SelectItem key={s.code} value={s.code}>
                        {s.name} ({s.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className={warningMessageClass} />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
          <FormField
            control={form.control}
            name="university"
            render={({ field }) => {
              // Remove zero-width chars e colapsa whitespace antes de validar
              // tamanho / usar como valor persistido.
              const normalized = universityQuery
                .replace(/[\u200B-\u200D\uFEFF]/g, "")
                .replace(/\s+/g, " ")
                .trim();
              return (
                <FormItem className="flex flex-col">
                  <FormLabel>Faculdade</FormLabel>
                  <Popover open={universityOpen} onOpenChange={setUniversityOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          role="combobox"
                          tabIndex={0}
                          aria-expanded={universityOpen}
                          className={cn(
                            "w-full justify-between font-normal",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          {field.value || (schoolsLoading ? "Carregando..." : "Selecione ou digite sua faculdade")}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                        <CommandInput
                          placeholder="Buscar faculdade..."
                          value={universityQuery}
                          onValueChange={setUniversityQuery}
                        />
                        <CommandList>
                          <CommandEmpty className="px-0 py-0 text-sm">
                            <button
                              type="button"
                              disabled={normalized.length < 2}
                              onClick={() => {
                                if (normalized.length >= 2) {
                                  field.onChange(normalized);
                                  setUniversityOpen(false);
                                }
                              }}
                              className="block w-full cursor-pointer px-2 py-3 text-left disabled:cursor-default disabled:opacity-60"
                            >
                              {normalized.length >= 2
                                ? `Adicionar "${normalized}"`
                                : "Digite pelo menos 2 caracteres"}
                            </button>
                          </CommandEmpty>
                          {schoolOptions.map((u) => (
                            <CommandItem
                              key={u}
                              value={u}
                              onSelect={() => {
                                field.onChange(u);
                                setUniversityOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  field.value === u ? "opacity-100" : "opacity-0",
                                )}
                              />
                              {u}
                            </CommandItem>
                          ))}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage className={warningMessageClass} />
                </FormItem>
              );
            }}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="graduation_year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ano de formação</FormLabel>
                <Select
                  onValueChange={(v) => field.onChange(Number(v))}
                  value={field.value ? String(field.value) : ""}
                >
                  <FormControl>
                    <SelectTrigger tabIndex={0}>
                      <SelectValue placeholder="Selecione o ano" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {graduationYears.map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className={warningMessageClass} />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="specialty_interest"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Especialidade desejada</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? ""}
                >
                  <FormControl>
                    <SelectTrigger tabIndex={0} disabled={specialtiesLoading}>
                      <SelectValue placeholder={specialtiesLoading ? "Carregando..." : "Selecione a especialidade"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {specialties?.map((s) => (
                      <SelectItem key={s.id} value={s.name}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className={warningMessageClass} />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Senha</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    aria-describedby="password-hint"
                    placeholder="Mínimo 8 caracteres"
                    maxLength={72}
                    {...field}
                  />
                </FormControl>
                <p
                  id="password-hint"
                  className="text-xs text-muted-foreground"
                >
                  Entre 8 e 72 caracteres.
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
                <FormLabel>Confirmar senha</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    placeholder="Repita a senha"
                    maxLength={72}
                    {...field}
                  />
                </FormControl>
                <FormMessage className={warningMessageClass} />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="lgpd_accepted"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-start gap-3">
                <FormControl>
                  <Checkbox
                    id="lgpd_accepted"
                    checked={field.value === true}
                    onCheckedChange={(v) => field.onChange(v === true)}
                  />
                </FormControl>
                <Label htmlFor="lgpd_accepted" className="text-sm leading-snug">
                  Aceito os{" "}
                  <a
                    href="/termos"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    Termos de Uso
                  </a>{" "}
                  e a{" "}
                  <a
                    href="/privacidade"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    Política de Privacidade
                  </a>
                  .
                </Label>
              </div>
              <FormMessage className={warningMessageClass} />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={!lgpdAccepted || isInvalid || mutation.isPending}
          aria-disabled={!lgpdAccepted || isInvalid || mutation.isPending}
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Criando...
            </>
          ) : (
            "Criar minha conta"
          )}
          {(!lgpdAccepted || isInvalid) && !mutation.isPending && (
            <span className="sr-only">
              {!lgpdAccepted
                ? "Marque o aceite dos termos para habilitar"
                : "Preencha todos os campos obrigatórios para habilitar"}
            </span>
          )}
        </Button>
      </form>
    </Form>
  );
}

export default SignupForm;
