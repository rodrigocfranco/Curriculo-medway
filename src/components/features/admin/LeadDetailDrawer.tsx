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
  publicacoes: "Publicações",
  artigos_high_impact: "Publicações",
  artigos_mid_impact: "Publicações",
  artigos_low_impact: "Publicações",
  artigos_nacionais: "Publicações",
  capitulos_livro: "Publicações",
  ic_com_bolsa: "Acadêmico",
  ic_sem_bolsa: "Acadêmico",
  ic_horas_totais: "Acadêmico",
  monitoria_semestres: "Acadêmico",
  extensao_semestres: "Acadêmico",
  voluntariado_horas: "Prática/Social",
  estagio_extracurricular_horas: "Prática/Social",
  trabalho_sus_meses: "Prática/Social",
  projeto_rondon: "Prática/Social",
  internato_hospital_ensino: "Prática/Social",
  diretoria_ligas: "Liderança/Eventos",
  membro_liga_anos: "Liderança/Eventos",
  representante_turma_anos: "Liderança/Eventos",
  cursos_suporte: "Liderança/Eventos",
  apresentacao_congresso: "Liderança/Eventos",
  ouvinte_congresso: "Liderança/Eventos",
  organizador_evento: "Liderança/Eventos",
  teste_progresso: "Liderança/Eventos",
  ingles_fluente: "Perfil",
  media_geral: "Perfil",
  conceito_historico: "Perfil",
  ranking_ruf_top35: "Perfil",
  mestrado_status: "Perfil",
  doutorado_status: "Perfil",
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
