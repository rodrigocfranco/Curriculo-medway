import { UserProfile, InstitutionScore, ScoreBreakdown } from "./types";

export const calculateScores = (data: UserProfile): InstitutionScore[] => {

  const unicamp = (): { score: number; breakdown: ScoreBreakdown[] } => {
    const pubs = Math.min(15, (data.artigos_high_impact * 10) + (data.artigos_mid_impact * 10) + (data.artigos_low_impact * 5) + (data.artigos_nacionais * 5));
    const ic = Math.min(20, (data.ic_com_bolsa * 20) + (data.ic_sem_bolsa * 10));
    const monitoria = data.monitoria_semestres > 2 ? 5 : (data.monitoria_semestres > 0 ? 2 : 0);
    const ligas = Math.min(5, (data.diretoria_ligas * 5) + (data.membro_liga_anos * 2));
    const voluntariado = data.voluntariado_horas >= 96 ? 5 : (data.voluntariado_horas >= 48 ? 2 : 0);
    const cursos = Math.min(5, data.cursos_suporte * 2);
    const formacao = (data.internato_hospital_ensino ? 10 : 0) + (data.doutorado ? 15 : (data.mestrado ? 10 : 0));
    const score = Math.min(100, pubs + ic + monitoria + ligas + voluntariado + cursos + formacao);
    return {
      score,
      breakdown: [
        { label: "Publicações", score: pubs, max: 15 },
        { label: "IC", score: ic, max: 20 },
        { label: "Monitoria", score: monitoria, max: 5 },
        { label: "Ligas", score: ligas, max: 5 },
        { label: "Voluntariado", score: voluntariado, max: 5 },
        { label: "Cursos", score: cursos, max: 5 },
        { label: "Formação", score: formacao, max: 25 },
      ],
    };
  };

  const usp_sp = (): { score: number; breakdown: ScoreBreakdown[] } => {
    const pubs = Math.min(10, (data.artigos_high_impact * 10) + (data.artigos_mid_impact * 10) + (data.artigos_low_impact * 10) + (data.artigos_nacionais * 5));
    const ic = Math.min(12, (data.ic_com_bolsa * 2) + (data.ic_sem_bolsa * 1));
    const monitoria = data.monitoria_semestres > 2 ? 3 : (data.monitoria_semestres > 0 ? 1 : 0);
    const ligas = Math.min(8, (data.diretoria_ligas * 5) + (data.representante_turma_anos * 3));
    const extensao = Math.min(2, data.extensao_semestres * 1);
    const cursos = Math.min(4, data.cursos_suporte * 2);
    const score = Math.min(100, pubs + ic + monitoria + ligas + extensao + cursos);
    return {
      score,
      breakdown: [
        { label: "Publicações", score: pubs, max: 10 },
        { label: "IC", score: ic, max: 12 },
        { label: "Monitoria", score: monitoria, max: 3 },
        { label: "Ligas/Rep.", score: ligas, max: 8 },
        { label: "Extensão", score: extensao, max: 2 },
        { label: "Cursos", score: cursos, max: 4 },
      ],
    };
  };

  const psu_mg = (): { score: number; breakdown: ScoreBreakdown[] } => {
    const pubs = Math.min(2.0, (data.artigos_high_impact * 0.7) + (data.artigos_mid_impact * 0.7) + (data.artigos_low_impact * 0.7) + (data.artigos_nacionais * 0.7));
    const ic = Math.min(2.0, (data.ic_com_bolsa * 0.5) + (data.ic_sem_bolsa * 0.3));
    const monitoria = data.monitoria_semestres >= 1 ? 1.0 : 0;
    const ligas_ext = Math.min(4.0, (data.membro_liga_anos * 0.8) + (data.diretoria_ligas * 0.3) + (data.extensao_semestres * 0.7));
    const estagio = data.estagio_extracurricular_horas >= 180 ? 1.0 : (data.estagio_extracurricular_horas >= 90 ? 0.5 : 0);
    const idiomas = Math.min(2.5, (data.ingles_fluente ? 1.5 : 0) + (data.cursos_suporte * 0.7));
    const historico = data.media_geral >= 85 ? 1.5 : (data.media_geral >= 80 ? 1.0 : 0.5);
    const score = Math.min(10.0, pubs + ic + monitoria + ligas_ext + estagio + idiomas + historico);
    return {
      score,
      breakdown: [
        { label: "Publicações", score: pubs, max: 2 },
        { label: "IC", score: ic, max: 2 },
        { label: "Monitoria", score: monitoria, max: 1 },
        { label: "Ligas/Ext.", score: ligas_ext, max: 4 },
        { label: "Estágio", score: estagio, max: 1 },
        { label: "Idiomas/Cursos", score: idiomas, max: 2.5 },
        { label: "Histórico", score: historico, max: 1.5 },
      ],
    };
  };

  const ses_pe = (): { score: number; breakdown: ScoreBreakdown[] } => {
    const pubs = Math.min(10, ((data.artigos_high_impact + data.artigos_mid_impact + data.artigos_low_impact + data.artigos_nacionais) * 5) + (data.apresentacao_congresso * 2.5));
    const ic = Math.min(15, (data.ic_com_bolsa + data.ic_sem_bolsa) * 5);
    const monitoria = Math.min(15, data.monitoria_semestres * 5);
    const extensao = Math.min(20, (data.extensao_semestres * 5) + (data.projeto_rondon ? 10 : 0));
    let historico = 10;
    if (data.media_geral >= 85) historico = 30;
    else if (data.media_geral >= 80) historico = 25;
    else if (data.media_geral >= 75) historico = 20;
    else if (data.media_geral >= 70) historico = 15;
    const score = Math.min(100, pubs + ic + monitoria + extensao + historico);
    return {
      score,
      breakdown: [
        { label: "Publicações", score: pubs, max: 10 },
        { label: "IC", score: ic, max: 15 },
        { label: "Monitoria", score: monitoria, max: 15 },
        { label: "Extensão", score: extensao, max: 20 },
        { label: "Histórico", score: historico, max: 30 },
      ],
    };
  };

  const einstein = (): { score: number; breakdown: ScoreBreakdown[] } => {
    const pubs = Math.min(70, 
      (data.artigos_high_impact * 35) + 
      (data.artigos_mid_impact * 15) + 
      (data.artigos_low_impact * 5) + 
      (data.artigos_nacionais * 2)
    );
    let ic_pontos = 0;
    if (data.ic_horas_totais >= 400) ic_pontos = 30;
    else if (data.ic_horas_totais >= 300) ic_pontos = 25;
    else if (data.ic_horas_totais >= 200) ic_pontos = 20;
    else if (data.ic_horas_totais >= 100) ic_pontos = 15;
    else if (data.ic_horas_totais > 0) ic_pontos = 5;
    const pos = data.doutorado ? 30 : (data.mestrado ? 25 : 0);
    const score = Math.min(100, pubs + ic_pontos + pos);
    return {
      score,
      breakdown: [
        { label: "Publicações", score: pubs, max: 70 },
        { label: "IC (horas)", score: ic_pontos, max: 30 },
        { label: "Pós-Grad.", score: pos, max: 30 },
      ],
    };
  };

  const ses_df = (): { score: number; breakdown: ScoreBreakdown[] } => {
    const pubs = Math.min(1.0, ((data.artigos_high_impact + data.artigos_mid_impact + data.artigos_low_impact) * 0.5) + (data.apresentacao_congresso * 0.2));
    const ic = Math.min(1.0, (data.ic_com_bolsa + data.ic_sem_bolsa) * 0.5);
    const monitoria = Math.min(1.0, data.monitoria_semestres * 0.5);
    const extensao = Math.min(1.0, data.extensao_semestres * 0.5);
    const social = Math.min(2.0, (data.projeto_rondon ? 1.0 : 0) + (Math.floor(data.trabalho_sus_meses / 5) * 0.5));
    const historico = data.media_geral >= 80 ? 0.5 : 0;
    const eventos = Math.min(1.0, (data.ouvinte_congresso * 0.1) + (data.cursos_suporte * 0.1));
    const score = Math.min(10.0, pubs + ic + monitoria + extensao + social + historico + eventos);
    return {
      score,
      breakdown: [
        { label: "Publicações", score: pubs, max: 1 },
        { label: "IC", score: ic, max: 1 },
        { label: "Monitoria", score: monitoria, max: 1 },
        { label: "Extensão", score: extensao, max: 1 },
        { label: "Social/SUS", score: social, max: 2 },
        { label: "Histórico", score: historico, max: 0.5 },
        { label: "Eventos", score: eventos, max: 1 },
      ],
    };
  };

  const fmabc = (): { score: number; breakdown: ScoreBreakdown[] } => {
    const total_artigos = data.artigos_high_impact + data.artigos_mid_impact + data.artigos_low_impact + data.artigos_nacionais;
    const p_artigos = total_artigos >= 2 ? 1.0 : (total_artigos === 1 ? 0.5 : 0);
    const p_apres = data.apresentacao_congresso >= 2 ? 1.0 : (data.apresentacao_congresso === 1 ? 0.5 : 0);
    const p_organizador = data.organizador_evento >= 1 ? 0.5 : 0;
    const p_ouvinte = data.ouvinte_congresso >= 4 ? 0.5 : (data.ouvinte_congresso >= 1 ? 0.25 : 0);
    const p_ic = (data.ic_com_bolsa + data.ic_sem_bolsa) >= 1 ? 1.0 : 0;
    const bloco_cientifico = Math.min(4.0, p_artigos + p_apres + p_organizador + p_ouvinte + p_ic);

    const anos_mon = Math.floor(data.monitoria_semestres / 2);
    const sem_mon = data.monitoria_semestres % 2;
    const bloco_monitoria = Math.min(1.5, (anos_mon * 1.0) + (sem_mon * 0.5));

    const p_teste = data.teste_progresso >= 4 ? 1.0 : (data.teste_progresso >= 1 ? 0.5 : 0);
    const p_estagio = data.estagio_extracurricular_horas >= 120 ? 1.0 : 0;
    const p_ligas = (data.diretoria_ligas + data.membro_liga_anos) >= 1 ? 0.5 : 0;
    const p_social = (data.projeto_rondon || data.voluntariado_horas > 0) ? 0.5 : 0;
    const p_rep = data.representante_turma_anos >= 1 ? 0.5 : 0;
    const p_acls = data.cursos_suporte >= 1 ? 0.5 : 0;
    const bloco_extra = Math.min(4.0, p_teste + p_estagio + p_ligas + p_social + p_rep + p_acls);

    const bloco_idioma = data.ingles_fluente ? 0.5 : 0;

    const score = Math.min(10.0, bloco_cientifico + bloco_monitoria + bloco_extra + bloco_idioma);
    return {
      score,
      breakdown: [
        { label: "Científica", score: bloco_cientifico, max: 4 },
        { label: "Monitoria", score: bloco_monitoria, max: 1.5 },
        { label: "Extracurricular", score: bloco_extra, max: 4 },
        { label: "Idioma", score: bloco_idioma, max: 0.5 },
      ],
    };
  };

  const scmsp = (): { score: number; breakdown: ScoreBreakdown[] } => {
    const formacao = (data.ranking_ruf_top35 ? 20 : 5) + (data.internato_hospital_ensino ? 10 : 0);
    const pubs = Math.min(10, ((data.artigos_high_impact + data.artigos_mid_impact + data.artigos_low_impact) * 10));
    const ic = data.ic_com_bolsa > 0 ? 10 : 0;
    const monitoria = data.monitoria_semestres > 0 ? 10 : 0;
    const ligas = (data.diretoria_ligas + data.membro_liga_anos) > 0 ? 10 : 0;
    const voluntariado = data.voluntariado_horas > 0 ? 5 : 0;
    const idiomas = (data.ingles_fluente ? 10 : 0);
    const score = Math.min(100, formacao + pubs + ic + monitoria + ligas + voluntariado + idiomas);
    return {
      score,
      breakdown: [
        { label: "Formação", score: formacao, max: 30 },
        { label: "Publicações", score: pubs, max: 10 },
        { label: "IC", score: ic, max: 10 },
        { label: "Monitoria", score: monitoria, max: 10 },
        { label: "Ligas", score: ligas, max: 10 },
        { label: "Voluntariado", score: voluntariado, max: 5 },
        { label: "Idiomas", score: idiomas, max: 10 },
      ],
    };
  };

  const scm_bh = (): { score: number; breakdown: ScoreBreakdown[] } => {
    const total_artigos = data.artigos_high_impact + data.artigos_mid_impact + data.artigos_low_impact + data.artigos_nacionais;
    const pubs = Math.min(2.0, (total_artigos * 0.5) + (data.apresentacao_congresso * 0.25));
    const ic = Math.min(2.0, (data.ic_com_bolsa * 0.5) + (data.ic_sem_bolsa * 0.25));
    const monitoria = data.monitoria_semestres >= 1 ? 1.0 : 0;
    const extensao = Math.min(4.0, (data.extensao_semestres * 0.5) + (data.membro_liga_anos * 0.5));
    const eventos = Math.min(1.0, data.ouvinte_congresso * 0.5);
    const historico = data.media_geral >= 80 ? 1.0 : 0;
    const score = Math.min(10.0, pubs + ic + monitoria + extensao + eventos + historico);
    return {
      score,
      breakdown: [
        { label: "Publicações", score: pubs, max: 2 },
        { label: "IC", score: ic, max: 2 },
        { label: "Monitoria", score: monitoria, max: 1 },
        { label: "Extensão", score: extensao, max: 4 },
        { label: "Eventos", score: eventos, max: 1 },
        { label: "Histórico", score: historico, max: 1 },
      ],
    };
  };

  const usp_rp = (): { score: number; breakdown: ScoreBreakdown[] } => {
    const total_artigos = data.artigos_high_impact + data.artigos_mid_impact + data.artigos_low_impact + data.artigos_nacionais;
    const pts_artigos = total_artigos * 1.0;
    const pts_apres = data.apresentacao_congresso * 0.5;
    const pts_ic = (data.ic_com_bolsa + data.ic_sem_bolsa) * 0.7;
    const bloco_cientifico = Math.min(3.0, pts_artigos + pts_apres + pts_ic);
    const monitoria = Math.min(1.5, data.monitoria_semestres * 0.5);
    const ligas_rep = Math.min(2.0, data.membro_liga_anos * 0.5) + Math.min(2.0, data.representante_turma_anos * 0.5);
    const voluntariado = data.voluntariado_horas >= 120 ? 0.5 : 0;
    const formacao = data.internato_hospital_ensino ? 1.0 : 0;
    const score = Math.min(10.0, bloco_cientifico + monitoria + ligas_rep + voluntariado + formacao);
    return {
      score,
      breakdown: [
        { label: "Científico", score: bloco_cientifico, max: 3 },
        { label: "Monitoria", score: monitoria, max: 1.5 },
        { label: "Ligas/Rep.", score: ligas_rep, max: 4 },
        { label: "Voluntariado", score: voluntariado, max: 0.5 },
        { label: "Formação", score: formacao, max: 1 },
      ],
    };
  };

  const ufpa = (): { score: number; breakdown: ScoreBreakdown[] } => {
    const total_artigos = data.artigos_high_impact + data.artigos_mid_impact + data.artigos_low_impact + data.artigos_nacionais;
    const pubs = Math.min(30, total_artigos * 10) + Math.min(20, data.apresentacao_congresso * 10);
    const ic = Math.min(21, (data.ic_com_bolsa * 6) + (data.ic_sem_bolsa * 5));
    const monitoria = Math.min(9, data.monitoria_semestres * 9);
    const extensao = Math.min(21, data.extensao_semestres * 6);
    const idiomas = Math.min(10, (data.ingles_fluente ? 5 : 0) + (data.ouvinte_congresso * 1));
    const score = Math.min(100, pubs + ic + monitoria + extensao + idiomas);
    return {
      score,
      breakdown: [
        { label: "Publicações", score: pubs, max: 50 },
        { label: "IC", score: ic, max: 21 },
        { label: "Monitoria", score: monitoria, max: 9 },
        { label: "Extensão", score: extensao, max: 21 },
        { label: "Idiomas", score: idiomas, max: 10 },
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
