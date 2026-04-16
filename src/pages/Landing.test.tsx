import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import Landing from "./Landing";

describe("Landing", () => {
  it("renders headline verbatim", () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    );
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Descubra como está seu currículo para as maiores instituições de residência do Brasil",
      })
    ).toBeInTheDocument();
  });

  it('CTA "Começar" aponta para /signup', () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    );
    const cta = screen.getByRole("link", { name: "Começar" });
    expect(cta).toHaveAttribute("href", "/signup");
  });
});
