import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import Landing from "./Landing";

const renderLanding = () =>
  render(
    <MemoryRouter>
      <Landing />
    </MemoryRouter>,
  );

describe("Landing", () => {
  describe("Hero", () => {
    it("renders headline", () => {
      renderLanding();
      expect(
        screen.getByRole("heading", {
          level: 1,
          name: /Descubra como está seu currículo/,
        }),
      ).toBeInTheDocument();
    });

    it("renders updated microcopy with score mention", () => {
      renderLanding();
      expect(
        screen.getByText(/Em 10 minutos você tem seu score nas maiores instituições/),
      ).toBeInTheDocument();
    });

    it('link "Fazer login" aponta para /login', () => {
      renderLanding();
      const login = screen.getByRole("link", { name: "Fazer login" });
      expect(login).toHaveAttribute("href", "/login");
    });

    it('CTA primário "Começar" aponta para /signup', () => {
      renderLanding();
      const cta = screen.getByRole("link", { name: "Começar" });
      expect(cta).toHaveAttribute("href", "/signup");
    });

    it('CTA secundário "Ver como funciona" aponta para âncora #como-funciona', () => {
      renderLanding();
      const cta = screen.getByRole("link", { name: "Ver como funciona" });
      expect(cta).toHaveAttribute("href", "#como-funciona");
    });
  });

  describe("Como funciona", () => {
    it("renders section with 3 cards", () => {
      renderLanding();
      expect(
        screen.getByRole("heading", { level: 2, name: "Como funciona" }),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Cadastre-se em 1 minuto"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Preencha seu currículo"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Veja seu score por instituição"),
      ).toBeInTheDocument();
    });

    it('CTA "Criar minha conta" aponta para /signup', () => {
      renderLanding();
      const cta = screen.getByRole("link", { name: "Criar minha conta" });
      expect(cta).toHaveAttribute("href", "/signup");
    });
  });

  describe("Benefícios", () => {
    it("renders benefits section with title", () => {
      renderLanding();
      expect(
        screen.getByRole("heading", {
          level: 2,
          name: "Por que usar o Currículo Medway?",
        }),
      ).toBeInTheDocument();
    });

    it("renders 6 benefit cards", () => {
      renderLanding();
      expect(screen.getByText("Score por instituição")).toBeInTheDocument();
      expect(screen.getByText("Gap analysis detalhado")).toBeInTheDocument();
      expect(screen.getByText("Regras oficiais dos editais")).toBeInTheDocument();
      expect(screen.getByText("Salvamento automático")).toBeInTheDocument();
      expect(screen.getByText("Plataforma em evolução")).toBeInTheDocument();
      expect(screen.getByText("Gratuito e sem compromisso")).toBeInTheDocument();
    });
  });

  describe("Social Proof", () => {
    it("renders section title", () => {
      renderLanding();
      expect(
        screen.getByRole("heading", {
          level: 2,
          name: "O que dizem nossos alunos",
        }),
      ).toBeInTheDocument();
    });

    it("renders at least 1 testimonial with name and quote", () => {
      renderLanding();
      expect(screen.getByText("Ana Beatriz")).toBeInTheDocument();
      expect(
        screen.getByText(/Finalmente consegui entender/),
      ).toBeInTheDocument();
    });
  });

  describe("FAQ", () => {
    it("renders section title", () => {
      renderLanding();
      expect(
        screen.getByRole("heading", {
          level: 2,
          name: "Perguntas frequentes",
        }),
      ).toBeInTheDocument();
    });

    it("accordion opens on click and shows answer", async () => {
      renderLanding();
      const trigger = screen.getByText("É gratuito?");
      fireEvent.click(trigger);
      await waitFor(() => {
        expect(screen.getByText(/100% gratuito/)).toBeVisible();
      });
    });
  });

  describe("CTA Banner", () => {
    it("renders headline and CTA link to /signup", () => {
      renderLanding();
      expect(
        screen.getByRole("heading", {
          level: 2,
          name: "Pronto para descobrir seu score?",
        }),
      ).toBeInTheDocument();
      const cta = screen.getByRole("link", { name: "Começar agora" });
      expect(cta).toHaveAttribute("href", "/signup");
    });
  });

  describe("Footer", () => {
    it("renders links for termos and privacidade", () => {
      renderLanding();
      const termos = screen.getByRole("link", { name: "Termos de Uso" });
      expect(termos).toHaveAttribute("href", "/termos");
      const privacidade = screen.getByRole("link", {
        name: "Política de Privacidade",
      });
      expect(privacidade).toHaveAttribute("href", "/privacidade");
    });

    it("renders current year", () => {
      renderLanding();
      const year = new Date().getFullYear();
      expect(screen.getByText(`© ${year} Medway`)).toBeInTheDocument();
    });

    it("has semantic footer element", () => {
      renderLanding();
      const footer = screen.getByRole("contentinfo");
      expect(footer).toBeInTheDocument();
    });
  });
});
