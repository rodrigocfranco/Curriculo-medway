import { InstitutionScore } from "@/lib/types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Props {
  result: InstitutionScore;
}

export default function InstitutionCard({ result }: Props) {
  const pct = result.base > 0 ? (result.score / result.base) * 100 : 0;
  const isDecimal = result.base <= 10;
  const display = isDecimal ? result.score.toFixed(1) : Math.round(result.score);
  const maxDisplay = isDecimal ? result.base.toFixed(1) : result.base;
  const fmt = (v: number, max: number) => max < 10 ? v.toFixed(1) : String(Math.round(v));

  return (
    <div className="score-card">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-bold text-base text-foreground">{result.name}</h3>
        <span className="mono-score text-2xl text-primary font-bold">
          {display}<span className="text-sm text-muted-foreground font-normal">/{maxDisplay}</span>
        </span>
      </div>

      <div className="score-bar-track mb-1">
        <div
          className="score-bar-fill"
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground mb-2 text-right mono-score">{pct.toFixed(0)}%</p>

      {result.breakdown.length > 0 && (
        <Accordion type="single" collapsible>
          <AccordionItem value="details" className="border-t border-border">
            <AccordionTrigger className="py-2 text-xs text-muted-foreground hover:no-underline">
              Ver detalhes por categoria
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-1.5 pt-1">
                {result.breakdown.map((b) => {
                  const bPct = b.max > 0 ? (b.score / b.max) * 100 : 0;
                  return (
                    <div key={b.label} className="flex items-center gap-2 text-xs">
                      <span className="w-24 truncate text-muted-foreground">{b.label}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-muted/30">
                        <div
                          className="h-1.5 rounded-full bg-primary/70 transition-all"
                          style={{ width: `${Math.min(bPct, 100)}%` }}
                        />
                      </div>
                      <span className="mono-score w-16 text-right text-foreground">
                        {fmt(b.score, b.max)}/{fmt(b.max, b.max)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );
}
