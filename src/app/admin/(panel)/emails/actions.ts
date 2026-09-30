'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/server/auth'
import { resendEmail, sendEmail, siteUrl } from '@/server/notifications'

export interface EmailActionState {
  ok?: string
  error?: string
}

export async function resend(id: string): Promise<void> {
  await requireAdmin()
  const log = await resendEmail(id)
  revalidatePath('/admin/emails')
  if (log.orderId) revalidatePath(`/admin/pedidos/${log.orderId}`)
  redirect(`/admin/emails/${log.id}`)
}

/** Email de prueba para comprobar la configuración SMTP */
export async function sendTest(_prev: EmailActionState, formData: FormData): Promise<EmailActionState> {
  const admin = await requireAdmin()
  const to = String(formData.get('to') ?? '').trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to) || to.length > 200) return { error: 'Escribe un email válido.' }
  const log = await sendEmail('test', {
    to,
    subject: 'Prueba de email · KAEO',
    text: `Si lees esto, la tienda puede enviar emails.\n\nEnviado por ${admin.login} desde ${siteUrl()}/admin`,
    html: `<p style="font-family:Helvetica,Arial,sans-serif;font-size:14px;">Si lees esto, la tienda puede enviar emails.</p><p style="font-family:Helvetica,Arial,sans-serif;font-size:12px;color:#6F6B64;">Enviado desde el admin de KAEO.</p>`,
  })
  revalidatePath('/admin/emails')
  if (log.status === 'FAILED') return { error: `No se ha podido enviar: ${log.error}` }
  if (log.status === 'LOGGED') return { ok: 'Registrado, pero NO enviado: el proveedor de email está en modo "log". Configura EMAIL_PROVIDER=smtp.' }
  return { ok: `Enviado a ${to}. Revisa la bandeja de entrada (y la de spam).` }
}
