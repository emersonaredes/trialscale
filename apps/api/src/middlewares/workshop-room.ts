import type { Request, Response, NextFunction } from 'express'
import { runWithContext } from '../context/request-context'
import { workshopRepository } from '../repositories/workshop-repository'
import { hashToken, toRoomRow, workshopContext, type RoomRow } from '../services/workshop-service'
import { NotFoundError, UnauthorizedError } from '../errors/domain-errors'

export interface WorkshopLocals {
  room: RoomRow
  participant?: { id: number; nickname: string }
}

/**
 * Rotas do CELULAR (sem conta): carrega a sala pelo código da URL e roda o
 * resto do pipeline num contexto SEM tenant (só catálogo global de CPC).
 * Com `exigirParticipante`, valida o token opaco da sala (Authorization:
 * Bearer) — o token só vale na sala em que foi emitido.
 */
export function workshopRoom(exigirParticipante: boolean) {
  return (req: Request, res: Response, next: NextFunction): void => {
    void runWithContext(workshopContext(), async () => {
      try {
        const code = String(req.params.code ?? '').toUpperCase()
        const roomModel = await workshopRepository.findRoomByCode(code)
        if (!roomModel) throw new NotFoundError('Sala não encontrada. Confira o código.')
        const locals: WorkshopLocals = { room: toRoomRow(roomModel) }

        if (exigirParticipante) {
          const header = req.headers.authorization
          if (!header?.startsWith('Bearer ')) throw new UnauthorizedError('Entre na sala primeiro.')
          const p = await workshopRepository.findParticipantByTokenHash(
            hashToken(header.slice('Bearer '.length)),
          )
          if (!p || Number(p.get('room_id')) !== locals.room.id || p.get('removed_at') != null) {
            throw new UnauthorizedError('Entre na sala novamente.')
          }
          locals.participant = { id: Number(p.get('id')), nickname: p.get('nickname') as string }
        }
        res.locals.workshop = locals
        next()
      } catch (err) {
        next(err)
      }
    })
  }
}
