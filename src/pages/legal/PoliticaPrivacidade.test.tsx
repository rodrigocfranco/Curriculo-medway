import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import PoliticaPrivacidade from "./PoliticaPrivacidade";

describe("PoliticaPrivacidade", () => {
  const renderPage = () =>
    render(
      <MemoryRouter>
        <PoliticaPrivacidade />
      </MemoryRouter>
    );

  it("renderiza título h1 'Política de Privacidade'", () => {
    renderPage();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Política de Privacidade",
      })
    ).toBeInTheDocument();
  });

  it("exibe data de última atualização", () => {
    renderPage();
    expect(
      screen.getByText(/Última atualização: abril de 2026/)
    ).toBeInTheDocument();
  });

  it("menciona LGPD e Art. 18", () => {
    renderPage();
    expect(screen.getByText(/Art\. 18 da LGPD/)).toBeInTheDocument();
  });

  it("apresenta heading hierarchy correta (h2 para seções principais)", () => {
    renderPage();
    const h2s = screen.getAllByRole("heading", { level: 2 });
    expect(h2s.length).toBeGreaterThanOrEqual(10);

    const sectionNames = [
      "Dados Coletados",
      "Finalidade do Tratamento",
      "Base Legal",
      "Compartilhamento de Dados",
      "Armazenamento e Segurança",
      "Direitos do Titular",
      "Cookies e Tecnologias",
      "Retenção de Dados",
      "Alterações nesta Política",
      "Contato do Encarregado",
    ];
    for (const name of sectionNames) {
      expect(
        h2s.some((h) => h.textContent?.includes(name))
      ).toBe(true);
    }
  });

  it("menciona direito de exclusão de conta", () => {
    renderPage();
    expect(
      screen.getByText(/exclusão de conta/i)
    ).toBeInTheDocument();
  });

  it("contém link de volta para /", () => {
    renderPage();
    const link = screen.getByRole("link", { name: /voltar ao início/i });
    expect(link).toHaveAttribute("href", "/");
  });
});
