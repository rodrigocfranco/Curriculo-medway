import { useState, useCallback, useMemo } from "react";
import type { SortingState, PaginationState } from "@tanstack/react-table";
import { toast } from "sonner";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useLeadFilters } from "@/hooks/use-lead-filters";
import { useLeads } from "@/lib/queries/leads";
import type { LeadsFilterValues } from "@/lib/schemas/leads";
import LeadMetricsCards from "@/components/features/admin/LeadMetricsCards";
import LeadFilters from "@/components/features/admin/LeadFilters";
import LeadTable from "@/components/features/admin/LeadTable";
import LeadDetailDrawer from "@/components/features/admin/LeadDetailDrawer";

const PAGE_SIZE = 50;

async function exportLeads(format: "csv" | "hubspot", filters: LeadsFilterValues) {
  const { data, error } = await supabase.functions.invoke("export-leads", {
    body: { filters, format },
  });
  if (error) throw error;
  return data;
}

export default function Leads() {
  const filterState = useLeadFilters();
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [exporting, setExporting] = useState<"csv" | "hubspot" | null>(null);

  const handleExport = useCallback(
    async (format: "csv" | "hubspot") => {
      setExporting(format);
      try {
        const result = await exportLeads(format, filterState.filters);

        // JSON response (0 leads) — show informative toast
        if (result && typeof result === "object" && !(result instanceof Blob) && result.count === 0) {
          toast.info("Nenhum lead encontrado com os filtros atuais");
          return;
        }

        // Normalize to string to count leads
        let csvText: string;
        if (result instanceof Blob) {
          csvText = await result.text();
        } else if (typeof result === "string") {
          csvText = result;
        } else if (result instanceof ArrayBuffer) {
          csvText = new TextDecoder().decode(result);
        } else {
          toast.error("Resposta inesperada do servidor.");
          return;
        }

        const leadCount = csvText.split("\n").filter((l) => l.length > 0).length - 1;

        const blob = new Blob([csvText], { type: "text/csv;charset=utf-8" });
        const filename = `leads-${format === "hubspot" ? "hubspot-" : ""}${new Date().toISOString().slice(0, 10)}.csv`;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        // Delay cleanup for Safari compatibility
        setTimeout(() => {
          a.remove();
          URL.revokeObjectURL(url);
        }, 100);
        toast.success(`CSV exportado com ${leadCount} leads`);
      } catch {
        toast.error("Erro ao exportar leads. Tente novamente.");
      } finally {
        setExporting(null);
      }
    },
    [filterState.filters],
  );

  // Pagination synced with URL via useLeadFilters
  const pagination: PaginationState = useMemo(
    () => ({ pageIndex: filterState.page, pageSize: PAGE_SIZE }),
    [filterState.page],
  );
  const { setPage } = filterState;
  const onPaginationChange = useCallback(
    (updater: PaginationState | ((prev: PaginationState) => PaginationState)) => {
      const next = typeof updater === "function" ? updater(pagination) : updater;
      setPage(next.pageIndex);
    },
    [pagination, setPage],
  );

  const [sorting, setSorting] = useState<SortingState>([
    { id: "created_at", desc: true },
  ]);

  const { data, isLoading } = useLeads(
    filterState.filters,
    pagination.pageIndex,
    pagination.pageSize,
    sorting,
  );

  const handleRowClick = useCallback((leadId: string) => {
    setSelectedLeadId(leadId);
  }, []);

  const handleDrawerClose = useCallback(() => {
    const id = selectedLeadId;
    setSelectedLeadId(null);
    // Retornar foco à linha clicada (AC4 — acessibilidade)
    if (id) {
      requestAnimationFrame(() => {
        const row = document.querySelector<HTMLElement>(
          `tr[data-lead-id="${CSS.escape(id)}"]`,
        );
        row?.focus();
      });
    }
  }, [selectedLeadId]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold tracking-tight text-navy-900">Leads</h1>

      <LeadMetricsCards />

      <LeadFilters {...filterState} />

      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => handleExport("csv")} disabled={!!exporting}>
          {exporting === "csv" ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Exportando...</>
          ) : (
            <><Download className="mr-2 h-4 w-4" /> Exportar CSV</>
          )}
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleExport("hubspot")} disabled={!!exporting}>
          {exporting === "hubspot" ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Exportando...</>
          ) : (
            <><Download className="mr-2 h-4 w-4" /> Exportar para Hubspot</>
          )}
        </Button>
      </div>

      <LeadTable
        data={data?.data ?? []}
        totalCount={data?.totalCount ?? 0}
        pagination={pagination}
        sorting={sorting}
        onPaginationChange={onPaginationChange}
        onSortingChange={setSorting}
        isLoading={isLoading}
        onRowClick={handleRowClick}
      />

      <LeadDetailDrawer leadId={selectedLeadId} onClose={handleDrawerClose} />
    </div>
  );
}
