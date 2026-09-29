import type { Metadata } from 'next'
import Link from 'next/link'
import { getCompany } from '@/server/settings'
import ContentPage from '@/components/content/ContentPage'
import ContactForm from './ContactForm'

export const metadata: Metadata = {
  title: 'Contacto',
  description: 'Escríbenos: dudas sobre tallas, pedidos, envíos o devoluciones.',
}

export default async function ContactPage() {
  const company = await getCompany()
  const email = company.email && !company.email.endsWith('.example') ? company.email : null

  return (
    <ContentPage
      kicker="Hablemos sin prisa"
      title="Contacto"
      intro={
        <>
          ¿Dudas con una talla, un pedido o una devolución? Mira primero las{' '}
          <Link href="/preguntas-frecuentes" className="underline underline-offset-4">
            preguntas frecuentes
          </Link>
          ; si no está ahí, escríbenos.
        </>
      }
    >
      <ContactForm />
      {email && (
        <p className="mt-12 text-center text-sm text-washed-black/70">
          También puedes escribirnos a{' '}
          <a href={`mailto:${email}`} className="underline underline-offset-4">
            {email}
          </a>
          .
        </p>
      )}
    </ContentPage>
  )
}
