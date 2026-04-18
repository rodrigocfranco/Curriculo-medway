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
import type { Article } from "@/lib/schemas/curriculum";

interface ArticleListFieldProps {
  value: Article[];
  onChange: (articles: Article[]) => void;
  onBlur: () => void;
  options: { posicao: string[]; veiculo: string[] };
}

export function ArticleListField({
  value,
  onChange,
  onBlur,
  options,
}: ArticleListFieldProps) {
  const articles = value ?? [];
  const posicaoOptions = options?.posicao ?? [];
  const veiculoOptions = options?.veiculo ?? [];

  const addArticle = () => {
    onChange([...articles, { posicao: "", veiculo: "", fi: 0 }]);
  };

  const removeArticle = (index: number) => {
    onChange(articles.filter((_, i) => i !== index));
    onBlur();
  };

  const updateArticle = (index: number, field: keyof Article, val: string | number) => {
    const updated = articles.map((a, i) =>
      i === index ? { ...a, [field]: val } : a,
    );
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      {articles.length === 0 && (
        <p className="py-2 text-sm text-muted-foreground">
          Nenhum artigo adicionado.
        </p>
      )}

      {articles.map((article, index) => (
        <Card key={index} className="p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Artigo {index + 1}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              onClick={() => removeArticle(index)}
              aria-label={`Remover artigo ${index + 1}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">
                Posição
              </label>
              <Select
                value={article.posicao}
                onValueChange={(val) => { updateArticle(index, "posicao", val); onBlur(); }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {posicaoOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-muted-foreground">
                Veículo de publicação
              </label>
              <Select
                value={article.veiculo}
                onValueChange={(val) => { updateArticle(index, "veiculo", val); onBlur(); }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {veiculoOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-2">
            <label className="mb-1 block text-xs text-muted-foreground">
              Fator de Impacto JCR (opcional)
            </label>
            <Input
              type="number"
              min={0}
              step="0.01"
              className="h-9"
              placeholder="Ex: 2.5 (deixe 0 se não souber)"
              value={article.fi || ""}
              onChange={(e) =>
                updateArticle(index, "fi", e.target.value === "" ? 0 : parseFloat(e.target.value))
              }
              onBlur={onBlur}
            />
          </div>
        </Card>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        onClick={addArticle}
      >
        <Plus className="mr-1 h-4 w-4" />
        Adicionar artigo
      </Button>
    </div>
  );
}
