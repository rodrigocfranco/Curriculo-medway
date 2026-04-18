-- Story 3.3 review patch: adiciona FK em changed_by → auth.users(id) ON DELETE SET NULL
-- Permite referential integrity enquanto preserva histórico quando admin é removido.

ALTER TABLE public.scoring_rules_audit
  ADD CONSTRAINT scoring_rules_audit_changed_by_fkey
  FOREIGN KEY (changed_by) REFERENCES auth.users(id) ON DELETE SET NULL;
