import { Users, Calendar, ClipboardCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeadMetrics } from "@/lib/queries/leads";

export default function LeadMetricsCards() {
  const { data, isLoading } = useLeadMetrics();

  const cards = [
    {
      title: "Total de leads",
      value: data?.total ?? 0,
      icon: Users,
    },
    {
      title: "Últimos 7 dias",
      value: data?.last7days ?? 0,
      icon: Calendar,
    },
    {
      title: "Últimos 30 dias",
      value: data?.last30days ?? 0,
      icon: Calendar,
    },
    {
      title: "Currículo preenchido",
      value: data ? `${data.withCurriculum} / ${data.total}` : "0 / 0",
      icon: ClipboardCheck,
    },
  ];

  return (
    <div
      className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4"
      aria-busy={isLoading}
    >
      {cards.map((card) => (
        <Card key={card.title} className="border-neutral-200 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between p-3 pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {isLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <p className="text-2xl font-bold tabular-nums text-navy-900">
                {card.value}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
