// Range dinâmico calculado em runtime da data atual.
// Cobre Lucas (5º ano, forma em 2028) + recém-formados até 10 anos atrás + alunos iniciais.
// Retorna [currentYear - 10 ... currentYear + 8] em ordem decrescente (mais recente primeiro).
export function getGraduationYearOptions(now: Date = new Date()): number[] {
  const currentYear = now.getFullYear();
  const start = currentYear + 8;
  const end = currentYear - 10;
  const years: number[] = [];
  for (let y = start; y >= end; y--) years.push(y);
  return years;
}
