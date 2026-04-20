import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { IcProjeto } from "@/lib/schemas/curriculum";

interface IcProjectListFieldProps {
  value: IcProjeto[];
  onChange: (items: IcProjeto[]) => void;
  onBlur: () => void;
  options: { tipo: string[] };
}

export function IcProjectListField({
  value,
  onChange,
  onBlur,
  options,
}: IcProjectListFieldProps) {
  const items = value ?? [];
  const tipoOptions = options?.tipo ?? ["Com bolsa", "Sem bolsa"];

  const addItem = () => {
    onChange([...items, { tipo: "", semestres: 0 }]);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
    onBlur();
  };

  const updateItem = (index: number, field: keyof IcProjeto, val: string | number) => {
    const updated = items.map((item, i) =>
      i === index ? { ...item, [field]: val } : item,
    );
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <p className="py-2 text-sm text-muted-foreground">
          Nenhum projeto adicionado.
        </p>
      )}

      {items.map((item, index) => (
        <Card key={index} className="p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Projeto {index + 1}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              onClick={() => removeItem(index)}
              aria-label={`Remover projeto ${index + 1}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">
                Tipo
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
                Semestres
              </label>
              <Input
                type="number"
                min={1}
                className="h-9"
                placeholder="Ex: 2"
                value={item.semestres || ""}
                onChange={(e) =>
                  updateItem(index, "semestres", e.target.value === "" ? 0 : parseInt(e.target.value))
                }
                onBlur={onBlur}
              />
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
        Adicionar projeto
      </Button>
    </div>
  );
}
