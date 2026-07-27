-- =============================================================================
-- Migração: textos instrutivos (2026-07-27) — handoff v4
-- Bancos JÁ CRIADOS. Instalações novas usam só o schema.sql.
-- Rollback: DROP TABLE process_guide; ALTER TABLE artifact DROP COLUMN why_it_matters;
-- =============================================================================
SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- Texto instrutivo por processo (1:1; conteúdo editorial re-seedável).
-- Adaptação registrada: flow_md guarda a PROSA de "Como o processo funciona"
-- (fonte é texto corrido); os campos JSON guardam as listas estruturadas
-- quando extraíveis (chips da UI).
CREATE TABLE IF NOT EXISTS `process_guide` (
  `process_id`      BIGINT UNSIGNED NOT NULL,
  `purpose_md`      TEXT NOT NULL,
  `flow_md`         TEXT NULL,
  `flow_inputs`     JSON NULL,
  `flow_activities` JSON NULL,
  `flow_outputs`    JSON NULL,
  `indicators`      JSON NULL,
  `risks`           JSON NULL,
  `practices`       JSON NULL,
  `regulatory`      JSON NULL,
  `getting_started` JSON NULL,
  `source_citation` TEXT NULL,
  `updated_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`process_id`),
  CONSTRAINT `fk_guide_process` FOREIGN KEY (`process_id`) REFERENCES `process` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Texto instrutivo do processo (handoff v4). Regra editorial: atualizações normativas SEMPRE em regulatory.';

-- Por que cada artefato existe (por VERSÃO — clonado no rascunho do CMS)
ALTER TABLE `artifact`
  ADD COLUMN `why_it_matters` TEXT NULL AFTER `dod_text`;
