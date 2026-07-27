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
