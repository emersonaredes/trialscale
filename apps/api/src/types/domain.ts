/** Tipos de domínio compartilhados (importáveis por qualquer camada —
 *  diferente dos models, restritos a repositories/ e db/ pelo ADR 001). */
export type TipoInstituicao = 'publica' | 'privada' | 'terceiro_setor'
export type ProtocolosFaixa = '0_10' | '11_30' | '31_50' | '51_100' | '101_200' | '200_mais'

// Catálogo ORPC (PT-0066): tipo de organização — imutável após o cadastro
export type OrgType = 'cpc' | 'orpc'
export type ModeloServico = 'full_service' | 'servicos_funcionais' | 'aro' | 'outro'
/** Faixas do perfil ORPC (escala própria, decisão de produto 2026-07-27 —
 *  distinta de ProtocolosFaixa, que é a escala de CPC). */
export type OrpcFaixa = '0_5' | '6_15' | '16_40' | '41_100' | '100_mais'

// Catálogo de conteúdo (Fatia 1)
export type ProcessGroup = 'central' | 'suporte' | 'gestao' | 'personalizado'
export type VersionStatus = 'rascunho' | 'publicado' | 'arquivado'
export type Classification = 'essencial' | 'complementar'
export type AssessmentState = 'nao_iniciado' | 'em_elaboracao' | 'completo'
export type AchievementType = 'selo' | 'medalha'
