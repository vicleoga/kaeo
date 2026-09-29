import 'server-only'
import nodemailer, { type Transporter } from 'nodemailer'

/**
 * Proveedor de email, elegido con EMAIL_PROVIDER:
 *  - log  (por defecto): no envía nada; el email queda registrado y se ve en Admin → Emails.
 *  - smtp: lo envía por SMTP (IONOS: smtp.ionos.es, puerto 587, usuario = la dirección completa).
 */
export interface OutgoingEmail {
  to: string
  subject: string
  html: string
  text: string
  replyTo?: string
}

export interface EmailProvider {
  readonly name: string
  /** true si el email sale de verdad (false = solo se registra) */
  readonly delivers: boolean
  send(email: OutgoingEmail): Promise<void>
}

const logProvider: EmailProvider = {
  name: 'log',
  delivers: false,
  async send(email) {
    console.info(`[email] (no enviado, EMAIL_PROVIDER=log) → ${email.to} · ${email.subject}`)
  },
}

let transporter: Transporter | null = null

function smtpProvider(): EmailProvider {
  const { SMTP_HOST, SMTP_PORT = '587', SMTP_USER, SMTP_PASSWORD } = process.env
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) throw new Error('EMAIL_PROVIDER=smtp necesita SMTP_HOST, SMTP_USER y SMTP_PASSWORD')
  const port = Number(SMTP_PORT)
  transporter ??= nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    // 465 = TLS directo; 587 = STARTTLS obligatorio (nunca se envía sin cifrar)
    secure: port === 465,
    requireTLS: port !== 465,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 30_000,
  })
  return {
    name: 'smtp',
    delivers: true,
    async send(email) {
      await transporter!.sendMail({ from: emailFrom(), to: email.to, subject: email.subject, html: email.html, text: email.text, replyTo: email.replyTo })
    },
  }
}

export function getEmailProvider(): EmailProvider {
  const name = process.env.EMAIL_PROVIDER || 'log'
  switch (name) {
    case 'log':
      return logProvider
    case 'smtp':
      return smtpProvider()
    default:
      throw new Error(`EMAIL_PROVIDER desconocido: ${name}`)
  }
}

/** Remitente: EMAIL_FROM ("KAEO <contact@kaeo.es>"). Con SMTP debe ser el mismo buzón que SMTP_USER. */
export const emailFrom = () => process.env.EMAIL_FROM || `KAEO <${process.env.SMTP_USER || 'contact@kaeo.es'}>`
