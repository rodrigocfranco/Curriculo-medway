import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  scoringRuleFormSchema,
  type ScoringRuleFormValues,
} from "@/lib/schemas/admin";
import {
  useInstitutions,
  useSpecialties,
  useCreateScoringRule,
  useUpdateScoringRule,
  type ScoringRuleRow,
} from "@/lib/queries/admin";
import {
  useCurriculumFields,
  type CurriculumFieldRow,
} from "@/lib/queries/curriculum";

interface ScoringRuleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule?: ScoringRuleRow | null;
  onPublish?: (values: ScoringRuleFormValues, ruleId?: string) => void;
}

type RuleStatus = "draft" | "dirty" | "publishing" | "published" | "error";

const STATUS_BADGES: Record<RuleStatus, { label: string; variant: "secondary" | "outline" | "default" | "destructive"; className?: string }> = {
  draft: { label: "Rascunho", variant: "secondary" },
  dirty: { label: "Nao salvo", variant: "outline", className: "border-amber-500 text-amber-700 bg-amber-50" },
  publishing: { label: "Publicando...", variant: "default" },
  published: { label: "Publicado", variant: "outline", className: "border-emerald-500 text-emerald-700 bg-emerald-50" },
  error: { label: "Erro", variant: "destructive" },
};

export function ScoringRuleFormDialog({
  open,
  onOpenChange,
  rule,
  onPublish,
}: ScoringRuleFormDialogProps) {
  const isEditing = !!rule;
  const createMutation = useCreateScoringRule();
  const updateMutation = useUpdateScoringRule();
  const mutation = isEditing ? updateMutation : createMutation;

  const { data: institutions } = useInstitutions();
  const { data: specialties } = useSpecialties();
  const { data: fieldsByCategory } = useCurriculumFields();

  const [mutationError, setMutationError] = useState<string | null>(null);

  const form = useForm<ScoringRuleFormValues>({
    resolver: zodResolver(scoringRuleFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      institution_id: "",
      specialty_id: null,
      category: "",
      field_key: "",
      weight: 0,
      max_points: 0,
      description: "",
      formula: "{}",
    },
  });

  const selectedCategory = form.watch("category");
  const isDirty = form.formState.isDirty;
  const isPending = mutation.isPending;

  // Determine visual status
  const status: RuleStatus = useMemo(() => {
    if (mutationError) return "error";
    if (isPending) return "publishing";
    if (!isEditing && !isDirty) return "draft";
    if (isDirty) return "dirty";
    return "published";
  }, [mutationError, isPending, isEditing, isDirty]);

  // Categories from curriculum_fields + legacy category from rule being edited
  const categories = useMemo(() => {
    const cats = fieldsByCategory ? Object.keys(fieldsByCategory) : [];
    if (rule && rule.category && !cats.includes(rule.category)) {
      return [rule.category, ...cats];
    }
    return cats;
  }, [fieldsByCategory, rule]);

  // Fields filtered by selected category + legacy field from rule being edited
  const filteredFields: CurriculumFieldRow[] = useMemo(() => {
    if (!selectedCategory) return [];
    const fields = fieldsByCategory?.[selectedCategory] ?? [];
    // If editing a rule with a legacy field_key not in curriculum_fields, add it
    if (
      rule &&
      rule.category === selectedCategory &&
      rule.field_key &&
      !fields.some((f) => f.field_key === rule.field_key)
    ) {
      return [
        {
          id: rule.field_key,
          category: rule.category,
          field_key: rule.field_key,
          label: rule.field_key,
          field_type: "text",
          options: null,
          display_order: 0,
          created_at: "",
        } as CurriculumFieldRow,
        ...fields,
      ];
    }
    return fields;
  }, [fieldsByCategory, selectedCategory, rule]);

  // Reset form when dialog opens/closes or rule changes
  useEffect(() => {
    if (open) {
      setMutationError(null);
      if (rule) {
        form.reset({
          institution_id: rule.institution_id,
          specialty_id: rule.specialty_id,
          category: rule.category,
          field_key: rule.field_key,
          weight: rule.weight,
          max_points: rule.max_points,
          description: rule.description ?? "",
          formula: JSON.stringify(rule.formula, null, 2),
        });
      } else {
        form.reset({
          institution_id: "",
          specialty_id: null,
          category: "",
          field_key: "",
          weight: 0,
          max_points: 0,
          description: "",
          formula: "{}",
        });
      }
    }
  }, [open, rule, form]);

  // Track initial category to distinguish user changes from form reset
  const [initialCategory, setInitialCategory] = useState<string | null>(null);

  useEffect(() => {
    if (open && rule) {
      setInitialCategory(rule.category);
    } else if (open) {
      setInitialCategory(null);
    }
  }, [open, rule]);

  // Reset field_key when category changes (user action, not initial load)
  useEffect(() => {
    if (!selectedCategory) return;
    if (initialCategory && selectedCategory === initialCategory) {
      setInitialCategory(null);
      return;
    }
    form.setValue("field_key", "");
  }, [selectedCategory, form, initialCategory]);

  const onSubmit = async (values: ScoringRuleFormValues) => {
    if (isPending) return;
    setMutationError(null);

    // If onPublish is provided, delegate to ImpactPreviewDialog flow
    if (onPublish) {
      onPublish(values, rule?.id);
      return;
    }

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: rule.id, ...values });
        toast.success("Regra atualizada.");
      } else {
        await createMutation.mutateAsync(values);
        toast.success("Regra criada.");
      }
      onOpenChange(false);
    } catch (err) {
      const isDuplicate =
        err instanceof Error && err.message?.includes("23505");
      const msg = isDuplicate
        ? "Ja existe uma regra com esta combinacao de instituicao, especialidade e campo."
        : "Erro ao salvar regra. Tente novamente.";
      setMutationError(msg);
      toast.error(msg);
    }
  };

  const badge = STATUS_BADGES[status];

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && isPending) return;
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>
              {isEditing ? "Editar regra" : "Nova regra"}
            </DialogTitle>
            <Badge variant={badge.variant} className={badge.className}>
              {status === "publishing" && (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              )}
              {badge.label}
              {status === "published" && rule?.updated_at && (
                <span className="ml-1 text-[10px] opacity-70">
                  {new Date(rule.updated_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </Badge>
          </div>
          <DialogDescription>
            {isEditing
              ? "Altere os dados da regra de pontuacao."
              : "Configure uma nova regra de pontuacao."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Institution */}
            <FormField
              control={form.control}
              name="institution_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instituicao</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger aria-label="Selecionar instituicao">
                        <SelectValue placeholder="Selecione a instituicao" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {institutions?.map((inst) => (
                        <SelectItem key={inst.id} value={inst.id}>
                          {inst.short_name || inst.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Specialty */}
            <FormField
              control={form.control}
              name="specialty_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Especialidade</FormLabel>
                  <Select
                    onValueChange={(v) =>
                      field.onChange(v === "__all__" ? null : v)
                    }
                    value={field.value ?? "__all__"}
                  >
                    <FormControl>
                      <SelectTrigger aria-label="Selecionar especialidade">
                        <SelectValue placeholder="Todas (default)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__all__">Todas (default)</SelectItem>
                      {specialties?.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select
                    onValueChange={(v) => {
                      field.onChange(v);
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger aria-label="Selecionar categoria">
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Field Key */}
            <FormField
              control={form.control}
              name="field_key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campo</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!selectedCategory}
                  >
                    <FormControl>
                      <SelectTrigger aria-label="Selecionar campo">
                        <SelectValue
                          placeholder={
                            selectedCategory
                              ? "Selecione o campo"
                              : "Selecione uma categoria primeiro"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredFields.map((f) => (
                        <SelectItem key={f.field_key} value={f.field_key}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Weight & Max Points */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pontos por unidade</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="any"
                        placeholder="0"
                        value={field.value ?? ""}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        onChange={(e) => {
                          const raw = e.target.value;
                          field.onChange(raw === "" ? 0 : parseFloat(raw));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="max_points"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teto maximo de pontos</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="any"
                        placeholder="0"
                        value={field.value ?? ""}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        onChange={(e) => {
                          const raw = e.target.value;
                          field.onChange(raw === "" ? 0 : parseFloat(raw));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descricao (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva brevemente a regra..."
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {mutationError && (
              <div className="flex items-center gap-2 text-sm text-destructive" role="alert">
                <p className="flex-1">{mutationError}</p>
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="shrink-0 text-destructive border-destructive hover:bg-destructive/10"
                >
                  Tentar novamente
                </Button>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {onPublish ? "Publicar" : isEditing ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
