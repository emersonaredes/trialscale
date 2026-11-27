import type { Request, Response, NextFunction } from 'express'
import { workshopService } from '../services/workshop-service'
import { workshopHub, openSse } from '../services/workshop-hub'
import { ValidationFailedError } from '../errors/domain-errors'
import type { WorkshopStep } from '../types/domain'
import type { WorkshopLocals } from '../middlewares/workshop-room'

function idParam(req: Request, nome: string): number {
  const n = Number(req.params[nome])
  if (!Number.isInteger(n) || n <= 0) throw new ValidationFailedError({ [nome]: 'id inválido' })
  return n
}
const locals = (res: Response) => res.locals.workshop as WorkshopLocals
const eu = (res: Response) => locals(res).participant!

type Handler = (req: Request, res: Response) => Promise<unknown>
/** Encaminha erros ao error-handler e responde JSON com o retorno. */
const json =
  (handler: Handler, status = 200) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(status).json(await handler(req, res))
    } catch (err) {
      next(err)
    }
  }

export const workshopController = {
  // ======== APRESENTADOR (staff) ========
  createRoom: json((req) => workshopService.createRoom(req.body.name as string), 201),
  listRooms: json(() => workshopService.listRooms()),
  snapshot: json((req) => workshopService.snapshot(idParam(req, 'id'))),
  setStep: json((req) => workshopService.setStep(idParam(req, 'id'), req.body.step as WorkshopStep)),
  setProcess: json((req) =>
    workshopService.setProcess(idParam(req, 'id'), req.body.processId as number),
  ),
  removeParticipant: json((req) =>
    workshopService.removeParticipant(idParam(req, 'id'), idParam(req, 'participantId')),
  ),
  closeRoom: json((req) => workshopService.closeRoom(idParam(req, 'id'))),
  processDetail: json((req) =>
    workshopService.processDetail(idParam(req, 'id'), idParam(req, 'processId')),
  ),

  /** SSE do telão: snapshot imediato + atualizações coalescidas. */
  async adminEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const roomId = idParam(req, 'id')
      const snapshot = await workshopService.snapshot(roomId)
      openSse(res)
      workshopHub.addAdmin(roomId, res)
      workshopHub.sendToAdmin(res, snapshot)
    } catch (err) {
      next(err)
    }
  },

  // ======== PARTICIPANTE (celular) ========
  join: json((_req, res) => workshopService.join(locals(res).room), 201),
  state: json((_req, res) => workshopService.state(locals(res).room, eu(res))),
  objectives: json(() => workshopService.objectives()),
  saveVotes: json((req, res) =>
    workshopService.saveVotes(locals(res).room, eu(res).id, req.body.objectiveIds as number[]),
  ),
  currentProcess: json((_req, res) => workshopService.currentProcess(locals(res).room, eu(res).id)),
  saveAssessment: json((req, res) =>
    workshopService.saveAssessment(
      locals(res).room,
      eu(res).id,
      req.body.artifactIds as number[],
      req.body.notApplicableIds as number[],
    ),
  ),

  /** SSE do celular: estado público da sala agora + mudanças de passo. */
  async playerEvents(_req: Request, res: Response, next: NextFunction) {
    try {
      const { room } = locals(res)
      const publico = await workshopService.publicRoom(room)
      openSse(res)
      workshopHub.addPlayer(room.id, eu(res).id, res)
      workshopHub.sendToPlayer(res, 'room', publico)
    } catch (err) {
      next(err)
    }
  },
}
