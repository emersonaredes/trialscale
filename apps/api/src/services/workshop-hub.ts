import type { Response } from 'express'
import { logger } from '../config/logger'

/**
 * HUB de tempo real do Workshop ao vivo (spec 006) — Server-Sent Events.
 * Em MEMÓRIA: exige instância única do servidor (decisão do plano 006). O
 * banco continua sendo a fonte da verdade; o hub só empurra avisos.
 *
 *  - telões (staff): recebem `snapshot` com o estado agregado da sala;
 *  - celulares: recebem `room` (mudança de passo/processo) e `removed`.
 *
 * Coalescência: muitos votos em sequência viram UM snapshot por janela
 * (REFRESH_MS), para o telão responder rápido sem ser afogado.
 */
const REFRESH_MS = 200
const HEARTBEAT_MS = 20_000

function send(res: Response, event: string, data: unknown): void {
  try {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
  } catch {
    // conexão morta: o 'close' do request remove o cliente
  }
}

/** Abre a resposta como stream SSE (sem buffer em proxies). */
export function openSse(res: Response): void {
  res.status(200).set({
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  })
  res.flushHeaders()
  res.write('retry: 1500\n\n')
}

class WorkshopHub {
  private admins = new Map<number, Set<Response>>()
  private players = new Map<number, Map<Response, number>>()
  private pending = new Map<number, NodeJS.Timeout>()
  private running = new Set<number>()
  private dirty = new Set<number>()
  private heartbeat: NodeJS.Timeout | null = null

  private ensureHeartbeat(): void {
    if (this.heartbeat) return
    this.heartbeat = setInterval(() => {
      for (const set of this.admins.values()) for (const res of set) res.write(': ping\n\n')
      for (const map of this.players.values()) for (const res of map.keys()) res.write(': ping\n\n')
    }, HEARTBEAT_MS)
    this.heartbeat.unref()
  }

  addAdmin(roomId: number, res: Response): void {
    this.ensureHeartbeat()
    const set = this.admins.get(roomId) ?? new Set<Response>()
    set.add(res)
    this.admins.set(roomId, set)
    res.on('close', () => {
      set.delete(res)
      if (set.size === 0) this.admins.delete(roomId)
    })
  }

  addPlayer(roomId: number, participantId: number, res: Response): void {
    this.ensureHeartbeat()
    const map = this.players.get(roomId) ?? new Map<Response, number>()
    map.set(res, participantId)
    this.players.set(roomId, map)
    res.on('close', () => {
      map.delete(res)
      if (map.size === 0) this.players.delete(roomId)
    })
  }

  hasAdmins(roomId: number): boolean {
    return (this.admins.get(roomId)?.size ?? 0) > 0
  }

  /** Celulares conectados agora (para o telão mostrar quem está online). */
  onlineCount(roomId: number): number {
    return new Set(this.players.get(roomId)?.values() ?? []).size
  }

  sendToAdmin(res: Response, snapshot: unknown): void {
    send(res, 'snapshot', snapshot)
  }

  sendToPlayer(res: Response, event: string, data: unknown): void {
    send(res, event, data)
  }

  broadcastPlayers(roomId: number, event: string, data: unknown): void {
    for (const res of this.players.get(roomId)?.keys() ?? []) send(res, event, data)
  }

  /** Avisa e desconecta um participante removido pelo apresentador. */
  kickPlayer(roomId: number, participantId: number): void {
    for (const [res, pid] of this.players.get(roomId) ?? []) {
      if (pid !== participantId) continue
      send(res, 'removed', {})
      res.end()
    }
  }

  /**
   * Agenda o envio do snapshot do telão (coalescido). `build` lê o banco;
   * se a sala sujar de novo durante o cálculo, roda mais uma vez ao final.
   */
  scheduleAdminRefresh(roomId: number, build: () => Promise<unknown>): void {
    if (!this.hasAdmins(roomId)) return
    if (this.running.has(roomId)) {
      this.dirty.add(roomId)
      return
    }
    if (this.pending.has(roomId)) return
    const timer = setTimeout(() => {
      this.pending.delete(roomId)
      this.running.add(roomId)
      build()
        .then((snapshot) => {
          for (const res of this.admins.get(roomId) ?? []) send(res, 'snapshot', snapshot)
        })
        .catch((err) => logger.error({ err, roomId }, 'workshop: falha ao montar snapshot'))
        .finally(() => {
          this.running.delete(roomId)
          if (this.dirty.delete(roomId)) this.scheduleAdminRefresh(roomId, build)
        })
    }, REFRESH_MS)
    timer.unref()
    this.pending.set(roomId, timer)
  }
}

export const workshopHub = new WorkshopHub()
