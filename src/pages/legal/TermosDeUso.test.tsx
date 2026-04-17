import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import TermosDeUso from "./TermosDeUso";

describe("TermosDeUso", () => {
  const renderPage = () =>
    render(
      <MemoryRouter>
        <TermosDeUso />
      </MemoryRouter>
    );

  it("renderiza título h1 'Termos de Uso'", () => {
    renderPage();
    expect(
      screen.getByRole("heading", { level: 1, name: "Termos de Uso" })
    ).toBeInTheDocument();
  });

  it("exibe data de última atualização", () => {
    renderPage();
    expect(
      screen.getByText(/Última atualização: abril de 2026/)
    ).toBeInTheDocument();
  });

  it("apresenta heading hierarchy correta (h2 para seções)", () => {
    renderPage();
    const h2s = screen.getAllByRole("heading", { level: 2 });
    expect(h2s.length).toBeGreaterThanOrEqual(9);

    const sectionNames = [
      "Definições",
      "Aceitação dos Termos",
      "Cadastro e Conta",
      "Uso da Plataforma",
      "Propriedade Intelectual",
      "Limitação de Responsabilidade",
      "Modificação dos Termos",
      "Lei Aplicável",
      "Contato",
    ];
    for (const name of sectionNames) {
      expect(
        h2s.some((h) => h.textContent?.includes(name))
      ).toBe(true);
    }
  });

  it("contém link de volta para /", () => {
    renderPage();
    const link = screen.getByRole("link", { name: /voltar ao início/i });
    expect(link).toHaveAttribute("href", "/");
  });
});
