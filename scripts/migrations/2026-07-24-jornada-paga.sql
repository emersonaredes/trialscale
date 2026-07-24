-- =============================================================================
-- Migração: jornada paga (2026-07-24) — Etapa 3
-- Bancos JÁ CRIADOS. Instalações novas usam só o schema.sql.
-- Rollback: ALTER TABLE round_process DROP COLUMN baseline_level;
--           DELETE FROM plan WHERE code IN ('autosservico','premium');
-- =============================================================================
SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- Nível de partida de cada processo na rodada (conclusão = subiu 1 nível em
-- cada — decisão do usuário 2026-07-24).
ALTER TABLE `round_process`
  ADD COLUMN `baseline_level` TINYINT UNSIGNED NULL AFTER `process_id`;

-- Planos do MVP (valores de exemplo da concepção §6, a validar comercialmente)
INSERT IGNORE INTO `plan` (`code`, `name`, `amount`) VALUES
  ('autosservico', 'Autosserviço',           3870.00),
  ('premium',      'Acompanhamento Premium', 7500.00);
