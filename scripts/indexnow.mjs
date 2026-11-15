import { readFile } from 'node:fs/promises';

const config = JSON.parse(await readFile('site.config.json', 'utf8'));
const canonical = `${config.origin}/`;
const keyLocation = `${canonical}${config.indexNowKey}.txt`;
const payload = { host: new URL(canonical).host, key: config.indexNowKey, keyLocation, urlList: [canonical] };
const afterBuild = process.argv.includes('--after-build');

if (afterBuild && process.env.VERCEL && process.env.VERCEL_ENV !== 'production') {
  console.log('IndexNow: skipped for a non-production Vercel build.');
} else if (process.argv.includes('--dry-run') || process.env.INDEXNOW_DRY_RUN === '1') {
  console.log(JSON.stringify({ endpoint: 'https://api.indexnow.org/indexnow', payload }, null, 2));
} else {
  try {
    const get = async url => {
      const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(15000), cache: 'no-store' });
      if (response.status !== 200) throw new Error(`${url}: HTTP ${response.status}`);
      return response.text();
    };
    const liveKey = await get(keyLocation);
    if (liveKey.trim() !== config.indexNowKey) throw new Error('Publish the IndexNow key on the main domain first, then rebuild.');
    const localHtml = await readFile('dist/index.html', 'utf8');
    if (!localHtml.includes(`<link rel="canonical" href="${canonical}"`)) {
      throw new Error('Rebuild the site with the configured canonical URL first.');
    }
    // Manual submission verifies the published build. During postbuild the new
    // deployment is not live yet, so only the domain's key can be checked.
    if (!afterBuild) {
      const liveHtml = await get(canonical);
      if (liveHtml.trim() !== localHtml.trim()) throw new Error('Publish the current dist/ build before submitting IndexNow.');
      for (const path of ['assets/css/site.css', 'assets/js/site.js']) {
        if ((await get(`${canonical}${path}`)) !== await readFile(`dist/${path}`, 'utf8')) {
          throw new Error(`The published ${path} differs from this build.`);
        }
      }
    }
    const response = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });
    if (![200, 202].includes(response.status)) throw new Error(`IndexNow: HTTP ${response.status}: ${await response.text()}`);
    console.log(response.status === 202 ? 'IndexNow: URL accepted; key validation pending (202).' : 'IndexNow: URL submitted successfully (200).');
    if (afterBuild) console.log('IndexNow: notification sent before publication; publish this build to the main domain.');
  } catch (error) {
    if (!afterBuild) throw error;
    console.warn(`IndexNow: notification not sent or not confirmed; build remains successful. ${error.message}`);
    console.warn('After publishing the root key file, rebuild or run npm run indexnow.');
  }
}
