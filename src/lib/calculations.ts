import { CurriculumData, InstitutionResult, CategoryScore } from "./types";

const cap = Math.min;

function calcUnicamp(d: CurriculumData): InstitutionResult {
  const pub = cap(15, d.artigos_pub_high_impact * 10 + d.artigos_pub_mid_impact * 10 + d.artigos_pub_low_impact * 5 + d.artigos_nacionais * 5);
  const ic = cap(20, d.ic_com_bolsa * 20 + d.ic_sem_bolsa * 10);
  const mon = d.monitoria_semestres > 2 ? 5 : d.monitoria_semestres > 0 ? 2 : 0;
  const ligas = cap(5, d.diretor_ligas * 5 + d.membro_liga * 2);
  const vol = d.voluntariado_horas >= 96 ? 5 : d.voluntariado_horas >= 48 ? 2 : 0;
  const cursos = cap(5, d.cursos_suporte * 2);
  const formacao = (d.internato_hospital_ensino ? 10 : 0) + (d.doutorado_concluido ? 15 : d.mestrado_concluido ? 10 : 0);

  const cats: CategoryScore[] = [
    { label: "Publicações", score: pub, max: 15 },
    { label: "Iniciação Científica", score: ic, max: 20 },
    { label: "Monitoria", score: mon, max: 5 },
    { label: "Ligas Acadêmicas", score: ligas, max: 5 },
    { label: "Voluntariado", score: vol, max: 5 },
    { label: "Cursos Extras", score: cursos, max: 5 },
    { label: "Formação/Outros", score: formacao, max: 25 },
  ];
  const total = cats.reduce((s, c) => s + c.score, 0);
  return { name: "UNICAMP", total, maxTotal: 80, categories: cats, isDecimal: false };
}

function calcUSP(d: CurriculumData): InstitutionResult {
  const allPub = d.artigos_pub_high_impact + d.artigos_pub_mid_impact + d.artigos_pub_low_impact + d.artigos_nacionais;
  const pub = cap(10, allPub * 10);
  const ic = cap(12, d.ic_com_bolsa * 2 + d.ic_sem_bolsa * 1);
  const mon = d.monitoria_semestres > 2 ? 3 : d.monitoria_semestres > 0 ? 1 : 0;
  const ligas = cap(8, d.diretor_ligas * 5 + d.representante_turma * 3);
  const vol = cap(2, d.extensao_semestres * 1);
  const cursos = cap(4, d.cursos_suporte * 2);

  const cats: CategoryScore[] = [
    { label: "Publicações", score: pub, max: 10 },
    { label: "Iniciação Científica", score: ic, max: 12 },
    { label: "Monitoria", score: mon, max: 3 },
    { label: "Ligas Acadêmicas", score: ligas, max: 8 },
    { label: "Voluntariado", score: vol, max: 2 },
    { label: "Cursos Extras", score: cursos, max: 4 },
  ];
  const total = cats.reduce((s, c) => s + c.score, 0);
  return { name: "USP-SP", total, maxTotal: 39, categories: cats, isDecimal: false };
}

function calcPSUMG(d: CurriculumData): InstitutionResult {
  const allPub = d.artigos_pub_high_impact + d.artigos_pub_mid_impact + d.artigos_pub_low_impact + d.artigos_nacionais;
  const pub = cap(2.0, allPub * 0.7);
  const ic = cap(2.0, d.ic_com_bolsa * 0.5 + d.ic_sem_bolsa * 0.3);
  const mon = d.monitoria_semestres >= 1 ? 1.0 : 0;
  const ligas = cap(4.0, d.membro_liga * 0.8 + d.diretor_ligas * 0.3 + d.extensao_semestres * 0.7);
  const estagio = d.estagio_extracurricular >= 180 ? 1.0 : d.estagio_extracurricular >= 90 ? 0.5 : 0;
  const idiomas = cap(2.5, (d.ingles_fluente ? 1.5 : 0) + d.cursos_suporte * 0.7);
  const historico = d.media_geral_notas >= 85 ? 1.5 : d.media_geral_notas >= 80 ? 1.0 : 0.5;

  const cats: CategoryScore[] = [
    { label: "Publicações", score: pub, max: 2.0 },
    { label: "Iniciação Científica", score: ic, max: 2.0 },
    { label: "Monitoria", score: mon, max: 1.0 },
    { label: "Ligas/Extensão", score: ligas, max: 4.0 },
    { label: "Estágio", score: estagio, max: 1.0 },
    { label: "Idiomas/Cursos", score: idiomas, max: 2.5 },
    { label: "Histórico", score: historico, max: 1.5 },
  ];
  const total = cap(10, cats.reduce((s, c) => s + c.score, 0));
  return { name: "PSU-MG", total, maxTotal: 10, categories: cats, isDecimal: true };
}

function calcFMABC(d: CurriculumData): InstitutionResult {
  const allPub = d.artigos_pub_high_impact + d.artigos_pub_mid_impact + d.artigos_pub_low_impact + d.artigos_nacionais;
  const cientifica = (allPub >= 2 ? 1.0 : allPub > 0 ? 0.5 : 0) +
    (d.apresentacao_congresso >= 2 ? 1.0 : d.apresentacao_congresso > 0 ? 0.5 : 0) +
    (d.ouvinte_congresso >= 4 ? 0.5 : d.ouvinte_congresso > 0 ? 0.25 : 0);
  const icScore = (d.ic_com_bolsa + d.ic_sem_bolsa) >= 1 ? 1.0 : 0;
  const item3 = cap(4.0, cientifica + icScore);
  const item2 = cap(1.5, d.monitoria_semestres * 0.5);
  const extra = (d.testes_progresso >= 4 ? 1.0 : d.testes_progresso > 0 ? 0.5 : 0) +
    (d.estagio_extracurricular > 120 ? 1.0 : 0) +
    (d.membro_liga > 0 ? 0.5 : 0) +
    (d.projeto_rondon ? 0.5 : 0) +
    (d.representante_turma > 0 ? 0.5 : 0) +
    (d.cursos_suporte > 0 ? 0.5 : 0);
  const item1 = cap(4.0, extra);
  const item4 = d.ingles_fluente ? 0.5 : 0;

  const cats: CategoryScore[] = [
    { label: "Produção Científica", score: item3, max: 4.0 },
    { label: "Monitoria", score: item2, max: 1.5 },
    { label: "Extracurricular", score: item1, max: 4.0 },
    { label: "Inglês", score: item4, max: 0.5 },
  ];
  const total = cap(10, cats.reduce((s, c) => s + c.score, 0));
  return { name: "FMABC", total, maxTotal: 10, categories: cats, isDecimal: true };
}

function calcSESPE(d: CurriculumData): InstitutionResult {
  const allPub = d.artigos_pub_high_impact + d.artigos_pub_mid_impact + d.artigos_pub_low_impact + d.artigos_nacionais;
  const pub = cap(10, allPub * 3 + d.capitulos_livro * 2);
  const ic = cap(10, d.ic_com_bolsa * 5 + d.ic_sem_bolsa * 3);
  const mon = cap(5, d.monitoria_semestres * 2);
  const ligas = cap(5, d.diretor_ligas * 3 + d.membro_liga * 1);
  const vol = cap(5, d.voluntariado_horas >= 100 ? 5 : d.voluntariado_horas >= 50 ? 3 : 0);
  const cursos = cap(10, d.cursos_suporte * 3 + (d.ingles_fluente ? 4 : 0));
  const formacao = (d.doutorado_concluido ? 10 : d.mestrado_concluido ? 5 : 0);

  const cats: CategoryScore[] = [
    { label: "Publicações", score: pub, max: 10 },
    { label: "Iniciação Científica", score: ic, max: 10 },
    { label: "Monitoria", score: mon, max: 5 },
    { label: "Ligas Acadêmicas", score: ligas, max: 5 },
    { label: "Voluntariado", score: vol, max: 5 },
    { label: "Cursos/Idiomas", score: cursos, max: 10 },
    { label: "Formação", score: formacao, max: 10 },
  ];
  const total = cats.reduce((s, c) => s + c.score, 0);
  return { name: "SES-PE", total, maxTotal: 55, categories: cats, isDecimal: false };
}

function calcSESDF(d: CurriculumData): InstitutionResult {
  const allPub = d.artigos_pub_high_impact + d.artigos_pub_mid_impact + d.artigos_pub_low_impact + d.artigos_nacionais;
  const pub = cap(10, allPub * 2 + d.capitulos_livro * 1);
  const ic = cap(10, d.ic_com_bolsa * 5 + d.ic_sem_bolsa * 3);
  const mon = cap(5, d.monitoria_semestres * 2);
  const ligas = cap(5, d.diretor_ligas * 3 + d.membro_liga * 1);
  const vol = d.voluntariado_horas >= 100 ? 5 : d.voluntariado_horas >= 50 ? 3 : 0;
  const cursos = cap(5, d.cursos_suporte * 2);
  const formacao = (d.doutorado_concluido ? 10 : d.mestrado_concluido ? 5 : 0) + (d.tempo_trabalho_sus >= 12 ? 5 : d.tempo_trabalho_sus >= 6 ? 3 : 0);

  const cats: CategoryScore[] = [
    { label: "Publicações", score: pub, max: 10 },
    { label: "Iniciação Científica", score: ic, max: 10 },
    { label: "Monitoria", score: mon, max: 5 },
    { label: "Ligas Acadêmicas", score: ligas, max: 5 },
    { label: "Voluntariado", score: vol, max: 5 },
    { label: "Cursos Extras", score: cursos, max: 5 },
    { label: "Formação/Outros", score: formacao, max: 15 },
  ];
  const total = cats.reduce((s, c) => s + c.score, 0);
  return { name: "SES-DF", total, maxTotal: 55, categories: cats, isDecimal: false };
}

function calcEinstein(d: CurriculumData): InstitutionResult {
  const allPub = d.artigos_pub_high_impact + d.artigos_pub_mid_impact + d.artigos_pub_low_impact + d.artigos_nacionais;
  const pub = cap(15, d.artigos_pub_high_impact * 5 + d.artigos_pub_mid_impact * 3 + d.artigos_pub_low_impact * 2 + d.artigos_nacionais * 1);
  const ic = cap(10, d.ic_com_bolsa * 5 + d.ic_sem_bolsa * 3);
  const mon = cap(5, d.monitoria_semestres * 2);
  const ligas = cap(5, d.diretor_ligas * 3 + d.membro_liga * 1);
  const vol = cap(5, d.voluntariado_horas >= 96 ? 5 : d.voluntariado_horas >= 48 ? 3 : 0);
  const cursos = cap(5, d.cursos_suporte * 2);
  const formacao = (d.doutorado_concluido ? 10 : d.mestrado_concluido ? 5 : 0) +
    (d.ingles_fluente ? 5 : 0) +
    (d.ranking_ruf_top35 ? 5 : 0);

  const cats: CategoryScore[] = [
    { label: "Publicações", score: pub, max: 15 },
    { label: "Iniciação Científica", score: ic, max: 10 },
    { label: "Monitoria", score: mon, max: 5 },
    { label: "Ligas Acadêmicas", score: ligas, max: 5 },
    { label: "Voluntariado", score: vol, max: 5 },
    { label: "Cursos Extras", score: cursos, max: 5 },
    { label: "Formação/Outros", score: formacao, max: 20 },
  ];
  const total = cats.reduce((s, c) => s + c.score, 0);
  return { name: "EINSTEIN", total, maxTotal: 65, categories: cats, isDecimal: false };
}

export function calculateAll(d: CurriculumData): InstitutionResult[] {
  return [
    calcUnicamp(d),
    calcUSP(d),
    calcPSUMG(d),
    calcFMABC(d),
    calcSESPE(d),
    calcSESDF(d),
    calcEinstein(d),
  ];
}
