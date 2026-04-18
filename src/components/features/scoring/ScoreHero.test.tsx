import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ScoreHero } from "./ScoreHero";

describe("ScoreHero", () => {
  it("renderiza microcopy para score >= 75%", () => {
    render(<ScoreHero score={80} maxScore={100} institutionName="UNICAMP" />);

    expect(screen.getByText("80")).toBeInTheDocument();
    expect(screen.getByText("Ótima posição nesta instituição!")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("renderiza microcopy para score >= 50% e < 75%", () => {
    render(<ScoreHero score={60} maxScore={100} institutionName="UNICAMP" />);

    expect(screen.getByText("60")).toBeInTheDocument();
    expect(screen.getByText("Bom caminho — veja onde pode crescer")).toBeInTheDocument();
  });

  it("renderiza microcopy para score < 50%", () => {
    render(<ScoreHero score={30} maxScore={100} institutionName="UNICAMP" />);

    expect(screen.getByText("30")).toBeInTheDocument();
    expect(screen.getByText("Você tem 70 pontos possíveis para crescer aqui")).toBeInTheDocument();
  });

  it("renderiza aria-label correto", () => {
    render(<ScoreHero score={68} maxScore={100} institutionName="UNICAMP" />);

    expect(
      screen.getByRole("region", { name: "Score 68 de 100 em UNICAMP" }),
    ).toBeInTheDocument();
  });

  it("renderiza corretamente com score 0", () => {
    render(<ScoreHero score={0} maxScore={100} institutionName="FMABC" />);

    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("/ 100")).toBeInTheDocument();
    expect(screen.getByText("Você tem 100 pontos possíveis para crescer aqui")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("renderiza corretamente com base diferente (maxScore 10)", () => {
    render(<ScoreHero score={8} maxScore={10} institutionName="PSU-MG" />);

    expect(screen.getByText("8")).toBeInTheDocument();
    // 8/10 = 80% → faixa >= 75%
    expect(screen.getByText("Ótima posição nesta instituição!")).toBeInTheDocument();
  });
});
