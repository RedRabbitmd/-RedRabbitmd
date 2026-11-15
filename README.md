# RedRabbitmd

Static website for https://redrabbitmd.space/. Requires Node.js 24.x and npm.

## Local development

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:4173. Press `Ctrl+C` to stop the server.
Restart `npm run dev` after making changes: automatic rebuilds are not enabled. This command does not send IndexNow notifications.

## Files

- `index.html` — page markup and content.
- `src/styles.css` — Tailwind CSS styles.
- `src/main.js` — Swiper gallery.
- `site.config.json` — primary domain, page modification date, and IndexNow key.

## Deployment

`npm run build` builds the website into `dist/`. Upload the contents of this directory to a static hosting provider.
The build also updates CSS, JavaScript, fonts, and SEO files in the project root to support deployment directly from the repository root. Commit the generated files in `assets/` along with the source files.

After a successful `npm run build`, npm automatically runs `postbuild`: it verifies the key on the primary domain and submits the canonical URL to IndexNow. On Vercel, submissions run only in production; preview and development environments are skipped. Network and IndexNow errors are reported as warnings and do not fail the build.

On Vercel, the notification is sent **before deployment**, so the search engine may still see the previous version. This does not confirm that the new version has been indexed. During the first deployment, the key file may not yet be available on the domain, in which case submission is skipped. After the key has been published, run the build again or use `npm run indexnow`.

Use the manual `npm run indexnow` command to resubmit after deployment. It also verifies that the published HTML, CSS, and JavaScript match the local build. The `.txt` key file must be in the website root; the build includes it in `dist/`.

To check the full build without submitting a notification, run `INDEXNOW_DRY_RUN=1 npm run build`. To preview the request only, run `npm run indexnow -- --dry-run`.
