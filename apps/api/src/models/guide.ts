/** Texto instrutivo por processo (handoff v4) — 1:1, conteúdo editorial global. */
import { DataTypes, type ModelDefined, type Optional } from 'sequelize'
import { sequelize } from '../db/sequelize'
import { registerTenancy } from '../db/tenancy'

export interface RegulatoryItem {
  source: string
  text: string
  url?: string
}
export interface PracticeItem {
  title: string
  text: string
}

export interface ProcessGuideAttrs {
  process_id: number
  purpose_md: string
  flow_md: string | null
  flow_inputs: string[] | null
  flow_activities: string[] | null
  flow_outputs: string[] | null
  indicators: string[] | null
  risks: string[] | null
  practices: PracticeItem[] | null
  regulatory: RegulatoryItem[] | null
  getting_started: string[] | null
  source_citation: string | null
}
export type ProcessGuideCreation = Optional<
  ProcessGuideAttrs,
  | 'flow_md'
  | 'flow_inputs'
  | 'flow_activities'
  | 'flow_outputs'
  | 'indicators'
  | 'risks'
  | 'practices'
  | 'regulatory'
  | 'getting_started'
  | 'source_citation'
>

export const ProcessGuide: ModelDefined<ProcessGuideAttrs, ProcessGuideCreation> =
  sequelize.define('process_guide', {
    process_id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true },
    purpose_md: { type: DataTypes.TEXT, allowNull: false },
    flow_md: { type: DataTypes.TEXT, allowNull: true },
    flow_inputs: { type: DataTypes.JSON, allowNull: true },
    flow_activities: { type: DataTypes.JSON, allowNull: true },
    flow_outputs: { type: DataTypes.JSON, allowNull: true },
    indicators: { type: DataTypes.JSON, allowNull: true },
    risks: { type: DataTypes.JSON, allowNull: true },
    practices: { type: DataTypes.JSON, allowNull: true },
    regulatory: { type: DataTypes.JSON, allowNull: true },
    getting_started: { type: DataTypes.JSON, allowNull: true },
    source_citation: { type: DataTypes.TEXT, allowNull: true },
  })

registerTenancy(ProcessGuide, 'global')
