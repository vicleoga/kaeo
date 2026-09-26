import { useEffect, useState } from 'react'
import Logo from './Logo.jsx'
import { BagIcon, CloseIcon, MenuIcon, SearchIcon } from './Icons.jsx'
import { useCart } from '../context/CartContext.jsx'

const LINKS = [
  { href: '#hombre', label: 'Hombre' },
  { href: '#mujer', label: 'Mujer' },
  { href: '#coleccion', label: 'Colección' },
  { href: '#nosotros', label: 'Nosotros' },
]

export default function Navbar({ onSearch }) {
  const [scrolled, setScrolled] = useState(false)
  const [menu, setMenu] = useState(false)
  const { count, setOpen } = useCart()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const solid = scrolled || menu
  const tone = solid ? 'text-washed-black' : 'text-offwhite'

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-colors duration-500 ${
        solid ? 'bg-offwhite/95 backdrop-blur-sm border-b border-washed-black/10' : 'bg-transparent'
      } ${tone}`}
    >
      <nav className="mx-auto flex h-16 md:h-20 max-w-7xl items-center justify-between px-5 md:px-10" aria-label="Principal">
        <div className="flex flex-1 items-center gap-4">
          <button className="md:hidden -ml-1 p-1" onClick={() => setMenu((m) => !m)} aria-label={menu ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={menu}>
            {menu ? <CloseIcon /> : <MenuIcon />}
          </button>
          <a href="#top" aria-label="KAEO — inicio" className="hidden md:block">
            <Logo size={17} />
          </a>
        </div>

        <a href="#top" aria-label="KAEO — inicio" className="md:hidden">
          <Logo size={15} />
        </a>

        <ul className="hidden md:flex items-center gap-10">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="label relative py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-500 hover:after:scale-x-100">
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex flex-1 items-center justify-end gap-4 md:gap-6">
          <button onClick={onSearch} aria-label="Buscar" className="p-1 opacity-90 hover:opacity-100">
            <SearchIcon />
          </button>
          <button onClick={() => setOpen(true)} aria-label={`Carrito, ${count} artículos`} className="relative p-1 opacity-90 hover:opacity-100">
            <BagIcon />
            {count > 0 && (
              <span className="absolute -right-1.5 -top-1 grid h-4 min-w-4 place-items-center bg-washed-black px-1 text-[9px] font-medium text-offwhite">
                {count}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* Menú móvil */}
      <div className={`md:hidden overflow-hidden transition-[max-height] duration-500 ${menu ? 'max-h-80' : 'max-h-0'}`}>
        <ul className="flex flex-col items-center gap-7 pb-10 pt-4">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="label text-xs" onClick={() => setMenu(false)}>
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </header>
  )
}
