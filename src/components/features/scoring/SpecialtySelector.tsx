import { useCallback, useRef } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/useAuth";
import { useSpecialties, useUpdateSpecialty } from "@/lib/queries/scoring";

const ALL_SPECIALTIES_VALUE = "__all__";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function SpecialtySelector() {
  const { user, profile } = useAuth();
  const userId = user?.id ?? "";
  const { data: specialties, isLoading } = useSpecialties();
  const updateSpecialty = useUpdateSpecialty(userId);
  const liveRegionRef = useRef<HTMLDivElement>(null);

  const rawSpecialty = profile?.specialty_interest;
  const currentValue =
    rawSpecialty && UUID_RE.test(rawSpecialty) ? rawSpecialty : ALL_SPECIALTIES_VALUE;

  const handleChange = useCallback(
    (value: string) => {
      const newSpecialtyId = value === ALL_SPECIALTIES_VALUE ? null : value;

      const selectedName =
        value === ALL_SPECIALTIES_VALUE
          ? "Todas as especialidades"
          : specialties?.find((s) => s.id === value)?.name ?? "";

      updateSpecialty.mutate(newSpecialtyId, {
        onError: () => {
          toast.error("Não foi possível trocar a especialidade. Tente novamente.");
        },
        onSuccess: () => {
          if (liveRegionRef.current) {
            // Clear then set to ensure screen readers re-announce
            liveRegionRef.current.textContent = "";
            requestAnimationFrame(() => {
              if (liveRegionRef.current) {
                liveRegionRef.current.textContent = `Scores atualizados para ${selectedName}`;
              }
            });
          }
        },
      });
    },
    [updateSpecialty, specialties],
  );

  if (isLoading || !specialties) return null;

  return (
    <>
      <Select value={currentValue} onValueChange={handleChange}>
        <SelectTrigger
          className="h-8 w-auto max-w-[200px] border-none bg-transparent text-sm font-medium shadow-none focus:ring-0 md:max-w-[260px]"
          aria-label="Selecionar especialidade"
        >
          <SelectValue placeholder="Todas as especialidades">
            <span className="max-w-[120px] truncate md:max-w-[200px]">
              {currentValue === ALL_SPECIALTIES_VALUE
                ? "Todas as especialidades"
                : specialties.find((s) => s.id === currentValue)?.name ?? "Todas as especialidades"}
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_SPECIALTIES_VALUE}>
            Todas as especialidades
          </SelectItem>
          {specialties.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div
        ref={liveRegionRef}
        aria-live="polite"
        className="sr-only"
        role="status"
      />
    </>
  );
}
