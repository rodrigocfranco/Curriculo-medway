import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, RotateCcw } from "lucide-react";
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
import type {
  ScoringRulesAuditRow,
  InstitutionRow,
} from "@/lib/queries/admin";
import { AuditDiffView } from "./AuditDiffView";

const PAGE_SIZE = 25;

const CHANGE_TYPE_CONFIG = {
  INSERT: { label: "Criação", variant: "default" as const },
  UPDATE: { label: "Edição", variant: "secondary" as const },
  DELETE: { label: "Remoção", variant: "destructive" as const },
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface AuditLogTableProps {
  data: ScoringRulesAuditRow[] | undefined;
  institutions: InstitutionRow[] | undefined;
  adminMap: Map<string, string>;
  isLoading: boolean;
  onRevert: (entry: ScoringRulesAuditRow) => void;
}

function LoadingSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-6" /></TableCell>
          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function AuditLogTable({
  data,
  institutions,
  adminMap,
  isLoading,
  onRevert,
}: AuditLogTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  // P3: Reset page when data changes (e.g. after revert)
  useEffect(() => {
    setPage(0);
  }, [data]);

  const institutionMap = useMemo(
    () =>
      new Map(
        institutions?.map((i) => [i.id, i.short_name || i.name]) ?? [],
      ),
    [institutions],
  );

  const pageData = useMemo(
    () => data?.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [data, page],
  );
  const totalPages = Math.ceil((data?.length ?? 0) / PAGE_SIZE);

  const getInstitutionName = (entry: ScoringRulesAuditRow): string => {
    const instId =
      (entry.new_values?.institution_id as string) ??
      (entry.old_values?.institution_id as string);
    return instId ? (institutionMap.get(instId) ?? "—") : "—";
  };

  const getRuleLabel = (entry: ScoringRulesAuditRow): string => {
    const vals = entry.new_values ?? entry.old_values;
    if (!vals) return "—";
    const category = vals.category as string | undefined;
    const fieldKey = vals.field_key as string | undefined;
    return [category, fieldKey].filter(Boolean).join(" / ") || "—";
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead scope="col" className="w-10" />
            <TableHead scope="col">Data/hora</TableHead>
            <TableHead scope="col">Instituição</TableHead>
            <TableHead scope="col">Regra</TableHead>
            <TableHead scope="col">Tipo</TableHead>
            <TableHead scope="col">Admin</TableHead>
            <TableHead scope="col" className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && <LoadingSkeleton />}

          {!isLoading && (!data || data.length === 0) && (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center text-muted-foreground py-8"
              >
                Nenhuma alteração registrada ainda.
              </TableCell>
            </TableRow>
          )}

          {!isLoading &&
            pageData?.flatMap((entry) => {
              const isExpanded = expandedId === entry.id;
              const config = CHANGE_TYPE_CONFIG[entry.change_type];
              const adminName = entry.changed_by
                ? (adminMap.get(entry.changed_by) ?? "Admin removido")
                : "Sistema";

              const rows = [
                <TableRow key={entry.id} className="group">
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => toggleExpand(entry.id)}
                      aria-expanded={isExpanded}
                      aria-label={isExpanded ? "Recolher detalhes" : "Expandir detalhes"}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDateTime(entry.changed_at)}
                  </TableCell>
                  <TableCell>{getInstitutionName(entry)}</TableCell>
                  <TableCell>{getRuleLabel(entry)}</TableCell>
                  <TableCell>
                    <Badge variant={config.variant}>{config.label}</Badge>
                  </TableCell>
                  <TableCell>{adminName}</TableCell>
                  <TableCell className="text-right">
                    {entry.change_type !== "INSERT" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => onRevert(entry)}
                      >
                        <RotateCcw className="mr-1 h-3 w-3" />
                        Reverter
                      </Button>
                    )}
                  </TableCell>
                </TableRow>,
              ];

              if (isExpanded) {
                rows.push(
                  <TableRow key={`${entry.id}-detail`}>
                    <TableCell colSpan={7} className="bg-muted/50 px-8 py-4">
                      <AuditDiffView entry={entry} institutionMap={institutionMap} />
                    </TableCell>
                  </TableRow>,
                );
              }

              return rows;
            })}
        </TableBody>
      </Table>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav
          className="flex items-center justify-between px-2 py-3"
          aria-label="Navegação de páginas"
        >
          <span className="text-sm text-muted-foreground">
            Página {page + 1} de {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima
            </Button>
          </div>
        </nav>
      )}
    </div>
  );
}
