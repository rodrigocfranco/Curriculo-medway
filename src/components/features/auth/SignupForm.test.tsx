import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { act } from "react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";

const signUpMock = vi.fn();
const navigateMock = vi.fn();
const toastErrorMock = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      signUp: (...args: unknown[]) => signUpMock(...args),
    },
  },
}));

vi.mock("sonner", () => ({
  toast: { error: (...args: unknown[]) => toastErrorMock(...args) },
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );
  return { ...actual, useNavigate: () => navigateMock };
});

import { SignupForm } from "./SignupForm";

function renderForm() {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <SignupForm />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  signUpMock.mockReset();
  navigateMock.mockReset();
  toastErrorMock.mockReset();
});

describe("SignupForm — render (AC1)", () => {
  it("renderiza todos os campos + CTA + checkbox LGPD", () => {
    renderForm();
    expect(screen.getByLabelText("Nome completo")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Telefone")).toBeInTheDocument();
    expect(screen.getByLabelText("Senha")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirmar senha")).toBeInTheDocument();
    expect(screen.getByText("Estado")).toBeInTheDocument();
    expect(screen.getByText("Faculdade")).toBeInTheDocument();
    expect(screen.getByText("Ano de formação")).toBeInTheDocument();
    expect(screen.getByText("Especialidade desejada")).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: /Aceito os/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Criar minha conta" }),
    ).toBeInTheDocument();
  });

  it("CTA desabilitado enquanto LGPD não for marcado", () => {
    renderForm();
    const cta = screen.getByRole("button", { name: "Criar minha conta" });
    expect(cta).toBeDisabled();
  });

  it("CTA habilita ao marcar LGPD", async () => {
    renderForm();
    const checkbox = screen.getByRole("checkbox", { name: /Aceito os/ });
    await act(async () => {
      fireEvent.click(checkbox);
    });
    const cta = screen.getByRole("button", { name: "Criar minha conta" });
    await waitFor(() => expect(cta).not.toBeDisabled());
  });
});

describe("SignupForm — telefone (AC1)", () => {
  it("aplica máscara (DD) 9XXXX-XXXX ao digitar dígitos crus", () => {
    renderForm();
    const phone = screen.getByLabelText("Telefone") as HTMLInputElement;
    fireEvent.input(phone, { target: { value: "11987654321" } });
    expect(phone.value).toBe("(11) 98765-4321");
  });
});

describe("SignupForm — erros inline âmbar (AC3)", () => {
  it("mensagens de erro não usam text-destructive nem text-red-*", async () => {
    const { container } = renderForm();
    const checkbox = screen.getByRole("checkbox", { name: /Aceito os/ });
    await act(async () => {
      fireEvent.click(checkbox);
    });
    const cta = screen.getByRole("button", { name: "Criar minha conta" });
    await act(async () => {
      fireEvent.click(cta);
    });
    await waitFor(() => {
      const msgs = container.querySelectorAll("[id$='-form-item-message']");
      expect(msgs.length).toBeGreaterThan(0);
    });
    const messages = container.querySelectorAll(
      "[id$='-form-item-message']",
    );
    for (const m of Array.from(messages)) {
      const cls = m.getAttribute("class") ?? "";
      expect(cls).not.toMatch(/text-destructive/);
      expect(cls).not.toMatch(/text-red-/);
      expect(cls).toMatch(/text-warning/);
    }
  });
});

describe("SignupForm — acessibilidade/LGPD", () => {
  it("links LGPD apontam para /termos e /privacidade e abrem em nova aba", () => {
    renderForm();
    const termos = screen.getByRole("link", { name: "Termos de Uso" });
    expect(termos).toHaveAttribute("href", "/termos");
    expect(termos).toHaveAttribute("target", "_blank");
    const privacidade = screen.getByRole("link", {
      name: "Política de Privacidade",
    });
    expect(privacidade).toHaveAttribute("href", "/privacidade");
    expect(privacidade).toHaveAttribute("target", "_blank");
  });
});
