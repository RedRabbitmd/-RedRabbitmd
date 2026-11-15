import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { build } from 'esbuild';

const config = JSON.parse(await readFile('site.config.json', 'utf8'));
const origin = new URL(config.origin);
if (origin.protocol !== 'https:' || origin.origin !== config.origin) {
  throw new Error('site.config.json: origin must be an HTTPS origin without a trailing slash.');
}
if (!/^[a-f0-9]{32}$/.test(config.indexNowKey)) throw new Error('Invalid IndexNow key.');
const canonical = `${origin.origin}/`;

// Keep root-hosted and dist-hosted deployments identical.
let html = await readFile('index.html', 'utf8');
html = html.replace(/(<link rel="canonical" href=")[^"]+/, `$1${canonical}`)
  .replace(/(<meta property="og:url" content=")[^"]+/, `$1${canonical}`)
  .replace(/(<meta property="og:image" content=")[^"]+/, `$1${canonical}og_image.png`)
  .replace(/(<meta name="twitter:image" content=")[^"]+/, `$1${canonical}og_image.png`)
  .replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/, (_, open, data, close) => {
    const business = JSON.parse(data);
    business.url = canonical;
    business.image = `${canonical}og_image.png`;
    return `${open}\n${JSON.stringify(business, null, 2)}\n    ${close}`;
  });
await writeFile('index.html', html);
await writeFile('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${canonical}</loc>\n    <lastmod>${config.lastModified}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>\n</urlset>\n`);
await writeFile('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${canonical}sitemap.xml\n`);
await writeFile(`${config.indexNowKey}.txt`, `${config.indexNowKey}\n`);

await mkdir('assets/css', { recursive: true });
await mkdir('assets/js', { recursive: true });
await mkdir('assets/fonts', { recursive: true });
for (const subset of ['cyrillic', 'latin-ext', 'latin']) {
  const filename = `jost-${subset}-wght-normal.woff2`;
  await cp(`node_modules/@fontsource-variable/jost/files/${filename}`, `assets/fonts/${filename}`);
}
await cp('node_modules/@fontsource-variable/jost/LICENSE', 'assets/fonts/OFL.txt');
execFileSync(process.execPath, ['node_modules/@tailwindcss/cli/dist/index.mjs', '-i', 'src/styles.css', '-o', 'assets/css/site.css', '--minify'], { stdio: 'inherit' });
await build({ entryPoints: ['src/main.js'], outfile: 'assets/js/site.js', bundle: true, minify: true, format: 'iife', target: ['es2020'], legalComments: 'linked' });

await rm('dist', { recursive: true, force: true });
await mkdir('dist');
const rootFiles = ['index.html', 'sitemap.xml', 'robots.txt', 'manifest.json', 'favicon.ico', 'icon0.svg', 'icon1.png', 'apple-icon.png', 'og_image.png', 'web-app-manifest-192x192.png', 'web-app-manifest-512x512.png', `${config.indexNowKey}.txt`];
for (const file of rootFiles) await cp(file, `dist/${file}`);
for (const directory of ['images', 'css', 'js', 'fonts']) {
  await cp(`assets/${directory}`, `dist/assets/${directory}`, { recursive: true });
}
console.log(`Static site built in dist/ (${(await readdir('dist')).length} root entries).`);
