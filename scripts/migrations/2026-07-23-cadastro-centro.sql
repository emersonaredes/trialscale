-- =============================================================================
-- Migração: cadastro do centro (2026-07-23)
-- Alinha bancos JÁ CRIADOS à nova definição do tenant no schema.sql (fonte da
-- verdade). Instalações novas não precisam deste arquivo.
--
-- Contexto: tenant estava vazio (0 linhas) no momento da escrita — sem perda
-- de dados. Rollback (se necessário): reverter os CHANGE/DROP abaixo com a
-- definição anterior (natureza ENUM('publico','privado','misto'), regiao
-- VARCHAR(80), volume_faixa VARCHAR(40), especialidades VARCHAR(400)).
--
-- Mudanças (decisão do usuário em 2026-07-23):
--   natureza  -> tipo_instituicao ENUM(publica, privada, terceiro_setor)
--   regiao    -> cidade + estado (UF)
--   volume_faixa -> protocolos_ativos_faixa (faixas fixas; 51-100/100-200
--                   normalizadas para 51_100/101_200 por sobreposição no 100)
--   especialidades VARCHAR -> N:N via specialty + tenant_specialty
-- =============================================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

ALTER TABLE `tenant`
  CHANGE COLUMN `natureza` `tipo_instituicao` ENUM('publica','privada','terceiro_setor') NULL,
  CHANGE COLUMN `regiao` `cidade` VARCHAR(120) NULL,
  ADD COLUMN `estado` CHAR(2) NULL AFTER `cidade`,
  CHANGE COLUMN `volume_faixa` `protocolos_ativos_faixa`
    ENUM('0_10','11_30','31_50','51_100','101_200','200_mais') NULL,
  DROP COLUMN `especialidades`,
  ADD KEY `ix_tenant_uf` (`estado`);

CREATE TABLE IF NOT EXISTS `specialty` (
  `id`   SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(60)  NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_specialty_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Lookup global de especialidades médicas (cadastro do centro).';

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
