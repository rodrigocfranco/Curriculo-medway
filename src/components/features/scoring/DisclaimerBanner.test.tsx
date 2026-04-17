import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { DisclaimerBanner } from "./DisclaimerBanner";

describe("DisclaimerBanner", () => {
  it("renderiza variante compact por padrão", () => {
    render(<DisclaimerBanner />);
    expect(
      screen.getByText("Scores são estimativas baseadas em editais públicos."),
    ).toBeInTheDocument();
  });

  it("renderiza variante compact explicitamente", () => {
    render(<DisclaimerBanner variant="compact" />);
    expect(
      screen.getByText("Scores são estimativas baseadas em editais públicos."),
    ).toBeInTheDocument();
  });

  it("renderiza variante full com texto expandido", () => {
    render(<DisclaimerBanner variant="full" />);
    expect(
      screen.getByText(/Use como referência, não como garantia/),
    ).toBeInTheDocument();
  });
});
