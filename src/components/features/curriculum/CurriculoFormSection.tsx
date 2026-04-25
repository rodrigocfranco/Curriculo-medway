import type { UseFormReturn } from "react-hook-form";
import {
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { CurriculumFieldRow } from "@/lib/queries/curriculum";
import type { CurriculumData, Article, Apresentacao, IcProjeto } from "@/lib/schemas/curriculum";
import { ArticleListField } from "./ArticleListField";
import { EventListField } from "./EventListField";
import { IcProjectListField } from "./IcProjectListField";

interface CurriculoFormSectionProps {
  category: string;
  fields: CurriculumFieldRow[];
  form: UseFormReturn<CurriculumData>;
  onBlur: () => void;
}

// Estilo por categoria: borda lateral + gradiente sutil no header,
// usando paleta oficial Medway (Primary, Preventive, Clinic, Secondary, Surgery).
// Classes literais (não interpoladas) para o JIT do Tailwind detectá-las.
const CATEGORY_STYLES: Record<
  string,
  { border: string; gradient: string }
> = {
  Formação: {
    border: "border-l-brand-primary",
    gradient:
      "from-brand-primary/10 hover:from-brand-primary/20 data-[state=open]:from-brand-primary/15",
  },
  "Pesquisa e Publicações": {
    border: "border-l-brand-secondary",
    gradient:
      "from-brand-secondary/10 hover:from-brand-secondary/20 data-[state=open]:from-brand-secondary/15",
  },
  "Atividades Acadêmicas": {
    border: "border-l-brand-clinic",
    gradient:
      "from-brand-clinic/10 hover:from-brand-clinic/20 data-[state=open]:from-brand-clinic/15",
  },
  "Congressos e Formação Complementar": {
    border: "border-l-brand-neutral",
    gradient:
      "from-brand-neutral/10 hover:from-brand-neutral/20 data-[state=open]:from-brand-neutral/15",
  },
  "Representação Estudantil e Voluntariado": {
    border: "border-l-brand-surgery-80",
    gradient:
      "from-brand-surgery-80/10 hover:from-brand-surgery-80/20 data-[state=open]:from-brand-surgery-80/15",
  },
  Qualificações: {
    border: "border-l-brand-preventive-80",
    gradient:
      "from-brand-preventive-80/10 hover:from-brand-preventive-80/20 data-[state=open]:from-brand-preventive-80/15",
  },
};

const DEFAULT_CATEGORY_STYLE = CATEGORY_STYLES["Formação"];

const PLACEHOLDERS: Record<string, string> = {
  capitulos_livro: "Ex: 1",
  monitoria_horas_totais: "Ex: 192 (horas)",
  ic_projetos: "Adicione seus projetos de IC",
  ic_horas_totais: "Ex: 120 (horas)",
  monitoria_semestres: "Ex: 2 (semestres)",
  extensao_semestres: "Ex: 1 (semestres)",
  voluntariado_horas: "Ex: 80 (horas)",
  estagio_extracurricular_horas: "Ex: 200 (horas)",
  trabalho_sus_meses: "Ex: 6 (meses)",
  diretoria_ligas: "Ex: 1",
  membro_liga_anos: "Ex: 2 (anos)",
  representante_turma_anos: "Ex: 1 (anos)",
  cursos_suporte: "Ex: 2 (ACLS/ATLS/PALS)",
  apresentacoes: "Adicione seus trabalhos apresentados",
  ouvinte_congresso: "Ex: 5",
  organizador_evento: "Ex: 1",
  teste_progresso: "Ex: 4",
  media_geral: "Ex: 8,5",
};

function categoryToValue(category: string): string {
  return category
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function isFieldFilled(value: unknown, fieldType: string): boolean {
  if (fieldType === "boolean") return value === true;
  if (fieldType === "number") return typeof value === "number" && value > 0;
  if (fieldType === "select" || fieldType === "text")
    return typeof value === "string" && value !== "" && value !== "Não tenho";
  if (fieldType === "article_list" || fieldType === "event_list")
    return Array.isArray(value) && value.length > 0;
  return false;
}

export function CurriculoFormSection({
  category,
  fields,
  form,
  onBlur,
}: CurriculoFormSectionProps) {
  const values = form.watch();
  const filledCount = fields.filter((f) =>
    isFieldFilled(values[f.field_key as keyof CurriculumData], f.field_type),
  ).length;

  const accordionValue = categoryToValue(category);
  const styles = CATEGORY_STYLES[category] ?? DEFAULT_CATEGORY_STYLE;

  return (
    <AccordionItem
      value={accordionValue}
      className={cn(
        "overflow-hidden rounded-md border border-border border-l-4 bg-card",
        styles.border,
      )}
    >
      <AccordionTrigger
        className={cn(
          "bg-gradient-to-r to-transparent px-4 text-base font-semibold transition-colors hover:no-underline",
          styles.gradient,
        )}
      >
        {category}{" "}
        <span className="ml-2 text-sm font-normal text-muted-foreground">
          ({filledCount}/{fields.length} preenchidos)
        </span>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-4 px-4 pt-2">
          {fields.map((field) => (
            <FormField
              key={field.field_key}
              control={form.control}
              name={field.field_key as keyof CurriculumData & string}
              render={({ field: formField }) => {
                if (field.field_type === "boolean") {
                  return (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={formField.value as boolean}
                          onCheckedChange={(checked) => {
                            formField.onChange(checked);
                            onBlur();
                          }}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal leading-none">
                        {field.label}
                      </FormLabel>
                      <FormMessage />
                    </FormItem>
                  );
                }

                if (
                  field.field_type === "select" &&
                  Array.isArray(field.options) &&
                  field.options.length > 0
                ) {
                  const options = field.options as string[];
                  return (
                    <FormItem>
                      <FormLabel>{field.label}</FormLabel>
                      <Select
                        value={formField.value as string}
                        onValueChange={(val) => {
                          formField.onChange(val);
                          onBlur();
                        }}
                      >
                        <FormControl>
                          <SelectTrigger onBlur={onBlur}>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {options.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  );
                }

                if (field.field_type === "article_list") {
                  const opts = (field.options ?? {}) as { posicao: string[]; veiculo: string[] };
                  return (
                    <FormItem>
                      <FormLabel>{field.label}</FormLabel>
                      <FormControl>
                        <ArticleListField
                          value={formField.value as Article[]}
                          onChange={(articles) => {
                            formField.onChange(articles);
                          }}
                          onBlur={onBlur}
                          options={opts}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }

                if (field.field_type === "event_list") {
                  if (field.field_key === "ic_projetos") {
                    const opts = (field.options ?? {}) as { tipo: string[] };
                    return (
                      <FormItem>
                        <FormLabel>{field.label}</FormLabel>
                        <FormControl>
                          <IcProjectListField
                            value={formField.value as IcProjeto[]}
                            onChange={(items) => {
                              formField.onChange(items);
                            }}
                            onBlur={onBlur}
                            options={opts}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }

                  const opts = (field.options ?? {}) as { tipo: string[]; nivel: string[] };
                  return (
                    <FormItem>
                      <FormLabel>{field.label}</FormLabel>
                      <FormControl>
                        <EventListField
                          value={formField.value as Apresentacao[]}
                          onChange={(items) => {
                            formField.onChange(items);
                          }}
                          onBlur={onBlur}
                          options={opts}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }

                if (field.field_type === "text") {
                  return (
                    <FormItem>
                      <FormLabel>{field.label}</FormLabel>
                      <FormControl>
                        <Textarea
                          {...formField}
                          value={formField.value as string}
                          placeholder={
                            PLACEHOLDERS[field.field_key] ?? "Digite aqui..."
                          }
                          onBlur={onBlur}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }

                // Default: number
                const isMediaGeral = field.field_key === "media_geral";
                return (
                  <FormItem>
                    <FormLabel>{field.label}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={isMediaGeral ? 10 : undefined}
                        step={isMediaGeral ? 0.1 : undefined}
                        inputMode={isMediaGeral ? "decimal" : undefined}
                        {...formField}
                        value={formField.value as number}
                        onChange={(e) =>
                          formField.onChange(
                            e.target.value === "" ? 0 : Number(e.target.value),
                          )
                        }
                        placeholder={
                          PLACEHOLDERS[field.field_key] ?? "Ex: 0"
                        }
                        onBlur={onBlur}
                      />
                    </FormControl>
                    {isMediaGeral && (
                      <FormDescription>
                        Use a escala 0 a 10 (com até 1 casa decimal). Ex.: 8,5.
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
