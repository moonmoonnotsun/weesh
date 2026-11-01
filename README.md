# weeesh.app

Landing page for **Weesh**: every wish gets one real plan near you. Static HTML, CSS and JS, no build step.

## Run locally

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

## Files

- `index.html` - the page
- `pitch/index.html` - investor deck at `/pitch`
- `assets/css/site.css` - all styles
- `assets/css/pitch.css` - deck styles
- `assets/js/site.js` - hero wish demo, phone screens, star sky, waitlist
- `assets/js/pitch.js` - slide navigation
- `assets/js/data.js` - generated: wish tag dictionary and cover photos from the app
- `credits.html` - photo credits (Wikimedia Commons, required by the CC licences)

## Refresh data from the app

Reads `../willz/constants/wishTags.json` and `wishCovers.generated.json`:

```bash
node scripts/build-data.mjs
```

## Waitlist

Set `WAITLIST_ENDPOINT` at the top of `assets/js/site.js` (Formspree, Google Apps Script, etc.). While it's empty, the form opens a prefilled email to `dev.ohmyapp@gmail.com`.

## Deploy (GitHub Pages + Cloudflare, same as life-reel.app)

1. Create a public repo, push this folder, enable Pages from `main` / root.
2. Custom domain `weeesh.app` (already in `CNAME`), then **Enforce HTTPS**.
3. Cloudflare DNS, grey cloud (DNS only):

| Type | Name | Value |
|------|------|-------|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| CNAME | `www` | `moonmoonnotsun.github.io` |
