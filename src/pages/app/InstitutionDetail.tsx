import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useInstitutions } from "@/lib/queries/scoring";

const InstitutionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: institutions } = useInstitutions();
  const institution = institutions?.find((i) => i.id === id);
  const displayName = institution?.short_name || institution?.name || "Instituição";

  return (
    <div className="space-y-4">
      <Link
        to="/app"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Dashboard
      </Link>
      <h1 className="text-2xl font-bold">{displayName}</h1>
      <p className="text-muted-foreground">Detalhes em breve — Story 2.4</p>
    </div>
  );
};

export default InstitutionDetail;
