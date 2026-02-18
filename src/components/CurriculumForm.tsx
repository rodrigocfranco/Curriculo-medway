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
import { BookOpen, GraduationCap, CalendarDays, User, Heart } from "lucide-react";

interface Props {
  data: UserProfile;
  onChange: (data: UserProfile) => void;
}

function NumberField({ label, value, onChange, min = 0, max, step = 1 }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm text-muted-foreground">{label}</Label>
      <Input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value || ""}
        placeholder="0"
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="h-10"
      />
    </div>
  );
}

function BoolField({ label, value, onChange }: {
  label: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <Label className="text-sm text-muted-foreground">{label}</Label>
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
            <NumberField label="Artigos High Impact (IF > 3.0)" value={data.artigos_high_impact} onChange={v => set("artigos_high_impact", v)} />
            <NumberField label="Artigos Mid Impact (IF 0.5-3.0)" value={data.artigos_mid_impact} onChange={v => set("artigos_mid_impact", v)} />
            <NumberField label="Artigos Low Impact / Coautor" value={data.artigos_low_impact} onChange={v => set("artigos_low_impact", v)} />
            <NumberField label="Artigos Nacionais (SciELO/LILACS)" value={data.artigos_nacionais} onChange={v => set("artigos_nacionais", v)} />
            <NumberField label="Capítulos de Livros" value={data.capitulos_livro} onChange={v => set("capitulos_livro", v)} />
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
            <NumberField label="IC com Bolsa (projetos)" value={data.ic_com_bolsa} onChange={v => set("ic_com_bolsa", v)} />
            <NumberField label="IC sem Bolsa (projetos)" value={data.ic_sem_bolsa} onChange={v => set("ic_sem_bolsa", v)} />
            <NumberField label="Horas Totais de IC" value={data.ic_horas_totais} onChange={v => set("ic_horas_totais", v)} />
            <NumberField label="Monitoria (semestres)" value={data.monitoria_semestres} onChange={v => set("monitoria_semestres", v)} />
            <NumberField label="Extensão (semestres)" value={data.extensao_semestres} onChange={v => set("extensao_semestres", v)} />
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
            <NumberField label="Voluntariado (horas)" value={data.voluntariado_horas} onChange={v => set("voluntariado_horas", v)} />
            <NumberField label="Estágio Extracurricular (horas)" value={data.estagio_extracurricular_horas} onChange={v => set("estagio_extracurricular_horas", v)} />
            <NumberField label="Trabalho no SUS (meses)" value={data.trabalho_sus_meses} onChange={v => set("trabalho_sus_meses", v)} />
            <div />
            <BoolField label="Projeto Rondon" value={data.projeto_rondon} onChange={v => set("projeto_rondon", v)} />
            <BoolField label="Internato em Hospital de Ensino" value={data.internato_hospital_ensino} onChange={v => set("internato_hospital_ensino", v)} />
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
            <NumberField label="Diretoria em Ligas (gestões)" value={data.diretoria_ligas} onChange={v => set("diretoria_ligas", v)} />
            <NumberField label="Membro de Liga (anos)" value={data.membro_liga_anos} onChange={v => set("membro_liga_anos", v)} />
            <NumberField label="Representante de Turma (anos)" value={data.representante_turma_anos} onChange={v => set("representante_turma_anos", v)} />
            <NumberField label="Cursos Suporte à Vida (ACLS/ATLS)" value={data.cursos_suporte} onChange={v => set("cursos_suporte", v)} />
            <NumberField label="Apresentações em Congressos" value={data.apresentacao_congresso} onChange={v => set("apresentacao_congresso", v)} />
            <NumberField label="Congressos como Ouvinte" value={data.ouvinte_congresso} onChange={v => set("ouvinte_congresso", v)} />
            <NumberField label="Organização de Eventos" value={data.organizador_evento} onChange={v => set("organizador_evento", v)} />
            <NumberField label="Testes de Progresso (ABEM)" value={data.teste_progresso} onChange={v => set("teste_progresso", v)} />
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
            <NumberField label="Média Geral de Notas (0-100)" value={data.media_geral} onChange={v => set("media_geral", v)} min={0} max={100} />
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Conceito no Histórico</Label>
              <Select value={data.conceito_historico || ""} onValueChange={v => set("conceito_historico", v as 'A' | 'B' | 'C')}>
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
            <BoolField label="Inglês Fluente" value={data.ingles_fluente} onChange={v => set("ingles_fluente", v)} />
            <BoolField label="Faculdade RUF Top 35" value={data.ranking_ruf_top35} onChange={v => set("ranking_ruf_top35", v)} />
            <BoolField label="Mestrado Concluído" value={data.mestrado} onChange={v => set("mestrado", v)} />
            <BoolField label="Doutorado Concluído" value={data.doutorado} onChange={v => set("doutorado", v)} />
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
