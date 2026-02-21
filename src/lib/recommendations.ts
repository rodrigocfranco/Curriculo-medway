import { UserProfile, InstitutionScore } from "./types";

export interface Recommendation {
  type: "success" | "warning" | "info";
  message: string;
}

const v = (val: number | null | undefined): number => Number(val) || 0;

export function generateRecommendations(data: UserProfile, results: InstitutionScore[]): Recommendation[] {
  const recs: Recommendation[] = [];

  // Success recommendations
  if (data.mestrado) {
    recs.push({ type: "success", message: "Ótimo! Seu mestrado garante pontos de pós-graduação no Einstein (25pts) e UNICAMP (10pts)." });
  }
  if (data.doutorado) {
    recs.push({ type: "success", message: "Excelente! Seu doutorado garante a nota máxima de pós-graduação no Einstein (30pts) e UNICAMP (15pts)." });
  }
  if (data.ingles_fluente) {
    recs.push({ type: "success", message: "Parabéns! Inglês fluente garante pontos em UNICAMP (10pts), USP-SP (10pts), SCMSP (10pts) e FMABC (0.5pt)." });
  }
  if (data.internato_hospital_ensino) {
    recs.push({ type: "success", message: "Internato em Hospital de Ensino garante pontos na UNICAMP (10pts), USP-SP (10pts) e USP-RP (1pt)." });
  }
  if (v(data.artigos_high_impact) >= 2) {
    recs.push({ type: "success", message: `Seus ${v(data.artigos_high_impact)} artigos de alto impacto valem até ${v(data.artigos_high_impact) * 35}pts no Einstein!` });
  }

  // Warning recommendations
  if (!data.ingles_fluente) {
    recs.push({ type: "warning", message: "Atenção: Você está perdendo pontos valiosos na SCMSP (10pts), UNICAMP (10pts), USP-SP (10pts) e FMABC (0.5pt) por não ter Inglês Fluente." });
  }
  if (v(data.ic_com_bolsa) === 0 && v(data.ic_sem_bolsa) === 0) {
    recs.push({ type: "warning", message: "Sem Iniciação Científica você perde até 20pts na UNICAMP, 14pts na USP-SP e 1pt na FMABC." });
  }
  if (v(data.monitoria_semestres) === 0) {
    recs.push({ type: "warning", message: "Sem monitoria você perde pontos em quase todas as instituições (até 15pts na SES-PE)." });
  }
  if (v(data.artigos_high_impact) === 0 && v(data.artigos_mid_impact) === 0 && v(data.artigos_low_impact) === 0) {
    recs.push({ type: "warning", message: "Sem publicações científicas, seu currículo perde competitividade em todas as 11 instituições." });
  }
  if (!data.ranking_ruf_top35) {
    recs.push({ type: "warning", message: "Faculdade fora do Top 35 RUF: você perde 20pts na SCMSP." });
  }

  // Info recommendations
  if (v(data.ic_horas_totais) > 0 && v(data.ic_horas_totais) < 400) {
    const next = v(data.ic_horas_totais) < 100 ? 100 : v(data.ic_horas_totais) < 200 ? 200 : v(data.ic_horas_totais) < 300 ? 300 : 400;
    recs.push({ type: "info", message: `Dica: Atingindo ${next}h de IC você sobe de faixa no Einstein (próximo nível de pontuação).` });
  }
  if (v(data.voluntariado_horas) > 0 && v(data.voluntariado_horas) < 96) {
    recs.push({ type: "info", message: `Dica: Com ${96 - v(data.voluntariado_horas)}h a mais de voluntariado, você atinge o teto na UNICAMP (5pts).` });
  }

  return recs;
}
