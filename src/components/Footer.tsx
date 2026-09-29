import Link from 'next/link'
import Logo from './Logo'
import { InstagramIcon, PinterestIcon, TiktokIcon } from './Icons'

const HELP = [
  { href: '/contacto', label: 'Contacto' },
  { href: '/preguntas-frecuentes', label: 'Preguntas frecuentes' },
  { href: '/envios-y-devoluciones', label: 'Envíos y devoluciones' },
  { href: '/seguimiento', label: 'Seguimiento de pedido' },
  { href: '/nosotros', label: 'Nosotros' },
]

const LEGAL = [
  { href: '/legal/aviso-legal', label: 'Aviso legal' },
  { href: '/legal/condiciones', label: 'Condiciones de venta' },
  { href: '/legal/privacidad', label: 'Privacidad' },
  { href: '/legal/cookies', label: 'Cookies' },
]

const SOCIAL = [
  { href: 'https://instagram.com', label: 'Instagram', Icon: InstagramIcon },
  { href: 'https://pinterest.com', label: 'Pinterest', Icon: PinterestIcon },
  { href: 'https://tiktok.com', label: 'TikTok', Icon: TiktokIcon },
]

// Réplica de la franja inferior del moodboard: frase · línea · frase · línea · logo.
export default function Footer() {
  return (
    <footer className="border-t border-washed-black/10 px-6 pb-10 pt-16 md:px-10 md:pt-20">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center gap-8 text-center md:flex-row md:text-left">
          <p className="label shrink-0">Mediterranean state of mind</p>
          <span className="h-px w-16 bg-washed-black/40 md:w-auto md:flex-1" aria-hidden="true" />
          <p className="label shrink-0">T-shirts for a brighter tomorrow</p>
          <span className="h-px w-16 bg-washed-black/40 md:w-auto md:flex-1" aria-hidden="true" />
          <Logo color="#2E2E2E" size={20} className="shrink-0" />
        </div>

        <nav aria-label="Ayuda" className="mt-14">
          <ul className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-[11px] uppercase tracking-label text-washed-black/75">
            {HELP.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-washed-black">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-12 flex flex-col-reverse items-center justify-between gap-8 border-t border-washed-black/10 pt-8 md:flex-row">
          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-[10px] uppercase tracking-label text-washed-black/60">
            <li>© {new Date().getFullYear()} KAEO</li>
            {LEGAL.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-washed-black">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <ul className="flex gap-6 text-washed-black/70">
            {SOCIAL.map(({ href, label, Icon }) => (
              <li key={label}>
                <a href={href} target="_blank" rel="noreferrer" aria-label={label} className="hover:text-washed-black">
                  <Icon />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}
