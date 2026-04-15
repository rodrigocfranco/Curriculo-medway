// Dev-only page — rota habilitada apenas em import.meta.env.DEV. Não vai para produção.
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

type Swatch = { name: string; hex: string; className: string };

const swatches: { title: string; items: Swatch[] }[] = [
  {
    title: "Navy",
    items: [
      { name: "navy.700", hex: "#1E3A8A", className: "bg-navy-700" },
      { name: "navy.800", hex: "#0A2770", className: "bg-navy-800" },
      { name: "navy.900", hex: "#00205B", className: "bg-navy-900" },
    ],
  },
  {
    title: "Teal",
    items: [
      { name: "teal.500", hex: "#01CFB5", className: "bg-teal-500" },
      { name: "teal.600", hex: "#01A695", className: "bg-teal-600" },
    ],
  },
  {
    title: "Neutral",
    items: [
      { name: "neutral.0", hex: "#FFFFFF", className: "bg-neutral-0 border border-neutral-200" },
      { name: "neutral.50", hex: "#F8FAFC", className: "bg-neutral-50 border border-neutral-200" },
      { name: "neutral.100", hex: "#F1F5F9", className: "bg-neutral-100" },
      { name: "neutral.200", hex: "#E2E8F0", className: "bg-neutral-200" },
      { name: "neutral.300", hex: "#CBD5E1", className: "bg-neutral-300" },
      { name: "neutral.400", hex: "#94A3B8", className: "bg-neutral-400" },
      { name: "neutral.500", hex: "#64748B", className: "bg-neutral-500" },
      { name: "neutral.600", hex: "#475569", className: "bg-neutral-600" },
      { name: "neutral.700", hex: "#334155", className: "bg-neutral-700" },
      { name: "neutral.800", hex: "#1E293B", className: "bg-neutral-800" },
      { name: "neutral.900", hex: "#0F172A", className: "bg-neutral-900" },
    ],
  },
  {
    title: "Semânticos",
    items: [
      { name: "success", hex: "#10B981", className: "bg-semantic-success" },
      { name: "warning", hex: "#F59E0B", className: "bg-semantic-warning" },
      { name: "danger", hex: "#DC2626", className: "bg-semantic-danger" },
      { name: "info", hex: "#3B82F6", className: "bg-semantic-info" },
    ],
  },
];

function SwatchGroup({ title, items }: { title: string; items: Swatch[] }) {
  return (
    <div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {items.map((s) => (
          <div key={s.name} className="flex flex-col">
            <div className={`h-16 w-full rounded-md ${s.className}`} />
            <div className="mt-2 text-sm font-medium">{s.name}</div>
            <div className="text-xs text-muted-foreground tnum">{s.hex}</div>
            <code className="text-xs text-muted-foreground">{s.className.split(" ")[0]}</code>
          </div>
        ))}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <Separator />
      {children}
    </section>
  );
}

export default function DesignSystem() {
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground">
        <div className="container py-10 space-y-12">
          <header className="space-y-2">
            <h1 className="text-5xl font-bold tracking-tight">Design System Medway</h1>
            <p className="text-sm text-muted-foreground">
              Referência visual — tokens, tipografia, radius, spacing e primitives shadcn tematizados.
            </p>
          </header>

          <Section title="Cores">
            <div className="space-y-8">
              {swatches.map((g) => (
                <SwatchGroup key={g.title} title={g.title} items={g.items} />
              ))}
            </div>
          </Section>

          <Section title="Tipografia">
            <div className="space-y-3">
              <p className="text-6xl font-bold">Display — 60/700</p>
              <p className="text-5xl font-bold">H1 — 48/700</p>
              <p className="text-3xl font-bold">H2 — 30/700</p>
              <p className="text-2xl font-semibold">H3 — 24/600</p>
              <p className="text-xl font-semibold">H4 — 20/600</p>
              <p className="text-lg">Body-lg — 18/400</p>
              <p className="text-base">Body — 16/400</p>
              <p className="text-sm">Body-sm — 14/400</p>
              <p className="text-xs font-medium uppercase tracking-wide">Caption — 12/500</p>
              <p className="text-7xl font-bold tnum">Score 92</p>
              <div className="pt-4 space-y-1">
                <p className="font-semibold">Tabular numerals</p>
                <p className="tnum">tnum: 0123456789 | 1111 | 9999</p>
                <p>default: 0123456789 | 1111 | 9999</p>
              </div>
            </div>
          </Section>

          <Section title="Border radius">
            <div className="flex flex-wrap gap-4">
              {[
                { cls: "rounded-sm", label: "sm — 4px" },
                { cls: "rounded-md", label: "md — 8px" },
                { cls: "rounded-lg", label: "lg — 12px" },
                { cls: "rounded-xl", label: "xl — 16px" },
              ].map((r) => (
                <div key={r.cls} className="flex flex-col items-center gap-2">
                  <div className={`w-24 h-24 bg-primary ${r.cls}`} />
                  <span className="text-xs text-muted-foreground">{r.label}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Spacing">
            <div className="flex flex-wrap gap-4">
              {["p-3", "p-4", "p-6", "p-8"].map((p) => (
                <div key={p} className={`bg-neutral-100 border border-neutral-200 rounded-md ${p}`}>
                  <div className="bg-teal-500 w-12 h-12 rounded-sm" />
                  <span className="text-xs text-muted-foreground mt-2 block">{p}</span>
                </div>
              ))}
              <div className="flex gap-4 items-center">
                <div className="w-8 h-8 bg-navy-900 rounded-sm" />
                <div className="w-8 h-8 bg-navy-900 rounded-sm" />
                <span className="text-xs text-muted-foreground">gap-4</span>
              </div>
              <div className="flex gap-8 items-center">
                <div className="w-8 h-8 bg-navy-900 rounded-sm" />
                <div className="w-8 h-8 bg-navy-900 rounded-sm" />
                <span className="text-xs text-muted-foreground">gap-8</span>
              </div>
            </div>
          </Section>

          <Section title="Primitives — Buttons">
            <div className="flex flex-wrap gap-3">
              <Button>default</Button>
              <Button variant="secondary">secondary</Button>
              <Button variant="outline">outline</Button>
              <Button variant="ghost">ghost</Button>
              <Button variant="destructive">destructive</Button>
              <Button variant="link">link</Button>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <Button size="sm">sm</Button>
              <Button>default</Button>
              <Button size="lg">lg</Button>
              <Button
                className="focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
              >
                focus ring teal
              </Button>
            </div>
          </Section>

          <Section title="Primitives — Inputs">
            <div className="grid gap-4 md:grid-cols-2 max-w-xl">
              <div className="space-y-2">
                <Label htmlFor="ds-email">Email</Label>
                <Input
                  id="ds-email"
                  placeholder="nome@exemplo.com"
                  className="focus-visible:ring-teal-500 focus-visible:ring-offset-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ds-invalid">Inválido (aria-invalid)</Label>
                <Input id="ds-invalid" aria-invalid defaultValue="valor inválido" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="ds-textarea">Textarea</Label>
                <Textarea id="ds-textarea" placeholder="Descreva algo..." />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="ds-check" />
                <Label htmlFor="ds-check">Aceito os termos</Label>
              </div>
            </div>
          </Section>

          <Section title="Primitives — Badges & Card">
            <div className="flex flex-wrap gap-2">
              <Badge>default</Badge>
              <Badge variant="secondary">secondary</Badge>
              <Badge variant="outline">outline</Badge>
              <Badge variant="destructive">destructive</Badge>
            </div>
            <Card className="max-w-md">
              <CardHeader>
                <CardTitle>Card title</CardTitle>
                <CardDescription>Descrição breve do card.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">Conteúdo do card — herda foreground navy.900.</p>
              </CardContent>
              <CardFooter>
                <Button size="sm">Ação</Button>
              </CardFooter>
            </Card>
          </Section>

          <Section title="Primitives — Alert, Dialog, Tooltip">
            <Alert>
              <AlertTitle>Atenção</AlertTitle>
              <AlertDescription>Mensagem informativa para o usuário.</AlertDescription>
            </Alert>
            <div className="flex gap-3">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">Abrir Dialog</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Dialog de exemplo</DialogTitle>
                    <DialogDescription>
                      Conteúdo de diálogo tematizado com tokens Medway.
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost">Hover / focus para tooltip</Button>
                </TooltipTrigger>
                <TooltipContent>Tooltip tematizado</TooltipContent>
              </Tooltip>
            </div>
          </Section>

          <Section title="Primitives — Tabs & Accordion">
            <Tabs defaultValue="a" className="max-w-md">
              <TabsList>
                <TabsTrigger value="a">Tab A</TabsTrigger>
                <TabsTrigger value="b">Tab B</TabsTrigger>
              </TabsList>
              <TabsContent value="a">Conteúdo da Tab A.</TabsContent>
              <TabsContent value="b">Conteúdo da Tab B.</TabsContent>
            </Tabs>
            <Accordion type="single" collapsible className="max-w-md">
              <AccordionItem value="item-1">
                <AccordionTrigger>Seção 1</AccordionTrigger>
                <AccordionContent>Detalhes da seção 1.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Seção 2</AccordionTrigger>
                <AccordionContent>Detalhes da seção 2.</AccordionContent>
              </AccordionItem>
            </Accordion>
          </Section>

          <Section title="Primitives — Progress & Skeleton">
            <div className="space-y-3 max-w-md">
              <Progress value={50} />
              <Progress value={80} />
              <Skeleton className="h-4 w-full" />
            </div>
          </Section>
        </div>
      </div>
    </TooltipProvider>
  );
}
