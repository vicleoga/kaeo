import Reveal from './Reveal'

export default function Manifesto() {
  return (
    <section id="nosotros" className="px-6 py-28 md:py-44 text-center">
      <Reveal className="mx-auto max-w-3xl">
        <p className="label text-washed-black/60">Clothes for a calmer tomorrow</p>
        <h2 className="heading mt-10 text-xl leading-[2.1] sm:text-2xl md:text-[34px] md:leading-[2]">
          Good people
          <br />
          Brighter days
          <br />
          A more human way forward
        </h2>
        <span className="divider mx-auto mt-10" aria-hidden="true" />
        <p className="mx-auto mt-10 max-w-md text-sm leading-7 text-washed-black/75">
          Hacemos pocas prendas y las hacemos bien: algodón orgánico lavado, lino europeo y tintes suaves inspirados en la costa.
          Básicos para vivir despacio, con sal en el pelo y sin prisa por llegar.
        </p>
      </Reveal>
    </section>
  )
}
