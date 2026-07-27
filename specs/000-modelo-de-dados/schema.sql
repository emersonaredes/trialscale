-- =============================================================================
-- TrialScale — Schema do núcleo (multi-tenant, banco ÚNICO, isolamento por tenant_id)
-- Deriva de specs/000-modelo-de-dados/spec.md (v2, autocrítica + revisão db-architect folded).
--
-- Ambiente-alvo: MySQL 5.7 (serviço MySQL57 local, DEV). NÃO é produção.
-- Revisão: constituição §3 — migração revisada linha a linha; sem DROP; só CREATE IF NOT EXISTS.
--
-- Convenções (constituição §4):
--   * utf8mb4 / utf8mb4_unicode_ci em tudo (evita charsets mistos do legado).
--   * Datas em UTC: colunas DATETIME; a APLICAÇÃO deve conectar com time_zone='+00:00'.
--   * Dinheiro em DECIMAL (plan.amount).
--   * tenant_id NOT NULL em toda tabela de dados de centro; NULL só onde é catálogo global.
--
-- Caveats do MySQL 5.7 (registrados; não são falha do schema):
--   * CHECK é ACEITO mas NÃO É APLICADO no 5.7. Os CHECK abaixo documentam a intenção e
--     passam a valer se o servidor for atualizado para 8.0; até lá, AC-9/AC-10/faixas de
--     valor são garantidos na CAMADA DE APLICAÇÃO + testes (suíte permanente 2).
--   * AC-10 (tenant custom => não benchmarkável) é forçado por COLUNA GERADA (is_benchmarkable).
--   * AC-11 (uma versão publicada por processo) é forçado por COLUNA GERADA + índice único.
--
-- BN-3 (revisão): tenant_id (anulável) foi propagado às tabelas-filhas do catálogo
--   (content_version, level, artifact, artifact_placement) para eliminar escopo puramente
--   transitivo do conteúdo personalizado. NULL = catálogo global; preenchido = custom do centro.
-- =============================================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';           -- defaults de CURRENT_TIMESTAMP gravam em UTC nesta sessão
SET FOREIGN_KEY_CHECKS = 1;

-- O banco (DB_NAME) é criado e selecionado por quem aplica este script
-- (scripts/apply-schema.ps1 lê o .env). Assim trocar de banco = editar só o .env.
-- Para rodar manualmente, selecione o banco antes:  USE `trialscale_dev`;

-- =============================================================================
-- 1. LOOKUPS FIXOS E CATÁLOGO GLOBAL (sem tenant_id — referência compartilhada)
-- =============================================================================

CREATE TABLE IF NOT EXISTS `artifact_type` (
  `id`   TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(40)  NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_artifact_type_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Vocabulário fixo de tipos de artefato (concepção §3).';

CREATE TABLE IF NOT EXISTS `origin_seal` (
  `code` CHAR(1)      NOT NULL,        -- T tese · G GCP · A norma/ANVISA · P PIC · D design
  `name` VARCHAR(120) NOT NULL,
  PRIMARY KEY (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Selo de origem do artefato (concepção §9).';

CREATE TABLE IF NOT EXISTS `applicability_condition` (
  `id`          SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code`        VARCHAR(60)  NOT NULL,  -- ex.: centro_publico, possui_pi_refrigerado
  `description` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_appl_cond_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Condição de aplicabilidade de artefato, avaliada contra o perfil do tenant (C2/Q7).';

CREATE TABLE IF NOT EXISTS `objective` (
  `id`    SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `theme` VARCHAR(80)  NOT NULL,        -- tema do menu (concepção §2)
  `name`  VARCHAR(200) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_objective_theme` (`theme`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Menu global de objetivos estratégicos (Fase 1).';

CREATE TABLE IF NOT EXISTS `achievement` (
  `id`   SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(60)  NOT NULL,
  `name` VARCHAR(160) NOT NULL,
  `type` ENUM('selo','medalha') NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_achievement_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Catálogo de selos/medalhas (gamificação, concepção §5).';

CREATE TABLE IF NOT EXISTS `specialty` (
  `id`   SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(60)  NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_specialty_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Lookup global de especialidades médicas (cadastro do centro).';

CREATE TABLE IF NOT EXISTS `plan` (
  `id`     SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code`   VARCHAR(40)   NOT NULL,
  `name`   VARCHAR(120)  NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,      -- dinheiro em DECIMAL (constituição §3)
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_plan_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Planos comerciais (Autosserviço / Premium).';

-- ------------------------------ processo ------------------------------------
CREATE TABLE IF NOT EXISTS `process` (
  `id`                   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tenant_id`            BIGINT UNSIGNED NULL,            -- NULL = catálogo global; set = custom
  `code`                 VARCHAR(20)  NULL,               -- ex.: '2.5' (NULL em custom sem código)
  `name`                 VARCHAR(200) NOT NULL,
  `process_group`        ENUM('central','suporte','gestao','personalizado') NOT NULL,
  `one_line_description` TEXT NULL,
  `objective_text`       TEXT NULL,
  -- AC-10: custom (tenant_id NOT NULL) nunca entra no benchmark — invariante por coluna gerada:
  `is_benchmarkable`     TINYINT(1) AS (`tenant_id` IS NULL) VIRTUAL,
  `created_at`           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_process_tenant` (`tenant_id`),
  KEY `ix_process_group`  (`tenant_id`, `process_group`),
  KEY `ix_process_code`   (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Processo do catálogo (28 da tese) ou personalizado do centro.';

CREATE TABLE IF NOT EXISTS `process_dependency` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `from_process_id` BIGINT UNSIGNED NOT NULL,
  `to_process_id`   BIGINT UNSIGNED NOT NULL,
  `type`            VARCHAR(40) NOT NULL,   -- aciona · acionado_por · alimenta
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_dep` (`from_process_id`, `to_process_id`, `type`),
  KEY `ix_dep_to` (`to_process_id`),
  CONSTRAINT `fk_dep_from` FOREIGN KEY (`from_process_id`) REFERENCES `process` (`id`),
  CONSTRAINT `fk_dep_to`   FOREIGN KEY (`to_process_id`)   REFERENCES `process` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Dependências entre processos (ordem recomendada; não trava navegação).';

-- ------------------------- versionamento de conteúdo ------------------------
CREATE TABLE IF NOT EXISTS `content_version` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `process_id`   BIGINT UNSIGNED NOT NULL,
  `tenant_id`    BIGINT UNSIGNED NULL,        -- BN-3: herda a natureza do processo-dono
  `version_no`   INT UNSIGNED NOT NULL,
  `status`       ENUM('rascunho','publicado','arquivado') NOT NULL DEFAULT 'rascunho',
  `published_at` DATETIME NULL,
  `created_by`   BIGINT UNSIGNED NULL,        -- staff TrialScale
  `notes`        TEXT NULL,
  `created_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- AC-11: no máximo uma versão 'publicado' por processo (índice único sobre coluna gerada):
  `pub_process_id` BIGINT UNSIGNED AS (IF(`status` = 'publicado', `process_id`, NULL)) VIRTUAL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cv_process_version` (`process_id`, `version_no`),
  UNIQUE KEY `uq_cv_one_published`   (`pub_process_id`),
  KEY `ix_cv_process_status` (`process_id`, `status`),
  KEY `ix_cv_tenant` (`tenant_id`),
  CONSTRAINT `fk_cv_process` FOREIGN KEY (`process_id`) REFERENCES `process` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Versão de conteúdo por processo (rascunho→publicado→arquivado). Snapshot do dono.';

CREATE TABLE IF NOT EXISTS `level` (
  `id`                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `content_version_id` BIGINT UNSIGNED NOT NULL,
  `tenant_id`          BIGINT UNSIGNED NULL,
  `number`             TINYINT UNSIGNED NOT NULL,   -- 1..5
  `name`               VARCHAR(40)  NOT NULL,       -- Inicial..Otimizado
  `description`        TEXT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_level_cv_number` (`content_version_id`, `number`),
  CONSTRAINT `fk_level_cv` FOREIGN KEY (`content_version_id`) REFERENCES `content_version` (`id`),
  CONSTRAINT `ck_level_number` CHECK (`number` BETWEEN 1 AND 5)   -- não aplicado no 5.7
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Os cinco níveis, caracterizados por processo/versão.';

-- ------------------------------- artefato -----------------------------------
CREATE TABLE IF NOT EXISTS `artifact` (
  `id`                         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `content_version_id`         BIGINT UNSIGNED NOT NULL,   -- versão do processo-DONO
  `tenant_id`                  BIGINT UNSIGNED NULL,
  `logical_key`                VARCHAR(80)  NOT NULL,      -- identidade estável entre versões (RN-1)
  `artifact_type_id`           TINYINT UNSIGNED NOT NULL,
  `title`                      VARCHAR(255) NOT NULL,
  `dod_text`                   TEXT NOT NULL,              -- definição de pronto (frase completa)
  `why_it_matters`             TEXT NULL,                  -- "por que importa" (texto instrutivo v4)
  `owner_process_id`           BIGINT UNSIGNED NOT NULL,
  `applicability_condition_id` SMALLINT UNSIGNED NULL,
  `created_at`                 DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_artifact_cv` (`content_version_id`),
  KEY `ix_artifact_logical` (`logical_key`),
  KEY `ix_artifact_owner` (`owner_process_id`),
  KEY `ix_artifact_tenant` (`tenant_id`),
  CONSTRAINT `fk_artifact_cv`    FOREIGN KEY (`content_version_id`) REFERENCES `content_version` (`id`),
  CONSTRAINT `fk_artifact_type`  FOREIGN KEY (`artifact_type_id`)   REFERENCES `artifact_type` (`id`),
  CONSTRAINT `fk_artifact_owner` FOREIGN KEY (`owner_process_id`)   REFERENCES `process` (`id`),
  CONSTRAINT `fk_artifact_cond`  FOREIGN KEY (`applicability_condition_id`) REFERENCES `applicability_condition` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Artefato que define maturidade. Pertence à versão do processo-dono.';

CREATE TABLE IF NOT EXISTS `artifact_seal` (
  `artifact_id` BIGINT UNSIGNED NOT NULL,
  `seal_code`   CHAR(1) NOT NULL,
  PRIMARY KEY (`artifact_id`, `seal_code`),
  KEY `ix_seal_code` (`seal_code`),
  CONSTRAINT `fk_seal_artifact` FOREIGN KEY (`artifact_id`) REFERENCES `artifact` (`id`),
  CONSTRAINT `fk_seal_code`     FOREIGN KEY (`seal_code`)   REFERENCES `origin_seal` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='N:N artefato × selo (um artefato pode ter [T][G] etc.).';

CREATE TABLE IF NOT EXISTS `artifact_placement` (
  `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `artifact_id`    BIGINT UNSIGNED NOT NULL,
  `process_id`     BIGINT UNSIGNED NOT NULL,   -- pode diferir do owner (artefato referenciado)
  `tenant_id`      BIGINT UNSIGNED NULL,
  `level_number`   TINYINT UNSIGNED NOT NULL,  -- RN-5: deve casar com um `level` da versão
  `classification` ENUM('essencial','complementar') NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_placement` (`artifact_id`, `process_id`),
  KEY `ix_placement_process_level` (`process_id`, `level_number`),
  CONSTRAINT `fk_placement_artifact` FOREIGN KEY (`artifact_id`) REFERENCES `artifact` (`id`),
  CONSTRAINT `fk_placement_process`  FOREIGN KEY (`process_id`)  REFERENCES `process` (`id`),
  CONSTRAINT `ck_placement_level` CHECK (`level_number` BETWEEN 1 AND 5)  -- não aplicado no 5.7
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Coloca o artefato em um processo/nível com classificação E/C. Habilita compartilhamento.';

CREATE TABLE IF NOT EXISTS `objective_process_weight` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `objective_id` SMALLINT UNSIGNED NOT NULL,
  `process_id`   BIGINT UNSIGNED NOT NULL,
  `weight`       DECIMAL(5,2) NOT NULL,      -- relevância do processo p/ o objetivo (BN-1)
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_opw` (`objective_id`, `process_id`),
  KEY `ix_opw_process` (`process_id`),
  CONSTRAINT `fk_opw_objective` FOREIGN KEY (`objective_id`) REFERENCES `objective` (`id`),
  CONSTRAINT `fk_opw_process`   FOREIGN KEY (`process_id`)   REFERENCES `process` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Elo objetivo→processo: insumo do peso da priorização e do nível geral ponderado.';

CREATE TABLE IF NOT EXISTS `artifact_template` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `artifact_id` BIGINT UNSIGNED NOT NULL,
  `file_ref`    VARCHAR(500) NOT NULL,      -- objeto no storage próprio da plataforma
  `filename`    VARCHAR(255) NOT NULL,
  `mime_type`   VARCHAR(120) NOT NULL,
  `size_bytes`  BIGINT UNSIGNED NOT NULL,
  `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_template_artifact` (`artifact_id`),
  CONSTRAINT `fk_template_artifact` FOREIGN KEY (`artifact_id`) REFERENCES `artifact` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Templates para download anexados pela equipe TrialScale (anexos assimétricos).';

-- Texto instrutivo por processo (handoff v4; 1:1, conteúdo editorial re-seedável)
CREATE TABLE IF NOT EXISTS `process_guide` (
  `process_id`      BIGINT UNSIGNED NOT NULL,
  `purpose_md`      TEXT NOT NULL,
  `flow_md`         TEXT NULL,          -- prosa de "Como o processo funciona"
  `flow_inputs`     JSON NULL,
  `flow_activities` JSON NULL,
  `flow_outputs`    JSON NULL,
  `indicators`      JSON NULL,
  `risks`           JSON NULL,
  `practices`       JSON NULL,
  `regulatory`      JSON NULL,          -- regra editorial: normas SEMPRE aqui
  `getting_started` JSON NULL,
  `source_citation` TEXT NULL,
  `updated_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`process_id`),
  CONSTRAINT `fk_guide_process` FOREIGN KEY (`process_id`) REFERENCES `process` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Texto instrutivo do processo (v4): ensina por que importa, como funciona, riscos e práticas.';

-- =============================================================================
-- 2. IDENTIDADE (user global; demais tabelas de centro com tenant_id NOT NULL)
-- =============================================================================

CREATE TABLE IF NOT EXISTS `user` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email`         VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `name`          VARCHAR(200) NOT NULL,
  `is_staff`      TINYINT(1) NOT NULL DEFAULT 0,   -- equipe TrialScale (backoffice), sem tenant
  `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Identidade de pessoa (global). Escopo de centro vem de membership. Exceção §7.';

CREATE TABLE IF NOT EXISTS `tenant` (
  `id`                       BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,  -- o PK É o escopo
  `name`                     VARCHAR(200) NOT NULL,
  -- Cadastro do centro (decisão do usuário 2026-07-23; substitui natureza/regiao/volume_faixa):
  `tipo_instituicao`         ENUM('publica','privada','terceiro_setor') NULL,
  `cidade`                   VARCHAR(120) NULL,   -- LGPD: mais granular que "faixa"; proteção do
  `estado`                   CHAR(2) NULL,        --   benchmark = regra dos >=5 tenants por recorte
  -- Faixas normalizadas (51-100 e 100-200 se sobrepunham; ajustado para 101_200):
  `protocolos_ativos_faixa`  ENUM('0_10','11_30','31_50','51_100','101_200','200_mais') NULL,
  `tamanho`                  VARCHAR(40) NULL,
  `fase_estudos`             VARCHAR(40) NULL,
  `tempo_existencia`         VARCHAR(40) NULL,
  `plan_id`                  SMALLINT UNSIGNED NULL,
  -- Atributos de perfil que condições de aplicabilidade consultam (Q7, provisório):
  `possui_pi_refrigerado`    TINYINT(1) NULL,
  `possui_amostras`          TINYINT(1) NULL,
  `created_at`               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_tenant_plan` (`plan_id`),
  KEY `ix_tenant_uf` (`estado`),
  CONSTRAINT `fk_tenant_plan` FOREIGN KEY (`plan_id`) REFERENCES `plan` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='O centro de pesquisa. Raiz do isolamento. Sem protocolo/patrocinador (constituição §2). Especialidades: N:N via tenant_specialty.';

CREATE TABLE IF NOT EXISTS `tenant_specialty` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tenant_id`    BIGINT UNSIGNED NOT NULL,
  `specialty_id` SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tenant_specialty` (`tenant_id`, `specialty_id`),
  KEY `ix_ts_specialty` (`specialty_id`),
  CONSTRAINT `fk_ts_tenant`    FOREIGN KEY (`tenant_id`)    REFERENCES `tenant` (`id`),
  CONSTRAINT `fk_ts_specialty` FOREIGN KEY (`specialty_id`) REFERENCES `specialty` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Especialidades médicas do centro (N:N com o lookup global specialty).';

CREATE TABLE IF NOT EXISTS `membership` (
  `id`        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tenant_id` BIGINT UNSIGNED NOT NULL,
  `user_id`   BIGINT UNSIGNED NOT NULL,
  `role`      ENUM('administrador','coordenador','membro') NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_membership` (`tenant_id`, `user_id`),
  KEY `ix_membership_user` (`user_id`),
  CONSTRAINT `fk_membership_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenant` (`id`),
  CONSTRAINT `fk_membership_user`   FOREIGN KEY (`user_id`)   REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Vínculo usuário×centro com papel.';

CREATE TABLE IF NOT EXISTS `consent` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tenant_id`       BIGINT UNSIGNED NOT NULL,
  `user_id`         BIGINT UNSIGNED NOT NULL,
  `consent_version` VARCHAR(40) NOT NULL,
  `consented_at`    DATETIME NOT NULL,
  `text_ref`        VARCHAR(255) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_consent_tenant` (`tenant_id`, `consented_at`),
  KEY `ix_consent_user` (`user_id`),
  CONSTRAINT `fk_consent_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenant` (`id`),
  CONSTRAINT `fk_consent_user`   FOREIGN KEY (`user_id`)   REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Consentimento LGPD versionado; nunca sobrescrito (constituição §5).';

CREATE TABLE IF NOT EXISTS `audit_log` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tenant_id`  BIGINT UNSIGNED NULL,       -- NULL só p/ eventos globais de staff
  `user_id`    BIGINT UNSIGNED NULL,
  `event_type` VARCHAR(80)  NOT NULL,
  `entity`     VARCHAR(80)  NOT NULL,
  `entity_id`  VARCHAR(80)  NULL,
  `metadata`   JSON NULL,                  -- ALLOW-LIST na aplicação; nunca PII (RN-4/AC-14)
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_audit_tenant` (`tenant_id`, `created_at`),
  KEY `ix_audit_event` (`event_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Auditoria de eventos sensíveis. metadata é allow-list (sem PII).';

CREATE TABLE IF NOT EXISTS `refresh_token` (
  `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`        BIGINT UNSIGNED NOT NULL,
  `tenant_id`      BIGINT UNSIGNED NULL,      -- tenant da SESSÃO (claim do access token);
                                              -- NULL apenas para sessão de staff (is_staff)
  `token_hash`     CHAR(64) NOT NULL,         -- SHA-256 hex; o token em claro NUNCA é persistido
  `family_id`      CHAR(36) NOT NULL,         -- cadeia de rotação; reuso revoga a família
  `expires_at`     DATETIME NOT NULL,         -- UTC
  `revoked_at`     DATETIME NULL,             -- logout, rotação ou detecção de reuso
  `replaced_by_id` BIGINT UNSIGNED NULL,      -- elo da rotação
  `created_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rt_token_hash` (`token_hash`),
  KEY `ix_rt_user`   (`user_id`),
  KEY `ix_rt_family` (`family_id`),
  KEY `ix_rt_tenant` (`tenant_id`, `expires_at`),
  CONSTRAINT `fk_rt_user`     FOREIGN KEY (`user_id`)        REFERENCES `user` (`id`),
  CONSTRAINT `fk_rt_tenant`   FOREIGN KEY (`tenant_id`)      REFERENCES `tenant` (`id`),
  CONSTRAINT `fk_rt_replaced` FOREIGN KEY (`replaced_by_id`) REFERENCES `refresh_token` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Sessão via refresh token opaco com rotação/revogação. Identidade: escopo por user_id.';

CREATE TABLE IF NOT EXISTS `password_reset_token` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    BIGINT UNSIGNED NOT NULL,     -- user é global; sem tenant_id
  `token_hash` CHAR(64) NOT NULL,            -- SHA-256 hex; single-use
  `expires_at` DATETIME NOT NULL,            -- UTC; TTL ~30 min
  `used_at`    DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_prt_token_hash` (`token_hash`),
  KEY `ix_prt_user` (`user_id`, `expires_at`),
  CONSTRAINT `fk_prt_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Token de recuperação de senha (single-use, expira). Global como user.';

-- =============================================================================
-- 3. JORNADA E AVALIAÇÃO DO CENTRO (tenant_id NOT NULL)
-- =============================================================================

CREATE TABLE IF NOT EXISTS `tenant_objective` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tenant_id`     BIGINT UNSIGNED NOT NULL,
  `objective_id`  SMALLINT UNSIGNED NOT NULL,
  `priority_rank` INT NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tenant_objective` (`tenant_id`, `objective_id`),
  KEY `ix_to_objective` (`objective_id`),
  CONSTRAINT `fk_to_tenant`    FOREIGN KEY (`tenant_id`)    REFERENCES `tenant` (`id`),
  CONSTRAINT `fk_to_objective` FOREIGN KEY (`objective_id`) REFERENCES `objective` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Objetivos priorizados pelo centro (prioridade relativa).';

CREATE TABLE IF NOT EXISTS `pain_score` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tenant_id`  BIGINT UNSIGNED NOT NULL,
  `process_id` BIGINT UNSIGNED NOT NULL,
  `score`      TINYINT UNSIGNED NOT NULL,   -- 1..5 (termômetro)
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_pain` (`tenant_id`, `process_id`),
  KEY `ix_pain_process` (`process_id`),
  CONSTRAINT `fk_pain_tenant`  FOREIGN KEY (`tenant_id`)  REFERENCES `tenant` (`id`),
  CONSTRAINT `fk_pain_process` FOREIGN KEY (`process_id`) REFERENCES `process` (`id`),
  CONSTRAINT `ck_pain_score` CHECK (`score` BETWEEN 1 AND 5)   -- não aplicado no 5.7
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Termômetro de dor por processo.';

CREATE TABLE IF NOT EXISTS `process_applicability` (
  `id`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tenant_id`        BIGINT UNSIGNED NOT NULL,
  `process_id`       BIGINT UNSIGNED NOT NULL,
  `applies`          TINYINT(1) NOT NULL DEFAULT 1,
  `na_justification` VARCHAR(500) NULL,     -- transparência do N/A (concepção §3)
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_proc_appl` (`tenant_id`, `process_id`),
  KEY `ix_proc_appl_process` (`process_id`),
  CONSTRAINT `fk_pa_tenant`  FOREIGN KEY (`tenant_id`)  REFERENCES `tenant` (`id`),
  CONSTRAINT `fk_pa_process` FOREIGN KEY (`process_id`) REFERENCES `process` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='"Não se aplica" por processo, com justificativa. Sai do cálculo do nível geral.';

CREATE TABLE IF NOT EXISTS `level_target` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tenant_id`    BIGINT UNSIGNED NOT NULL,
  `process_id`   BIGINT UNSIGNED NOT NULL,
  `target_level` TINYINT UNSIGNED NOT NULL,  -- 1..5
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_level_target` (`tenant_id`, `process_id`),   -- RN-5
  KEY `ix_lt_process` (`process_id`),
  CONSTRAINT `fk_lt_tenant`  FOREIGN KEY (`tenant_id`)  REFERENCES `tenant` (`id`),
  CONSTRAINT `fk_lt_process` FOREIGN KEY (`process_id`) REFERENCES `process` (`id`),
  CONSTRAINT `ck_lt_level` CHECK (`target_level` BETWEEN 1 AND 5)  -- não aplicado no 5.7
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Meta de nível por processo (concepção §4).';

CREATE TABLE IF NOT EXISTS `assessment` (
  `id`                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tenant_id`         BIGINT UNSIGNED NOT NULL,
  `artifact_id`       BIGINT UNSIGNED NOT NULL,   -- fixa a versão avaliada (ver RN-1/Q1)
  `state`             ENUM('nao_iniciado','em_elaboracao','completo') NOT NULL DEFAULT 'nao_iniciado',
  `expected_due_date` DATE NULL,                  -- AC-9: só com state='em_elaboracao' (app)
  `completed_at`      DATETIME NULL,
  `updated_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_assessment` (`tenant_id`, `artifact_id`),
  KEY `ix_assessment_state` (`tenant_id`, `state`),
  KEY `ix_assessment_due`   (`tenant_id`, `expected_due_date`),
  KEY `ix_assessment_artifact` (`artifact_id`),
  CONSTRAINT `fk_assessment_tenant`   FOREIGN KEY (`tenant_id`)   REFERENCES `tenant` (`id`),
  CONSTRAINT `fk_assessment_artifact` FOREIGN KEY (`artifact_id`) REFERENCES `artifact` (`id`),
  CONSTRAINT `ck_assessment_due` CHECK (`expected_due_date` IS NULL OR `state` = 'em_elaboracao')  -- não aplicado no 5.7
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Raio-X: marcação autodeclarada do artefato pelo centro. Única por (tenant, artefato).';

CREATE TABLE IF NOT EXISTS `round` (
  `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tenant_id`      BIGINT UNSIGNED NOT NULL,
  `sequence_no`    INT UNSIGNED NOT NULL,
  `status`         ENUM('aberta','concluida') NOT NULL DEFAULT 'aberta',
  `started_at`     DATETIME NULL,
  `completed_at`   DATETIME NULL,
  `challenge_weeks` INT UNSIGNED NULL,       -- desafio opcional de N semanas
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_round` (`tenant_id`, `sequence_no`),
  CONSTRAINT `fk_round_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenant` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Rodada de 3–4 processos que o centro escolhe melhorar.';

CREATE TABLE IF NOT EXISTS `round_process` (
  `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `round_id`       BIGINT UNSIGNED NOT NULL,
  `tenant_id`      BIGINT UNSIGNED NOT NULL,   -- ON-3: denormalizado p/ índice do kanban
  `process_id`     BIGINT UNSIGNED NOT NULL,
  `baseline_level` TINYINT UNSIGNED NULL,      -- nível de partida (conclusão = +1 em cada)
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_round_process` (`round_id`, `process_id`),
  KEY `ix_rp_tenant_process` (`tenant_id`, `process_id`),
  CONSTRAINT `fk_rp_round`   FOREIGN KEY (`round_id`)   REFERENCES `round` (`id`),
  CONSTRAINT `fk_rp_tenant`  FOREIGN KEY (`tenant_id`)  REFERENCES `tenant` (`id`),
  CONSTRAINT `fk_rp_process` FOREIGN KEY (`process_id`) REFERENCES `process` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Processos que compõem uma rodada (3–4).';

CREATE TABLE IF NOT EXISTS `tenant_achievement` (
  `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tenant_id`      BIGINT UNSIGNED NOT NULL,
  `achievement_id` SMALLINT UNSIGNED NOT NULL,
  `earned_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tenant_achievement` (`tenant_id`, `achievement_id`),
  KEY `ix_ta_achievement` (`achievement_id`),
  CONSTRAINT `fk_ta_tenant`      FOREIGN KEY (`tenant_id`)      REFERENCES `tenant` (`id`),
  CONSTRAINT `fk_ta_achievement` FOREIGN KEY (`achievement_id`) REFERENCES `achievement` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Conquistas obtidas pelo centro.';

-- =============================================================================
-- 4. SEED DO VOCABULÁRIO FIXO (idempotente) — só os catálogos realmente fixos
-- =============================================================================

INSERT IGNORE INTO `artifact_type` (`code`, `name`) VALUES
  ('infraestrutura',  'Infraestrutura'),
  ('pop',             'POP (procedimento operacional padrão)'),
  ('ferramenta',      'Ferramenta de gestão'),
  ('indicador',       'Indicador'),
  ('treinamento',     'Treinamento'),
  ('registro',        'Registro / evidência');

INSERT IGNORE INTO `origin_seal` (`code`, `name`) VALUES
  ('T', 'Tese'),
  ('G', 'Boa prática GCP/gestão'),
  ('A', 'Exigência de norma/ANVISA'),
  ('P', 'PIC (Plano de Implementação de Centros)'),
  ('D', 'Sugestão de design');

-- Planos do MVP (valores de exemplo da concepção §6, a validar comercialmente)
INSERT IGNORE INTO `plan` (`code`, `name`, `amount`) VALUES
  ('autosservico', 'Autosserviço',           3870.00),
  ('premium',      'Acompanhamento Premium', 7500.00);

-- Condições de aplicabilidade de artefato (avaliação: ADR 002 / Q7 provisório)
INSERT IGNORE INTO `applicability_condition` (`code`, `description`) VALUES
  ('centro_publico',        'Aplicável apenas a centros de instituição pública'),
  ('possui_pi_refrigerado', 'Aplicável a centros com produto sob investigação refrigerado'),
  ('possui_amostras',       'Aplicável a centros que manejam amostras biológicas');

-- Especialidades médicas (lista inicial editável via backoffice; baseada nas
-- especialidades reconhecidas no Brasil mais frequentes em pesquisa clínica):
INSERT IGNORE INTO `specialty` (`code`, `name`) VALUES
  ('alergia_imunologia',        'Alergia e Imunologia'),
  ('anestesiologia',            'Anestesiologia'),
  ('angiologia_vascular',       'Angiologia e Cirurgia Vascular'),
  ('cardiologia',               'Cardiologia'),
  ('cirurgia_geral',            'Cirurgia Geral'),
  ('cirurgia_oncologica',       'Cirurgia Oncológica'),
  ('clinica_medica',            'Clínica Médica'),
  ('coloproctologia',           'Coloproctologia'),
  ('dermatologia',              'Dermatologia'),
  ('endocrinologia',            'Endocrinologia e Metabologia'),
  ('gastroenterologia',         'Gastroenterologia'),
  ('genetica_medica',           'Genética Médica'),
  ('geriatria',                 'Geriatria'),
  ('ginecologia_obstetricia',   'Ginecologia e Obstetrícia'),
  ('hematologia',               'Hematologia e Hemoterapia'),
  ('hepatologia',               'Hepatologia'),
  ('infectologia',              'Infectologia'),
  ('mastologia',                'Mastologia'),
  ('medicina_familia',          'Medicina de Família e Comunidade'),
  ('medicina_esportiva',        'Medicina Esportiva'),
  ('medicina_intensiva',        'Medicina Intensiva'),
  ('medicina_nuclear',          'Medicina Nuclear'),
  ('nefrologia',                'Nefrologia'),
  ('neurocirurgia',             'Neurocirurgia'),
  ('neurologia',                'Neurologia'),
  ('nutrologia',                'Nutrologia'),
  ('oftalmologia',              'Oftalmologia'),
  ('oncologia_clinica',         'Oncologia Clínica'),
  ('ortopedia_traumatologia',   'Ortopedia e Traumatologia'),
  ('otorrinolaringologia',      'Otorrinolaringologia'),
  ('pediatria',                 'Pediatria'),
  ('pneumologia',               'Pneumologia'),
  ('psiquiatria',               'Psiquiatria'),
  ('radioterapia',              'Radioterapia'),
  ('reumatologia',              'Reumatologia'),
  ('urologia',                  'Urologia');

-- Fim do schema.
