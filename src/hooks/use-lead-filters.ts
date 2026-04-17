import { useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import type { LeadsFilterValues } from "@/lib/schemas/leads";

const FILTER_KEYS = ["state", "specialty", "from", "to", "curriculum"] as const;
type FilterKey = (typeof FILTER_KEYS)[number];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function validDate(v: string | null): string | undefined {
  return v && DATE_RE.test(v) ? v : undefined;
}

export function useLeadFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters: LeadsFilterValues = useMemo(
    () => {
      const rawCurriculum = searchParams.get("curriculum");
      return {
        state: searchParams.get("state") ?? undefined,
        specialty: searchParams.get("specialty") ?? undefined,
        from: validDate(searchParams.get("from")),
        to: validDate(searchParams.get("to")),
        curriculum:
          rawCurriculum === "filled" || rawCurriculum === "empty"
            ? rawCurriculum
            : undefined,
      };
    },
    [searchParams],
  );

  // Pagination synced with URL
  const page = useMemo(() => {
    const raw = searchParams.get("page");
    const n = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }, [searchParams]);

  const setPage = useCallback(
    (newPage: number) => {
      setSearchParams(
        (prev) => {
          if (newPage > 0) prev.set("page", String(newPage));
          else prev.delete("page");
          return prev;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setFilter = useCallback(
    (key: FilterKey, value: string | undefined) => {
      setSearchParams(
        (prev) => {
          if (value) prev.set(key, value);
          else prev.delete(key);
          prev.delete("page"); // reset paginação ao filtrar
          return prev;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const clearFilters = useCallback(() => {
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  const hasFilters = FILTER_KEYS.some((k) => searchParams.has(k));

  const activeFilters = useMemo(() => {
    const result: { key: FilterKey; value: string; label: string }[] = [];
    const labelMap: Record<FilterKey, string> = {
      state: "Estado",
      specialty: "Especialidade",
      from: "De",
      to: "Até",
      curriculum: "Currículo",
    };
    const curriculumLabels: Record<string, string> = {
      filled: "Preenchido",
      empty: "Só cadastro",
    };
    for (const key of FILTER_KEYS) {
      const val = searchParams.get(key);
      if (val) {
        const displayValue =
          key === "curriculum" ? (curriculumLabels[val] ?? val) : val;
        result.push({
          key,
          value: val,
          label: `${labelMap[key]}: ${displayValue}`,
        });
      }
    }
    return result;
  }, [searchParams]);

  const dateRangeInvalid =
    filters.from && filters.to ? filters.from > filters.to : false;

  return {
    filters,
    setFilter,
    clearFilters,
    hasFilters,
    activeFilters,
    page,
    setPage,
    dateRangeInvalid,
  };
}
