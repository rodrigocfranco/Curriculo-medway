import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect, beforeAll } from "vitest";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distIndex = path.resolve(__dirname, "../../dist/index.html");

const shouldSkipSSG = !existsSync(distIndex);
if (shouldSkipSSG) {
  console.warn(
    "⚠ SSG tests skipped — dist/index.html not found. Run `bun run build` first.",
  );
}

describe.skipIf(shouldSkipSSG)("SSG output", () => {
  let html: string;

  beforeAll(() => {
    html = readFileSync(distIndex, "utf-8");
  });

  it("contém headline pré-renderizado", () => {
    expect(html).toMatch(/Descubra como está seu currículo/);
  });
  it("contém CTA link para /signup", () => {
    expect(html).toMatch(/href="\/signup"/);
  });
  it("contém meta description pt-BR", () => {
    expect(html).toMatch(/<meta name="description"/);
  });
  it("contém og:image", () => {
    expect(html).toMatch(/property="og:image"/);
  });
  it("contém seção como-funciona", () => {
    expect(html).toMatch(/id="como-funciona"/);
  });
  it("contém seção preview", () => {
    expect(html).toMatch(/id="preview"/);
  });
  it("contém microcopy persuasiva", () => {
    expect(html).toMatch(/Em 10 minutos/);
  });
  it("contém seção social-proof", () => {
    expect(html).toMatch(/id="social-proof"/);
  });
  it("contém seção faq", () => {
    expect(html).toMatch(/id="faq"/);
  });
  it("contém elemento footer", () => {
    expect(html).toMatch(/<footer/);
  });
  it("contém headline do CTA banner", () => {
    expect(html).toMatch(/Pronto para descobrir seu score/);
  });
});
