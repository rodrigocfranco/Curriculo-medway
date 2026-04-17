-- Fix: marcar user_scores.stale=true quando user_curriculum é atualizado
-- Sem isso, scores calculados antes do preenchimento do currículo ficam zerados
-- e nunca são recalculados (stale=false com score=0).

create or replace function public.mark_scores_stale_on_curriculum_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.user_scores
    set stale = true
    where user_id = NEW.user_id
      and stale = false;

  return NEW;
end;
$$;

create trigger trg_curriculum_mark_scores_stale
  after insert or update on public.user_curriculum
  for each row execute function public.mark_scores_stale_on_curriculum_change();
