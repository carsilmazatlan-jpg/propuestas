// Entrega las propuestas publicadas desde la plataforma (módulo Propuestas).
// La plataforma guarda cada presentación en Supabase Storage (bucket público
// propuestas-publicadas/<carpeta>/…). Este servicio sirve su index.html y sus
// versiones con la dirección de siempre: carsil-propuestas.vercel.app/<carpeta>/.
// El contenido real va cifrado en archivos .json que la página baja directo de Supabase.
// Las carpetas que existen en este repositorio se sirven como archivos normales y
// nunca llegan aquí (Vercel revisa primero los archivos).

const BASE = 'https://swcjjusttfelluptyond.supabase.co/storage/v1/object/public/propuestas-publicadas'
const CARPETA = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const ARCHIVO = /^(?:index\.html|versiones\/[a-z0-9-]+\.html)$/

const NO_ENCONTRADA = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Propuesta no encontrada</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0B0C0D;color:#FAF9F6;font:16px/1.5 Inter,system-ui,sans-serif;padding:24px;text-align:center}b{color:#F76900}</style></head><body><main><p><b>CARSIL Soluciones Integrales</b></p><h1>Esta propuesta no existe o ya no está disponible</h1><p>Revisa el link que te enviamos o escríbenos por WhatsApp.</p></main></body></html>`

module.exports = async function handler(req, res) {
  const c = String(req.query.c || '')
  const f = String(req.query.f || 'index.html')
  if (!CARPETA.test(c) || !ARCHIVO.test(f)) {
    res.status(404).setHeader('Content-Type', 'text/html; charset=utf-8')
    return res.send(NO_ENCONTRADA)
  }
  let r
  try {
    r = await fetch(`${BASE}/${c}/${f}`, { headers: { 'Cache-Control': 'no-cache' } })
  } catch {
    res.status(502).setHeader('Content-Type', 'text/plain; charset=utf-8')
    return res.send('No se pudo cargar la propuesta. Inténtalo de nuevo en un momento.')
  }
  if (!r.ok) {
    res.status(404).setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Cache-Control', 'public, s-maxage=30')
    return res.send(NO_ENCONTRADA)
  }
  const html = await r.text()
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive')
  // Corto en la CDN: al volver a publicar, el cliente ve la versión nueva en menos de un minuto.
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=30, stale-while-revalidate=300')
  return res.status(200).send(html)
}
