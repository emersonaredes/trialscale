/** Tipos de domínio compartilhados (importáveis por qualquer camada —
 *  diferente dos models, restritos a repositories/ e db/ pelo ADR 001). */
export type TipoInstituicao = 'publica' | 'privada' | 'terceiro_setor'
export type ProtocolosFaixa = '0_10' | '11_30' | '31_50' | '51_100' | '101_200' | '200_mais'

// Catálogo de conteúdo (Fatia 1)
export type ProcessGroup = 'central' | 'suporte' | 'gestao' | 'personalizado'
export type VersionStatus = 'rascunho' | 'publicado' | 'arquivado'
export type Classification = 'essencial' | 'complementar'
export type AssessmentState = 'nao_iniciado' | 'em_elaboracao' | 'completo'
