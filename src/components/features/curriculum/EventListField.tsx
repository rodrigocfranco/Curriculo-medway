import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Apresentacao } from "@/lib/schemas/curriculum";

interface EventListFieldProps {
  value: Apresentacao[];
  onChange: (items: Apresentacao[]) => void;
  onBlur: () => void;
  options: { tipo: string[]; nivel: string[] };
}

export function EventListField({
  value,
  onChange,
  onBlur,
  options,
}: EventListFieldProps) {
  const items = value ?? [];
  const tipoOptions = options?.tipo ?? [];
  const nivelOptions = options?.nivel ?? [];

  const addItem = () => {
    onChange([...items, { tipo: "", nivel: "" }]);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
    onBlur();
  };

  const updateItem = (index: number, field: keyof Apresentacao, val: string) => {
    const updated = items.map((item, i) =>
      i === index ? { ...item, [field]: val } : item,
    );
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <p className="py-2 text-sm text-muted-foreground">
          Nenhum trabalho adicionado.
        </p>
      )}

      {items.map((item, index) => (
        <Card key={index} className="p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Trabalho {index + 1}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              onClick={() => removeItem(index)}
              aria-label={`Remover trabalho ${index + 1}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">
                Tipo de apresentação
              </label>
              <Select
                value={item.tipo}
                onValueChange={(val) => { updateItem(index, "tipo", val); onBlur(); }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {tipoOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-muted-foreground">
                Nível do evento
              </label>
              <Select
                value={item.nivel}
                onValueChange={(val) => { updateItem(index, "nivel", val); onBlur(); }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {nivelOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        onClick={addItem}
      >
        <Plus className="mr-1 h-4 w-4" />
        Adicionar trabalho
      </Button>
    </div>
  );
}
