import Logo from './Logo'
import { InstagramIcon, PinterestIcon, TiktokIcon } from './Icons'

const LEGAL = ['Aviso legal', 'Privacidad', 'Cookies', 'Envíos y devoluciones']

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

        <div className="mt-16 flex flex-col-reverse items-center justify-between gap-8 border-t border-washed-black/10 pt-8 md:flex-row">
          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-[10px] uppercase tracking-label text-washed-black/60">
            <li>© {new Date().getFullYear()} KAEO</li>
            {LEGAL.map((l) => (
              <li key={l}>
                <a href="#top" className="hover:text-washed-black">
                  {l}
                </a>
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
