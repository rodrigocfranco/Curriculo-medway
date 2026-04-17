import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BRAZIL_STATES } from "@/lib/brazil-states";
import { SPECIALTIES } from "@/lib/specialties";
import type { useLeadFilters } from "@/hooks/use-lead-filters";

const ALL = "__all__";

type LeadFiltersProps = ReturnType<typeof useLeadFilters>;

export default function LeadFilters({
  filters,
  setFilter,
  clearFilters,
  hasFilters,
  activeFilters,
  dateRangeInvalid,
}: LeadFiltersProps) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-end gap-2">
        {/* Período - De */}
        <div className="space-y-1">
          <label htmlFor="filter-from" className="text-xs text-muted-foreground">
            De
          </label>
          <input
            id="filter-from"
            type="date"
            value={filters.from ?? ""}
            onChange={(e) => setFilter("from", e.target.value || undefined)}
            className="h-9 rounded-md border border-neutral-200 bg-background px-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
          />
        </div>

        {/* Período - Até */}
        <div className="space-y-1">
          <label htmlFor="filter-to" className="text-xs text-muted-foreground">
            Até
          </label>
          <input
            id="filter-to"
            type="date"
            value={filters.to ?? ""}
            onChange={(e) => setFilter("to", e.target.value || undefined)}
            className="h-9 rounded-md border border-neutral-200 bg-background px-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
          />
        </div>

        {/* Estado */}
        <Select
          value={filters.state ?? ALL}
          onValueChange={(v) => setFilter("state", v === ALL ? undefined : v)}
        >
          <SelectTrigger className="h-9 w-[140px] border-neutral-200 text-sm focus:ring-2 focus:ring-teal-500 focus:ring-offset-2">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos</SelectItem>
            {BRAZIL_STATES.map((s) => (
              <SelectItem key={s.code} value={s.code}>
                {s.code} — {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Especialidade */}
        <Select
          value={filters.specialty ?? ALL}
          onValueChange={(v) => setFilter("specialty", v === ALL ? undefined : v)}
        >
          <SelectTrigger className="h-9 w-[180px] border-neutral-200 text-sm focus:ring-2 focus:ring-teal-500 focus:ring-offset-2">
            <SelectValue placeholder="Especialidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas</SelectItem>
            {SPECIALTIES.map((sp) => (
              <SelectItem key={sp} value={sp}>
                {sp}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status Currículo */}
        <Select
          value={filters.curriculum ?? ALL}
          onValueChange={(v) => setFilter("curriculum", v === ALL ? undefined : v)}
        >
          <SelectTrigger className="h-9 w-[160px] border-neutral-200 text-sm focus:ring-2 focus:ring-teal-500 focus:ring-offset-2">
            <SelectValue placeholder="Currículo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos</SelectItem>
            <SelectItem value="filled">Preenchido</SelectItem>
            <SelectItem value="empty">Só cadastro</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-9 text-xs text-muted-foreground hover:text-foreground"
          >
            Limpar filtros
          </Button>
        )}
      </div>

      {/* Aviso de range invertido */}
      {dateRangeInvalid && (
        <p className="text-xs text-amber-600">
          A data "De" é posterior a "Até" — o intervalo está invertido.
        </p>
      )}

      {/* Chips de filtros ativos */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {activeFilters.map((f) => (
            <Badge
              key={f.key}
              variant="outline"
              className="gap-1 border-neutral-200 pr-1 text-xs"
            >
              {f.label}
              <button
                type="button"
                onClick={() => setFilter(f.key, undefined)}
                className="ml-0.5 rounded-sm p-0.5 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
                aria-label={`Remover filtro: ${f.label}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
