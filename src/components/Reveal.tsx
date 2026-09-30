'use client'

import { useEffect, useRef, useState, type ElementType, type HTMLAttributes } from 'react'

interface RevealProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType
  delay?: number
}

// Aparición progresiva al entrar en pantalla (fade + ligero desplazamiento).
export default function Reveal({ as: Tag = 'div', delay = 0, className = '', children, ...rest }: RevealProps) {
  const ref = useRef<HTMLElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          io.disconnect()
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <Tag
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-[1200ms] ease-[cubic-bezier(.2,.7,.2,1)] ${
        shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      } ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  )
}
