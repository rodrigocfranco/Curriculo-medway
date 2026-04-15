// Lista fechada de especialidades médicas para o Select de "especialidade desejada".
// Ordem: alfabética, exceto "Outra" no final. Fontes: PRD persona Lucas + calculations.ts + Epic 2.
export const SPECIALTIES = [
  "Anestesiologia",
  "Cardiologia",
  "Cirurgia Geral",
  "Clínica Médica",
  "Dermatologia",
  "Ginecologia e Obstetrícia",
  "Medicina de Emergência",
  "Medicina de Família e Comunidade",
  "Medicina Intensiva",
  "Neurologia",
  "Oftalmologia",
  "Ortopedia",
  "Pediatria",
  "Psiquiatria",
  "Radiologia",
  "Outra",
] as const;

export type Specialty = (typeof SPECIALTIES)[number];

export const SPECIALTIES_TUPLE: readonly [Specialty, ...Specialty[]] = [
  SPECIALTIES[0],
  ...SPECIALTIES.slice(1),
];
