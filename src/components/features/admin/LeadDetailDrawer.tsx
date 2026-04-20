import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { formatGrade } from "@/lib/schemas/scoring";
import { useLeadDetail } from "@/lib/queries/leads";

type Props = {
  leadId: string | null;
  onClose: () => void;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const CURRICULUM_CATEGORIES: Record<string, string> = {
  // Formação
  ranking_ruf_top35: "Formação",
  faculdade_tem_doutorado: "Formação",
  faculdade_tem_mestrado: "Formação",
  faculdade_programas_capes: "Formação",
  internato_hospital_ensino: "Formação",
  nivel_assistencial: "Formação",
  media_geral: "Formação",
  // Pesquisa e Publicações
  publicacoes: "Pesquisa e Publicações",
  capitulos_livro: "Pesquisa e Publicações",
  ic_projetos: "Pesquisa e Publicações",
  ic_horas_totais: "Pesquisa e Publicações",
  // Atividades Acadêmicas
  monitoria_semestres: "Atividades Acadêmicas",
  extensao_semestres: "Atividades Acadêmicas",
  diretoria_ligas: "Atividades Acadêmicas",
  membro_liga_anos: "Atividades Acadêmicas",
  premios_academicos: "Atividades Acadêmicas",
  cursinhos_preparatorios: "Atividades Acadêmicas",
  // Congressos e Formação Complementar
  apresentacoes: "Congressos e Formação Complementar",
  ouvinte_congresso: "Congressos e Formação Complementar",
  organizador_evento: "Congressos e Formação Complementar",
  cursos_temas_medicos: "Congressos e Formação Complementar",
  cursos_suporte: "Congressos e Formação Complementar",
  teste_progresso: "Congressos e Formação Complementar",
  // Representação Estudantil e Voluntariado
  voluntariado_horas: "Representação Estudantil e Voluntariado",
  estagio_extracurricular_horas: "Representação Estudantil e Voluntariado",
  trabalho_sus_meses: "Representação Estudantil e Voluntariado",
  projeto_rondon: "Representação Estudantil e Voluntariado",
  representante_turma_anos: "Representação Estudantil e Voluntariado",
  colegiado_institucional_semestres: "Representação Estudantil e Voluntariado",
  centro_academico_semestres: "Representação Estudantil e Voluntariado",
  atletica_semestres: "Representação Estudantil e Voluntariado",
  equipe_esportiva_semestres: "Representação Estudantil e Voluntariado",
  comissao_avaliacao_semestres: "Representação Estudantil e Voluntariado",
  // Qualificações
  ingles_fluente: "Qualificações",
  mestrado_status: "Qualificações",
  doutorado_status: "Qualificações",
  residencia_medica_concluida: "Qualificações",
  outro_curso_universitario: "Qualificações",
  prova_proficiencia_medicina: "Qualificações",
};

function formatFieldLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatFieldValue(value: unknown): string {
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value || "—";
  return "—";
}

function isFieldFilled(value: unknown): boolean {
  if (value === null || value === undefined || value === "") return false;
  if (typeof value === "number") return value > 0;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value !== "Não tenho" && value !== "Não";
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

export default function LeadDetailDrawer({ leadId, onClose }: Props) {
  const { data, isLoading } = useLeadDetail(leadId);

  const curriculumByCategory = (() => {
    if (!data?.curriculum?.data) return null;
    const grouped: Record<string, { key: string; value: unknown; filled: boolean }[]> = {};
    for (const [key, value] of Object.entries(data.curriculum.data)) {
      const cat = CURRICULUM_CATEGORIES[key] ?? "Outros";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push({ key, value, filled: isFieldFilled(value) });
    }
    return grouped;
  })();

  return (
    <Sheet open={!!leadId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="text-lg font-semibold text-navy-900">
            {isLoading ? <Skeleton className="h-6 w-48" /> : data?.profile.name}
          </SheetTitle>
          <SheetDescription>Detalhes do lead</SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="space-y-4 px-1 pt-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        ) : data ? (
          <div className="space-y-6 px-1 pt-4">
            {/* Perfil */}
            <section>
              <h3 className="mb-2 text-sm font-semibold text-navy-900">Perfil</h3>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                {([
                  ["Email", data.profile.email],
                  ["Telefone", data.profile.phone],
                  ["Estado", data.profile.state],
                  ["Faculdade", data.profile.university],
                  ["Ano formação", data.profile.graduation_year],
                  ["Especialidade", data.profile.specialty_interest],
                  ["Role", data.profile.role],
                  ["Cadastro", formatDate(data.profile.created_at)],
                  ["Atualização", formatDate(data.profile.updated_at)],
                ] as [string, unknown][]).map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className="text-sm tabular-nums">{formatFieldValue(value)}</dd>
                  </div>
                ))}
              </dl>
            </section>

            {/* Currículo */}
            <section>
              <h3 className="mb-2 text-sm font-semibold text-navy-900">Currículo</h3>
              {curriculumByCategory ? (
                Object.entries(curriculumByCategory).map(([cat, fields]) => {
                  const filledCount = fields.filter((f) => f.filled).length;
                  return (
                    <div key={cat} className="mb-3">
                      <p className="mb-1 text-xs font-medium text-muted-foreground">
                        {cat} — {filledCount}/{fields.length} preenchidos
                      </p>
                      <div className="space-y-0.5">
                        {fields.map((f) => (
                          <div key={f.key} className="flex items-center justify-between text-xs">
                            <span className={f.filled ? "text-foreground" : "text-muted-foreground"}>
                              {formatFieldLabel(f.key)}
                            </span>
                            <span className="tabular-nums">{formatFieldValue(f.value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-muted-foreground">Nenhum dado de currículo preenchido.</p>
              )}
            </section>

            {/* Top 3 scores */}
            <section>
              <h3 className="mb-2 text-sm font-semibold text-navy-900">Top 3 Scores</h3>
              {data.topScores.length > 0 ? (
                <div className="space-y-2">
                  {data.topScores.map((s, i) => {
                    const pct = s.max_score > 0 ? (s.score / s.max_score) * 100 : 0;
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium">
                            {s.institution?.short_name ?? s.institution?.name ?? "—"}
                          </span>
                          <span className="tabular-nums">
                            {formatGrade(s.score, s.max_score)}
                          </span>
                        </div>
                        <Progress value={pct} className="mt-1 h-1.5" />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Nenhum score calculado.</p>
              )}
            </section>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
