import { ProcessGuide, type ProcessGuideCreation } from '../models/guide'
import { Artifact } from '../models/catalog'

/** Textos instrutivos (handoff v4): 1:1 por processo, re-seedável. */
export const guideRepository = {
  findByProcessId(processId: number) {
    return ProcessGuide.findByPk(processId)
  },

  /** Upsert do guia inteiro (o seed é a fonte editorial por ora). */
  async upsert(data: ProcessGuideCreation): Promise<void> {
    const [row, created] = await ProcessGuide.findOrCreate({
      where: { process_id: data.process_id },
      defaults: data as never,
    })
    if (!created) {
      row.set(data as never)
      await row.save()
    }
  },

  /** Define o "por que importa" de um artefato (linha da versão publicada). */
  async setArtifactWhy(artifactId: number, why: string | null): Promise<void> {
    await Artifact.update({ why_it_matters: why }, { where: { id: artifactId } })
  },
}
