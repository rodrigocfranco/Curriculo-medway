import { Link } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ_ITEMS = [
  {
    question: "O que é o Currículo Medway?",
    answer:
      "Uma ferramenta gratuita que analisa seu currículo e calcula seu score para programas de residência médica das maiores instituições do Brasil.",
  },
  {
    question: "É gratuito?",
    answer:
      "Sim, 100% gratuito. Sem cobrança, sem plano premium. Você cria sua conta e já pode usar todas as funcionalidades.",
  },
  {
    question: "Como o score é calculado?",
    answer:
      "Baseado nas regras oficiais dos editais de cada instituição. Cada categoria — formação, experiência, publicações, entre outras — tem peso definido pelo edital.",
  },
  {
    question: "Quais instituições estão disponíveis?",
    answer:
      "Cobrimos as maiores instituições de residência médica do Brasil. A lista é atualizada conforme novos editais são publicados.",
  },
  {
    question: "Meus dados estão seguros?",
    answer: (
      <>
        Sim. Usamos criptografia e seguimos a LGPD. Você pode excluir seus
        dados a qualquer momento. Veja nossa{" "}
        <Link
          to="/privacidade"
          className="font-medium text-accent underline underline-offset-4 hover:text-accent/80"
        >
          Política de Privacidade
        </Link>
        .
      </>
    ),
  },
  {
    question: "Posso atualizar meu currículo depois?",
    answer:
      "Sim. Seu currículo é salvo automaticamente e você pode editar sempre que quiser. O score é recalculado a cada alteração.",
  },
] as const;

const FaqSection = () => (
  <section id="faq" className="bg-secondary/30 py-16 md:py-24">
    <div className="mx-auto max-w-5xl px-6">
      <h2 className="mb-12 text-center text-2xl font-bold tracking-tight text-foreground md:text-[32px]">
        Perguntas frequentes
      </h2>

      <Accordion type="single" collapsible className="mx-auto max-w-3xl">
        {FAQ_ITEMS.map((item, index) => (
          <AccordionItem key={index} value={`faq-${index}`}>
            <AccordionTrigger className="text-left text-base">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </section>
);

export default FaqSection;
