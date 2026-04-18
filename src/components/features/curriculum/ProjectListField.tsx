import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ICProject } from "@/lib/schemas/curriculum";

interface ProjectListFieldProps {
  value: ICProject[];
  onChange: (projects: ICProject[]) => void;
  onBlur: () => void;
  options: { bolsa: string[]; extras: string[] };
}

export function ProjectListField({
  value,
  onChange,
  onBlur,
  options,
}: ProjectListFieldProps) {
  const projects = value ?? [];

  const addProject = () => {
    onChange([...projects, { bolsa: "", semestres: 0, publicacao: false }]);
  };

  const removeProject = (index: number) => {
    onChange(projects.filter((_, i) => i !== index));
    onBlur();
  };

  const updateProject = (index: number, field: string, val: unknown) => {
    const updated = projects.map((p, i) =>
      i === index ? { ...p, [field]: val } : p,
    );
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      {projects.length === 0 && (
        <p className="py-2 text-sm text-muted-foreground">
          Nenhum projeto adicionado.
        </p>
      )}

      {projects.map((project, index) => (
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
              onClick={() => removeProject(index)}
              aria-label={`Remover projeto ${index + 1}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Bolsa</label>
              <Select
                value={project.bolsa}
                onValueChange={(val) => { updateProject(index, "bolsa", val); onBlur(); }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {options.bolsa.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Semestres</label>
              <Input
                type="number"
                min={0}
                className="h-9"
                placeholder="Ex: 2"
                value={project.semestres || ""}
                onChange={(e) =>
                  updateProject(index, "semestres", e.target.value === "" ? 0 : parseInt(e.target.value))
                }
                onBlur={onBlur}
              />
            </div>
          </div>

          <div className="mt-2">
            <label className="flex items-center gap-1.5 text-xs">
              <Checkbox
                checked={project.publicacao}
                onCheckedChange={(v) => { updateProject(index, "publicacao", !!v); onBlur(); }}
              />
              Publicação aceita/submetida
            </label>
          </div>
        </Card>
      ))}

      <Button type="button" variant="outline" size="sm" className="w-full" onClick={addProject}>
        <Plus className="mr-1 h-4 w-4" />
        Adicionar projeto
      </Button>
    </div>
  );
}
