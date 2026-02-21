import { UserProfile, InstitutionScore, ScoreBreakdown } from "./types";

const v = (val: number | null | undefined): number => Number(val) || 0;

export const calculateScores = (data: UserProfile): InstitutionScore[] => {

  // --- 1. UNICAMP (Base 100) ---
  const unicamp = (): { score: number; breakdown: ScoreBreakdown[] } => {
    const pubs = Math.min(15, (v(data.artigos_high_impact) * 10) + (v(data.artigos_mid_impact) * 5) + (v(data.artigos_nacionais) * 2));
    const ic = Math.min(20, (v(data.ic_com_bolsa) * 20) + (v(data.ic_sem_bolsa) * 10));
    const monitoria = v(data.monitoria_semestres) > 2 ? 5 : (v(data.monitoria_semestres) > 0 ? 2 : 0);
    const ligas = Math.min(5, (v(data.diretoria_ligas) * 5) + (v(data.membro_liga_anos) * 2));
    const voluntariado = v(data.voluntariado_horas) >= 96 ? 5 : (v(data.voluntariado_horas) >= 48 ? 2 : 0);
    const cursos = Math.min(5, v(data.cursos_suporte) * 2.5);
    const formacao = (data.internato_hospital_ensino ? 10 : 0) + (data.doutorado ? 15 : (data.mestrado ? 10 : 0));
    const idiomas = data.ingles_fluente ? 10 : 0;
    const eventos = Math.min(10, v(data.apresentacao_congresso) * 2.5);
    const score = Math.min(100, pubs + ic + monitoria + ligas + voluntariado + cursos + formacao + idiomas + eventos);
    return {
      score,
      breakdown: [
        { label: "Publicações", score: pubs, max: 15, rule: "High: 10pts | Mid: 5pts | Nac: 2pts" },
        { label: "Iniciação Científica", score: ic, max: 20, rule: "Com bolsa: 20pts | Sem: 10pts" },
        { label: "Monitoria", score: monitoria, max: 5, rule: "> 2 semestres: 5pts | 1-2: 2pts" },
        { label: "Ligas Acadêmicas", score: ligas, max: 5, rule: "Diretor: 5pts | Membro: 2pts/ano" },
        { label: "Voluntariado", score: voluntariado, max: 5, rule: ">= 96h: 5pts | >= 48h: 2pts" },
        { label: "Cursos Extras", score: cursos, max: 5, rule: "2,5 pts por curso" },
        { label: "Apresentação em Eventos", score: eventos, max: 10, rule: "2,5 pts por apresentação" },
        { label: "Idiomas", score: idiomas, max: 10, rule: "Fluência comprovada: 10pts" },
        { label: "Formação/Pós", score: formacao, max: 25, rule: "Internato: 10pts | Mestrado: 10pts | Doc: 15pts" },
      ],
    };
  };

  // --- 2. USP-SP (Base 100) ---
  const usp_sp = (): { score: number; breakdown: ScoreBreakdown[] } => {
    const pubs = Math.min(15, (v(data.artigos_high_impact) * 10) + (v(data.artigos_mid_impact) * 5) + (v(data.artigos_low_impact) * 2));
    const ic = Math.min(14, (v(data.ic_com_bolsa) * 7) + (v(data.ic_sem_bolsa) * 3));
    const monitoria = Math.min(4, v(data.monitoria_semestres) * 2);
    const ligas_rep = Math.min(10, (v(data.diretoria_ligas) * 3) + (v(data.representante_turma_anos) * 4));
    const extensao = Math.min(10, (v(data.extensao_semestres) * 2) + (v(data.voluntariado_horas) > 0 ? 4 : 0) + (data.projeto_rondon ? 4 : 0));
    const cursos = Math.min(4, v(data.cursos_suporte) * 2);
    const instituicao_origem = (data.internato_hospital_ensino ? 10 : 0) + (data.ranking_ruf_top35 ? 5 : 0);
    const idiomas = data.ingles_fluente ? 10 : 0;
    const congressos = Math.min(10, (v(data.apresentacao_congresso) * 3) + (v(data.ouvinte_congresso) * 1));
    const historico = (data.media_geral !== null && v(data.media_geral) >= 80) ? 8 : 0;
    const score = Math.min(100, pubs + ic + monitoria + ligas_rep + extensao + cursos + instituicao_origem + idiomas + congressos + historico);
    return {
      score,
      breakdown: [
        { label: "Instituição de Origem", score: instituicao_origem, max: 15, rule: "Internato HC: 10pts | Ranking: 5pts" },
        { label: "Publicações", score: pubs, max: 15, rule: "High: 10pts | Mid: 5pts | Low: 2pts" },
        { label: "Iniciação Científica", score: ic, max: 14, rule: "Com bolsa: 7pts | Sem bolsa: 3pts" },
        { label: "Monitoria", score: monitoria, max: 4, rule: "2 pts por semestre" },
        { label: "Ligas e Representação", score: ligas_rep, max: 10, rule: "Diretor: 3pts | Rep: 4pts/ano" },
        { label: "Extensão/Voluntariado", score: extensao, max: 10, rule: "Semestre: 2pts | Voluntário: 4pts | Rondon: 4pts" },
        { label: "Congressos", score: congressos, max: 10, rule: "Apresentador: 3pts | Ouvinte: 1pt" },
        { label: "Idiomas", score: idiomas, max: 10, rule: "Fluência comprovada: 10pts" },
        { label: "Histórico Escolar", score: historico, max: 8, rule: "Nota >= 80%: 8pts" },
        { label: "Cursos (ACLS/ATLS)", score: cursos, max: 4, rule: "2 pts por curso" },
      ],
    };
  };

  // --- 3. PSU-MG (Base 10.0) ---
  const psu_mg = (): { score: number; breakdown: ScoreBreakdown[] } => {
    const pubs = Math.min(2.0, (v(data.artigos_high_impact) * 0.7) + (v(data.artigos_mid_impact) * 0.7) + (v(data.artigos_low_impact) * 0.7) + (v(data.artigos_nacionais) * 0.7));
    const ic = Math.min(2.0, (v(data.ic_com_bolsa) * 0.5) + (v(data.ic_sem_bolsa) * 0.3));
    const monitoria = v(data.monitoria_semestres) >= 1 ? 1.0 : 0;
    const ligas_ext = Math.min(4.0, (v(data.membro_liga_anos) * 0.8) + (v(data.diretoria_ligas) * 0.3) + (v(data.extensao_semestres) * 0.7));
    const estagio = v(data.estagio_extracurricular_horas) >= 180 ? 1.0 : (v(data.estagio_extracurricular_horas) >= 90 ? 0.5 : 0);
    const idiomas = Math.min(2.5, (data.ingles_fluente ? 1.5 : 0) + (v(data.cursos_suporte) * 0.7));
    const historico = data.media_geral !== null ? (v(data.media_geral) >= 85 ? 1.5 : (v(data.media_geral) >= 80 ? 1.0 : 0.5)) : 0;
    const score = Math.min(10.0, pubs + ic + monitoria + ligas_ext + estagio + idiomas + historico);
    return {
      score,
      breakdown: [
        { label: "Publicações", score: pubs, max: 2, rule: "Todos os artigos: 0.7pts cada" },
        { label: "IC", score: ic, max: 2, rule: "Com bolsa: 0.5 | Sem: 0.3" },
        { label: "Monitoria", score: monitoria, max: 1, rule: ">= 1 semestre: 1.0pt" },
        { label: "Ligas/Ext.", score: ligas_ext, max: 4, rule: "Membro: 0.8 | Dir: 0.3 | Ext: 0.7" },
        { label: "Estágio", score: estagio, max: 1, rule: ">= 180h: 1.0 | >= 90h: 0.5" },
        { label: "Idiomas/Cursos", score: idiomas, max: 2.5, rule: "Inglês: 1.5 | ACLS: 0.7" },
        { label: "Histórico", score: historico, max: 1.5, rule: ">= 85: 1.5 | >= 80: 1.0 | < 80: 0.5" },
      ],
    };
  };

  // --- 4. SES-PE (Base 100) ---
  const ses_pe = (): { score: number; breakdown: ScoreBreakdown[] } => {
    const pubs = Math.min(10, ((v(data.artigos_high_impact) + v(data.artigos_mid_impact) + v(data.artigos_low_impact) + v(data.artigos_nacionais)) * 5) + (v(data.apresentacao_congresso) * 2.5));
    const ic = Math.min(15, (v(data.ic_com_bolsa) + v(data.ic_sem_bolsa)) * 5);
    const monitoria = Math.min(15, v(data.monitoria_semestres) * 5);
    const extensao = Math.min(20, (v(data.extensao_semestres) * 5) + (data.projeto_rondon ? 10 : 0));
    let historico = 0;
    if (data.media_geral !== null) {
      if (v(data.media_geral) >= 85) historico = 30;
      else if (v(data.media_geral) >= 80) historico = 25;
      else if (v(data.media_geral) >= 75) historico = 20;
      else if (v(data.media_geral) >= 70) historico = 15;
      else historico = 10;
    }
    const score = Math.min(100, pubs + ic + monitoria + extensao + historico);
    return {
      score,
      breakdown: [
        { label: "Publicações", score: pubs, max: 10, rule: "5pts/artigo | 2.5pts/apresentação" },
        { label: "IC", score: ic, max: 15, rule: "5pts por projeto" },
        { label: "Monitoria", score: monitoria, max: 15, rule: "5pts por semestre" },
        { label: "Extensão", score: extensao, max: 20, rule: "5pts/sem | Rondon: 10pts" },
        { label: "Histórico", score: historico, max: 30, rule: ">=85: 30 | >=80: 25 | >=75: 20 | >=70: 15" },
      ],
    };
  };

  // --- 5. EINSTEIN (Base 100) ---
  const einstein = (): { score: number; breakdown: ScoreBreakdown[] } => {
    const pubs = Math.min(70,
      (v(data.artigos_high_impact) * 35) +
      (v(data.artigos_mid_impact) * 15) +
      (v(data.artigos_low_impact) * 5) +
      (v(data.artigos_nacionais) * 2)
    );
    let ic_pontos = 0;
    if (v(data.ic_horas_totais) >= 400) ic_pontos = 30;
    else if (v(data.ic_horas_totais) >= 300) ic_pontos = 25;
    else if (v(data.ic_horas_totais) >= 200) ic_pontos = 20;
    else if (v(data.ic_horas_totais) >= 100) ic_pontos = 15;
    else if (v(data.ic_horas_totais) > 0) ic_pontos = 5;
    const pos = data.doutorado ? 30 : (data.mestrado ? 25 : 0);
    const score = Math.min(100, pubs + ic_pontos + pos);
    return {
      score,
      breakdown: [
        { label: "Publicações", score: pubs, max: 70, rule: "High: 35pts | Mid: 15pts | Low: 5pts | Nac: 2pts" },
        { label: "IC (horas)", score: ic_pontos, max: 30, rule: ">=400h: 30 | >=300h: 25 | >=200h: 20 | >=100h: 15" },
        { label: "Pós-Grad.", score: pos, max: 30, rule: "Doutorado: 30pts | Mestrado: 25pts" },
      ],
    };
  };

  // --- 6. SES-DF (Base 10.0) ---
  const ses_df = (): { score: number; breakdown: ScoreBreakdown[] } => {
    const pubs = Math.min(1.0, ((v(data.artigos_high_impact) + v(data.artigos_mid_impact) + v(data.artigos_low_impact)) * 0.5) + (v(data.apresentacao_congresso) * 0.2));
    const ic = Math.min(1.0, (v(data.ic_com_bolsa) + v(data.ic_sem_bolsa)) * 0.5);
    const monitoria = Math.min(1.0, v(data.monitoria_semestres) * 0.5);
    const extensao = Math.min(1.0, v(data.extensao_semestres) * 0.5);
    const social = Math.min(2.0, (data.projeto_rondon ? 1.0 : 0) + (Math.floor(v(data.trabalho_sus_meses) / 5) * 0.5));
    const historico = (data.media_geral !== null && v(data.media_geral) >= 80) ? 0.5 : 0;
    const eventos = Math.min(1.0, (v(data.ouvinte_congresso) * 0.1) + (v(data.cursos_suporte) * 0.1));
    const score = Math.min(10.0, pubs + ic + monitoria + extensao + social + historico + eventos);
    return {
      score,
      breakdown: [
        { label: "Publicações", score: pubs, max: 1, rule: "0.5pts/artigo | 0.2pts/apresentação" },
        { label: "IC", score: ic, max: 1, rule: "0.5pts por projeto" },
        { label: "Monitoria", score: monitoria, max: 1, rule: "0.5pts por semestre" },
        { label: "Extensão", score: extensao, max: 1, rule: "0.5pts por semestre" },
        { label: "Social/SUS", score: social, max: 2, rule: "Rondon: 1.0 | SUS: 0.5/5 meses" },
        { label: "Histórico", score: historico, max: 0.5, rule: ">= 80: 0.5pt" },
        { label: "Eventos", score: eventos, max: 1, rule: "0.1pt/congresso | 0.1pt/curso" },
      ],
    };
  };

  // --- 7. FMABC (Base 10.0) ---
  const fmabc = (): { score: number; breakdown: ScoreBreakdown[] } => {
    const total_artigos = v(data.artigos_high_impact) + v(data.artigos_mid_impact) + v(data.artigos_low_impact) + v(data.artigos_nacionais);
    const p_artigos = total_artigos >= 2 ? 1.0 : (total_artigos === 1 ? 0.5 : 0);
    const p_apres = v(data.apresentacao_congresso) >= 2 ? 1.0 : (v(data.apresentacao_congresso) === 1 ? 0.5 : 0);
    const p_organizador = v(data.organizador_evento) >= 1 ? 0.5 : 0;
    const p_ouvinte = v(data.ouvinte_congresso) >= 4 ? 0.5 : (v(data.ouvinte_congresso) >= 1 ? 0.25 : 0);
    const p_ic = (v(data.ic_com_bolsa) + v(data.ic_sem_bolsa)) >= 1 ? 1.0 : 0;
    const bloco_cientifico = Math.min(4.0, p_artigos + p_apres + p_organizador + p_ouvinte + p_ic);

    const anos_mon = Math.floor(v(data.monitoria_semestres) / 2);
    const sem_mon = v(data.monitoria_semestres) % 2;
    const bloco_monitoria = Math.min(1.5, (anos_mon * 1.0) + (sem_mon * 0.5));

    const p_teste = v(data.teste_progresso) >= 4 ? 1.0 : (v(data.teste_progresso) >= 1 ? 0.5 : 0);
    const p_estagio = v(data.estagio_extracurricular_horas) >= 120 ? 1.0 : 0;
    const p_ligas = (v(data.diretoria_ligas) + v(data.membro_liga_anos)) >= 1 ? 0.5 : 0;
    const p_social = (data.projeto_rondon || v(data.voluntariado_horas) > 0) ? 0.5 : 0;
    const p_rep = v(data.representante_turma_anos) >= 1 ? 0.5 : 0;
    const p_acls = v(data.cursos_suporte) >= 1 ? 0.5 : 0;
    const bloco_extra = Math.min(4.0, p_teste + p_estagio + p_ligas + p_social + p_rep + p_acls);

    const bloco_idioma = data.ingles_fluente ? 0.5 : 0;

    const score = Math.min(10.0, bloco_cientifico + bloco_monitoria + bloco_extra + bloco_idioma);
    return {
      score,
      breakdown: [
        { label: "Científica", score: bloco_cientifico, max: 4, rule: "Artigos, IC, apresentações, ouvinte" },
        { label: "Monitoria", score: bloco_monitoria, max: 1.5, rule: "1 ano: 1.0 | 1 semestre: 0.5" },
        { label: "Extracurricular", score: bloco_extra, max: 4, rule: "Teste, estágio, ligas, social, rep, ACLS" },
        { label: "Idioma", score: bloco_idioma, max: 0.5, rule: "Inglês fluente: 0.5pt" },
      ],
    };
  };

  // --- 8. SCMSP (Base 100) ---
  const scmsp = (): { score: number; breakdown: ScoreBreakdown[] } => {
    const formacao = (data.ranking_ruf_top35 ? 20 : 0) + (data.internato_hospital_ensino ? 10 : 0);
    const pubs = Math.min(10, ((v(data.artigos_high_impact) + v(data.artigos_mid_impact) + v(data.artigos_low_impact)) * 10));
    const ic = v(data.ic_com_bolsa) > 0 ? 10 : 0;
    const monitoria = v(data.monitoria_semestres) > 0 ? 10 : 0;
    const ligas = (v(data.diretoria_ligas) + v(data.membro_liga_anos)) > 0 ? 10 : 0;
    const voluntariado = v(data.voluntariado_horas) > 0 ? 5 : 0;
    const idiomas = data.ingles_fluente ? 10 : 0;
    const score = Math.min(100, formacao + pubs + ic + monitoria + ligas + voluntariado + idiomas);
    return {
      score,
      breakdown: [
        { label: "Formação", score: formacao, max: 30, rule: "RUF Top 35: 20pts | Internato: 10pts" },
        { label: "Publicações", score: pubs, max: 10, rule: "10pts por artigo (teto 10)" },
        { label: "IC", score: ic, max: 10, rule: ">= 1 com bolsa: 10pts" },
        { label: "Monitoria", score: monitoria, max: 10, rule: ">= 1 semestre: 10pts" },
        { label: "Ligas", score: ligas, max: 10, rule: "Participação: 10pts" },
        { label: "Voluntariado", score: voluntariado, max: 5, rule: "> 0 horas: 5pts" },
        { label: "Idiomas", score: idiomas, max: 10, rule: "Fluência: 10pts" },
      ],
    };
  };

  // --- 9. SCM-BH (Base 10.0) ---
  const scm_bh = (): { score: number; breakdown: ScoreBreakdown[] } => {
    const total_artigos = v(data.artigos_high_impact) + v(data.artigos_mid_impact) + v(data.artigos_low_impact) + v(data.artigos_nacionais);
    const pubs = Math.min(2.0, (total_artigos * 0.5) + (v(data.apresentacao_congresso) * 0.25));
    const ic = Math.min(2.0, (v(data.ic_com_bolsa) * 0.5) + (v(data.ic_sem_bolsa) * 0.25));
    const monitoria = v(data.monitoria_semestres) >= 1 ? 1.0 : 0;
    const extensao = Math.min(4.0, (v(data.extensao_semestres) * 0.5) + (v(data.membro_liga_anos) * 0.5));
    const eventos = Math.min(1.0, v(data.ouvinte_congresso) * 0.5);
    const historico = (data.media_geral !== null && v(data.media_geral) >= 80) ? 1.0 : 0;
    const score = Math.min(10.0, pubs + ic + monitoria + extensao + eventos + historico);
    return {
      score,
      breakdown: [
        { label: "Publicações", score: pubs, max: 2, rule: "0.5pts/artigo | 0.25pts/apresentação" },
        { label: "IC", score: ic, max: 2, rule: "Com bolsa: 0.5 | Sem: 0.25" },
        { label: "Monitoria", score: monitoria, max: 1, rule: ">= 1 semestre: 1.0pt" },
        { label: "Extensão", score: extensao, max: 4, rule: "0.5pts/semestre | 0.5pts/ano liga" },
        { label: "Eventos", score: eventos, max: 1, rule: "0.5pts/congresso ouvinte" },
        { label: "Histórico", score: historico, max: 1, rule: ">= 80: 1.0pt" },
      ],
    };
  };

  // --- 10. USP-RP (Base 10.0) ---
  const usp_rp = (): { score: number; breakdown: ScoreBreakdown[] } => {
    const total_artigos = v(data.artigos_high_impact) + v(data.artigos_mid_impact) + v(data.artigos_low_impact) + v(data.artigos_nacionais);
    const pts_artigos = total_artigos * 1.0;
    const pts_apres = v(data.apresentacao_congresso) * 0.5;
    const pts_ic = (v(data.ic_com_bolsa) + v(data.ic_sem_bolsa)) * 0.7;
    const bloco_cientifico = Math.min(3.0, pts_artigos + pts_apres + pts_ic);
    const monitoria = Math.min(1.5, v(data.monitoria_semestres) * 0.5);
    const ligas_rep = Math.min(2.0, v(data.membro_liga_anos) * 0.5) + Math.min(2.0, v(data.representante_turma_anos) * 0.5);
    const voluntariado = v(data.voluntariado_horas) >= 120 ? 0.5 : 0;
    const formacao = data.internato_hospital_ensino ? 1.0 : 0;
    const score = Math.min(10.0, bloco_cientifico + monitoria + ligas_rep + voluntariado + formacao);
    return {
      score,
      breakdown: [
        { label: "Científico", score: bloco_cientifico, max: 3, rule: "1.0/artigo | 0.5/apresentação | 0.7/IC" },
        { label: "Monitoria", score: monitoria, max: 1.5, rule: "0.5pts por semestre" },
        { label: "Ligas/Rep.", score: ligas_rep, max: 4, rule: "0.5pts/ano membro | 0.5pts/ano rep" },
        { label: "Voluntariado", score: voluntariado, max: 0.5, rule: ">= 120h: 0.5pt" },
        { label: "Formação", score: formacao, max: 1, rule: "Internato HC: 1.0pt" },
      ],
    };
  };

  // --- 11. UFPA (Base 100) ---
  const ufpa = (): { score: number; breakdown: ScoreBreakdown[] } => {
    const total_artigos = v(data.artigos_high_impact) + v(data.artigos_mid_impact) + v(data.artigos_low_impact) + v(data.artigos_nacionais);
    const pubs = Math.min(30, total_artigos * 10) + Math.min(20, v(data.apresentacao_congresso) * 10);
    const ic = Math.min(21, (v(data.ic_com_bolsa) * 6) + (v(data.ic_sem_bolsa) * 5));
    const monitoria = Math.min(9, v(data.monitoria_semestres) * 9);
    const extensao = Math.min(21, v(data.extensao_semestres) * 6);
    const idiomas = Math.min(10, (data.ingles_fluente ? 5 : 0) + (v(data.ouvinte_congresso) * 1));
    const score = Math.min(100, pubs + ic + monitoria + extensao + idiomas);
    return {
      score,
      breakdown: [
        { label: "Publicações", score: pubs, max: 50, rule: "10pts/artigo (teto 30) | 10pts/apresentação (teto 20)" },
        { label: "IC", score: ic, max: 21, rule: "Com bolsa: 6pts | Sem: 5pts" },
        { label: "Monitoria", score: monitoria, max: 9, rule: "9pts por semestre" },
        { label: "Extensão", score: extensao, max: 21, rule: "6pts por semestre" },
        { label: "Idiomas", score: idiomas, max: 10, rule: "Inglês: 5pts | Ouvinte: 1pt" },
      ],
    };
  };

  const r = (fn: () => { score: number; breakdown: ScoreBreakdown[] }, name: string, base: number): InstitutionScore => {
    const { score, breakdown } = fn();
    return { name, score, base, breakdown };
  };

  return [
    r(unicamp, "UNICAMP", 100),
    r(usp_sp, "USP-SP", 100),
    r(psu_mg, "PSU-MG", 10),
    r(fmabc, "FMABC", 10),
    r(ses_pe, "SES-PE", 100),
    r(ses_df, "SES-DF", 10),
    r(einstein, "EINSTEIN", 100),
    r(scmsp, "SCMSP", 100),
    r(scm_bh, "SCM-BH", 10),
    r(usp_rp, "USP-RP", 10),
    r(ufpa, "UFPA", 100),
  ];
};
