// The sitemap lists the pages we want search engines to find. Demand-test
// pages (/radar/, /fitnfree/glp1/) and account pages are left out on purpose.
import { company } from '../data/company';
import { visibleProducts } from '../data/products';
import { apps } from '../data/apps';

export function GET() {
  const paths = [
    '/',
    '/products/',
    ...visibleProducts.filter((p) => p.page?.startsWith('/products/')).map((p) => p.page!),
    '/about/',
    '/contact/',
    '/games/',
    '/games/privacy/',
    ...apps.flatMap((a) => [`/${a.slug}/support/`, `/${a.slug}/privacy/`, `/${a.slug}/terms/`, `/${a.slug}/delete-account/`]),
  ];
  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    paths.map((p) => `  <url><loc>${company.siteUrl}${p}</loc></url>`).join('\n') +
    `\n</urlset>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
}
