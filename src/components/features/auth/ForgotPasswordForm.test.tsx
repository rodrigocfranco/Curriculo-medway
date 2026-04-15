import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";

const resetPasswordForEmailMock = vi.fn();
const toastErrorMock = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: (...args: unknown[]) =>
        resetPasswordForEmailMock(...args),
    },
  },
}));

vi.mock("sonner", () => ({
  toast: { error: (...args: unknown[]) => toastErrorMock(...args) },
}));

import { ForgotPasswordForm } from "./ForgotPasswordForm";

function renderForm() {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ForgotPasswordForm />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  resetPasswordForEmailMock.mockReset();
  toastErrorMock.mockReset();
});

describe("ForgotPasswordForm — render (AC1)", () => {
  it("renderiza input email + CTA verbatim + link voltar", () => {
    renderForm();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Enviar link de recuperação" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Voltar para o login" }),
    ).toBeInTheDocument();
  });
});

describe("ForgotPasswordForm — validação inline (AC1)", () => {
  it("email inválido → FormMessage âmbar e não chama resetPasswordForEmail", async () => {
    renderForm();
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "nope" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Enviar link de recuperação" }),
    );

    const msg = await screen.findByText("Email inválido");
    expect(msg).toBeInTheDocument();
    expect(msg.className).toContain("text-warning");
    expect(msg.className).not.toMatch(/text-destructive|text-red-/);
    expect(resetPasswordForEmailMock).not.toHaveBeenCalled();
  });
});

describe("ForgotPasswordForm — submit neutro anti-enumeração (AC1)", () => {
  it("sucesso → mensagem neutra verbatim e redirectTo /reset-password", async () => {
    resetPasswordForEmailMock.mockResolvedValueOnce({ error: null });
    renderForm();

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "lucas@example.com" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Enviar link de recuperação" }),
    );

    await waitFor(() => {
      expect(resetPasswordForEmailMock).toHaveBeenCalledTimes(1);
    });
    const [email, opts] = resetPasswordForEmailMock.mock.calls[0];
    expect(email).toBe("lucas@example.com");
    expect(opts.redirectTo).toMatch(/\/reset-password$/);

    await screen.findByText(
      /Se este email está cadastrado, enviamos um link\./i,
    );
  });

  it("erro user_not_found (mock) → mesma UI neutra, sem toast", async () => {
    resetPasswordForEmailMock.mockResolvedValueOnce({
      error: { message: "User not found", name: "AuthApiError" },
    });
    renderForm();

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "missing@example.com" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Enviar link de recuperação" }),
    );

    await screen.findByText(
      /Se este email está cadastrado, enviamos um link\./i,
    );
    expect(toastErrorMock).not.toHaveBeenCalled();
  });

  it("erro rate limit → toast específico e form permanece visível (sem tela neutra)", async () => {
    // Erros técnicos NÃO devem mostrar "link enviado" — contradiria UX.
    // Usuário precisa saber que a requisição falhou e pode tentar de novo.
    resetPasswordForEmailMock.mockResolvedValueOnce({
      error: { message: "rate limit exceeded", name: "AuthApiError" },
    });
    renderForm();

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "lucas@example.com" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Enviar link de recuperação" }),
    );

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith(
        "Muitas tentativas — aguarde alguns minutos",
      );
    });
    expect(
      screen.queryByText(/Se este email está cadastrado, enviamos um link\./i),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Enviar link de recuperação" }),
    ).toBeInTheDocument();
  });

  it("erro de rede (TypeError) → toast específico e form permanece visível", async () => {
    resetPasswordForEmailMock.mockRejectedValueOnce(
      new TypeError("Failed to fetch"),
    );
    renderForm();

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "lucas@example.com" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Enviar link de recuperação" }),
    );

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith(
        "Sem conexão com o servidor. Verifique sua internet e tente novamente.",
      );
    });
    expect(
      screen.queryByText(/Se este email está cadastrado, enviamos um link\./i),
    ).not.toBeInTheDocument();
  });
});
