// Rutas a /public respetando el "base" de Vite (necesario en GitHub Pages).
export const asset = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`
