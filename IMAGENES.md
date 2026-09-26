# KAEO — Imágenes

Ahora mismo la web usa **imágenes provisionales**:

- **Recortes del moodboard** (`.jpg`), generados con `python scripts/crop_moodboard.py` a partir de
  `public/images/moodboard/kaeo-moodboard.webp`. Son de baja resolución (paneles de ~400–600 px ampliados ×2),
  así que se ven algo suaves en pantallas grandes.
- **Ilustraciones** (`.svg`) de las prendas sin foto (lino, sudadera, punto), generadas con `npm run images`.

Abajo está la lista de todas las imágenes definitivas, con un prompt en inglés para generarlas con IA
(Midjourney, Flux, Firefly…). Cuando tengas una, guárdala con el mismo nombre (o cambia la ruta en
`src/data/products.js` / el componente correspondiente).

## Estilo común (añádelo al final de cada prompt)

> Warm natural late-afternoon light, desaturated earthy tones, Mediterranean coast (Ibiza, Menorca, Mallorca, Greek islands),
> pale limestone rocks, olive trees, deep blue sea, relaxed natural models with wavy hair and dark sunglasses,
> editorial fashion photography, 35mm film look, soft grain, muted palette of off-white #F7F5EF, sand #D9C9B1,
> sage #8A9B8F, washed blue #5C7A8A and washed black #2E2E2E. Garments are garment-dyed washed organic cotton
> t-shirts with a small "KAEO" logo in a geometric sans-serif where the A has no crossbar (Λ).

Resolución mínima recomendada: 2400 px en el lado largo para el hero, 1600 px para el resto.

---

## Hero y secciones

| Archivo | Dónde | Ratio | Ahora |
|---|---|---|---|
| `hero-costa-acantilados.jpg` | Hero a pantalla completa | 16:9 | Paisaje del moodboard (fila 4) sin la frase manuscrita |
| `hombre-sentado-costa.jpg` | Sección HOMBRE | 4:5 | Recorte del moodboard ✔ (sustituir por versión en alta) |
| `mujer-lifestyle-olivo.jpg` | Sección MUJER | 4:5 | **Falta** — se usa el paisaje del olivo |

**hero-costa-acantilados.jpg**
> Wide cinematic shot of a man with wavy hair and sunglasses standing on pale limestone rocks above the Mediterranean,
> seen from behind at three-quarters, wearing an off-white washed oversized t-shirt and sand linen trousers, dramatic
> cliffs and calm deep blue sea, an old olive tree on the right edge, large calm area of sky in the centre for a logo. --ar 16:9

**hombre-sentado-costa.jpg**
> Editorial portrait of a man with curly wavy hair and dark sunglasses sitting on limestone rocks by the sea, wearing an
> off-white washed t-shirt with a small black "KAEO" chest logo and off-white linen trousers, looking away to the horizon,
> cliffs and deep blue water behind, golden hour. --ar 4:5

**mujer-lifestyle-olivo.jpg** ⚠️ imprescindible
> Editorial portrait of a woman with long sun-bleached wavy hair and sunglasses leaning against a centuries-old olive tree
> on a Mediterranean cliff, wearing a sage washed t-shirt with a small "KAEO" chest logo tucked into off-white wide linen
> trousers, sea and limestone cliffs behind, relaxed candid pose, warm late light. --ar 4:5

## Paleta de la colección

**coleccion-camisetas-colgadas.jpg** (3:2) — ahora es el recorte del moodboard ✔
> Five oversized washed cotton t-shirts hanging on natural wooden hangers from a rustic wooden rail against a limestone wall,
> from left to right: off-white, sand, sage, washed blue, washed black, each with a small "KAEO" chest logo, soft side light. --ar 3:2

## Galería (lookbook)

Todas son recortes del moodboard ✔. Para la versión definitiva, genera cada una en alta resolución:

| Archivo | Ratio | Prompt |
|---|---|---|
| `galeria/paisaje-same-sun.jpg` | 16:9 | Limestone cliffs over a calm Mediterranean sea seen from a rocky terrace, empty sky on the left for handwritten text. (Añadir luego "Same Sun Higher Standards" en script.) |
| `galeria/cuello-sage-etiqueta.jpg` | 4:5 | Close-up flat lay of a sage washed t-shirt neckline with "KAEO" and "GOOD VIBES / BETTER DAYS / SLOW LIVING" printed inside the back neck, a kraft paper hang tag tied with twine. |
| `galeria/pilar-calmer-tomorrow.jpg` | 4:5 | A weathered limestone pillar with the engraved text "CLOTHES FOR A CALMER TOMORROW" and "KAEO", olive leaf shadows. |
| `galeria/tejido-less-hurry.jpg` | 2:3 | Macro of washed blue slub cotton fabric with small white print "LESS / HURRY / MORE / LIFE". |
| `galeria/espalda-brighter-tomorrow.jpg` | 1:1 | Man with curly hair and sunglasses sitting on rocks seen from behind, washed black tee with back print "A BRIGHTER TOMORROW" and "KAEO", sea and cliffs ahead. |
| `galeria/pila-camisetas-frases.jpg` | 4:3 | Stack of five folded tees (off-white, sand, sage, washed blue, washed black) on limestone, each fold showing a phrase: KAEO, GOOD VIBES, SLOW LIVING, BETTER DAYS, LESS HURRY MORE LIFE. |
| `galeria/paisaje-olivo-good-people.jpg` | 21:9 | Olive tree growing from limestone rocks above a Mediterranean bay with cliffs, soft haze, empty sky on the left for text. |

## Productos (4:5, fondo de pared de cal o piedra, luz natural)

| Archivo | Ahora | Prompt |
|---|---|---|
| `productos/essential-tee-{offwhite,sand,sage,blue,black}.jpg` | Recorte ✔ | Single washed cotton tee in {color} on a wooden hanger against a limestone wall, small "KAEO" chest logo, centred. |
| `hombre-espalda-palmera.jpg` | Recorte ✔ | Man seen from behind wearing a sage tee with "KAEO", a black palm tree and "GOOD VIBES / BETTER DAYS / SLOW LIVING" on the back, cliffs and sea. |
| `galeria/camiseta-doblada-good-vibes.jpg` | Recorte ✔ | Folded off-white tee on limestone with chest print "GOOD VIBES / GOOD FLOW / BETTER DAYS / SLOW LIVING" and "KAEO". |
| `galeria/cuello-sand-slow-living.jpg` | Recorte ✔ | Sand tee neckline close-up with inner print "KAEO / SLOW LIVING / BETTER DAYS / GOOD PEOPLE". |
| `productos/hombre-linen-shirt-sand.jpg` | **Ilustración** | Relaxed washed linen shirt in sand with camp collar and chest pocket, hanging on a wooden hanger against a limestone wall. |
| `productos/hombre-linen-wide-pants-offwhite.jpg` | **Ilustración** | Off-white wide-leg linen trousers with drawstring, folded over a wooden chair on a sunny terrace. |
| `productos/hombre-better-days-sweatshirt-blue.jpg` | **Ilustración** | Washed blue organic cotton crewneck sweatshirt with small "KAEO" chest logo, flat lay on limestone. |
| `productos/mujer-same-sun-linen-dress.jpg` | **Ilustración** | Off-white linen midi slip dress on a wooden hanger against a whitewashed wall, olive branch shadow. |
| `productos/mujer-soft-knit-top-sand.jpg` | **Ilustración** | Sand ribbed knit short-sleeve top with boat neck, folded on limestone. |
| `productos/mujer-linen-wide-pants-sage.jpg` | **Ilustración** | Sage high-waisted wide-leg linen trousers hanging on a wooden hanger against a limestone wall. |
