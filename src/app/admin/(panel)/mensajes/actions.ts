'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/server/db'
import { requireAdmin } from '@/server/auth'

export async function setHandled(id: string, handled: boolean): Promise<void> {
  await requireAdmin()
  await prisma.contactMessage.update({ where: { id }, data: { handled } })
  revalidatePath('/admin/mensajes')
  revalidatePath('/admin', 'layout')
}
