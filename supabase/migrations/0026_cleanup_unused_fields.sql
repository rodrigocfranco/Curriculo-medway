-- 0026_cleanup_unused_fields.sql
-- Remover 4 campos que nenhuma regra usa (0 referências)

DELETE FROM curriculum_fields WHERE field_key IN (
  'congressos',           -- event_list, 0 regras
  'ic_projetos',          -- project_list, 0 regras
  'monitoria_horas_totais', -- number, 0 regras
  'conceito_historico'    -- select, 0 regras
);
