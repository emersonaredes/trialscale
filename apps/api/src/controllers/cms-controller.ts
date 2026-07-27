import path from 'node:path'
import fs from 'node:fs'
import crypto from 'node:crypto'
import type { Request, Response, NextFunction } from 'express'
import { contentService, type DraftGraphInput } from '../services/content-service'
import { priorityWeightsService } from '../services/priority-weights-service'
import { contentRepository } from '../repositories/content-repository'
import { getContext } from '../context/request-context'
import { NotFoundError, ValidationFailedError } from '../errors/domain-errors'

export const TEMPLATE_DIR =
  process.env.TEMPLATE_DIR ?? path.resolve(__dirname, '../../storage/templates')

export const cmsController = {
  async listProcesses(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await contentService.listProcessesWithStatus())
    } catch (err) {
      next(err)
    }
  },

  async createProcess(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(201).json(await contentService.createProcess(req.body))
    } catch (err) {
      next(err)
    }
  },

  async updateProcess(req: Request, res: Response, next: NextFunction) {
    try {
      await contentService.updateProcess(Number(req.params.id), req.body)
      res.status(204).end()
    } catch (err) {
      next(err)
    }
  },

  async lookups(_req: Request, res: Response, next: NextFunction) {
    try {
      const [types, conditions, processes] = await Promise.all([
        contentRepository.listArtifactTypes(),
        contentRepository.listConditions(),
        contentRepository.listProcesses(),
      ])
      res.json({
        artifactTypes: types.map((t) => ({ code: t.get('code'), name: t.get('name') })),
        conditions: conditions.map((c) => ({ code: c.get('code'), description: c.get('description') })),
        processes: processes.map((p) => ({ id: p.get('id'), code: p.get('code'), name: p.get('name') })),
      })
    } catch (err) {
      next(err)
    }
  },

  async createDraft(req: Request, res: Response, next: NextFunction) {
    try {
      const ctx = getContext()
      res
        .status(201)
        .json(await contentService.createDraft(Number(req.params.id), ctx?.userId ?? null))
    } catch (err) {
      next(err)
    }
  },

  async getVersion(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await contentService.getVersionGraph(Number(req.params.id)))
    } catch (err) {
      next(err)
    }
  },

  async saveDraft(req: Request, res: Response, next: NextFunction) {
    try {
      const { orphanFileRefs } = await contentService.saveDraft(
        Number(req.params.id),
        req.body as DraftGraphInput,
      )
      // Artefato removido do rascunho → arquivo sem nenhuma referência sai do storage
      for (const ref of orphanFileRefs) {
        const filePath = path.join(TEMPLATE_DIR, ref)
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
      }
      res.status(204).end()
    } catch (err) {
      next(err)
    }
  },

  async publish(req: Request, res: Response, next: NextFunction) {
    try {
      const ctx = getContext()
      res.json(await contentService.publish(Number(req.params.id), ctx?.userId ?? null))
    } catch (err) {
      next(err)
    }
  },

  // ---- Editor de pesos objetivo→processo (curadoria da priorização) ----
  async getPriorityWeights(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await priorityWeightsService.getMatrix())
    } catch (err) {
      next(err)
    }
  },

  async setPriorityWeight(req: Request, res: Response, next: NextFunction) {
    try {
      const { objectiveId, processId, weight } = req.body as {
        objectiveId: number
        processId: number
        weight: number
      }
      await priorityWeightsService.setWeight(objectiveId, processId, weight)
      res.status(204).end()
    } catch (err) {
      next(err)
    }
  },

  /** Upload de template (anexos assimétricos: SÓ staff anexa — CA-9). */
  async uploadTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const file = (req as Request & { file?: Express.Multer.File }).file
      if (!file) throw new ValidationFailedError({ file: 'arquivo obrigatório (campo "file")' })
      const artifactId = Number(req.params.id)
      const artifact = await contentRepository.findArtifactById(artifactId)
      if (!artifact) throw new NotFoundError('Artefato não encontrado.')

      fs.mkdirSync(TEMPLATE_DIR, { recursive: true })
      const ref = `${crypto.randomUUID()}${path.extname(file.originalname)}`
      fs.writeFileSync(path.join(TEMPLATE_DIR, ref), file.buffer)

      const row = await contentRepository.createTemplate({
        artifact_id: artifactId,
        file_ref: ref,
        filename: file.originalname,
        mime_type: file.mimetype,
        size_bytes: file.size,
      })
      res.status(201).json({ id: row.get('id'), filename: file.originalname })
    } catch (err) {
      next(err)
    }
  },

  async deleteTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const template = await contentRepository.findTemplateById(Number(req.params.id))
      if (!template) throw new NotFoundError('Template não encontrado.')
      const fileRef = template.get('file_ref') as string
      await contentRepository.destroyTemplate(Number(req.params.id))
      // O arquivo pode ser compartilhado por clones em outras versões — só sai
      // do storage quando a última linha que o referencia é removida.
      const restantes = await contentRepository.findTemplatesByFileRefs([fileRef])
      if (restantes.length === 0) {
        const filePath = path.join(TEMPLATE_DIR, fileRef)
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
      }
      res.status(204).end()
    } catch (err) {
      next(err)
    }
  },
}
