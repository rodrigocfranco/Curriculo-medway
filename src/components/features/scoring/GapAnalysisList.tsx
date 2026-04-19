import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { ScoreBreakdown } from "@/lib/schemas/scoring";

interface GapAnalysisListProps {
  breakdown: ScoreBreakdown;
  curriculumData?: Record<string, unknown>;
}

/** Paleta de cores por categoria */
interface CategoryPalette {
  headerBg: string;
  headerBorder: string;
  badge: string;
  badgeText: string;
  progress: string;
  accent: string;
  snapshotBorder: string;
  snapshotBg: string;
}

const CATEGORY_PALETTES: Record<string, CategoryPalette> = {
  Perfil: {
    headerBg: "bg-violet-50/60",
    headerBorder: "border-b-violet-200/50",
    badge: "bg-violet-100",
    badgeText: "text-violet-700",
    progress: "[&>div]:bg-violet-500",
    accent: "text-violet-600",
    snapshotBorder: "border-l-violet-400",
    snapshotBg: "bg-violet-50/40",
  },
  Acadêmico: {
    headerBg: "bg-blue-50/60",
    headerBorder: "border-b-blue-200/50",
    badge: "bg-blue-100",
    badgeText: "text-blue-700",
    progress: "[&>div]:bg-blue-500",
    accent: "text-blue-600",
    snapshotBorder: "border-l-blue-400",
    snapshotBg: "bg-blue-50/40",
  },
  Publicações: {
    headerBg: "bg-amber-50/60",
    headerBorder: "border-b-amber-200/50",
    badge: "bg-amber-100",
    badgeText: "text-amber-700",
    progress: "[&>div]:bg-amber-500",
    accent: "text-amber-600",
    snapshotBorder: "border-l-amber-400",
    snapshotBg: "bg-amber-50/40",
  },
  "Liderança/Eventos": {
    headerBg: "bg-teal-50/60",
    headerBorder: "border-b-teal-200/50",
    badge: "bg-teal-100",
    badgeText: "text-teal-700",
    progress: "[&>div]:bg-teal-500",
    accent: "text-teal-600",
    snapshotBorder: "border-l-teal-400",
    snapshotBg: "bg-teal-50/40",
  },
  "Prática/Social": {
    headerBg: "bg-rose-50/60",
    headerBorder: "border-b-rose-200/50",
    badge: "bg-rose-100",
    badgeText: "text-rose-700",
    progress: "[&>div]:bg-rose-500",
    accent: "text-rose-600",
    snapshotBorder: "border-l-rose-400",
    snapshotBg: "bg-rose-50/40",
  },
};

const DEFAULT_PALETTE: CategoryPalette = {
  headerBg: "bg-slate-50/60",
  headerBorder: "border-b-slate-200/50",
  badge: "bg-slate-100",
  badgeText: "text-slate-700",
  progress: "[&>div]:bg-slate-500",
  accent: "text-slate-600",
  snapshotBorder: "border-l-slate-400",
  snapshotBg: "bg-slate-50/40",
};

function getPalette(category: string): CategoryPalette {
  return CATEGORY_PALETTES[category] ?? DEFAULT_PALETTE;
}

interface BreakdownEntry {
  key: string;
  label: string;
  score: number;
  max: number;
  delta: number;
  description: string;
  percentage: number;
}

interface CategoryGroup {
  category: string;
  entries: BreakdownEntry[];
  totalScore: number;
  totalMax: number;
  totalDelta: number;
}

function formatKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function parseRuleItems(description: string): { text: string; pts: string }[] {
  if (!description) return [];
  return description.split("|").map((part) => {
    const trimmed = part.trim();
    const match = trimmed.match(/^(.+?)\s*\((\d+[\.,]?\d*)\s*pts?\)$/i);
    if (match) {
      return { text: match[1].trim(), pts: match[2] };
    }
    return { text: trimmed, pts: "" };
  }).filter((item) => item.text.length > 0);
}

/** Formata o valor do currículo para exibição humana */
function formatCurriculumValue(value: unknown): string {
  if (value === null || value === undefined) return "Não informado";
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if (typeof value === "number") return value === 0 ? "0" : String(value);
  if (typeof value === "string") {
    if (value === "" || value === "Não" || value === "Não tenho") return value || "Não informado";
    return value;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return "Nenhum";
    return `${value.length} item${value.length > 1 ? "ns" : ""}`;
  }
  return String(value);
}

/** Mapa de field_key → campos do currículo que a regra pode usar */
const FIELD_RELATED_KEYS: Record<string, string[]> = {
  mestrado_status: ["mestrado_status", "doutorado_status"],
  doutorado_status: ["mestrado_status", "doutorado_status"],
  ic_com_bolsa: ["ic_com_bolsa", "ic_sem_bolsa"],
  publicacoes: ["publicacoes"],
  internato_hospital_ensino: ["internato_hospital_ensino"],
  media_geral: ["media_geral"],
  ingles_fluente: ["ingles_fluente"],
  monitoria_semestres: ["monitoria_semestres"],
  extensao_semestres: ["extensao_semestres"],
  estagio_extracurricular_horas: ["estagio_extracurricular_horas"],
  voluntariado_horas: ["voluntariado_horas"],
  cursos_suporte: ["cursos_suporte"],
  apresentacao_congresso: ["apresentacao_congresso"],
  ouvinte_congresso: ["ouvinte_congresso"],
  organizador_evento: ["organizador_evento"],
  diretoria_ligas: ["diretoria_ligas", "membro_liga_anos"],
  membro_liga_anos: ["diretoria_ligas", "membro_liga_anos"],
  centro_academico_semestres: ["centro_academico_semestres", "atletica_semestres", "equipe_esportiva_semestres"],
  ranking_ruf_top35: ["ranking_ruf_top35"],
  nivel_assistencial: ["nivel_assistencial"],
  ic_horas_totais: ["ic_horas_totais"],
  capitulos_livro: ["capitulos_livro"],
  projeto_rondon: ["projeto_rondon"],
  trabalho_sus_meses: ["trabalho_sus_meses"],
  residencia_medica_concluida: ["residencia_medica_concluida"],
  outro_curso_universitario: ["outro_curso_universitario"],
  representante_turma_anos: ["representante_turma_anos"],
  teste_progresso: ["teste_progresso"],
  premios_academicos: ["premios_academicos"],
  cursinhos_preparatorios: ["cursinhos_preparatorios"],
  cursos_temas_medicos: ["cursos_temas_medicos"],
  prova_proficiencia_medicina: ["prova_proficiencia_medicina"],
  colegiado_institucional_semestres: ["colegiado_institucional_semestres"],
  atletica_semestres: ["atletica_semestres"],
  equipe_esportiva_semestres: ["equipe_esportiva_semestres"],
};

/** Labels amigáveis para field_keys */
const FIELD_LABELS: Record<string, string> = {
  mestrado_status: "Mestrado",
  doutorado_status: "Doutorado",
  ic_com_bolsa: "IC com bolsa",
  ic_sem_bolsa: "IC sem bolsa",
  ic_horas_totais: "Horas de IC",
  publicacoes: "Publicações",
  internato_hospital_ensino: "Hospital de ensino",
  media_geral: "Média geral",
  ingles_fluente: "Proficiência língua",
  monitoria_semestres: "Monitoria (semestres)",
  extensao_semestres: "Extensão (semestres)",
  estagio_extracurricular_horas: "Estágio extracurricular (horas)",
  voluntariado_horas: "Voluntariado (horas)",
  cursos_suporte: "Cursos suporte vida",
  apresentacao_congresso: "Apresentações congresso",
  ouvinte_congresso: "Participações congresso",
  organizador_evento: "Eventos organizados",
  diretoria_ligas: "Diretoria de liga",
  membro_liga_anos: "Membro de liga (anos)",
  centro_academico_semestres: "Centro acadêmico",
  atletica_semestres: "Atlética",
  equipe_esportiva_semestres: "Equipe esportiva",
  ranking_ruf_top35: "Faculdade Top 35 RUF",
  nivel_assistencial: "Nível assistencial",
  capitulos_livro: "Capítulos de livro",
  projeto_rondon: "Projeto Rondon",
  trabalho_sus_meses: "Trabalho SUS (meses)",
  residencia_medica_concluida: "Residência médica",
  outro_curso_universitario: "Outro curso universitário",
  representante_turma_anos: "Representante turma",
  teste_progresso: "Testes de progresso",
  premios_academicos: "Prêmios acadêmicos",
  cursinhos_preparatorios: "Cursinhos preparatórios",
  cursos_temas_medicos: "Cursos temas médicos",
  prova_proficiencia_medicina: "Prova proficiência medicina",
  colegiado_institucional_semestres: "Colegiado institucional",
};

function groupByCategory(breakdown: ScoreBreakdown): CategoryGroup[] {
  const groups = new Map<string, BreakdownEntry[]>();

  for (const [key, item] of Object.entries(breakdown)) {
    const cat = item.category || "Outros";
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat)!.push({
      key,
      label: item.label || formatKey(key),
      score: item.score,
      max: item.max,
      delta: item.max - item.score,
      description: item.description,
      percentage: item.max > 0 ? (item.score / item.max) * 100 : 0,
    });
  }

  return Array.from(groups.entries())
    .map(([category, entries]) => {
      entries.sort((a, b) => b.delta - a.delta);
      const totalScore = entries.reduce((s, e) => s + e.score, 0);
      const totalMax = entries.reduce((s, e) => s + e.max, 0);
      return { category, entries, totalScore, totalMax, totalDelta: totalMax - totalScore };
    })
    .sort((a, b) => b.totalDelta - a.totalDelta);
}

/** Verifica se o valor é "preenchido" (contribui com algo) */
function isValueFilled(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  if (typeof value === "string") return value !== "" && value !== "Não" && value !== "Não tenho";
  if (Array.isArray(value)) return value.length > 0;
  return false;
}

function CurriculumSnapshot({
  fieldKey,
  curriculumData,
  palette,
}: {
  fieldKey: string;
  curriculumData: Record<string, unknown>;
  palette: CategoryPalette;
}) {
  const relatedKeys = FIELD_RELATED_KEYS[fieldKey] ?? [fieldKey];
  const items = relatedKeys
    .map((k) => ({
      label: FIELD_LABELS[k] ?? formatKey(k),
      value: formatCurriculumValue(curriculumData[k]),
      filled: isValueFilled(curriculumData[k]),
    }))
    .filter((item) => item.value !== undefined);

  if (items.length === 0) return null;

  return (
    <div className={`mb-3 rounded-lg border-l-4 ${palette.snapshotBorder} ${palette.snapshotBg} px-3 py-2.5`}>
      <p className={`mb-2 text-[10px] font-bold uppercase tracking-widest ${palette.accent} opacity-70`}>
        Seu currículo
      </p>
      <div className="space-y-1.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-xs">
            <span className={`shrink-0 ${item.filled ? "text-emerald-500" : "text-muted-foreground/50"}`}>
              {item.filled ? "●" : "○"}
            </span>
            <span className="text-muted-foreground">{item.label}</span>
            <span className="ml-auto shrink-0 font-semibold">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RuleItem({
  entry,
  curriculumData,
  palette,
}: {
  entry: BreakdownEntry;
  curriculumData?: Record<string, unknown>;
  palette: CategoryPalette;
}) {
  const hasGap = entry.delta > 0;
  const [open, setOpen] = useState(false);
  const ruleItems = parseRuleItems(entry.description);
  const hasStructuredItems = ruleItems.length > 0 && ruleItems.some((r) => r.pts);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      {/* Header da regra — compacto, sem barra */}
      <CollapsibleTrigger className="flex w-full items-center gap-2 text-left">
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium leading-snug">{entry.label}</span>
            <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums ${
              entry.score > 0
                ? `${palette.badge} ${palette.badgeText}`
                : "bg-muted text-muted-foreground"
            }`}>
              {entry.score}/{entry.max}
            </span>
          </div>
          <p className="mt-0.5 text-xs">
            {hasGap ? (
              <span className={`font-medium ${palette.accent}`}>+{entry.delta} possíveis</span>
            ) : (
              <span className="font-medium text-emerald-600">✓ Máximo atingido</span>
            )}
          </p>
        </div>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="mt-3 space-y-2">
          {/* Dados do currículo do aluno */}
          {curriculumData && (
            <CurriculumSnapshot fieldKey={entry.key} curriculumData={curriculumData} palette={palette} />
          )}

          {/* Regras de pontuação */}
          {hasStructuredItems ? (
            <div className="rounded-lg bg-muted/30 px-3 py-2">
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                Como pontuar
              </p>
              <div className="space-y-1">
                {ruleItems.map((item, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-muted-foreground">{item.text}</span>
                    {item.pts && (
                      <span className={`shrink-0 font-semibold tabular-nums ${palette.accent}`}>
                        {item.pts} pts
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-lg bg-muted/30 px-3 py-2">
              <p className="text-xs text-muted-foreground">{entry.description}</p>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function CategoryCard({
  group,
  curriculumData,
}: {
  group: CategoryGroup;
  curriculumData?: Record<string, unknown>;
}) {
  const percentage =
    group.totalMax > 0 ? (group.totalScore / group.totalMax) * 100 : 0;
  const palette = getPalette(group.category);

  return (
    <li>
      <Card className="overflow-hidden">
        {/* Header da categoria — cor por categoria */}
        <div className={`border-b ${palette.headerBorder} ${palette.headerBg} px-5 py-4`}>
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-bold">{group.category}</h3>
            <span className={`rounded-full px-3 py-1 text-sm font-bold tabular-nums ${palette.badge} ${palette.badgeText}`}>
              {group.totalScore}/{group.totalMax}
            </span>
          </div>
          <Progress
            value={percentage}
            className={`mt-3 h-2.5 bg-primary/10 ${palette.progress}`}
            aria-hidden
          />
          {group.totalDelta > 0 && (
            <p className={`mt-2 text-xs font-semibold ${palette.accent}`}>
              +{group.totalDelta} pontos possíveis
            </p>
          )}
          {group.totalDelta === 0 && (
            <p className="mt-2 text-xs font-semibold text-emerald-600">
              ✓ Pontuação máxima atingida
            </p>
          )}
        </div>

        {/* Regras individuais — cada uma como bloco distinto */}
        <div className="space-y-2 p-3">
          {group.entries.map((entry) => (
            <div key={entry.key} className="rounded-lg border bg-background px-3 py-2">
              <RuleItem entry={entry} curriculumData={curriculumData} palette={palette} />
            </div>
          ))}
        </div>
      </Card>
    </li>
  );
}

export function GapAnalysisList({ breakdown, curriculumData }: GapAnalysisListProps) {
  const groups = groupByCategory(breakdown);

  if (groups.length === 0) {
    return (
      <p className="py-4 text-sm text-muted-foreground">
        Nenhuma categoria de pontuação disponível.
      </p>
    );
  }

  return (
    <ul role="list" className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {groups.map((group) => (
        <CategoryCard key={group.category} group={group} curriculumData={curriculumData} />
      ))}
    </ul>
  );
}
