import { InstitutionResult } from "@/lib/types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ChevronDown } from "lucide-react";

interface Props {
  result: InstitutionResult;
}

export default function InstitutionCard({ result }: Props) {
  const pct = result.maxTotal > 0 ? (result.total / result.maxTotal) * 100 : 0;
  const display = result.isDecimal ? result.total.toFixed(1) : Math.round(result.total);
  const maxDisplay = result.isDecimal ? result.maxTotal.toFixed(1) : result.maxTotal;

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
      <p className="text-xs text-muted-foreground mb-3 text-right mono-score">{pct.toFixed(0)}%</p>

      <Accordion type="single" collapsible>
        <AccordionItem value="details" className="border-none">
          <AccordionTrigger className="py-1 text-sm text-muted-foreground hover:no-underline hover:text-foreground">
            Ver detalhes
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 pt-2">
              {result.categories.map((cat) => {
                const catPct = cat.max > 0 ? (cat.score / cat.max) * 100 : 0;
                return (
                  <div key={cat.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">{cat.label}</span>
                      <span className="mono-score text-foreground">
                        {result.isDecimal ? cat.score.toFixed(1) : cat.score}/{result.isDecimal ? cat.max.toFixed(1) : cat.max}
                      </span>
                    </div>
                    <div className="score-bar-track !h-1.5">
                      <div
                        className="score-bar-fill !h-1.5"
                        style={{ width: `${Math.min(catPct, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
