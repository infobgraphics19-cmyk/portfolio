# Portfolio — WordPress, Shopify & Wix Developer

A fast, dependency-free personal portfolio site (plain HTML, CSS and JavaScript).

**Sections:** Hero · Stats · Services (WordPress / Shopify / Wix) · Featured Projects with platform filter · Process · Skills · Contact · Footer.
Includes light/dark mode, a mobile menu, scroll animations and full responsiveness.

## Structure

```
index.html      page content
css/style.css   all styles (colours are CSS variables at the top)
js/main.js      project list + interactions
images/         put project screenshots here
```

## Customise

1. **Your details:** search `index.html` for `Your Name`, `hello@example.com`, the WhatsApp number and the LinkedIn URL, and replace them. Also set `CONTACT_EMAIL` in `js/main.js`.
2. **Stats:** check the numbers in the stats bar (`data-count="…"` in `index.html`) and set them to your real figures.
3. **Projects:** edit the `PROJECTS` array at the top of `js/main.js`. Each entry has a title, URL, platform (`wordpress`, `shopify` or `wix`), a short description and tags.
   - `tarmalsteel.com` and `bazayan.ch` are already included. Check that their platform and descriptions are correct.
   - The other four entries are examples. Replace them with your real projects or delete them.
4. **Screenshots (optional):** save a screenshot of each site, for example `images/tarmalsteel.jpg` at 1280×800, and set `image: "images/tarmalsteel.jpg"`. If you leave it out, the card shows a coloured placeholder.

## Run / deploy

Open `index.html` in a browser, or serve it locally:

```bash
python3 -m http.server 8000
```

To publish it, use **GitHub Pages** (Settings → Pages → deploy from the `main` branch, root folder), Netlify or Vercel, or upload the files to any web host.
