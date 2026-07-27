-- MySQL dump 10.13  Distrib 5.7.44, for Win64 (x86_64)
--
-- ------------------------------------------------------
-- Server version	5.7.44-log

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `achievement`
--

DROP TABLE IF EXISTS `achievement`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `achievement` (
  `id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('selo','medalha') COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_achievement_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Catálogo de selos/medalhas (gamificação, concepção §5).';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `applicability_condition`
--

DROP TABLE IF EXISTS `applicability_condition`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `applicability_condition` (
  `id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_appl_cond_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Condição de aplicabilidade de artefato, avaliada contra o perfil do tenant (C2/Q7).';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `artifact`
--

DROP TABLE IF EXISTS `artifact`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `artifact` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `content_version_id` bigint(20) unsigned NOT NULL,
  `tenant_id` bigint(20) unsigned DEFAULT NULL,
  `logical_key` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `artifact_type_id` tinyint(3) unsigned NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `dod_text` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `why_it_matters` text COLLATE utf8mb4_unicode_ci,
  `owner_process_id` bigint(20) unsigned NOT NULL,
  `applicability_condition_id` smallint(5) unsigned DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_artifact_cv` (`content_version_id`),
  KEY `ix_artifact_logical` (`logical_key`),
  KEY `ix_artifact_owner` (`owner_process_id`),
  KEY `ix_artifact_tenant` (`tenant_id`),
  KEY `fk_artifact_type` (`artifact_type_id`),
  KEY `fk_artifact_cond` (`applicability_condition_id`),
  CONSTRAINT `fk_artifact_cond` FOREIGN KEY (`applicability_condition_id`) REFERENCES `applicability_condition` (`id`),
  CONSTRAINT `fk_artifact_cv` FOREIGN KEY (`content_version_id`) REFERENCES `content_version` (`id`),
  CONSTRAINT `fk_artifact_owner` FOREIGN KEY (`owner_process_id`) REFERENCES `process` (`id`),
  CONSTRAINT `fk_artifact_type` FOREIGN KEY (`artifact_type_id`) REFERENCES `artifact_type` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Artefato que define maturidade. Pertence à versão do processo-dono.';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `artifact_placement`
--

DROP TABLE IF EXISTS `artifact_placement`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `artifact_placement` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `artifact_id` bigint(20) unsigned NOT NULL,
  `process_id` bigint(20) unsigned NOT NULL,
  `tenant_id` bigint(20) unsigned DEFAULT NULL,
  `level_number` tinyint(3) unsigned NOT NULL,
  `classification` enum('essencial','complementar') COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_placement` (`artifact_id`,`process_id`),
  KEY `ix_placement_process_level` (`process_id`,`level_number`),
  CONSTRAINT `fk_placement_artifact` FOREIGN KEY (`artifact_id`) REFERENCES `artifact` (`id`),
  CONSTRAINT `fk_placement_process` FOREIGN KEY (`process_id`) REFERENCES `process` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Coloca o artefato em um processo/nível com classificação E/C. Habilita compartilhamento.';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `artifact_seal`
--

DROP TABLE IF EXISTS `artifact_seal`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `artifact_seal` (
  `artifact_id` bigint(20) unsigned NOT NULL,
  `seal_code` char(1) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`artifact_id`,`seal_code`),
  KEY `ix_seal_code` (`seal_code`),
  CONSTRAINT `fk_seal_artifact` FOREIGN KEY (`artifact_id`) REFERENCES `artifact` (`id`),
  CONSTRAINT `fk_seal_code` FOREIGN KEY (`seal_code`) REFERENCES `origin_seal` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='N:N artefato × selo (um artefato pode ter [T][G] etc.).';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `artifact_template`
--

DROP TABLE IF EXISTS `artifact_template`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `artifact_template` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `artifact_id` bigint(20) unsigned NOT NULL,
  `file_ref` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `filename` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mime_type` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `size_bytes` bigint(20) unsigned NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_template_artifact` (`artifact_id`),
  CONSTRAINT `fk_template_artifact` FOREIGN KEY (`artifact_id`) REFERENCES `artifact` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Templates para download anexados pela equipe TrialScale (anexos assimétricos).';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `artifact_type`
--

DROP TABLE IF EXISTS `artifact_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `artifact_type` (
  `id` tinyint(3) unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_artifact_type_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Vocabulário fixo de tipos de artefato (concepção §3).';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `assessment`
--

DROP TABLE IF EXISTS `assessment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `assessment` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint(20) unsigned NOT NULL,
  `artifact_id` bigint(20) unsigned NOT NULL,
  `state` enum('nao_iniciado','em_elaboracao','completo') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'nao_iniciado',
  `expected_due_date` date DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_assessment` (`tenant_id`,`artifact_id`),
  KEY `ix_assessment_state` (`tenant_id`,`state`),
  KEY `ix_assessment_due` (`tenant_id`,`expected_due_date`),
  KEY `ix_assessment_artifact` (`artifact_id`),
  CONSTRAINT `fk_assessment_artifact` FOREIGN KEY (`artifact_id`) REFERENCES `artifact` (`id`),
  CONSTRAINT `fk_assessment_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenant` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Raio-X: marcação autodeclarada do artefato pelo centro. Única por (tenant, artefato).';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `audit_log`
--

DROP TABLE IF EXISTS `audit_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `audit_log` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint(20) unsigned DEFAULT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `event_type` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_id` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_audit_tenant` (`tenant_id`,`created_at`),
  KEY `ix_audit_event` (`event_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Auditoria de eventos sensíveis. metadata é allow-list (sem PII).';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `consent`
--

DROP TABLE IF EXISTS `consent`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `consent` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `consent_version` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `consented_at` datetime NOT NULL,
  `text_ref` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_consent_tenant` (`tenant_id`,`consented_at`),
  KEY `ix_consent_user` (`user_id`),
  CONSTRAINT `fk_consent_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenant` (`id`),
  CONSTRAINT `fk_consent_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Consentimento LGPD versionado; nunca sobrescrito (constituição §5).';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `content_version`
--

DROP TABLE IF EXISTS `content_version`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `content_version` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `process_id` bigint(20) unsigned NOT NULL,
  `tenant_id` bigint(20) unsigned DEFAULT NULL,
  `version_no` int(10) unsigned NOT NULL,
  `status` enum('rascunho','publicado','arquivado') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'rascunho',
  `published_at` datetime DEFAULT NULL,
  `created_by` bigint(20) unsigned DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `pub_process_id` bigint(20) unsigned GENERATED ALWAYS AS (if((`status` = 'publicado'),`process_id`,NULL)) VIRTUAL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cv_process_version` (`process_id`,`version_no`),
  UNIQUE KEY `uq_cv_one_published` (`pub_process_id`),
  KEY `ix_cv_process_status` (`process_id`,`status`),
  KEY `ix_cv_tenant` (`tenant_id`),
  CONSTRAINT `fk_cv_process` FOREIGN KEY (`process_id`) REFERENCES `process` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Versão de conteúdo por processo (rascunho→publicado→arquivado). Snapshot do dono.';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `level`
--

DROP TABLE IF EXISTS `level`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `level` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `content_version_id` bigint(20) unsigned NOT NULL,
  `tenant_id` bigint(20) unsigned DEFAULT NULL,
  `number` tinyint(3) unsigned NOT NULL,
  `name` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_level_cv_number` (`content_version_id`,`number`),
  CONSTRAINT `fk_level_cv` FOREIGN KEY (`content_version_id`) REFERENCES `content_version` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Os cinco níveis, caracterizados por processo/versão.';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `level_target`
--

DROP TABLE IF EXISTS `level_target`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `level_target` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint(20) unsigned NOT NULL,
  `process_id` bigint(20) unsigned NOT NULL,
  `target_level` tinyint(3) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_level_target` (`tenant_id`,`process_id`),
  KEY `ix_lt_process` (`process_id`),
  CONSTRAINT `fk_lt_process` FOREIGN KEY (`process_id`) REFERENCES `process` (`id`),
  CONSTRAINT `fk_lt_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenant` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Meta de nível por processo (concepção §4).';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `membership`
--

DROP TABLE IF EXISTS `membership`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `membership` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `role` enum('administrador','coordenador','membro') COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_membership` (`tenant_id`,`user_id`),
  KEY `ix_membership_user` (`user_id`),
  CONSTRAINT `fk_membership_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenant` (`id`),
  CONSTRAINT `fk_membership_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Vínculo usuário×centro com papel.';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `objective`
--

DROP TABLE IF EXISTS `objective`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `objective` (
  `id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `theme` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_objective_theme` (`theme`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Menu global de objetivos estratégicos (Fase 1).';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `objective_process_weight`
--

DROP TABLE IF EXISTS `objective_process_weight`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `objective_process_weight` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `objective_id` smallint(5) unsigned NOT NULL,
  `process_id` bigint(20) unsigned NOT NULL,
  `weight` decimal(5,2) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_opw` (`objective_id`,`process_id`),
  KEY `ix_opw_process` (`process_id`),
  CONSTRAINT `fk_opw_objective` FOREIGN KEY (`objective_id`) REFERENCES `objective` (`id`),
  CONSTRAINT `fk_opw_process` FOREIGN KEY (`process_id`) REFERENCES `process` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Elo objetivo→processo: insumo do peso da priorização e do nível geral ponderado.';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `origin_seal`
--

DROP TABLE IF EXISTS `origin_seal`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `origin_seal` (
  `code` char(1) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Selo de origem do artefato (concepção §9).';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pain_score`
--

DROP TABLE IF EXISTS `pain_score`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pain_score` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint(20) unsigned NOT NULL,
  `process_id` bigint(20) unsigned NOT NULL,
  `score` tinyint(3) unsigned NOT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_pain` (`tenant_id`,`process_id`),
  KEY `ix_pain_process` (`process_id`),
  CONSTRAINT `fk_pain_process` FOREIGN KEY (`process_id`) REFERENCES `process` (`id`),
  CONSTRAINT `fk_pain_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenant` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Termômetro de dor por processo.';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `password_reset_token`
--

DROP TABLE IF EXISTS `password_reset_token`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `password_reset_token` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `token_hash` char(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_prt_token_hash` (`token_hash`),
  KEY `ix_prt_user` (`user_id`,`expires_at`),
  CONSTRAINT `fk_prt_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Token de recuperação de senha (single-use, expira). Global como user.';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `plan`
--

DROP TABLE IF EXISTS `plan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `plan` (
  `id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_plan_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Planos comerciais (Autosserviço / Premium).';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `process`
--

DROP TABLE IF EXISTS `process`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `process` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint(20) unsigned DEFAULT NULL,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `process_group` enum('central','suporte','gestao','personalizado') COLLATE utf8mb4_unicode_ci NOT NULL,
  `one_line_description` text COLLATE utf8mb4_unicode_ci,
  `objective_text` text COLLATE utf8mb4_unicode_ci,
  `is_benchmarkable` tinyint(1) GENERATED ALWAYS AS (isnull(`tenant_id`)) VIRTUAL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_process_tenant` (`tenant_id`),
  KEY `ix_process_group` (`tenant_id`,`process_group`),
  KEY `ix_process_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Processo do catálogo (28 da tese) ou personalizado do centro.';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `process_applicability`
--

DROP TABLE IF EXISTS `process_applicability`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `process_applicability` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint(20) unsigned NOT NULL,
  `process_id` bigint(20) unsigned NOT NULL,
  `applies` tinyint(1) NOT NULL DEFAULT '1',
  `na_justification` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_proc_appl` (`tenant_id`,`process_id`),
  KEY `ix_proc_appl_process` (`process_id`),
  CONSTRAINT `fk_pa_process` FOREIGN KEY (`process_id`) REFERENCES `process` (`id`),
  CONSTRAINT `fk_pa_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenant` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='"Não se aplica" por processo, com justificativa. Sai do cálculo do nível geral.';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `process_dependency`
--

DROP TABLE IF EXISTS `process_dependency`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `process_dependency` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `from_process_id` bigint(20) unsigned NOT NULL,
  `to_process_id` bigint(20) unsigned NOT NULL,
  `type` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_dep` (`from_process_id`,`to_process_id`,`type`),
  KEY `ix_dep_to` (`to_process_id`),
  CONSTRAINT `fk_dep_from` FOREIGN KEY (`from_process_id`) REFERENCES `process` (`id`),
  CONSTRAINT `fk_dep_to` FOREIGN KEY (`to_process_id`) REFERENCES `process` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Dependências entre processos (ordem recomendada; não trava navegação).';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `process_guide`
--

DROP TABLE IF EXISTS `process_guide`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `process_guide` (
  `process_id` bigint(20) unsigned NOT NULL,
  `purpose_md` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `flow_md` text COLLATE utf8mb4_unicode_ci,
  `flow_inputs` json DEFAULT NULL,
  `flow_activities` json DEFAULT NULL,
  `flow_outputs` json DEFAULT NULL,
  `indicators` json DEFAULT NULL,
  `risks` json DEFAULT NULL,
  `practices` json DEFAULT NULL,
  `regulatory` json DEFAULT NULL,
  `getting_started` json DEFAULT NULL,
  `source_citation` text COLLATE utf8mb4_unicode_ci,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`process_id`),
  CONSTRAINT `fk_guide_process` FOREIGN KEY (`process_id`) REFERENCES `process` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Texto instrutivo do processo (v4): ensina por que importa, como funciona, riscos e práticas.';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `refresh_token`
--

DROP TABLE IF EXISTS `refresh_token`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `refresh_token` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `tenant_id` bigint(20) unsigned DEFAULT NULL,
  `token_hash` char(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `family_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `revoked_at` datetime DEFAULT NULL,
  `replaced_by_id` bigint(20) unsigned DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rt_token_hash` (`token_hash`),
  KEY `ix_rt_user` (`user_id`),
  KEY `ix_rt_family` (`family_id`),
  KEY `ix_rt_tenant` (`tenant_id`,`expires_at`),
  KEY `fk_rt_replaced` (`replaced_by_id`),
  CONSTRAINT `fk_rt_replaced` FOREIGN KEY (`replaced_by_id`) REFERENCES `refresh_token` (`id`),
  CONSTRAINT `fk_rt_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenant` (`id`),
  CONSTRAINT `fk_rt_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Sessão via refresh token opaco com rotação/revogação. Identidade: escopo por user_id.';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `round`
--

DROP TABLE IF EXISTS `round`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `round` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint(20) unsigned NOT NULL,
  `sequence_no` int(10) unsigned NOT NULL,
  `status` enum('aberta','concluida') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'aberta',
  `started_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `challenge_weeks` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_round` (`tenant_id`,`sequence_no`),
  CONSTRAINT `fk_round_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenant` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Rodada de 3–4 processos que o centro escolhe melhorar.';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `round_process`
--

DROP TABLE IF EXISTS `round_process`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `round_process` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `round_id` bigint(20) unsigned NOT NULL,
  `tenant_id` bigint(20) unsigned NOT NULL,
  `process_id` bigint(20) unsigned NOT NULL,
  `baseline_level` tinyint(3) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_round_process` (`round_id`,`process_id`),
  KEY `ix_rp_tenant_process` (`tenant_id`,`process_id`),
  KEY `fk_rp_process` (`process_id`),
  CONSTRAINT `fk_rp_process` FOREIGN KEY (`process_id`) REFERENCES `process` (`id`),
  CONSTRAINT `fk_rp_round` FOREIGN KEY (`round_id`) REFERENCES `round` (`id`),
  CONSTRAINT `fk_rp_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenant` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Processos que compõem uma rodada (3–4).';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `specialty`
--

DROP TABLE IF EXISTS `specialty`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `specialty` (
  `id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_specialty_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Lookup global de especialidades médicas (cadastro do centro).';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tenant`
--

DROP TABLE IF EXISTS `tenant`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tenant` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo_instituicao` enum('publica','privada','terceiro_setor') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cidade` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado` char(2) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `protocolos_ativos_faixa` enum('0_10','11_30','31_50','51_100','101_200','200_mais') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tamanho` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fase_estudos` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tempo_existencia` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `plan_id` smallint(5) unsigned DEFAULT NULL,
  `possui_pi_refrigerado` tinyint(1) DEFAULT NULL,
  `possui_amostras` tinyint(1) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_tenant_plan` (`plan_id`),
  KEY `ix_tenant_uf` (`estado`),
  CONSTRAINT `fk_tenant_plan` FOREIGN KEY (`plan_id`) REFERENCES `plan` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='O centro de pesquisa. Raiz do isolamento. Sem protocolo/patrocinador (constituição §2). Especialidades: N:N via tenant_specialty.';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tenant_achievement`
--

DROP TABLE IF EXISTS `tenant_achievement`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tenant_achievement` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint(20) unsigned NOT NULL,
  `achievement_id` smallint(5) unsigned NOT NULL,
  `earned_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tenant_achievement` (`tenant_id`,`achievement_id`),
  KEY `ix_ta_achievement` (`achievement_id`),
  CONSTRAINT `fk_ta_achievement` FOREIGN KEY (`achievement_id`) REFERENCES `achievement` (`id`),
  CONSTRAINT `fk_ta_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenant` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Conquistas obtidas pelo centro.';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tenant_objective`
--

DROP TABLE IF EXISTS `tenant_objective`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tenant_objective` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint(20) unsigned NOT NULL,
  `objective_id` smallint(5) unsigned NOT NULL,
  `priority_rank` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tenant_objective` (`tenant_id`,`objective_id`),
  KEY `ix_to_objective` (`objective_id`),
  CONSTRAINT `fk_to_objective` FOREIGN KEY (`objective_id`) REFERENCES `objective` (`id`),
  CONSTRAINT `fk_to_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenant` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Objetivos priorizados pelo centro (prioridade relativa).';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tenant_specialty`
--

DROP TABLE IF EXISTS `tenant_specialty`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tenant_specialty` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint(20) unsigned NOT NULL,
  `specialty_id` smallint(5) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tenant_specialty` (`tenant_id`,`specialty_id`),
  KEY `ix_ts_specialty` (`specialty_id`),
  CONSTRAINT `fk_ts_specialty` FOREIGN KEY (`specialty_id`) REFERENCES `specialty` (`id`),
  CONSTRAINT `fk_ts_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenant` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Especialidades médicas do centro (N:N com o lookup global specialty).';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_staff` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Identidade de pessoa (global). Escopo de centro vem de membership. Exceção §7.';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed
