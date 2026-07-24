/** Envio de e-mail como adapter: a Fatia 0 só tem o ConsoleMailAdapter (dev).
 *  Trocar por provedor real é PRÉ-CONDIÇÃO de qualquer ambiente compartilhado
 *  (constituição §2 — token nunca em log de produção). */
export interface MailAdapter {
  sendPasswordReset(to: string, resetUrl: string): Promise<void>
}

export const consoleMailAdapter: MailAdapter = {
  async sendPasswordReset(to, resetUrl) {
    // Escrito direto no stdout, FORA do logger da aplicação (que tem redaction).
    // eslint-disable-next-line no-console
    console.log(
      [
        '',
        '════════════ DEV ONLY — E-MAIL SIMULADO ════════════',
        `Para: ${to}`,
        'Assunto: TrialScale — redefinição de senha',
        `Link (expira em 30 min): ${resetUrl}`,
        '════════════════════════════════════════════════════',
        '',
      ].join('\n'),
    )
  },
}
