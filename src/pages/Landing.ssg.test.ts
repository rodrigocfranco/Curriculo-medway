import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";

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
  const html = readFileSync(distIndex, "utf-8");
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
});
