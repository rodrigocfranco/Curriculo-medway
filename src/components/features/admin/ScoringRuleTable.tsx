import { useMemo } from "react";
import { Pencil, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ScoringRuleRow, InstitutionRow, SpecialtyRow } from "@/lib/queries/admin";
import { useCurriculumFields } from "@/lib/queries/curriculum";

/** Labels para field_keys compostos (fórmulas que combinam vários campos do currículo) */
const COMPOSITE_FIELD_LABELS: Record<string, string> = {
  publicacoes: "Publicações",
  ic: "Iniciação Científica",
  monitoria: "Monitoria",
  formacao: "Formação acadêmica",
  extensao: "Extensão universitária",
  voluntariado: "Voluntariado",
  ligas: "Ligas acadêmicas",
  ligas_rep: "Representação e Ligas",
  ligas_ext: "Extensão e Ligas",
  congressos: "Congressos e Eventos",
  eventos: "Eventos",
  historico: "Histórico escolar",
  idiomas: "Idiomas",
  estagio: "Estágio extracurricular",
  social: "Experiência social",
  representante: "Representante de turma",
  instituicao_origem: "Instituição de origem",
  pos_graduacao: "Pós-graduação",
  bloco_cientifico: "Produção científica",
  bloco_monitoria: "Monitoria",
  bloco_extra: "Atividades extracurriculares",
  bloco_idioma: "Língua estrangeira",
};

interface ScoringRuleTableProps {
  rules: ScoringRuleRow[] | undefined;
  institutions: InstitutionRow[] | undefined;
  specialties: SpecialtyRow[] | undefined;
  isLoading: boolean;
  onEdit: (rule: ScoringRuleRow) => void;
  onDelete: (rule: ScoringRuleRow) => void;
}

function LoadingSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-10" /></TableCell>
          <TableCell><Skeleton className="h-4 w-10" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function ScoringRuleTable({
  rules,
  institutions,
  specialties,
  isLoading,
  onEdit,
  onDelete,
}: ScoringRuleTableProps) {
  const { data: fieldsByCategory } = useCurriculumFields();

  const institutionMap = useMemo(
    () => new Map(institutions?.map((i) => [i.id, i]) ?? []),
    [institutions],
  );
  const specialtyMap = useMemo(
    () => new Map(specialties?.map((s) => [s.id, s]) ?? []),
    [specialties],
  );

  // Map field_key -> label for display
  const fieldLabelMap = useMemo(() => {
    const m = new Map<string, string>();
    if (fieldsByCategory) {
      for (const fields of Object.values(fieldsByCategory)) {
        for (const f of fields) {
          m.set(f.field_key, f.label);
        }
      }
    }
    return m;
  }, [fieldsByCategory]);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Instituicao</TableHead>
          <TableHead scope="col">Especialidade</TableHead>
          <TableHead scope="col">Categoria</TableHead>
          <TableHead scope="col">Campo</TableHead>
          <TableHead scope="col" className="text-center">Pts/unidade</TableHead>
          <TableHead scope="col" className="text-center">Teto</TableHead>
          <TableHead scope="col" className="text-right">Acoes</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading && <LoadingSkeleton />}

        {!isLoading && rules?.length === 0 && (
          <TableRow>
            <TableCell
              colSpan={7}
              className="text-center text-muted-foreground py-8"
            >
              Nenhuma regra cadastrada. Clique em "Nova regra" para criar a primeira.
            </TableCell>
          </TableRow>
        )}

        {!isLoading &&
          rules?.map((rule) => {
            const inst = institutionMap.get(rule.institution_id);
            const spec = rule.specialty_id
              ? specialtyMap.get(rule.specialty_id)
              : null;

            return (
              <TableRow key={rule.id}>
                <TableCell className="font-medium">
                  {inst?.short_name || inst?.name || "—"}
                </TableCell>
                <TableCell>
                  {spec ? (
                    spec.name
                  ) : (
                    <Badge variant="secondary">Todas</Badge>
                  )}
                </TableCell>
                <TableCell>{rule.category}</TableCell>
                <TableCell>
                  {fieldLabelMap.get(rule.field_key) ?? COMPOSITE_FIELD_LABELS[rule.field_key] ?? rule.field_key}
                </TableCell>
                <TableCell className="text-center">{rule.weight}</TableCell>
                <TableCell className="text-center">{rule.max_points}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onEdit(rule)}
                          aria-label={`Editar regra ${rule.field_key}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Editar</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => onDelete(rule)}
                          aria-label={`Remover regra ${rule.field_key}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Remover</TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
      </TableBody>
    </Table>
  );
}
