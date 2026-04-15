import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";

vi.mock("@/components/features/auth/ForgotPasswordForm", () => ({
  ForgotPasswordForm: () => <div data-testid="forgot-password-form" />,
}));

import ForgotPassword from "./ForgotPassword";

describe("ForgotPassword page", () => {
  it("renderiza header, h1 e ForgotPasswordForm", () => {
    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("heading", { name: "Recuperar senha" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("forgot-password-form")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Medway" })).toBeInTheDocument();
  });
});
