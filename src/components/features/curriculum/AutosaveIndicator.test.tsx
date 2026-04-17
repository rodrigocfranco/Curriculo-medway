import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AutosaveIndicator } from "./AutosaveIndicator";

describe("AutosaveIndicator", () => {
  it("exibe 'Salvo' no status idle", () => {
    render(
      <AutosaveIndicator status="idle" lastSavedAt={null} retryCount={0} onRetry={() => {}} />,
    );
    expect(screen.getByText("Salvo")).toBeInTheDocument();
  });

  it("exibe 'Salvando...' no status saving sem retry", () => {
    render(
      <AutosaveIndicator
        status="saving"
        lastSavedAt={null}
        retryCount={0}
        onRetry={() => {}}
      />,
    );
    expect(screen.getByText("Salvando...")).toBeInTheDocument();
  });

  it("exibe 'tentando novamente' durante retries", () => {
    render(
      <AutosaveIndicator
        status="saving"
        lastSavedAt={null}
        retryCount={1}
        onRetry={() => {}}
      />,
    );
    expect(
      screen.getByText("Erro ao salvar — tentando novamente..."),
    ).toBeInTheDocument();
  });

  it("exibe 'Salvo há poucos segundos' no status saved", () => {
    render(
      <AutosaveIndicator
        status="saved"
        lastSavedAt={new Date()}
        retryCount={0}
        onRetry={() => {}}
      />,
    );
    expect(
      screen.getByText(/Salvo há poucos segundos/),
    ).toBeInTheDocument();
  });

  it("exibe erro com botão 'Tentar de novo' no status error", () => {
    const onRetry = vi.fn();
    render(
      <AutosaveIndicator
        status="error"
        lastSavedAt={null}
        retryCount={3}
        onRetry={onRetry}
      />,
    );
    expect(screen.getByText("Erro ao salvar")).toBeInTheDocument();
    const retryButton = screen.getByRole("button", {
      name: /Tentar de novo/,
    });
    expect(retryButton).toBeInTheDocument();
    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("exibe 'Sem conexão' no status offline", () => {
    render(
      <AutosaveIndicator
        status="offline"
        lastSavedAt={null}
        retryCount={0}
        onRetry={() => {}}
      />,
    );
    expect(screen.getByText("Sem conexão")).toBeInTheDocument();
  });

  it("tem aria-live='polite' para acessibilidade", () => {
    const { container } = render(
      <AutosaveIndicator status="idle" lastSavedAt={null} retryCount={0} onRetry={() => {}} />,
    );
    const liveRegion = container.querySelector("[aria-live='polite']");
    expect(liveRegion).toBeInTheDocument();
  });
});
