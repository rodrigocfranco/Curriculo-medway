-- Migration: admin SELECT policies for user_curriculum and user_scores
-- Context: Story 4.1 code review — admin needs to read curriculum/scores
-- of all students for the Leads page (metrics, filters, detail drawer).
-- Uses existing public.is_admin(uuid) helper from 0001_profiles.sql.

-- user_curriculum: admin can SELECT all rows
create policy "user_curriculum_select_admin"
  on public.user_curriculum for select to authenticated
  using (public.is_admin(auth.uid()));

-- user_scores: admin can SELECT all rows
create policy "user_scores_select_admin"
  on public.user_scores for select to authenticated
  using (public.is_admin(auth.uid()));
