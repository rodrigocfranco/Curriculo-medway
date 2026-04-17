-- Story 3.3: tabela de audit para scoring_rules + trigger + RLS
-- Registra INSERT/UPDATE/DELETE automaticamente via trigger SECURITY DEFINER.

-- 1. Tabela de audit
CREATE TABLE public.scoring_rules_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id uuid NOT NULL,
  changed_by uuid,
  change_type text NOT NULL CHECK (change_type IN ('INSERT', 'UPDATE', 'DELETE')),
  old_values jsonb,
  new_values jsonb,
  changed_at timestamptz NOT NULL DEFAULT now()
);

-- rule_id NÃO é FK CASCADE — histórico deve sobreviver à deleção da regra.

COMMENT ON TABLE public.scoring_rules_audit IS 'Audit log for scoring_rules changes';

-- 2. Índices
CREATE INDEX idx_scoring_rules_audit_rule_id ON public.scoring_rules_audit(rule_id);
CREATE INDEX idx_scoring_rules_audit_changed_at ON public.scoring_rules_audit(changed_at DESC);

-- 3. Trigger function (SECURITY DEFINER para bypass RLS ao inserir no audit)
CREATE OR REPLACE FUNCTION public.audit_scoring_rules()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.scoring_rules_audit (rule_id, changed_by, change_type, old_values, new_values)
    VALUES (NEW.id, auth.uid(), 'INSERT', NULL, row_to_json(NEW)::jsonb);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.scoring_rules_audit (rule_id, changed_by, change_type, old_values, new_values)
    VALUES (NEW.id, auth.uid(), 'UPDATE', row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.scoring_rules_audit (rule_id, changed_by, change_type, old_values, new_values)
    VALUES (OLD.id, auth.uid(), 'DELETE', row_to_json(OLD)::jsonb, NULL);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- 4. Trigger (AFTER para não interferir na operação original)
CREATE TRIGGER trg_audit_scoring_rules
  AFTER INSERT OR UPDATE OR DELETE ON public.scoring_rules
  FOR EACH ROW EXECUTE FUNCTION public.audit_scoring_rules();

-- 5. RLS
ALTER TABLE public.scoring_rules_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scoring_rules_audit FORCE ROW LEVEL SECURITY;

-- Apenas admin pode ler o histórico
CREATE POLICY "admin can read audit log"
  ON public.scoring_rules_audit FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Nenhuma policy de INSERT/UPDATE/DELETE — somente trigger (SECURITY DEFINER) insere
