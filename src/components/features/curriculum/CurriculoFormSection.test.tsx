import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Accordion } from "@/components/ui/accordion";
import { CurriculoFormSection } from "./CurriculoFormSection";
import {
  curriculumDataSchema,
  type CurriculumData,
} from "@/lib/schemas/curriculum";
import type { CurriculumFieldRow } from "@/lib/queries/curriculum";

const mockFields: CurriculumFieldRow[] = [
  {
    id: "1",
    field_key: "artigo_1_fi",
    label: "Artigo 1º autor (FI)",
    field_type: "number",
    category: "Pesquisa e Publicações",
    display_order: 1,
    options: null,
    created_at: "",
  },
  {
    id: "2",
    field_key: "projeto_rondon",
    label: "Projeto Rondon",
    field_type: "boolean",
    category: "Representação Estudantil e Voluntariado",
    display_order: 1,
    options: null,
    created_at: "",
  },
  {
    id: "3",
    field_key: "conceito_historico",
    label: "Conceito histórico",
    field_type: "select",
    category: "Qualificações",
    display_order: 1,
    options: ["A", "B", "C"],
    created_at: "",
  },
];

function Wrapper({
  fields,
  onBlur,
  defaultValues,
}: {
  fields: CurriculumFieldRow[];
  onBlur: () => void;
  defaultValues?: Partial<CurriculumData>;
}) {
  const form = useForm<CurriculumData>({
    resolver: zodResolver(curriculumDataSchema),
    defaultValues: curriculumDataSchema.parse(defaultValues ?? {}),
  });

  return (
    <FormProvider {...form}>
      <Accordion type="single" collapsible defaultValue="pesquisa-e-publicacoes">
        <CurriculoFormSection
          category="Pesquisa e Publicações"
          fields={fields}
          form={form}
          onBlur={onBlur}
        />
      </Accordion>
    </FormProvider>
  );
}

describe("CurriculoFormSection", () => {
  it("renderiza título da categoria com contador", () => {
    render(<Wrapper fields={mockFields.slice(0, 1)} onBlur={() => {}} />);
    expect(screen.getByText("Pesquisa e Publicações")).toBeInTheDocument();
    expect(screen.getByText("(0/1 preenchidos)")).toBeInTheDocument();
  });

  it("renderiza campo numérico com label e input", () => {
    render(<Wrapper fields={mockFields.slice(0, 1)} onBlur={() => {}} />);
    expect(screen.getByText("Artigo 1º autor (FI)")).toBeInTheDocument();
    expect(screen.getByRole("spinbutton")).toBeInTheDocument();
  });

  it("renderiza campo boolean como checkbox", () => {
    render(<Wrapper fields={[mockFields[1]]} onBlur={() => {}} />);
    expect(screen.getByText("Projeto Rondon")).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
  });

  it("renderiza campo select com opções", () => {
    render(<Wrapper fields={[mockFields[2]]} onBlur={() => {}} />);
    expect(screen.getByText("Conceito histórico")).toBeInTheDocument();
    expect(
      screen.getByRole("combobox"),
    ).toBeInTheDocument();
  });

  it("chama onBlur quando input numérico perde foco", () => {
    const onBlur = vi.fn();
    render(<Wrapper fields={mockFields.slice(0, 1)} onBlur={onBlur} />);
    const input = screen.getByRole("spinbutton");
    input.focus();
    input.blur();
    expect(onBlur).toHaveBeenCalled();
  });

  it("mostra contador correto quando há campos preenchidos", () => {
    render(
      <Wrapper
        fields={mockFields.slice(0, 1)}
        onBlur={() => {}}
        defaultValues={{ artigo_1_fi: 3 }}
      />,
    );
    expect(screen.getByText("(1/1 preenchidos)")).toBeInTheDocument();
  });
});
