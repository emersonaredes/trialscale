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
-- Dumping data for table `artifact_type`
--

LOCK TABLES `artifact_type` WRITE;
/*!40000 ALTER TABLE `artifact_type` DISABLE KEYS */;
INSERT INTO `artifact_type` VALUES (1,'infraestrutura','Infraestrutura'),(2,'pop','POP (procedimento operacional padrão)'),(3,'ferramenta','Ferramenta de gestão'),(4,'indicador','Indicador'),(5,'treinamento','Treinamento'),(6,'registro','Registro / evidência');
/*!40000 ALTER TABLE `artifact_type` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `origin_seal`
--

LOCK TABLES `origin_seal` WRITE;
/*!40000 ALTER TABLE `origin_seal` DISABLE KEYS */;
INSERT INTO `origin_seal` VALUES ('A','Exigência de norma/ANVISA'),('D','Sugestão de design'),('G','Boa prática GCP/gestão'),('P','PIC (Plano de Implementação de Centros)'),('T','Tese');
/*!40000 ALTER TABLE `origin_seal` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `applicability_condition`
--

LOCK TABLES `applicability_condition` WRITE;
/*!40000 ALTER TABLE `applicability_condition` DISABLE KEYS */;
INSERT INTO `applicability_condition` VALUES (1,'centro_publico','Aplicável apenas a centros de instituição pública'),(2,'possui_pi_refrigerado','Aplicável a centros com produto sob investigação refrigerado'),(3,'possui_amostras','Aplicável a centros que manejam amostras biológicas');
/*!40000 ALTER TABLE `applicability_condition` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `objective`
--

LOCK TABLES `objective` WRITE;
/*!40000 ALTER TABLE `objective` DISABLE KEYS */;
INSERT INTO `objective` VALUES (1,'Volume e captação de estudos','Aumentar o número de protocolos'),(2,'Volume e captação de estudos','Aumentar recrutamento'),(3,'Volume e captação de estudos','Atrair estudos de maior complexidade ou fase mais precoce'),(4,'Volume e captação de estudos','Diversificar áreas terapêuticas'),(5,'Volume e captação de estudos','Atrair estudos internacionais / patrocinadores globais'),(6,'Volume e captação de estudos','Reduzir a dependência de poucos patrocinadores'),(7,'Qualidade e conformidade','Melhorar a qualidade dos processos'),(8,'Qualidade e conformidade','Diminuir desvios'),(9,'Qualidade e conformidade','Reduzir achados em monitorias, auditorias e inspeções'),(10,'Qualidade e conformidade','Encurtar o tempo de resposta a queries'),(11,'Qualidade e conformidade','Fortalecer a integridade e a rastreabilidade dos dados'),(12,'Desempenho operacional','Encurtar o tempo de startup (da seleção ao primeiro participante)'),(13,'Desempenho operacional','Melhorar a taxa de retenção de participantes'),(14,'Desempenho operacional','Aumentar a previsibilidade de metas de inclusão'),(15,'Desempenho operacional','Reduzir o tempo entre visita e inserção de dados no CRF'),(16,'Desempenho operacional','Aumentar a taxa de conversão de feasibility em contrato'),(17,'Financeiro e sustentabilidade','Aumentar o faturamento'),(18,'Financeiro e sustentabilidade','Melhorar a previsibilidade e o fluxo de caixa'),(19,'Financeiro e sustentabilidade','Reduzir inadimplência e atrasos de pagamento do patrocinador'),(20,'Financeiro e sustentabilidade','Melhorar a precificação de procedimentos e o overhead'),(21,'Pessoas e conhecimento','Reduzir a dependência de pessoas-chave (reter conhecimento em processos)'),(22,'Pessoas e conhecimento','Estruturar capacitação e educação continuada'),(23,'Pessoas e conhecimento','Melhorar a retenção da equipe'),(24,'Impacto e reputação','Melhorar o serviço de saúde local'),(25,'Impacto e reputação','Fortalecer o relacionamento com a comunidade e a rede de referenciamento'),(26,'Impacto e reputação','Construir reputação e ser reconhecido como referência em uma área'),(27,'Participante','Melhorar a experiência e a segurança do participante'),(28,'Participante','Reduzir o tempo de espera nas visitas');
/*!40000 ALTER TABLE `objective` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `achievement`
--

LOCK TABLES `achievement` WRITE;
/*!40000 ALTER TABLE `achievement` DISABLE KEYS */;
INSERT INTO `achievement` VALUES (1,'primeiro-passo','Primeiro passo','selo'),(2,'fotografia-completa','Fotografia completa','selo'),(3,'primeira-trilha','Primeira trilha','selo'),(4,'primeiro-definido','Processo Definido','selo'),(5,'primeiro-gerenciado','Processo Gerenciado','selo'),(6,'primeiro-otimizado','Topo da rota','medalha'),(7,'cinco-definidos','Cinco no Definido','medalha'),(8,'suporte-definido','Base sólida','medalha'),(9,'primeira-rodada','Primeira rodada','medalha'),(10,'tres-rodadas','Ritmo de melhoria','medalha');
/*!40000 ALTER TABLE `achievement` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `specialty`
--

LOCK TABLES `specialty` WRITE;
/*!40000 ALTER TABLE `specialty` DISABLE KEYS */;
INSERT INTO `specialty` VALUES (1,'alergia_imunologia','Alergia e Imunologia'),(2,'anestesiologia','Anestesiologia'),(3,'angiologia_vascular','Angiologia e Cirurgia Vascular'),(4,'cardiologia','Cardiologia'),(5,'cirurgia_geral','Cirurgia Geral'),(6,'cirurgia_oncologica','Cirurgia Oncológica'),(7,'clinica_medica','Clínica Médica'),(8,'coloproctologia','Coloproctologia'),(9,'dermatologia','Dermatologia'),(10,'endocrinologia','Endocrinologia e Metabologia'),(11,'gastroenterologia','Gastroenterologia'),(12,'genetica_medica','Genética Médica'),(13,'geriatria','Geriatria'),(14,'ginecologia_obstetricia','Ginecologia e Obstetrícia'),(15,'hematologia','Hematologia e Hemoterapia'),(16,'hepatologia','Hepatologia'),(17,'infectologia','Infectologia'),(18,'mastologia','Mastologia'),(19,'medicina_familia','Medicina de Família e Comunidade'),(20,'medicina_esportiva','Medicina Esportiva'),(21,'medicina_intensiva','Medicina Intensiva'),(22,'medicina_nuclear','Medicina Nuclear'),(23,'nefrologia','Nefrologia'),(24,'neurocirurgia','Neurocirurgia'),(25,'neurologia','Neurologia'),(26,'nutrologia','Nutrologia'),(27,'oftalmologia','Oftalmologia'),(28,'oncologia_clinica','Oncologia Clínica'),(29,'ortopedia_traumatologia','Ortopedia e Traumatologia'),(30,'otorrinolaringologia','Otorrinolaringologia'),(31,'pediatria','Pediatria'),(32,'pneumologia','Pneumologia'),(33,'psiquiatria','Psiquiatria'),(34,'radioterapia','Radioterapia'),(35,'reumatologia','Reumatologia'),(36,'urologia','Urologia');
/*!40000 ALTER TABLE `specialty` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `plan`
--

LOCK TABLES `plan` WRITE;
/*!40000 ALTER TABLE `plan` DISABLE KEYS */;
INSERT INTO `plan` VALUES (1,'autosservico','Autosserviço',3870.00),(2,'premium','Acompanhamento Premium',7500.00);
/*!40000 ALTER TABLE `plan` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed
