import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Rocket, ArrowRight } from "lucide-react";
import { InstitutionScore } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  results: InstitutionScore[];
}

export default function LeadGateModal({ open, onClose, onSubmit, results }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const isValid = name.trim().length > 2 && email.includes("@") && phone.trim().length >= 10;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true);

    const payload = {
      contact: { name: name.trim(), email: email.trim(), phone: phone.trim() },
      scores: results.map(r => ({ institution: r.name, score: r.score, base: r.base })),
      timestamp: new Date().toISOString(),
    };

    // Mock HubSpot integration
    console.log("🚀 [LEAD CAPTURE] Dados prontos para HubSpot CRM:", JSON.stringify(payload, null, 2));

    setTimeout(() => {
      setLoading(false);
      onSubmit();
    }, 800);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-primary/20">
        <DialogHeader className="text-center space-y-3">
          <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10">
            <Rocket className="h-7 w-7 text-primary" />
          </div>
          <DialogTitle className="text-xl font-bold text-foreground">
            Seu Diagnóstico está pronto!
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Preencha seus dados para acessar o relatório completo com ranking, detalhamento por instituição e recomendações personalizadas.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="lead-name" className="text-sm">Nome Completo</Label>
            <Input
              id="lead-name"
              placeholder="Dr(a). João Silva"
              value={name}
              onChange={e => setName(e.target.value)}
              className="h-11"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lead-email" className="text-sm">E-mail</Label>
            <Input
              id="lead-email"
              type="email"
              placeholder="joao@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="h-11"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lead-phone" className="text-sm">WhatsApp</Label>
            <Input
              id="lead-phone"
              type="tel"
              placeholder="(11) 99999-9999"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="h-11"
            />
          </div>

          <Button
            type="submit"
            disabled={!isValid || loading}
            className="w-full h-12 text-base font-semibold gap-2"
          >
            {loading ? "Gerando diagnóstico..." : "Acessar Meu Diagnóstico"}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </Button>

          <p className="text-[11px] text-muted-foreground text-center leading-tight">
            Seus dados são protegidos e usados apenas para envio do diagnóstico.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
