-- =============================================================================
-- Migração: fundações do catálogo ORPC (2026-07-27) [PT-0066]
-- Bancos JÁ CRIADOS. Instalações novas usam só o schema.sql (atualizado JUNTO).
-- Aplicar com conexão utf8mb4 (lição da 2026-07-27-fix-lookups-charset.sql).
-- Idempotente: guards via INFORMATION_SCHEMA (5.7 não tem ADD COLUMN IF NOT EXISTS).
-- Sem operação destrutiva. Backup antes de aplicar (constituição §3).
-- Desenho revisado pelo db-architect sobre docs/db/analise_models_orpc.md:
--   - condições de PROCESSO (presta_monitoria etc.) ficam FORA do lookup de
--     condição de artefato até existir mecanismo processo-nível; o cadastro
--     captura os booleanos de serviço desde já para não re-perguntar depois
--   - sem índice novo em process.org_type (~60 linhas, ENUM de 2 valores)
--   - codes de condição = nomes das colunas do tenant (avaliador hardcoded)
-- Rollback:
--   ALTER TABLE tenant  DROP COLUMN org_type, DROP COLUMN modelo_servico,
--     DROP COLUMN assume_atribuicoes_anvisa, DROP COLUMN assume_farmacovigilancia,
--     DROP COLUMN perfil_fomento, DROP COLUMN presta_monitoria,
--     DROP COLUMN seleciona_centros, DROP COLUMN presta_gestao_dados,
--     DROP COLUMN ativa_centros, DROP COLUMN centros_geridos_faixa,
--     DROP COLUMN estudos_ativos_faixa;
--   ALTER TABLE process DROP COLUMN org_type;
--   ALTER TABLE objective DROP COLUMN org_type;
--   ALTER TABLE artifact DROP COLUMN regulatory_verified_at, DROP COLUMN regulatory_verified_by;
--   ALTER TABLE process_applicability DROP COLUMN area_label;
--   DELETE FROM origin_seal WHERE code = 'R';
--   DELETE FROM artifact_type WHERE code = 'documento_governanca';
--   DELETE FROM applicability_condition WHERE code IN
--     ('perfil_fomento','assume_atribuicoes_anvisa','assume_farmacovigilancia');
-- =============================================================================
SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- 1) Lookups (idempotentes por INSERT IGNORE) ---------------------------------
INSERT IGNORE INTO `artifact_type` (`code`, `name`) VALUES
  ('documento_governanca', 'Documento de governança');

INSERT IGNORE INTO `origin_seal` (`code`, `name`) VALUES
  ('R', 'Arquitetura de referência ORPC'),
  ('I', 'Achado de inspeção (BPC 2024-2025)');

-- Só condições com uso artefato-nível confirmado nas levas E campo de perfil
-- correspondente (RN-3: condição sem case no avaliador nunca exclui nada).
INSERT IGNORE INTO `applicability_condition` (`code`, `description`) VALUES
  ('perfil_fomento',            'Aplicável a organizações com captação via fomento/editais'),
  ('assume_atribuicoes_anvisa', 'Aplicável quando a ORPC assume atribuições do patrocinador perante a Anvisa'),
  ('assume_farmacovigilancia',  'Aplicável quando a ORPC assume atividades delegadas de segurança/farmacovigilância');

-- 2) tenant: tipo de organização + perfil ORPC (um ALTER só = um rebuild só) ---
SET @ddl = (SELECT IF(COUNT(*) = 0,
  'ALTER TABLE `tenant`
     ADD COLUMN `org_type` ENUM(''cpc'',''orpc'') NOT NULL DEFAULT ''cpc'' AFTER `name`,
     ADD COLUMN `modelo_servico` ENUM(''full_service'',''servicos_funcionais'',''aro'',''outro'') NULL,
     ADD COLUMN `assume_atribuicoes_anvisa` TINYINT(1) NULL,
     ADD COLUMN `assume_farmacovigilancia`  TINYINT(1) NULL,
     ADD COLUMN `perfil_fomento`            TINYINT(1) NULL,
     ADD COLUMN `presta_monitoria`          TINYINT(1) NULL,
     ADD COLUMN `seleciona_centros`         TINYINT(1) NULL,
     ADD COLUMN `presta_gestao_dados`       TINYINT(1) NULL,
     ADD COLUMN `ativa_centros`             TINYINT(1) NULL,
     ADD COLUMN `centros_geridos_faixa` ENUM(''0_5'',''6_15'',''16_40'',''41_100'',''100_mais'') NULL,
     ADD COLUMN `estudos_ativos_faixa`  ENUM(''0_5'',''6_15'',''16_40'',''41_100'',''100_mais'') NULL',
  'SELECT 1')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tenant' AND COLUMN_NAME = 'org_type');
PREPARE mig FROM @ddl; EXECUTE mig; DEALLOCATE PREPARE mig;

-- 3) process: catálogo por tipo de organização (SEM índice novo: ~60 linhas,
--    ENUM de 2 valores; reavaliar como (tenant_id, org_type) se crescer) ------
SET @ddl = (SELECT IF(COUNT(*) = 0,
  'ALTER TABLE `process`
     ADD COLUMN `org_type` ENUM(''cpc'',''orpc'') NOT NULL DEFAULT ''cpc'' AFTER `process_group`',
  'SELECT 1')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'process' AND COLUMN_NAME = 'org_type');
PREPARE mig FROM @ddl; EXECUTE mig; DEALLOCATE PREPARE mig;

-- 4) objective: idem -----------------------------------------------------------
SET @ddl = (SELECT IF(COUNT(*) = 0,
  'ALTER TABLE `objective`
     ADD COLUMN `org_type` ENUM(''cpc'',''orpc'') NOT NULL DEFAULT ''cpc'' AFTER `name`',
  'SELECT 1')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'objective' AND COLUMN_NAME = 'org_type');
PREPARE mig FROM @ddl; EXECUTE mig; DEALLOCATE PREPARE mig;

-- 5) artifact: última verificação regulatória (atualizacao_regulatoria_2026.md,
--    Parte 4). Sem FK em verified_by: precedente content_version.created_by. ---
SET @ddl = (SELECT IF(COUNT(*) = 0,
  'ALTER TABLE `artifact`
     ADD COLUMN `regulatory_verified_at` DATE NULL,
     ADD COLUMN `regulatory_verified_by` BIGINT UNSIGNED NULL',
  'SELECT 1')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'artifact' AND COLUMN_NAME = 'regulatory_verified_at');
PREPARE mig FROM @ddl; EXECUTE mig; DEALLOCATE PREPARE mig;

-- 6) process_applicability: área/departamento como atributo por tenant ---------
SET @ddl = (SELECT IF(COUNT(*) = 0,
  'ALTER TABLE `process_applicability`
     ADD COLUMN `area_label` VARCHAR(80) NULL',
  'SELECT 1')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'process_applicability' AND COLUMN_NAME = 'area_label');
PREPARE mig FROM @ddl; EXECUTE mig; DEALLOCATE PREPARE mig;

-- Fim. Seeds do catálogo ORPC (org_type='orpc') SÓ depois desta migração
-- aplicada + suíte de isolamento de catálogo verde.
