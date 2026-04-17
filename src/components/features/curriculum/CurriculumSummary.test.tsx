import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { CurriculumSummary } from "./CurriculumSummary";
import { curriculumDataSchema } from "@/lib/schemas/curriculum";
import type { CurriculumFieldRow } from "@/lib/queries/curriculum";

const mockFields: Record<string, CurriculumFieldRow[]> = {
  Publicações: [
    {
      id: "1",
      field_key: "artigos_high_impact",
      label: "Artigos alto impacto",
      field_type: "number",
      category: "Publicações",
      display_order: 10,
      options: null,
      created_at: "",
    },
  ],
  "Prática/Social": [
    {
      id: "2",
      field_key: "projeto_rondon",
      label: "Projeto Rondon",
      field_type: "boolean",
      category: "Prática/Social",
      display_order: 40,
      options: null,
      created_at: "",
    },
  ],
  Perfil: [
    {
      id: "3",
      field_key: "conceito_historico",
      label: "Conceito histórico",
      field_type: "select",
      category: "Perfil",
      display_order: 30,
      options: ["A", "B", "C"],
      created_at: "",
    },
  ],
};

describe("CurriculumSummary", () => {
  it("renderiza título de resumo", () => {
    const data = curriculumDataSchema.parse({});
    render(
      <MemoryRouter>
        <CurriculumSummary
          fieldsByCategory={mockFields}
          data={data}
          categoryOrder={["Publicações", "Prática/Social", "Perfil"]}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText("Resumo do currículo")).toBeInTheDocument();
  });

  it("exibe categorias com link Editar", () => {
    const data = curriculumDataSchema.parse({});
    render(
      <MemoryRouter>
        <CurriculumSummary
          fieldsByCategory={mockFields}
          data={data}
          categoryOrder={["Publicações"]}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText("Publicações")).toBeInTheDocument();
    expect(screen.getByText("Editar")).toBeInTheDocument();
  });

  it("exibe '—' para campos numéricos vazios (zero)", () => {
    const data = curriculumDataSchema.parse({ artigos_high_impact: 0 });
    render(
      <MemoryRouter>
        <CurriculumSummary
          fieldsByCategory={mockFields}
          data={data}
          categoryOrder={["Publicações"]}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("exibe valor numérico preenchido", () => {
    const data = curriculumDataSchema.parse({ artigos_high_impact: 5 });
    render(
      <MemoryRouter>
        <CurriculumSummary
          fieldsByCategory={mockFields}
          data={data}
          categoryOrder={["Publicações"]}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("exibe 'Sim' para booleano true", () => {
    const data = curriculumDataSchema.parse({ projeto_rondon: true });
    render(
      <MemoryRouter>
        <CurriculumSummary
          fieldsByCategory={mockFields}
          data={data}
          categoryOrder={["Prática/Social"]}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText("Sim")).toBeInTheDocument();
  });

  it("exibe 'Não' para booleano false", () => {
    const data = curriculumDataSchema.parse({ projeto_rondon: false });
    render(
      <MemoryRouter>
        <CurriculumSummary
          fieldsByCategory={mockFields}
          data={data}
          categoryOrder={["Prática/Social"]}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText("Não")).toBeInTheDocument();
  });

  it("exibe valor de select preenchido", () => {
    const data = curriculumDataSchema.parse({ conceito_historico: "A" });
    render(
      <MemoryRouter>
        <CurriculumSummary
          fieldsByCategory={mockFields}
          data={data}
          categoryOrder={["Perfil"]}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText("A")).toBeInTheDocument();
  });
});
