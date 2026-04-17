import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { BRAZIL_STATES } from "@/lib/brazil-states";
import {
  institutionFormSchema,
  type InstitutionFormValues,
} from "@/lib/schemas/admin";
import {
  useCreateInstitution,
  useUpdateInstitution,
  uploadEditalPdf,
  deleteEditalPdf,
  type InstitutionRow,
} from "@/lib/queries/admin";

interface InstitutionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  institution?: InstitutionRow | null;
}

type EditalMode = "link" | "upload";

export function InstitutionFormDialog({
  open,
  onOpenChange,
  institution,
}: InstitutionFormDialogProps) {
  const isEditing = !!institution;
  const createMutation = useCreateInstitution();
  const updateMutation = useUpdateInstitution();
  const mutation = isEditing ? updateMutation : createMutation;

  const [editalMode, setEditalMode] = useState<EditalMode>("link");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<InstitutionFormValues>({
    resolver: zodResolver(institutionFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      name: "",
      short_name: "",
      state: "",
      edital_url: "",
    },
  });

  // Reset form when dialog opens/closes or institution changes
  useEffect(() => {
    if (open) {
      if (institution) {
        form.reset({
          name: institution.name,
          short_name: institution.short_name ?? "",
          state: institution.state ?? "",
          edital_url: institution.edital_url ?? "",
        });
        setEditalMode(institution.pdf_path ? "upload" : "link");
      } else {
        form.reset({
          name: "",
          short_name: "",
          state: "",
          edital_url: "",
        });
        setEditalMode("link");
      }
      setSelectedFile(null);
      setUploading(false);
      setUploadProgress(0);
    }
  }, [open, institution, form]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Apenas arquivos PDF são aceitos.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo excede o limite de 10 MB.");
      return;
    }
    setSelectedFile(file);
  };

  const onSubmit = async (values: InstitutionFormValues) => {
    if (mutation.isPending || uploading) return;

    try {
      let pdfPath: string | null | undefined;
      let oldPdfToDelete: string | null = null;
      let generatedId: string | undefined;

      // Handle PDF upload
      if (editalMode === "upload" && selectedFile) {
        setUploading(true);
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => Math.min(prev + 15, 90));
        }, 200);

        try {
          const targetId = isEditing ? institution.id : crypto.randomUUID();
          if (!isEditing) generatedId = targetId;

          pdfPath = await uploadEditalPdf(targetId, selectedFile);
          clearInterval(progressInterval);
          setUploadProgress(100);

          // Schedule old PDF for cleanup after successful mutation
          if (isEditing && institution.pdf_path) {
            oldPdfToDelete = institution.pdf_path;
          }
        } catch (err) {
          clearInterval(progressInterval);
          setUploading(false);
          setUploadProgress(0);
          toast.error(
            err instanceof Error
              ? err.message
              : "Erro ao fazer upload do PDF.",
          );
          return;
        }
        setUploading(false);
      } else if (editalMode === "link") {
        if (isEditing && institution.pdf_path) {
          oldPdfToDelete = institution.pdf_path;
        }
        pdfPath = null;
      }

      if (isEditing) {
        await updateMutation.mutateAsync({
          id: institution.id,
          ...values,
          edital_url: editalMode === "link" ? (values.edital_url || null) : null,
          pdf_path: pdfPath,
        });
        toast.success("Instituição atualizada.");
      } else {
        await createMutation.mutateAsync({
          ...(generatedId && { id: generatedId }),
          ...values,
          edital_url: editalMode === "link" ? (values.edital_url || null) : null,
          pdf_path: pdfPath,
        });
        toast.success("Instituição criada.");
      }

      // Best-effort: delete old PDF only after successful mutation
      if (oldPdfToDelete) {
        deleteEditalPdf(oldPdfToDelete).catch(() => {});
      }

      onOpenChange(false);
    } catch {
      toast.error("Erro ao salvar instituição. Tente novamente.");
    }
  };

  const isPending = mutation.isPending || uploading;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && isPending) return; onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar instituição" : "Nova instituição"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Altere os dados da instituição."
              : "Preencha os dados da nova instituição."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: UNICAMP" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="short_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sigla</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: UNICAMP" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {BRAZIL_STATES.map((s) => (
                        <SelectItem key={s.code} value={s.code}>
                          {s.code} — {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Edital section */}
            <div className="space-y-3">
              <p className="text-sm font-medium">Edital</p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={editalMode === "link" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEditalMode("link")}
                >
                  Link externo
                </Button>
                <Button
                  type="button"
                  variant={editalMode === "upload" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEditalMode("upload")}
                >
                  Upload PDF
                </Button>
              </div>

              {editalMode === "link" && (
                <FormField
                  control={form.control}
                  name="edital_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="url"
                          placeholder="https://exemplo.com/edital.pdf"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {editalMode === "upload" && (
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isPending}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Escolher arquivo
                  </Button>

                  {selectedFile && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="truncate max-w-[200px]">
                        {selectedFile.name}
                      </span>
                      <span className="text-xs">
                        ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="text-destructive hover:text-destructive/80"
                        aria-label="Remover arquivo"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {!selectedFile && isEditing && institution.pdf_path && (
                    <p className="text-xs text-muted-foreground">
                      PDF atual anexado. Selecione um novo arquivo para substituí-lo.
                    </p>
                  )}

                  {uploading && (
                    <Progress value={uploadProgress} className="h-2" />
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEditing ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
