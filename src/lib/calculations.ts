import { UserProfile, InstitutionScore, DetailItem } from "./types";

export const calculateScores = (data: UserProfile): InstitutionScore[] => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- helper legado preservado at\u00e9 Story 1.9 (migra\u00e7\u00e3o para seeds SQL).
  const val = (v: any) => Number(v) || 0;

  // --- 1. UNICAMP (Base 100) ---
  const unicamp = (): InstitutionScore => {
    const pubs = Math.min(15, (val(data.artigos_high_impact) * 10) + (val(data.artigos_mid_impact) * 5) + (val(data.artigos_nacionais) * 2));
    const ic = Math.min(20, (val(data.ic_com_bolsa) * 20) + (val(data.ic_sem_bolsa) * 10));
    const monitoria = val(data.monitoria_semestres) > 2 ? 5 : (val(data.monitoria_semestres) > 0 ? 2 : 0);
    const ligas = Math.min(5, (val(data.diretoria_ligas) * 5) + (val(data.membro_liga_anos) * 2));
    const voluntariado = val(data.voluntariado_horas) >= 96 ? 5 : (val(data.voluntariado_horas) >= 48 ? 2 : 0);
    const cursos = Math.min(5, val(data.cursos_suporte) * 2.5);
    const formacao = (data.internato_hospital_ensino ? 10 : 0) + (data.doutorado ? 15 : (data.mestrado ? 10 : 0));
    const idiomas = data.ingles_fluente ? 10 : 0;
    const eventos = Math.min(10, val(data.apresentacao_congresso) * 2.5);

    return {
      name: "UNICAMP",
      score: Math.min(100, pubs + ic + monitoria + ligas + voluntariado + cursos + formacao + idiomas + eventos),
      base: 100,
      details: [
        { label: "Atividades de Pesquisa (IC)", value: ic, max: 20, rule: "Bolsa Oficial: 20 pts | Voluntária: 10 pts" },
        { label: "Publicações Científicas", value: pubs, max: 15, rule: "Autor principal indexado: 10 pts | Coautor/Nacional: 2 a 5 pts" },
        { label: "Apresentação em Congressos", value: eventos, max: 10, rule: "Apresentação oral ou Pôster (2,5 pts cada)" },
        { label: "Ativ. de Extensão Universitária", value: voluntariado, max: 5, rule: "Carga horária > 96h (5 pts) | > 48h (2 pts)" },
        { label: "Participação Institucional", value: ligas, max: 5, rule: "Cargo de Gestão/Diretoria (5 pts) | Membro (2 pts)" },
        { label: "Programa de Monitoria", value: monitoria, max: 5, rule: "Duração > 2 semestres (5 pts) | 1 a 2 semestres (2 pts)" },
        { label: "Cursos Extracurriculares Médicos", value: cursos, max: 5, rule: "Cursos de Suporte (2,5 pts cada)" },
        { label: "Proficiência em Idiomas", value: idiomas, max: 10, rule: "Certificado de Proficiência em Inglês (10 pts)" },
        { label: "Pós-Graduação e Formação", value: formacao, max: 25, rule: "Internato Próprio (10 pts) | Mestrado (10 pts) | Doutorado (15 pts)" },
      ]
    };
  };

  // --- 2. USP-SP (Base 100) ---
  const usp_sp = (): InstitutionScore => {
    const pubs = Math.min(15, (val(data.artigos_high_impact) * 10) + (val(data.artigos_mid_impact) * 5) + (val(data.artigos_low_impact) * 2));
    const ic = Math.min(14, (val(data.ic_com_bolsa) * 7) + (val(data.ic_sem_bolsa) * 3));
    const monitoria = Math.min(4, val(data.monitoria_semestres) * 2);
    const ligas_rep = Math.min(10, (val(data.diretoria_ligas) * 3) + (val(data.representante_turma_anos) * 4));
    const extensao = Math.min(10, (val(data.extensao_semestres) * 2) + (val(data.voluntariado_horas) > 0 ? 4 : 0) + (data.projeto_rondon ? 4 : 0));
    const cursos = Math.min(4, val(data.cursos_suporte) * 2);
    const instituicao_origem = (data.internato_hospital_ensino ? 10 : 0) + (data.ranking_ruf_top35 ? 5 : 0);
    const idiomas = data.ingles_fluente ? 10 : 0;
    const congressos = Math.min(10, (val(data.apresentacao_congresso) * 3) + (val(data.ouvinte_congresso) * 1));
    const historico = (data.media_geral !== null && val(data.media_geral) >= 80) ? 8 : 0;

    return {
      name: "USP-SP",
      score: Math.min(100, pubs + ic + monitoria + ligas_rep + extensao + cursos + instituicao_origem + idiomas + congressos + historico),
      base: 100,
      details: [
        { label: "1. Instituição de Origem", value: instituicao_origem, max: 15, rule: "Hospital de Ensino Próprio (10 pts) | Top 35 RUF (5 pts)" },
        { label: "2. Produção Científica", value: pubs, max: 15, rule: "Alto impacto: 10 pts | Baixo impacto: 2 pts" },
        { label: "3. Iniciação Científica", value: ic, max: 14, rule: "Com bolsa Oficial: 7 pts/ano | Sem bolsa: 3 pts/ano" },
        { label: "4. Participação em Eventos", value: congressos, max: 10, rule: "Apresentação (3 pts) | Ouvinte (1 pt)" },
        { label: "5. Extensão e Voluntariado", value: extensao, max: 10, rule: "Voluntariado (4 pts) | Projeto Rondon (4 pts)" },
        { label: "6. Representação e Ligas", value: ligas_rep, max: 10, rule: "Centro Acadêmico (4 pts) | Diretoria de Ligas (3 pts)" },
        { label: "7. Programas de Monitoria", value: monitoria, max: 4, rule: "Monitoria Oficial (2 pts por semestre)" },
        { label: "8. Cursos de Suporte de Vida", value: cursos, max: 4, rule: "ACLS, ATLS ou PALS (2 pts por curso validado)" },
        { label: "9. Proficiência Idiomas", value: idiomas, max: 10, rule: "Certificação Oficial de Proficiência (10 pts)" },
        { label: "10. Desempenho Acadêmico", value: historico, max: 8, rule: "Média Global Ponderada >= 8,0 ou 80% (8 pts)" },
      ]
    };
  };

  // --- 3. PSU-MG (Base 10.0) ---
  const psu_mg = (): InstitutionScore => {
    const pubs = Math.min(2.0, (val(data.artigos_high_impact) * 0.7) + (val(data.artigos_mid_impact) * 0.7) + (val(data.artigos_low_impact) * 0.7) + (val(data.artigos_nacionais) * 0.7));
    const ic = Math.min(2.0, (val(data.ic_com_bolsa) * 0.5) + (val(data.ic_sem_bolsa) * 0.3));
    const monitoria = val(data.monitoria_semestres) >= 1 ? 1.0 : 0;
    const ligas_ext = Math.min(4.0, (val(data.membro_liga_anos) * 0.8) + (val(data.diretoria_ligas) * 0.3) + (val(data.extensao_semestres) * 0.7));
    const estagio = val(data.estagio_extracurricular_horas) >= 180 ? 1.0 : (val(data.estagio_extracurricular_horas) >= 90 ? 0.5 : 0);
    const idiomas = Math.min(2.5, (data.ingles_fluente ? 1.5 : 0) + (val(data.cursos_suporte) * 0.7));
    const historico = val(data.media_geral) >= 85 ? 1.5 : (val(data.media_geral) >= 80 ? 1.0 : (data.media_geral !== null ? 0.5 : 0));

    return {
      name: "PSU-MG",
      score: Math.min(10.0, pubs + ic + monitoria + ligas_ext + estagio + idiomas + historico),
      base: 10,
      details: [
        { label: "A. Histórico Escolar", value: historico, max: 1.5, rule: "Conceito A ou >85% (1.5) | B ou >80% (1.0) | C ou >70% (0.5)" },
        { label: "B. Iniciação Científica", value: ic, max: 2.0, rule: "Com bolsa (0.5/ano) | Sem bolsa (0.3/ano)" },
        { label: "C. Produção Científica", value: pubs, max: 2.0, rule: "Artigos em revistas indexadas (0.7 por publicação)" },
        { label: "D. Programas de Monitoria", value: monitoria, max: 1.0, rule: "Mínimo 1 semestre oficial (1.0 pt)" },
        { label: "E. Ativ. Extensão e Ligas", value: ligas_ext, max: 4.0, rule: "Projetos (0.7) | Membro Liga (0.8) | Diretoria (0.3)" },
        { label: "F. Estágio Extracurricular", value: estagio, max: 1.0, rule: "Carga horária >180h (1.0) | Carga horária >90h (0.5)" },
        { label: "G. Cursos e Idiomas", value: idiomas, max: 2.5, rule: "Inglês/Espanhol (1.5) | Cursos Suporte (0.7)" },
      ]
    };
  };

  // --- 4. FMABC (Base 10.0) ---
  const fmabc = (): InstitutionScore => {
    const total_artigos = val(data.artigos_high_impact) + val(data.artigos_mid_impact) + val(data.artigos_low_impact) + val(data.artigos_nacionais);
    const p_artigos = total_artigos >= 2 ? 1.0 : (total_artigos === 1 ? 0.5 : 0);
    const p_apres = val(data.apresentacao_congresso) >= 2 ? 1.0 : (val(data.apresentacao_congresso) === 1 ? 0.5 : 0);
    const p_organizador = val(data.organizador_evento) >= 1 ? 0.5 : 0;
    const p_ouvinte = val(data.ouvinte_congresso) >= 4 ? 0.5 : (val(data.ouvinte_congresso) >= 1 ? 0.25 : 0);
    const p_ic = (val(data.ic_com_bolsa) + val(data.ic_sem_bolsa)) >= 1 ? 1.0 : 0;
    const bloco_cientifico = Math.min(4.0, p_artigos + p_apres + p_organizador + p_ouvinte + p_ic);

    const anos_mon = Math.floor(val(data.monitoria_semestres) / 2);
    const sem_mon = val(data.monitoria_semestres) % 2;
    const bloco_monitoria = Math.min(1.5, (anos_mon * 1.0) + (sem_mon * 0.5));

    const p_teste = val(data.teste_progresso) >= 4 ? 1.0 : (val(data.teste_progresso) >= 1 ? 0.5 : 0);
    const p_estagio = val(data.estagio_extracurricular_horas) >= 120 ? 1.0 : 0;
    const p_ligas = (val(data.diretoria_ligas) + val(data.membro_liga_anos)) >= 1 ? 0.5 : 0;
    const p_social = (data.projeto_rondon || val(data.voluntariado_horas) > 0) ? 0.5 : 0;
    const p_rep = val(data.representante_turma_anos) >= 1 ? 0.5 : 0;
    const p_acls = val(data.cursos_suporte) >= 1 ? 0.5 : 0;
    const bloco_extra = Math.min(4.0, p_teste + p_estagio + p_ligas + p_social + p_rep + p_acls);

    const bloco_idioma = data.ingles_fluente ? 0.5 : 0;

    return {
      name: "FMABC",
      score: Math.min(10.0, bloco_cientifico + bloco_monitoria + bloco_extra + bloco_idioma),
      base: 10,
      details: [
        { label: "Item 1: Estágios e Ativ. Extracurriculares", value: bloco_extra, max: 4.0, rule: "Teste Progresso (1.0) | Estágio >120h (1.0) | Ligas/Social/Rep/ACLS (0.5 cada)" },
        { label: "Item 2: Monitorias", value: bloco_monitoria, max: 1.5, rule: "Duração de 1 ano: 1.0 pt | Duração 1 semestre: 0.5 pt" },
        { label: "Item 3: Produção Científica", value: bloco_cientifico, max: 4.0, rule: "Artigos/Apresentações: até 1.0 pt | IC > 1 ano: 1.0 pt | Ouvinte: 0.5 pt" },
        { label: "Item 4: Língua Estrangeira", value: bloco_idioma, max: 0.5, rule: "Fluência comprovada (Inglês): 0.5 pt" },
      ]
    };
  };

  // --- 5. EINSTEIN (Base 100) ---
  const einstein = (): InstitutionScore => {
    const pubs = Math.min(70, (val(data.artigos_high_impact) * 35) + (val(data.artigos_mid_impact) * 15) + (val(data.artigos_low_impact) * 5) + (val(data.artigos_nacionais) * 2));
    let ic_pontos = 0;
    if (val(data.ic_horas_totais) >= 400) ic_pontos = 30;
    else if (val(data.ic_horas_totais) >= 300) ic_pontos = 25;
    else if (val(data.ic_horas_totais) >= 200) ic_pontos = 20;
    else if (val(data.ic_horas_totais) >= 100) ic_pontos = 15;
    else if (val(data.ic_horas_totais) > 0) ic_pontos = 5;

    const pos = data.doutorado ? 30 : (data.mestrado ? 25 : 0);

    return {
      name: "EINSTEIN",
      score: Math.min(100, pubs + ic_pontos + pos),
      base: 100,
      details: [
        { label: "1. Publicações em Periódicos Indexados", value: pubs, max: 70, rule: "1º Autor Qualis A/JCR>3.0 (35pts) | JCR 0.5-3.0 (15pts) | Outros (5pts)" },
        { label: "2. Iniciação Científica Institucional", value: ic_pontos, max: 30, rule: "CH >400h (30pts) | >300h (25pts) | >200h (20pts) | >100h (15pts)" },
        { label: "3. Pós-Graduação Stricto Sensu", value: pos, max: 30, rule: "Doutorado concluído (30 pts) | Mestrado concluído (25 pts)" },
      ]
    };
  };

  // --- 6. SCMSP (Santa Casa SP - Base 100) ---
  const scmsp = (): InstitutionScore => {
    const formacao = (data.internato_hospital_ensino ? 10 : 0) + (data.ranking_ruf_top35 !== null ? (data.ranking_ruf_top35 ? 20 : 5) : 0);
    const pubs = Math.min(10, ((val(data.artigos_high_impact) + val(data.artigos_mid_impact) + val(data.artigos_low_impact)) * 10));
    const ic = val(data.ic_com_bolsa) > 0 ? 10 : 0;
    const monitoria = val(data.monitoria_semestres) > 0 ? 10 : 0;
    const ligas = (val(data.diretoria_ligas) + val(data.membro_liga_anos)) > 0 ? 10 : 0;
    const voluntariado = val(data.voluntariado_horas) > 0 ? 5 : 0;
    const idiomas = (data.ingles_fluente ? 10 : 0);
    const eventos = Math.min(10, val(data.apresentacao_congresso) * 5);
    const cursos = Math.min(5, val(data.cursos_suporte) * 5);

    return {
      name: "SCMSP",
      score: Math.min(100, formacao + pubs + ic + monitoria + ligas + voluntariado + idiomas + eventos + cursos),
      base: 100,
      details: [
        { label: "Formação na Graduação", value: formacao, max: 30, rule: "Top 35 RUF: 20pts (Outras 5pts) | Internato próprio: 10pts" },
        { label: "Publicações Científicas", value: pubs, max: 10, rule: "10 pts por artigo publicado" },
        { label: "Iniciação Científica", value: ic, max: 10, rule: "10 pts se possuir IC com bolsa" },
        { label: "Monitoria Oficial", value: monitoria, max: 10, rule: "10 pts se possui histórico" },
        { label: "Liderança e Ligas", value: ligas, max: 10, rule: "10 pts se participou ativamente" },
        { label: "Ações Voluntárias", value: voluntariado, max: 5, rule: "5 pts se possui horas" },
        { label: "Proficiência em Idiomas", value: idiomas, max: 10, rule: "Inglês Fluente: 10 pts" },
        { label: "Apresentação em Eventos", value: eventos, max: 10, rule: "Apresentações: 5 pts cada" },
        { label: "Cursos Suporte (ACLS)", value: cursos, max: 5, rule: "5 pts se possui" },
      ]
    };
  };

  // --- 7. SES-PE (Base 100) ---
  const ses_pe = (): InstitutionScore => {
    const pubs = Math.min(10, ((val(data.artigos_high_impact) + val(data.artigos_mid_impact) + val(data.artigos_low_impact) + val(data.artigos_nacionais)) * 5) + (val(data.apresentacao_congresso) * 2.5));
    const ic = Math.min(15, (val(data.ic_com_bolsa) + val(data.ic_sem_bolsa)) * 5);
    const monitoria = Math.min(15, val(data.monitoria_semestres) * 5);
    const extensao = Math.min(20, (val(data.extensao_semestres) * 5) + (data.projeto_rondon ? 10 : 0));

    let historico = 0;
    if (data.media_geral !== null) {
      if (val(data.media_geral) >= 85) historico = 30;
      else if (val(data.media_geral) >= 80) historico = 25;
      else if (val(data.media_geral) >= 75) historico = 20;
      else if (val(data.media_geral) >= 70) historico = 15;
      else historico = 10;
    }

    const ligas = Math.min(5, val(data.membro_liga_anos) * 2.5);
    const idiomas = data.ingles_fluente ? 5 : 0;

    return {
      name: "SES-PE",
      score: Math.min(100, pubs + ic + monitoria + extensao + historico + ligas + idiomas),
      base: 100,
      details: [
        { label: "Produção Científica", value: pubs, max: 10, rule: "Artigo: 5 pts | Apresentação: 2,5 pts" },
        { label: "Iniciação Científica", value: ic, max: 15, rule: "5 pts por projeto/ano" },
        { label: "Atividades de Monitoria", value: monitoria, max: 15, rule: "5 pts por semestre" },
        { label: "Atividades de Extensão", value: extensao, max: 20, rule: "5 pts/semestre | Rondon: 10 pts" },
        { label: "Desempenho (Histórico Escolar)", value: historico, max: 30, rule: ">=85: 30pts | >=80: 25pts | <70: 10pts" },
        { label: "Ligas Acadêmicas", value: ligas, max: 5, rule: "2,5 pts por ano" },
        { label: "Língua Estrangeira", value: idiomas, max: 5, rule: "Inglês Fluente: 5 pts" },
      ]
    };
  };

  // --- 8. SES-DF (Base 10.0) ---
  const ses_df = (): InstitutionScore => {
    const pubs = Math.min(1.0, ((val(data.artigos_high_impact) + val(data.artigos_mid_impact) + val(data.artigos_low_impact)) * 0.5) + (val(data.apresentacao_congresso) * 0.2));
    const ic = Math.min(1.0, (val(data.ic_com_bolsa) + val(data.ic_sem_bolsa)) * 0.5);
    const monitoria = Math.min(1.0, val(data.monitoria_semestres) * 0.5);
    const extensao = Math.min(1.0, val(data.extensao_semestres) * 0.5);
    const social = Math.min(2.0, (data.projeto_rondon ? 1.0 : 0) + (Math.floor(val(data.trabalho_sus_meses) / 5) * 0.5));
    const historico = (data.media_geral !== null && val(data.media_geral) >= 80) ? 0.5 : 0;
    const eventos = Math.min(1.0, (val(data.ouvinte_congresso) * 0.1) + (val(data.cursos_suporte) * 0.1));
    const ligas = Math.min(1.5, val(data.membro_liga_anos) * 0.5);
    const representante = val(data.representante_turma_anos) > 0 ? 0.5 : 0;
    const idioma = data.ingles_fluente ? 0.5 : 0;

    return {
      name: "SES-DF",
      score: Math.min(10.0, pubs + ic + monitoria + extensao + social + historico + eventos + ligas + representante + idioma),
      base: 10,
      details: [
        { label: "Publicações", value: pubs, max: 1.0, rule: "Artigo: 0.5 | Apres: 0.2" },
        { label: "Iniciação Científica", value: ic, max: 1.0, rule: "0.5 por projeto" },
        { label: "Monitoria", value: monitoria, max: 1.0, rule: "0.5 por semestre" },
        { label: "Extensão", value: extensao, max: 1.0, rule: "0.5 por projeto" },
        { label: "Experiência/Rondon", value: social, max: 2.0, rule: "Rondon: 1.0 | Trab. SUS: 0.5 a cada 5m" },
        { label: "Histórico Escolar", value: historico, max: 0.5, rule: ">= 80: 0.5 pts" },
        { label: "Eventos e Cursos", value: eventos, max: 1.0, rule: "Ouvinte: 0.1 | Curso: 0.1" },
        { label: "Ligas Acadêmicas", value: ligas, max: 1.5, rule: "0.5 por ano" },
        { label: "Representante de Turma", value: representante, max: 0.5, rule: "Se possui: 0.5 pts" },
        { label: "Idiomas", value: idioma, max: 0.5, rule: "Inglês Fluente: 0.5 pts" },
      ]
    };
  };

  // --- 9. SCM-BH (Santa Casa BH - Base 10.0) ---
  const scm_bh = (): InstitutionScore => {
    const total_artigos = val(data.artigos_high_impact) + val(data.artigos_mid_impact) + val(data.artigos_low_impact) + val(data.artigos_nacionais);
    const pubs = Math.min(2.0, (total_artigos * 0.5) + (val(data.apresentacao_congresso) * 0.25));
    const ic = Math.min(2.0, (val(data.ic_com_bolsa) * 0.5) + (val(data.ic_sem_bolsa) * 0.25));
    const monitoria = val(data.monitoria_semestres) >= 1 ? 1.0 : 0;
    const extensao = Math.min(4.0, (val(data.extensao_semestres) * 0.5) + (val(data.membro_liga_anos) * 0.5));
    const eventos = Math.min(1.0, val(data.ouvinte_congresso) * 0.5);
    const historico = (data.media_geral !== null && val(data.media_geral) >= 80) ? 1.0 : 0;

    return {
      name: "SCM-BH",
      score: Math.min(10.0, pubs + ic + monitoria + extensao + eventos + historico),
      base: 10,
      details: [
        { label: "Produção Científica", value: pubs, max: 2.0, rule: "Artigos (0.5 cada) | Apresentações (0.25 cada)" },
        { label: "Iniciação Científica", value: ic, max: 2.0, rule: "Com bolsa (0.5/ano) | Sem bolsa (0.25/ano)" },
        { label: "Monitoria", value: monitoria, max: 1.0, rule: "Mínimo de 1 semestre concluído (1.0 pt)" },
        { label: "Extensão e Ligas", value: extensao, max: 4.0, rule: "Projeto Extensão (0.5/sem) | Liga (0.5/ano)" },
        { label: "Participação em Eventos", value: eventos, max: 1.0, rule: "Ouvinte em Congresso (0.5 por evento)" },
        { label: "Histórico Escolar", value: historico, max: 1.0, rule: "Média Global >= 80% (1.0 pt)" },
      ]
    };
  };

  // --- 10. USP-RP (Ribeirão Preto - Base 10.0) ---
  const usp_rp = (): InstitutionScore => {
    const total_artigos = val(data.artigos_high_impact) + val(data.artigos_mid_impact) + val(data.artigos_low_impact) + val(data.artigos_nacionais);
    const pts_artigos = total_artigos * 1.0;
    const pts_apres = val(data.apresentacao_congresso) * 0.5;
    const pts_ic = (val(data.ic_com_bolsa) + val(data.ic_sem_bolsa)) * 0.7;
    const bloco_cientifico = Math.min(3.0, pts_artigos + pts_apres + pts_ic);

    const monitoria = Math.min(1.5, val(data.monitoria_semestres) * 0.5);
    const ligas_rep = Math.min(2.0, val(data.membro_liga_anos) * 0.5) + Math.min(2.0, val(data.representante_turma_anos) * 0.5);
    const voluntariado = val(data.voluntariado_horas) >= 120 ? 0.5 : 0;
    const formacao = data.internato_hospital_ensino ? 1.0 : 0;

    return {
      name: "USP-RP",
      score: Math.min(10.0, bloco_cientifico + monitoria + ligas_rep + voluntariado + formacao),
      base: 10,
      details: [
        { label: "1. Produção e Iniciação Científica", value: bloco_cientifico, max: 3.0, rule: "Artigo (1.0) | Apresentação (0.5) | IC (0.7/ano)" },
        { label: "2. Programas de Monitoria", value: monitoria, max: 1.5, rule: "0.5 pt por semestre de monitoria" },
        { label: "3. Representação e Ligas", value: ligas_rep, max: 4.0, rule: "Membro Liga (Max 2.0 - 0.5/ano) | Rep (Max 2.0 - 0.5/ano)" },
        { label: "4. Voluntariado", value: voluntariado, max: 0.5, rule: "Carga horária mínima de 120h (0.5 pt)" },
        { label: "5. Formação / Hospital de Ensino", value: formacao, max: 1.0, rule: "Internato em Hospital Próprio/Conveniado (1.0 pt)" },
      ]
    };
  };

  // --- 11. UFPA (Base 100) ---
  const ufpa = (): InstitutionScore => {
    const total_artigos = val(data.artigos_high_impact) + val(data.artigos_mid_impact) + val(data.artigos_low_impact) + val(data.artigos_nacionais);
    const pubs = Math.min(30, total_artigos * 10) + Math.min(20, val(data.apresentacao_congresso) * 10);
    const ic = Math.min(21, (val(data.ic_com_bolsa) * 6) + (val(data.ic_sem_bolsa) * 5));
    const monitoria = Math.min(9, val(data.monitoria_semestres) * 9);
    const extensao = Math.min(21, val(data.extensao_semestres) * 6);
    const idiomas = Math.min(10, (data.ingles_fluente ? 5 : 0) + (val(data.ouvinte_congresso) * 1));

    return {
      name: "UFPA",
      score: Math.min(100, pubs + ic + monitoria + extensao + idiomas),
      base: 100,
      details: [
        { label: "Trabalhos Científicos e Publicações", value: pubs, max: 50, rule: "Artigo (10 pts, Max 30) | Apresentação (10 pts, Max 20)" },
        { label: "Pesquisa / Iniciação Científica", value: ic, max: 21, rule: "Com bolsa (6 pts/projeto) | Sem bolsa (5 pts/projeto)" },
        { label: "Monitoria Oficial", value: monitoria, max: 9, rule: "9 pts por semestre de monitoria (Teto 9)" },
        { label: "Extensão Universitária", value: extensao, max: 21, rule: "6 pts por semestre de extensão" },
        { label: "Idiomas e Participação em Eventos", value: idiomas, max: 10, rule: "Inglês Fluente (5 pts) | Ouvinte em Congresso (1 pt/evento)" },
      ]
    };
  };

  return [unicamp(), usp_sp(), psu_mg(), fmabc(), einstein(), scmsp(), ses_pe(), ses_df(), scm_bh(), usp_rp(), ufpa()];
};
