import {
  ExternalLink,
  FileText,
  Pencil,
  Trash2,
} from "lucide-react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { InstitutionRow } from "@/lib/queries/admin";

interface InstitutionTableProps {
  institutions: InstitutionRow[] | undefined;
  ruleCounts: Record<string, number> | undefined;
  isLoading: boolean;
  onEdit: (institution: InstitutionRow) => void;
  onDelete: (institution: InstitutionRow) => void;
}

function LoadingSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell><Skeleton className="h-4 w-8" /></TableCell>
          <TableCell><Skeleton className="h-4 w-8" /></TableCell>
          <TableCell><Skeleton className="h-4 w-10" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function InstitutionTable({
  institutions,
  ruleCounts,
  isLoading,
  onEdit,
  onDelete,
}: InstitutionTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Nome</TableHead>
          <TableHead scope="col">Sigla</TableHead>
          <TableHead scope="col">Estado</TableHead>
          <TableHead scope="col">Edital</TableHead>
          <TableHead scope="col" className="text-center">Regras</TableHead>
          <TableHead scope="col" className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading && <LoadingSkeleton />}

        {!isLoading && institutions?.length === 0 && (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
              Nenhuma instituição cadastrada.
            </TableCell>
          </TableRow>
        )}

        {!isLoading &&
          institutions?.map((inst) => (
            <TableRow key={inst.id}>
              <TableCell className="font-medium">{inst.name}</TableCell>
              <TableCell>{inst.short_name ?? "—"}</TableCell>
              <TableCell>{inst.state ?? "—"}</TableCell>
              <TableCell>
                <EditalIndicator institution={inst} />
              </TableCell>
              <TableCell className="text-center">
                <Badge variant="secondary">
                  {ruleCounts?.[inst.id] ?? 0}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onEdit(inst)}
                        aria-label={`Editar ${inst.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Editar</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => onDelete(inst)}
                        aria-label={`Remover ${inst.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Remover</TooltipContent>
                  </Tooltip>
                </div>
              </TableCell>
            </TableRow>
          ))}
      </TableBody>
    </Table>
  );
}

function EditalIndicator({ institution }: { institution: InstitutionRow }) {
  if (institution.pdf_path) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span className="text-xs">PDF</span>
          </span>
        </TooltipTrigger>
        <TooltipContent>PDF do edital anexado</TooltipContent>
      </Tooltip>
    );
  }
  if (institution.edital_url) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <a
            href={institution.edital_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            <ExternalLink className="h-4 w-4" />
            <span className="text-xs">Link</span>
          </a>
        </TooltipTrigger>
        <TooltipContent>Abrir edital em nova aba</TooltipContent>
      </Tooltip>
    );
  }
  return <span className="text-muted-foreground text-xs">—</span>;
}
