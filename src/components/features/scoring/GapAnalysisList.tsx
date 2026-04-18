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

/** Parseia "item (Xpts) | item (Ypts)" em lista estruturada */
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
      return {
        category,
        entries,
        totalScore,
        totalMax,
        totalDelta: totalMax - totalScore,
      };
    })
    .sort((a, b) => b.totalDelta - a.totalDelta);
}

function RuleItem({ entry }: { entry: BreakdownEntry }) {
  const hasGap = entry.delta > 0;
  const [open, setOpen] = useState(hasGap);
  const ruleItems = parseRuleItems(entry.description);
  const hasStructuredItems = ruleItems.length > 0 && ruleItems.some((r) => r.pts);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="flex items-center justify-between gap-2 py-1.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm">{entry.label}</span>
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
              {entry.score}/{entry.max}
            </span>
          </div>
          <Progress
            value={entry.percentage}
            className="mt-1 h-1 bg-primary/20 [&>div]:bg-accent"
            aria-hidden
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        {hasGap ? (
          <span className="text-xs text-accent">+{entry.delta} possíveis</span>
        ) : (
          <span className="text-xs text-emerald-600">✓ Máximo</span>
        )}
        {entry.description && (
          <CollapsibleTrigger className="inline-flex min-h-[44px] items-center gap-0.5 text-xs text-accent hover:underline">
            {open ? "Ocultar" : "Como pontuar"}
            <ChevronDown
              className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
            />
          </CollapsibleTrigger>
        )}
      </div>

      <CollapsibleContent>
        {hasStructuredItems ? (
          <ul className="mb-2 space-y-1 rounded bg-muted/50 p-3">
            {ruleItems.map((item, i) => (
              <li key={i} className="flex items-center justify-between gap-2 text-xs">
                <span className="text-muted-foreground">{item.text}</span>
                {item.pts && (
                  <span className="shrink-0 font-medium tabular-nums text-accent">
                    {item.pts} pts
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mb-2 rounded bg-muted/50 p-2 text-xs text-muted-foreground">
            {entry.description}
          </p>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

function CategoryCard({ group }: { group: CategoryGroup }) {
  const percentage =
    group.totalMax > 0 ? (group.totalScore / group.totalMax) * 100 : 0;

  return (
    <li>
      <Card className="p-4">
        {/* Nível 1: Categoria */}
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">{group.category}</h3>
          <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
            {group.totalScore}/{group.totalMax} pontos
          </span>
        </div>
        <Progress
          value={percentage}
          className="mt-2 h-2 bg-primary/20 [&>div]:bg-accent"
          aria-hidden
        />
        {group.totalDelta > 0 && (
          <p className="mt-1 text-xs font-medium text-accent">
            +{group.totalDelta} possíveis
          </p>
        )}

        {/* Nível 2+3: Campos e regras */}
        <div className="mt-3 divide-y pl-2">
          {group.entries.map((entry) => (
            <RuleItem key={entry.key} entry={entry} />
          ))}
        </div>
      </Card>
    </li>
  );
}

export function GapAnalysisList({ breakdown }: GapAnalysisListProps) {
  const groups = groupByCategory(breakdown);

  if (groups.length === 0) {
    return (
      <p className="py-4 text-sm text-muted-foreground">
        Nenhuma categoria de pontuação disponível.
      </p>
    );
  }

  return (
    <ul role="list" className="space-y-3">
      {groups.map((group) => (
        <CategoryCard key={group.category} group={group} />
      ))}
    </ul>
  );
}
