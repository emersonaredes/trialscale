-- Reparo de dados: lookups gravados com '?' no lugar de acentos (carga inicial
-- feita com conexão sem utf8mb4). Valores canônicos = seed do schema.sql §4.
-- Idempotente: só toca linhas que ainda contêm '?'.
-- IMPORTANTE: aplicar com conexão utf8mb4 (default-character-set=utf8mb4).

UPDATE `artifact_type` SET `name` = 'POP (procedimento operacional padrão)'
  WHERE `code` = 'pop' AND `name` LIKE '%?%';
UPDATE `artifact_type` SET `name` = 'Ferramenta de gestão'
  WHERE `code` = 'ferramenta' AND `name` LIKE '%?%';
UPDATE `artifact_type` SET `name` = 'Registro / evidência'
  WHERE `code` = 'registro' AND `name` LIKE '%?%';

UPDATE `origin_seal` SET `name` = 'Boa prática GCP/gestão'
  WHERE `code` = 'G' AND `name` LIKE '%?%';
UPDATE `origin_seal` SET `name` = 'Exigência de norma/ANVISA'
  WHERE `code` = 'A' AND `name` LIKE '%?%';
UPDATE `origin_seal` SET `name` = 'PIC (Plano de Implementação de Centros)'
  WHERE `code` = 'P' AND `name` LIKE '%?%';
UPDATE `origin_seal` SET `name` = 'Sugestão de design'
  WHERE `code` = 'D' AND `name` LIKE '%?%';

-- Specialties gravadas com double-encoding (UTF-8 lido como latin1 e
-- re-gravado). Guarda binária: a assinatura C383/C382+C2 só existe no dado
-- corrompido (LIKE '%Ã%' não serve — unicode_ci iguala Ã a A).
UPDATE `specialty` SET `name` = 'Cirurgia Oncológica'
  WHERE `code` = 'cirurgia_oncologica' AND HEX(`name`) REGEXP 'C38[23]C2';
UPDATE `specialty` SET `name` = 'Clínica Médica'
  WHERE `code` = 'clinica_medica' AND HEX(`name`) REGEXP 'C38[23]C2';
UPDATE `specialty` SET `name` = 'Genética Médica'
  WHERE `code` = 'genetica_medica' AND HEX(`name`) REGEXP 'C38[23]C2';
UPDATE `specialty` SET `name` = 'Ginecologia e Obstetrícia'
  WHERE `code` = 'ginecologia_obstetricia' AND HEX(`name`) REGEXP 'C38[23]C2';
UPDATE `specialty` SET `name` = 'Medicina de Família e Comunidade'
  WHERE `code` = 'medicina_familia' AND HEX(`name`) REGEXP 'C38[23]C2';
UPDATE `specialty` SET `name` = 'Oncologia Clínica'
  WHERE `code` = 'oncologia_clinica' AND HEX(`name`) REGEXP 'C38[23]C2';
