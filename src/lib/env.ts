// Entorno público de la web. `staging` = tienda de pruebas (staging.kaeo.es):
// aviso visible, ningún buscador la indexa y los pagos son simulados.
// Se incrusta al compilar (NEXT_PUBLIC_*): hay que reconstruir la imagen si cambia.
export const SITE_ENV = process.env.NEXT_PUBLIC_SITE_ENV === 'staging' ? 'staging' : 'production'
export const isStaging = SITE_ENV === 'staging'
