import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = process.cwd()
const publicDir = resolve(root, 'public')
const toolsSource = await readFile(resolve(root, 'src/data/tools.ts'), 'utf8')
const categoriesSource = await readFile(resolve(root, 'src/data/categories.ts'), 'utf8')
const slugs = [...toolsSource.matchAll(/^\s*\['([^']+)',\s*'[^']+'/gm)].map((match) => match[1])
const categoryIds = [...categoriesSource.matchAll(/^\s*id:\s*'([^']+)'/gm)].map((match) => match[1])
let envSiteUrl = ''
try {
  const envFile = await readFile(resolve(root, '.env'), 'utf8')
  envSiteUrl = envFile.match(/^SITE_URL\s*=\s*["']?([^"'\r\n]+)["']?\s*$/m)?.[1] ?? ''
} catch { /* .env is optional. */ }
const base = (process.env.SITE_URL ?? envSiteUrl).replace(/\/+$/, '')

const robots = ['User-agent: *', 'Allow: /', ...(base ? ['', `Sitemap: ${base}/sitemap.xml`] : [])].join('\n') + '\n'
await writeFile(resolve(publicDir, 'robots.txt'), robots)

if (!base) {
  console.warn('SITE_URL is unset: generated robots.txt only; sitemap.xml is generated after SITE_URL is configured.')
  process.exit(0)
}

const routes = [
  '/',
  '/tools',
  ...categoryIds.map((id) => `/category/${id}`),
  ...slugs.map((slug) => `/tools/${slug}`),
  '/about',
  '/privacy',
]
const urls = routes.map((route) => `  <url><loc>${base}${route}</loc></url>`).join('\n')
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
await writeFile(resolve(publicDir, 'sitemap.xml'), sitemap)
console.log(`Generated robots.txt and sitemap.xml for ${routes.length} routes at ${base}`)
