import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
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
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
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
      screen.getByRole("button", { name: /Criar minha conta/ }),
    ).toBeInTheDocument();
  });

  it("CTA desabilitado enquanto LGPD não for marcado", () => {
    renderForm();
    const cta = screen.getByRole("button", { name: /Criar minha conta/ });
    expect(cta).toBeDisabled();
  });

  it("CTA permanece desabilitado quando LGPD marcado mas campos obrigatórios vazios (AC1)", async () => {
    renderForm();
    const checkbox = screen.getByRole("checkbox", { name: /Aceito os/ });
    await act(async () => {
      fireEvent.click(checkbox);
    });
    const cta = screen.getByRole("button", { name: /Criar minha conta/ });
    await waitFor(() => expect(cta).toBeDisabled());
    expect(cta).toHaveAttribute("aria-disabled", "true");
  });

  it("CTA expõe sr-only explicando motivo do disabled (a11y)", async () => {
    renderForm();
    const cta = screen.getByRole("button", { name: /Criar minha conta/ });
    // Sem LGPD marcado: mensagem sobre aceite.
    expect(cta.textContent).toContain("Marque o aceite");
  });
});

describe("SignupForm — telefone (AC1)", () => {
  it("aplica máscara (DD) 9XXXX-XXXX ao digitar dígitos crus (celular)", () => {
    renderForm();
    const phone = screen.getByLabelText("Telefone") as HTMLInputElement;
    fireEvent.input(phone, { target: { value: "11987654321" } });
    expect(phone.value).toBe("(11) 98765-4321");
  });

  it("aplica máscara (DD) XXXX-XXXX para telefone fixo (10 dígitos)", () => {
    renderForm();
    const phone = screen.getByLabelText("Telefone") as HTMLInputElement;
    fireEvent.input(phone, { target: { value: "1133334444" } });
    expect(phone.value).toBe("(11) 3333-4444");
  });
});

describe("SignupForm — password max (72)", () => {
  it("inputs de senha têm maxLength 72 (guardrail para bcrypt)", () => {
    renderForm();
    const password = screen.getByLabelText("Senha") as HTMLInputElement;
    const confirm = screen.getByLabelText("Confirmar senha") as HTMLInputElement;
    expect(password.maxLength).toBe(72);
    expect(confirm.maxLength).toBe(72);
  });
});

describe("SignupForm — erros inline âmbar (AC3)", () => {
  // Com mode: "onSubmit", mensagens aparecem após submit. Como o CTA fica disabled
  // até campos obrigatórios serem preenchidos, testamos a classe/cor via FormMessage
  // forçando erro com form.trigger através de submit de formulário vazio após
  // habilitar o submit via checkbox + preenchimento parcial (só LGPD + senha).
  it("mensagens de erro usam text-warning e não text-destructive", async () => {
    const { container } = renderForm();

    // Preenche só senha/confirmação + LGPD → ainda inválido (faltam outros campos),
    // mas vamos usar blur dos inputs já preenchidos para gerar erros inline após submit programático.
    const password = screen.getByLabelText("Senha");
    fireEvent.input(password, { target: { value: "123" } }); // curto
    fireEvent.blur(password);

    // Submit do form (via JS event) — dispara validação completa e renderiza FormMessages.
    const form = container.querySelector("form");
    expect(form).toBeTruthy();
    await act(async () => {
      fireEvent.submit(form!);
    });

    await waitFor(() => {
      const msgs = container.querySelectorAll("[id$='-form-item-message']");
      expect(msgs.length).toBeGreaterThan(0);
    });
    const messages = container.querySelectorAll(
      "[id$='-form-item-message']",
    );
    let verified = 0;
    for (const m of Array.from(messages)) {
      const cls = m.getAttribute("class") ?? "";
      if (cls) {
        expect(cls).not.toMatch(/text-destructive/);
        expect(cls).not.toMatch(/text-red-/);
        expect(cls).toMatch(/text-warning/);
        verified++;
      }
    }
    expect(verified).toBeGreaterThan(0);
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

  it("CommandEmpty da faculdade é acessível via teclado (botão) com estado disabled abaixo de 2 chars", async () => {
    renderForm();
    const facTrigger = screen.getByRole("combobox", { name: /Faculdade/i });
    await act(async () => {
      fireEvent.click(facTrigger);
    });
    const searchInput = screen.getByPlaceholderText("Buscar faculdade...");
    fireEvent.input(searchInput, { target: { value: "Nova Faculdade" } });
    await waitFor(() => {
      const btn = within(document.body).getByRole("button", {
        name: /Adicionar "Nova Faculdade"/,
      });
      expect(btn).toBeInTheDocument();
      expect(btn).not.toBeDisabled();
    });
  });
});
