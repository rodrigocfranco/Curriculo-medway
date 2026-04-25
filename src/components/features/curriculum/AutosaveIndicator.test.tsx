import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AutosaveIndicator } from "./AutosaveIndicator";

describe("AutosaveIndicator", () => {
  it("não renderiza nada no status idle", () => {
    const { container } = render(
      <AutosaveIndicator
        status="idle"
        lastSavedAt={null}
        retryCount={0}
        onRetry={() => {}}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("não renderiza nada no status saving sem retry", () => {
    const { container } = render(
      <AutosaveIndicator
        status="saving"
        lastSavedAt={null}
        retryCount={0}
        onRetry={() => {}}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("não renderiza nada no status saved", () => {
    const { container } = render(
      <AutosaveIndicator
        status="saved"
        lastSavedAt={new Date()}
        retryCount={0}
        onRetry={() => {}}
      />,
    );
    expect(container.firstChild).toBeNull();
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

  it("tem aria-live='polite' para acessibilidade quando renderiza", () => {
    const { container } = render(
      <AutosaveIndicator
        status="error"
        lastSavedAt={null}
        retryCount={3}
        onRetry={() => {}}
      />,
    );
    const liveRegion = container.querySelector("[aria-live='polite']");
    expect(liveRegion).toBeInTheDocument();
  });
});
