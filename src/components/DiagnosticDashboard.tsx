import { useMemo } from "react";
import { InstitutionScore, UserProfile } from "@/lib/types";
import { generateRecommendations } from "@/lib/recommendations";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { TrendingUp, AlertTriangle, CheckCircle2, Info, Trophy } from "lucide-react";

interface Props {
  results: InstitutionScore[];
  data: UserProfile;
}

const BAR_COLORS = [
  "hsl(200, 98%, 39%)",
  "hsl(198, 93%, 50%)",
  "hsl(168, 60%, 38%)",
  "hsl(152, 60%, 42%)",
  "hsl(38, 92%, 50%)",
  "hsl(213, 93%, 55%)",
  "hsl(215, 20%, 55%)",
  "hsl(0, 72%, 50%)",
  "hsl(280, 60%, 50%)",
  "hsl(320, 60%, 50%)",
  "hsl(45, 80%, 50%)",
];

export default function DiagnosticDashboard({ results, data }: Props) {
  const chartData = useMemo(
    () =>
      results
        .map((r) => ({
          name: r.name,
          pct: Math.round((r.score / r.base) * 100),
          score: r.base <= 10 ? r.score.toFixed(1) : Math.round(r.score),
          base: r.base <= 10 ? r.base.toFixed(1) : r.base,
        }))
        .sort((a, b) => b.pct - a.pct),
    [results]
  );

  const recommendations = useMemo(() => generateRecommendations(data, results), [data, results]);

  const topScore = chartData[0];

  const fmt = (val: number, max: number) => (max < 10 ? val.toFixed(1) : String(Math.round(val)));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
          <TrendingUp className="h-4 w-4" />
          Diagnóstico Curricular Completo
        </div>
        <h2 className="text-2xl font-bold text-foreground">Seu Ranking por Instituição</h2>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          Comparativo de aproveitamento do seu currículo nas 11 instituições avaliadas.
        </p>
      </div>

      {/* Top performer badge */}
      {topScore && (
        <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/15">
          <Trophy className="h-6 w-6 text-primary" />
          <p className="text-sm font-medium text-foreground">
            Melhor aproveitamento: <span className="text-primary font-bold">{topScore.name}</span> com{" "}
            <span className="mono-score text-primary">{topScore.pct}%</span> ({topScore.score}/{topScore.base})
          </p>
        </div>
      )}

      {/* Section 1: Bar Chart */}
      <div className="score-card">
        <h3 className="font-bold text-base text-foreground mb-4">Ranking de Desempenho (%)</h3>
        <div className="h-72 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                interval={0}
                angle={-35}
                textAnchor="end"
                height={60}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: number) => [`${value}%`, "Aproveitamento"]}
              />
              <Bar dataKey="pct" radius={[4, 4, 0, 0]} maxBarSize={40}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Section 2: Detailed Breakdown per IES */}
      <div className="space-y-3">
        <h3 className="font-bold text-base text-foreground">Diagnóstico Detalhado por IES</h3>
        <Accordion type="multiple" className="space-y-2">
          {results.map((r) => {
            const pct = Math.round((r.score / r.base) * 100);
            const isDecimal = r.base <= 10;
            const display = isDecimal ? r.score.toFixed(1) : Math.round(r.score);
            const maxDisplay = isDecimal ? r.base.toFixed(1) : r.base;

            return (
              <AccordionItem key={r.name} value={r.name} className="score-card border">
                <AccordionTrigger className="hover:no-underline py-3 px-1">
                  <div className="flex items-center justify-between w-full pr-2">
                    <span className="font-bold text-sm text-foreground">{r.name}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-2 rounded-full bg-muted/30">
                        <div
                          className="h-2 rounded-full bg-primary/70 transition-all"
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <span className="mono-score text-sm text-primary font-bold min-w-[65px] text-right">
                        {display}/{maxDisplay}
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-1">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border/50">
                          <TableHead className="text-xs font-semibold">Item</TableHead>
                          <TableHead className="text-xs font-semibold text-right w-20">Sua Nota</TableHead>
                          <TableHead className="text-xs font-semibold text-right w-20">Teto</TableHead>
                          <TableHead className="text-xs font-semibold hidden sm:table-cell">Regra do Edital</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {r.breakdown.map((b) => {
                          const bPct = b.max > 0 ? (b.score / b.max) * 100 : 0;
                          return (
                            <TableRow key={b.label} className="border-border/30">
                              <TableCell className="text-xs py-2.5 font-medium">{b.label}</TableCell>
                              <TableCell className="text-xs py-2.5 text-right">
                                <span className={`mono-score font-semibold ${bPct >= 80 ? "text-green-600" : bPct >= 40 ? "text-amber-600" : "text-red-500"}`}>
                                  {fmt(b.score, b.max)}
                                </span>
                              </TableCell>
                              <TableCell className="text-xs py-2.5 text-right mono-score text-muted-foreground">
                                {fmt(b.max, b.max)}
                              </TableCell>
                              <TableCell className="text-[11px] py-2.5 text-muted-foreground hidden sm:table-cell">
                                {b.rule || "—"}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>

      {/* Section 3: Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-base text-foreground">Recomendações de Melhoria</h3>
          <div className="space-y-2">
            {recommendations.map((rec, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 p-3.5 rounded-lg border text-sm ${
                  rec.type === "success"
                    ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-950/30 dark:border-green-800 dark:text-green-300"
                    : rec.type === "warning"
                    ? "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300"
                    : "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-300"
                }`}
              >
                {rec.type === "success" && <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />}
                {rec.type === "warning" && <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />}
                {rec.type === "info" && <Info className="h-4 w-4 mt-0.5 shrink-0" />}
                <p className="leading-snug">{rec.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
