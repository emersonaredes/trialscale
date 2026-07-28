-- =============================================================================
-- Migração: responsáveis por artefato (assessment) — módulo Rodada [PT-0068]
-- Bancos JÁ CRIADOS. Instalações novas usam só o schema.sql (atualizado JUNTO).
-- Idempotente (CREATE TABLE IF NOT EXISTS). Sem operação destrutiva.
-- Rollback: DROP TABLE assessment_assignee;
-- =============================================================================
SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS `assessment_assignee` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tenant_id`     BIGINT UNSIGNED NOT NULL,
  `assessment_id` BIGINT UNSIGNED NOT NULL,
  `user_id`       BIGINT UNSIGNED NOT NULL,
  `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_assignee` (`assessment_id`, `user_id`),
  KEY `ix_aa_tenant` (`tenant_id`),
  KEY `ix_aa_user` (`user_id`),
  CONSTRAINT `fk_aa_tenant`     FOREIGN KEY (`tenant_id`)     REFERENCES `tenant` (`id`),
  CONSTRAINT `fk_aa_assessment` FOREIGN KEY (`assessment_id`) REFERENCES `assessment` (`id`),
  CONSTRAINT `fk_aa_user`       FOREIGN KEY (`user_id`)       REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Responsáveis pelo artefato no centro (N:N assessment×user; PT-0068).';
