import path from 'node:path'
import fs from 'node:fs'
import type { Request, Response, NextFunction } from 'express'
import { maturityService } from '../services/maturity-service'
import { assessmentService } from '../services/assessment-service'
import { contentRepository } from '../repositories/content-repository'
import { NotFoundError } from '../errors/domain-errors'
import { TEMPLATE_DIR } from './cms-controller'
import type { AssessmentState } from '../types/domain'

export const maturityController = {
  /** Lista de processos publicados com nível calculado (visão do centro). */
  async overview(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await maturityService.computeOverview())
    } catch (err) {
      next(err)
    }
  },

  /** Detalhe do processo: artefatos por nível + estados + nível calculado. */
  async processDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const processId = Number(req.params.id)
      const process = await contentRepository.findProcessById(processId)
      const published = await contentRepository.findPublishedVersion(processId)
      if (!process || !published) throw new NotFoundError('Processo não encontrado.')
      const maturity = await maturityService.computeProcess(processId)
      const levels = await contentRepository.findLevelsByVersion(published.get('id') as number)
      res.json({
        process: {
          id: processId,
          code: process.get('code'),
          name: process.get('name'),
          processGroup: process.get('process_group'),
          oneLineDescription: process.get('one_line_description'),
          objectiveText: process.get('objective_text'),
        },
        levels: levels.map((l) => ({
          number: l.get('number'),
          name: l.get('name'),
          description: l.get('description'),
        })),
        maturity,
      })
    } catch (err) {
      next(err)
    }
  },

  async markAssessment(req: Request, res: Response, next: NextFunction) {
    try {
      const { state, expectedDueDate } = req.body as {
        state: AssessmentState
        expectedDueDate?: string | null
      }
      await assessmentService.markState(Number(req.params.artifactId), state, expectedDueDate ?? null)
      res.status(204).end()
    } catch (err) {
      next(err)
    }
  },

  async setApplicability(req: Request, res: Response, next: NextFunction) {
    try {
      const { applies, justification } = req.body as { applies: boolean; justification?: string | null }
      await assessmentService.setProcessApplicability(
        Number(req.params.id),
        applies,
        justification ?? null,
      )
      res.status(204).end()
    } catch (err) {
      next(err)
    }
  },

  /** Download de template (centro autenticado baixa; nunca anexa — CA-9). */
  async downloadTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const template = await contentRepository.findTemplateById(Number(req.params.id))
      if (!template) throw new NotFoundError('Template não encontrado.')
      const filePath = path.join(TEMPLATE_DIR, template.get('file_ref') as string)
      if (!fs.existsSync(filePath)) throw new NotFoundError('Arquivo indisponível.')
      res.download(filePath, template.get('filename') as string)
    } catch (err) {
      next(err)
    }
  },
}
