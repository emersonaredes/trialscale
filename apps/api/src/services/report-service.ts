import PDFDocument from 'pdfkit'
import { getContext } from '../context/request-context'
import { maturityService } from './maturity-service'
import { journeyService } from './journey-service'
import { achievementService } from './achievement-service'
import { identityRepository } from '../repositories/identity-repository'
import { roundRepository } from '../repositories/paid-journey-repository'
import { UnauthorizedError } from '../errors/domain-errors'

/**
 * MAPA DE MATURIDADE TRIALSCALE (nome: decisão 2026-07-24) — PDF exportável
 * (concepção §5): útil internamente e para patrocinadores. SEMPRE com a
 * marcação de AUTODECLARAÇÃO e a ressalva regulatória (constituição §6):
 * apoio à gestão, nunca certificação de conformidade.
 */

// Cores do DS v2 (escala "Rota da logo")
const NIVEL_COR: Record<number, string> = {
  1: '#0F81AC',
  2: '#219EC9',
  3: '#4CCBA0',
  4: '#17B583',
  5: '#F5A623',
}
const NIVEL_NOME: Record<number, string> = {
  1: 'Inicial',
  2: 'Informal',
  3: 'Definido',
  4: 'Gerenciado',
  5: 'Otimizado',
}
const INK = '#14242E'
const CORPO = '#3A4A54'
const SECUNDARIO = '#6B7B85'
const AZUL = '#0F81AC'

function desenharLogo(doc: PDFKit.PDFDocument, x: number, y: number, escala = 0.5) {
  const p = (v: number) => v * escala
  doc.save()
  doc
    .moveTo(x + p(8), y + p(44))
    .lineTo(x + p(20), y + p(32))
    .lineTo(x + p(14), y + p(22))
    .lineTo(x + p(30), y + p(16))
    .lineTo(x + p(40), y + p(8))
    .lineWidth(p(3.5))
    .stroke(AZUL)
  const pontos: Array<[number, number, number, string]> = [
    [8, 44, 4, '#0F81AC'],
    [20, 32, 4, '#219EC9'],
    [14, 22, 4, '#4CCBA0'],
    [30, 16, 4, '#17B583'],
    [40, 8, 5.5, '#F5A623'],
  ]
  for (const [cx, cy, r, cor] of pontos) {
    doc.circle(x + p(cx), y + p(cy), p(r)).fill(cor)
  }
  doc.restore()
}

function badgeNivel(doc: PDFKit.PDFDocument, x: number, y: number, nivel: number) {
  const texto = `${nivel} ${NIVEL_NOME[nivel]}`
  const largura = doc.widthOfString(texto, { size: 8 } as never) + 14
  doc.roundedRect(x, y, largura, 14, 7).fill(NIVEL_COR[nivel]!)
  doc
    .fillColor(nivel === 3 ? '#0A3A4E' : nivel === 5 ? '#4A3000' : '#FFFFFF')
    .fontSize(8)
    .text(texto, x + 7, y + 3.5, { lineBreak: false })
  return largura
}

export const reportService = {
  async buildPdf(): Promise<PDFKit.PDFDocument> {
    const ctx = getContext()
    if (!ctx || ctx.tenantId == null) throw new UnauthorizedError()
    const tenant = await identityRepository.findTenantById(ctx.tenantId)
    const overview = await maturityService.computeOverview()
    const foto = await journeyService.getPhoto()
    const rodadas = await roundRepository.listConcluded()
    const { achievements } = await achievementService.evaluate()
    const conquistadas = achievements.filter((a) => a.earnedAt != null)

    const doc = new PDFDocument({ size: 'A4', margin: 48, bufferPages: true })
    const agora = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

    // ---- Cabeçalho
    desenharLogo(doc, 48, 44, 0.55)
    doc.font('Helvetica-Bold').fontSize(19).fillColor(INK).text('Mapa de Maturidade TrialScale', 88, 48)
    doc.font('Helvetica').fontSize(10).fillColor(SECUNDARIO).text(
      `${tenant?.get('name') ?? ''} · emitido em ${agora}`,
      88,
      72,
    )

    // ---- Ressalva (inegociável — constituição §6)
    doc.moveDown(2)
    const yRessalva = 100
    doc.roundedRect(48, yRessalva, 499, 40, 6).fillOpacity(0.6).fill('#FEF3DC').fillOpacity(1)
    doc
      .font('Helvetica-Bold')
      .fontSize(8.5)
      .fillColor('#8A5E17')
      .text('MATURIDADE DE GESTÃO AUTODECLARADA', 60, yRessalva + 8)
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#8A5E17')
      .text(
        'Este mapa é um instrumento de autoavaliação e apoio à gestão do centro. Não é certificação, ' +
          'não atesta conformidade com BPC/GCP, ANVISA ou CEP/CONEP e não substitui exigências regulatórias.',
        60,
        yRessalva + 19,
        { width: 480 },
      )

    // ---- Nível geral
    let y = yRessalva + 58
    doc.font('Helvetica-Bold').fontSize(12).fillColor(INK).text('Nível geral do centro', 48, y)
    y += 18
    doc
      .font('Helvetica-Bold')
      .fontSize(30)
      .fillColor(AZUL)
      .text(overview.overallLevel != null ? overview.overallLevel.toFixed(1) : '—', 48, y)
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(SECUNDARIO)
      .text(
        `média simples dos ${overview.processes.filter((p) => p.applies).length} processos aplicáveis com conteúdo publicado`,
        110,
        y + 14,
      )
    y += 46

    // ---- Níveis por processo
    doc.font('Helvetica-Bold').fontSize(12).fillColor(INK).text('Níveis por processo (publicados)', 48, y)
    y += 18
    for (const p of overview.processes) {
      if (y > 750) {
        doc.addPage()
        y = 48
      }
      doc.font('Helvetica').fontSize(9).fillColor(CORPO)
      const rotulo = `${p.code ? `[${p.code}] ` : ''}${p.name}`
      doc.text(rotulo, 48, y + 2, { width: 280, lineBreak: false })
      if (p.applies) {
        badgeNivel(doc, 340, y, p.level)
        doc
          .font('Helvetica')
          .fontSize(8)
          .fillColor(SECUNDARIO)
          .text(`${p.essentialsComplete}/${p.essentialsTotal} essenciais`, 430, y + 3)
      } else {
        doc.font('Helvetica-Oblique').fontSize(8).fillColor(SECUNDARIO).text('não se aplica', 340, y + 3)
      }
      y += 20
    }

    // ---- Maiores dores (termômetro)
    if (foto.topPains.length > 0) {
      y += 10
      if (y > 700) {
        doc.addPage()
        y = 48
      }
      doc.font('Helvetica-Bold').fontSize(12).fillColor(INK).text('Maiores dores declaradas', 48, y)
      y += 16
      for (const p of foto.topPains) {
        doc
          .font('Helvetica')
          .fontSize(9)
          .fillColor(CORPO)
          .text(`${p.code ? `[${p.code}] ` : ''}${p.name} — dor ${p.score}/5`, 48, y)
        y += 14
      }
    }

    // ---- Rodadas concluídas
    y += 10
    if (y > 700) {
      doc.addPage()
      y = 48
    }
    doc.font('Helvetica-Bold').fontSize(12).fillColor(INK).text('Rodadas de melhoria concluídas', 48, y)
    y += 16
    if (rodadas.length === 0) {
      doc.font('Helvetica').fontSize(9).fillColor(SECUNDARIO).text('Nenhuma ainda — a jornada está começando.', 48, y)
      y += 14
    } else {
      for (const r of rodadas) {
        const quando = (r.get('completed_at') as Date | null)?.toLocaleDateString('pt-BR') ?? ''
        doc
          .font('Helvetica')
          .fontSize(9)
          .fillColor(CORPO)
          .text(`Rodada ${r.get('sequence_no')} — concluída em ${quando}`, 48, y)
        y += 14
      }
    }

    // ---- Conquistas
    if (conquistadas.length > 0) {
      y += 10
      if (y > 700) {
        doc.addPage()
        y = 48
      }
      doc.font('Helvetica-Bold').fontSize(12).fillColor(INK).text('Conquistas', 48, y)
      y += 16
      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor(CORPO)
        .text(conquistadas.map((c) => c.name).join(' · '), 48, y, { width: 499 })
    }

    // ---- Rodapé em todas as páginas
    const paginas = doc.bufferedPageRange()
    for (let i = paginas.start; i < paginas.start + paginas.count; i++) {
      doc.switchToPage(i)
      doc
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor(SECUNDARIO)
        .text(
          `TrialScale · Mapa de Maturidade autodeclarado · ${tenant?.get('name') ?? ''} · página ${i + 1} de ${paginas.count}`,
          48,
          812,
          { width: 499, align: 'center' },
        )
    }

    doc.end()
    return doc
  },
}
