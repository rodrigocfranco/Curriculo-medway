import { UserProfile } from "@/lib/types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BookOpen, GraduationCap, CalendarDays, User, Heart, Info } from "lucide-react";

interface Props {
  data: UserProfile;
  onChange: (data: UserProfile) => void;
}

function HelpTip({ text }: { text: string }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help inline ml-1" />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[240px] text-xs">
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function NumberField({ label, value, onChange, min = 0, max, step = 1, help }: {
  label: string; value: number | null; onChange: (v: number | null) => void; min?: number; max?: number; step?: number; help?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm text-muted-foreground">
        {label}
        {help && <HelpTip text={help} />}
      </Label>
      <Input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value === null || value === undefined ? "" : value}
        placeholder="—"
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "" || raw === null) {
            onChange(null);
          } else {
            onChange(Number(raw));
          }
        }}
        className="h-10"
      />
    </div>
  );
}

function BoolField({ label, value, onChange, help }: {
  label: string; value: boolean; onChange: (v: boolean) => void; help?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <Label className="text-sm text-muted-foreground">
        {label}
        {help && <HelpTip text={help} />}
      </Label>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}

export default function CurriculumForm({ data, onChange }: Props) {
  const set = <K extends keyof UserProfile>(key: K, val: UserProfile[K]) => {
    onChange({ ...data, [key]: val });
  };

  return (
    <Accordion type="multiple" defaultValue={["pub", "acad", "pratica", "lideranca", "perfil"]} className="space-y-3">
      <AccordionItem value="pub" className="form-section">
        <AccordionTrigger className="section-header hover:no-underline py-0">
          <span className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Publicações
          </span>
        </AccordionTrigger>
        <AccordionContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <NumberField label="Artigos High Impact (IF > 3.0)" value={data.artigos_high_impact} onChange={val => set("artigos_high_impact", val)} help="Até 35pts no Einstein | 10pts na UNICAMP" />
            <NumberField label="Artigos Mid Impact (IF 0.5-3.0)" value={data.artigos_mid_impact} onChange={val => set("artigos_mid_impact", val)} help="Até 15pts no Einstein | 5pts na UNICAMP" />
            <NumberField label="Artigos Low Impact / Coautor" value={data.artigos_low_impact} onChange={val => set("artigos_low_impact", val)} help="Até 5pts no Einstein | 2pts na USP-SP" />
            <NumberField label="Artigos Nacionais (SciELO/LILACS)" value={data.artigos_nacionais} onChange={val => set("artigos_nacionais", val)} help="2pts na UNICAMP e Einstein" />
            <NumberField label="Capítulos de Livros" value={data.capitulos_livro} onChange={val => set("capitulos_livro", val)} help="Pontuação variável por instituição" />
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="acad" className="form-section">
        <AccordionTrigger className="section-header hover:no-underline py-0">
          <span className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            Acadêmico
          </span>
        </AccordionTrigger>
        <AccordionContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <NumberField label="IC com Bolsa (projetos)" value={data.ic_com_bolsa} onChange={val => set("ic_com_bolsa", val)} help="Até 20pts na UNICAMP | 7pts na USP-SP" />
            <NumberField label="IC sem Bolsa (projetos)" value={data.ic_sem_bolsa} onChange={val => set("ic_sem_bolsa", val)} help="Até 10pts na UNICAMP | 3pts na USP-SP" />
            <NumberField label="Horas Totais de IC" value={data.ic_horas_totais} onChange={val => set("ic_horas_totais", val)} help="Einstein: >=400h=30pts | >=300h=25pts | >=200h=20pts" />
            <NumberField label="Monitoria (semestres)" value={data.monitoria_semestres} onChange={val => set("monitoria_semestres", val)} help="Até 5pts UNICAMP | 15pts SES-PE | 4pts USP-SP" />
            <NumberField label="Extensão (semestres)" value={data.extensao_semestres} onChange={val => set("extensao_semestres", val)} help="Até 21pts UFPA | 10pts USP-SP | 4pts SCM-BH" />
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="pratica" className="form-section">
        <AccordionTrigger className="section-header hover:no-underline py-0">
          <span className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            Prática / Social
          </span>
        </AccordionTrigger>
        <AccordionContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <NumberField label="Voluntariado (horas)" value={data.voluntariado_horas} onChange={val => set("voluntariado_horas", val)} help=">=96h=5pts UNICAMP | >0h=5pts SCMSP | 4pts USP-SP" />
            <NumberField label="Estágio Extracurricular (horas)" value={data.estagio_extracurricular_horas} onChange={val => set("estagio_extracurricular_horas", val)} help=">=120h=1.0pt FMABC | >=180h=1.0pt PSU-MG" />
            <NumberField label="Trabalho no SUS (meses)" value={data.trabalho_sus_meses} onChange={val => set("trabalho_sus_meses", val)} help="0.5pts a cada 5 meses na SES-DF" />
            <div />
            <BoolField label="Projeto Rondon" value={data.projeto_rondon} onChange={val => set("projeto_rondon", val)} help="10pts SES-PE | 1.0pt SES-DF | 4pts USP-SP" />
            <BoolField label="Internato em Hospital de Ensino" value={data.internato_hospital_ensino} onChange={val => set("internato_hospital_ensino", val)} help="10pts UNICAMP | 10pts USP-SP | 1pt USP-RP" />
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="lideranca" className="form-section">
        <AccordionTrigger className="section-header hover:no-underline py-0">
          <span className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Liderança / Eventos
          </span>
        </AccordionTrigger>
        <AccordionContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <NumberField label="Diretoria em Ligas (gestões)" value={data.diretoria_ligas} onChange={val => set("diretoria_ligas", val)} help="5pts/gestão UNICAMP | 3pts USP-SP" />
            <NumberField label="Membro de Liga (anos)" value={data.membro_liga_anos} onChange={val => set("membro_liga_anos", val)} help="2pts/ano UNICAMP | 0.8pts PSU-MG | 0.5pts USP-RP" />
            <NumberField label="Representante de Turma (anos)" value={data.representante_turma_anos} onChange={val => set("representante_turma_anos", val)} help="4pts/ano USP-SP | 0.5pts FMABC | 0.5pts/ano USP-RP" />
            <NumberField label="Cursos Suporte à Vida (ACLS/ATLS)" value={data.cursos_suporte} onChange={val => set("cursos_suporte", val)} help="2.5pts/curso UNICAMP | 2pts USP-SP | 0.7pts PSU-MG" />
            <NumberField label="Apresentações em Congressos" value={data.apresentacao_congresso} onChange={val => set("apresentacao_congresso", val)} help="2.5pts/apres UNICAMP | 3pts USP-SP | 10pts/apres UFPA" />
            <NumberField label="Congressos como Ouvinte" value={data.ouvinte_congresso} onChange={val => set("ouvinte_congresso", val)} help="1pt/congresso USP-SP | 0.5pts SCM-BH | >=4=0.5pt FMABC" />
            <NumberField label="Organização de Eventos" value={data.organizador_evento} onChange={val => set("organizador_evento", val)} help=">=1=0.5pt FMABC" />
            <NumberField label="Testes de Progresso (ABEM)" value={data.teste_progresso} onChange={val => set("teste_progresso", val)} help=">=4=1.0pt | >=1=0.5pt na FMABC" />
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="perfil" className="form-section">
        <AccordionTrigger className="section-header hover:no-underline py-0">
          <span className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Perfil e Formação
          </span>
        </AccordionTrigger>
        <AccordionContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <NumberField label="Média Geral de Notas (0-100)" value={data.media_geral} onChange={val => set("media_geral", val)} min={0} max={100} help="Até 30pts SES-PE | 8pts USP-SP | 1.5pts PSU-MG" />
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">
                Conceito no Histórico
                <HelpTip text="Usado em critérios de desempate" />
              </Label>
              <Select value={data.conceito_historico || ""} onValueChange={val => set("conceito_historico", val as 'A' | 'B' | 'C')}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                  <SelectItem value="C">C</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div />
            <div />
            <BoolField label="Inglês Fluente" value={data.ingles_fluente} onChange={val => set("ingles_fluente", val)} help="10pts UNICAMP, USP-SP, SCMSP | 1.5pts PSU-MG | 0.5pt FMABC" />
            <BoolField label="Faculdade RUF Top 35" value={data.ranking_ruf_top35} onChange={val => set("ranking_ruf_top35", val)} help="20pts SCMSP | 5pts USP-SP" />
            <BoolField label="Mestrado Concluído" value={data.mestrado} onChange={val => set("mestrado", val)} help="25pts Einstein | 10pts UNICAMP" />
            <BoolField label="Doutorado Concluído" value={data.doutorado} onChange={val => set("doutorado", val)} help="30pts Einstein | 15pts UNICAMP" />
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
