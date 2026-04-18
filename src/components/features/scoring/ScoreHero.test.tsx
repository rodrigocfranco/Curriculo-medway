import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ScoreHero } from "./ScoreHero";

describe("ScoreHero", () => {
  it("renderiza nota para score >= 75% (nota >= 7.5)", () => {
    render(<ScoreHero score={80} maxScore={100} institutionName="UNICAMP" />);

    // 80/100 = 8.0
    expect(screen.getByText("8,0")).toBeInTheDocument();
    expect(screen.getByText("80 / 100 pontos")).toBeInTheDocument();
    expect(screen.getByText("Ótima posição nesta instituição!")).toBeInTheDocument();
  });

  it("renderiza nota para score >= 50% e < 75% (nota 5.0-7.4)", () => {
    render(<ScoreHero score={60} maxScore={100} institutionName="UNICAMP" />);

    // 60/100 = 6.0
    expect(screen.getByText("6,0")).toBeInTheDocument();
    expect(screen.getByText("Bom caminho — veja onde pode crescer")).toBeInTheDocument();
  });

  it("renderiza nota para score < 50% (nota < 5.0)", () => {
    render(<ScoreHero score={30} maxScore={100} institutionName="UNICAMP" />);

    // 30/100 = 3.0
    expect(screen.getByText("3,0")).toBeInTheDocument();
    expect(screen.getByText("Espaço para crescer — veja as oportunidades abaixo")).toBeInTheDocument();
  });

  it("renderiza aria-label com nota e pontos", () => {
    render(<ScoreHero score={68} maxScore={100} institutionName="UNICAMP" />);

    expect(
      screen.getByRole("region", { name: "Nota 6,8 em UNICAMP, 68 de 100 pontos" }),
    ).toBeInTheDocument();
  });

  it("renderiza corretamente com score 0", () => {
    render(<ScoreHero score={0} maxScore={100} institutionName="FMABC" />);

    expect(screen.getByText("0,0")).toBeInTheDocument();
    expect(screen.getByText("0 / 100 pontos")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("renderiza corretamente com base diferente (maxScore 10)", () => {
    render(<ScoreHero score={8} maxScore={10} institutionName="PSU-MG" />);

    // 8/10 = 8.0
    expect(screen.getByText("8,0")).toBeInTheDocument();
    expect(screen.getByText("Ótima posição nesta instituição!")).toBeInTheDocument();
  });

  it("normaliza notas entre bases diferentes", () => {
    // Einstein: 50/130 = 3.8
    const { unmount } = render(<ScoreHero score={50} maxScore={130} institutionName="Einstein" />);
    expect(screen.getByText("3,8")).toBeInTheDocument();
    unmount();

    // FMABC: 8/10 = 8.0
    render(<ScoreHero score={8} maxScore={10} institutionName="FMABC" />);
    expect(screen.getByText("8,0")).toBeInTheDocument();
  });
});
