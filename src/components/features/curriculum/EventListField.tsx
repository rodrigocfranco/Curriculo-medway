import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CongressEvent } from "@/lib/schemas/curriculum";

interface EventListFieldProps {
  value: CongressEvent[];
  onChange: (events: CongressEvent[]) => void;
  onBlur: () => void;
  options: { tipo: string[]; nivel: string[]; extras: string[] };
}

export function EventListField({
  value,
  onChange,
  onBlur,
  options,
}: EventListFieldProps) {
  const events = value ?? [];

  const addEvent = () => {
    onChange([...events, { tipo: "", nivel: "", premio: false, primeiro_autor: false }]);
  };

  const removeEvent = (index: number) => {
    onChange(events.filter((_, i) => i !== index));
    onBlur();
  };

  const updateEvent = (index: number, field: string, val: unknown) => {
    const updated = events.map((e, i) =>
      i === index ? { ...e, [field]: val } : e,
    );
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      {events.length === 0 && (
        <p className="py-2 text-sm text-muted-foreground">
          Nenhuma atividade adicionada.
        </p>
      )}

      {events.map((event, index) => (
        <Card key={index} className="p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Atividade {index + 1}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              onClick={() => removeEvent(index)}
              aria-label={`Remover atividade ${index + 1}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Tipo</label>
              <Select
                value={event.tipo}
                onValueChange={(val) => { updateEvent(index, "tipo", val); onBlur(); }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {options.tipo.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Nível</label>
              <Select
                value={event.nivel}
                onValueChange={(val) => { updateEvent(index, "nivel", val); onBlur(); }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {options.nivel.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-2 flex gap-4">
            <label className="flex items-center gap-1.5 text-xs">
              <Checkbox
                checked={event.premio}
                onCheckedChange={(v) => { updateEvent(index, "premio", !!v); onBlur(); }}
              />
              Prêmio
            </label>
            <label className="flex items-center gap-1.5 text-xs">
              <Checkbox
                checked={event.primeiro_autor}
                onCheckedChange={(v) => { updateEvent(index, "primeiro_autor", !!v); onBlur(); }}
              />
              1º autor
            </label>
          </div>
        </Card>
      ))}

      <Button type="button" variant="outline" size="sm" className="w-full" onClick={addEvent}>
        <Plus className="mr-1 h-4 w-4" />
        Adicionar atividade
      </Button>
    </div>
  );
}
