-- =============================================================================
-- Migração: Workshop ao vivo (2026-11-27) — spec 006
-- Bancos JÁ CRIADOS. Instalações novas usam só o schema.sql (atualizado JUNTO).
-- Só CREATE TABLE IF NOT EXISTS (idempotente, sem operação destrutiva): rodar
-- `npm run db:apply` tem o mesmo efeito.
-- Rollback: DROP TABLE workshop_assessment, workshop_objective_vote,
--           workshop_participant, workshop_room;
-- =============================================================================
-- WORKSHOP AO VIVO (spec 006) — zona 'workshop', À PARTE da zona de centro.
-- Salas de demonstração: nenhuma FK para tenant; respostas anônimas nunca se
-- misturam com assessment/pain_score/tenant_objective dos centros reais.
-- =============================================================================
CREATE TABLE IF NOT EXISTS `workshop_room` (
  `id`                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code`               VARCHAR(8)   NOT NULL,              -- código curto do QR (sem caracteres ambíguos)
  `name`               VARCHAR(120) NOT NULL,              -- ex.: 'Workshop Congresso Norte Nordeste'
  `status`             ENUM('aberta','encerrada') NOT NULL DEFAULT 'aberta',
  `step`               ENUM('entrada','objetivos','ranking_objetivos','ranking_processos','avaliacao','distribuicao')
                       NOT NULL DEFAULT 'entrada',
  `current_process_id` BIGINT UNSIGNED NULL,               -- processo enviado aos celulares (passo 5)
  `created_by_user_id` BIGINT UNSIGNED NOT NULL,           -- staff que criou
  `created_at`         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `closed_at`          DATETIME NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_workshop_room_code` (`code`),
  CONSTRAINT `fk_wr_process` FOREIGN KEY (`current_process_id`) REFERENCES `process` (`id`),
  CONSTRAINT `fk_wr_user`    FOREIGN KEY (`created_by_user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Sala de workshop ao vivo (uma por evento). Sem vínculo com tenant.';

CREATE TABLE IF NOT EXISTS `workshop_participant` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `room_id`    BIGINT UNSIGNED NOT NULL,
  `nickname`   VARCHAR(40) NOT NULL,                       -- identificador SORTEADO pelo sistema (ex.: 'Tucano 42')
  `token_hash` CHAR(64)    NOT NULL,                       -- SHA-256 do token opaco do celular
  `joined_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `removed_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_wp_token` (`token_hash`),
  UNIQUE KEY `uq_wp_room_nick` (`room_id`, `nickname`),
  CONSTRAINT `fk_wp_room` FOREIGN KEY (`room_id`) REFERENCES `workshop_room` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Participante anônimo de uma sala (sem conta, sem dado pessoal).';

CREATE TABLE IF NOT EXISTS `workshop_objective_vote` (
  `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `room_id`        BIGINT UNSIGNED NOT NULL,
  `participant_id` BIGINT UNSIGNED NOT NULL,
  `objective_id`   SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_wov` (`participant_id`, `objective_id`),
  KEY `ix_wov_room` (`room_id`, `objective_id`),
  CONSTRAINT `fk_wov_room`        FOREIGN KEY (`room_id`)        REFERENCES `workshop_room` (`id`),
  CONSTRAINT `fk_wov_participant` FOREIGN KEY (`participant_id`) REFERENCES `workshop_participant` (`id`),
  CONSTRAINT `fk_wov_objective`   FOREIGN KEY (`objective_id`)   REFERENCES `objective` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Voto de objetivo estratégico (até 3 por participante, sem ordem).';

CREATE TABLE IF NOT EXISTS `workshop_assessment` (
  `id`                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `room_id`            BIGINT UNSIGNED NOT NULL,
  `participant_id`     BIGINT UNSIGNED NOT NULL,
  `process_id`         BIGINT UNSIGNED NOT NULL,
  `artifact_ids`       JSON NOT NULL,                      -- artefatos que o participante declarou possuir
  `not_applicable_ids` JSON NOT NULL,                      -- condicionais marcados "não se aplica"
  `level`              TINYINT UNSIGNED NOT NULL,          -- nível calculado (1–5), mesma regra do produto
  `finished_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_wa` (`participant_id`, `process_id`),
  KEY `ix_wa_room_process` (`room_id`, `process_id`),
  CONSTRAINT `fk_wa_room`        FOREIGN KEY (`room_id`)        REFERENCES `workshop_room` (`id`),
  CONSTRAINT `fk_wa_participant` FOREIGN KEY (`participant_id`) REFERENCES `workshop_participant` (`id`),
  CONSTRAINT `fk_wa_process`     FOREIGN KEY (`process_id`)     REFERENCES `process` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Autoavaliação de demonstração de um processo, por participante da sala.';

