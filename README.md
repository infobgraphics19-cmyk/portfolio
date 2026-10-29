# Portfolio — WordPress, Shopify & Wix Developer

A hand-coded, scroll-animated developer portfolio built with **GSAP 3.15 + ScrollTrigger + SplitText** and **Lenis** smooth scrolling. There is no build step or framework: plain HTML, CSS and JavaScript.

## What's inside

| Section | Effect |
|---|---|
| Preloader | Terminal "npm run build" boot sequence with a 0→100% counter, then a curtain wipe |
| Hero | Huge kinetic headline split into characters, a grid spotlight that follows the mouse, and lines that drift apart on scroll |
| Marquee | Endless platform/tech ticker that speeds up and skews with scroll speed |
| About | Paragraph that lights up word by word as you scroll, plus animated counters |
| Services | Pinned **stacking cards** where each card shrinks and dims as the next slides over it |
| Work | **Pinned horizontal-scroll gallery** with parallax inside each project cover |
| Code | Pinned code editor that switches between PHP, Liquid and Velo files as you scroll |
| Process | Timeline line that draws itself on scroll, with dots lighting up at each step |
| Toolbox | Tech grid with a glow that follows the cursor |
| Contact | Giant type sliding in from both sides, floating-label form and magnetic buttons |
| Global | Custom cursor ("View" over projects), scroll progress bar, film grain, active nav link |

Accessibility and fallbacks:
- Scroll animations always run. Visitors who turn on their system's "reduce motion" setting skip the preloader and smooth scrolling.
- If a script fails to load, the site shows a clean static version with all content visible.
- On phones the horizontal gallery becomes a vertical list, and the custom cursor is turned off on touch devices.

## Two versions

- **Option 1**: `index.html` (site root) is the original scroll-animated design.
- **Option 2**: `v2/index.html` adds blurred aurora lighting, a glass navigation bar, blur-in text, floating WordPress/Shopify/Wix logos with depth-of-field parallax, smoother scrolling for every visitor, and a draggable **Before / After** redesign section, and a pinned **Responsive** showcase that shows one project on desktop, tablet and phone.
  - Edit the `REDESIGNS` list at the top of `v2/js/main.js`. Set `before` and `after` to your screenshots, for example `images/client-before.jpg`. Without screenshots, illustrated examples are shown.

## Structure

```
index.html          page content
css/style.css       styles (colour tokens at the top: --accent, --bg, …)
js/main.js          PROJECTS list + all animation code
js/vendor/          GSAP, ScrollTrigger, SplitText, Lenis (local copies, no CDN needed)
images/             project screenshots
```

## Customise

1. **Your details:** the name is set to Kishan; replace `hello@example.com` and the WhatsApp, LinkedIn, GitHub and Upwork links in `index.html`. Set `CONTACT_EMAIL` in `js/main.js`.
2. **Stats:** set the `data-count` numbers in the About section to your real figures.
3. **Projects:** edit the `PROJECTS` array at the top of `js/main.js` (and `v2/js/main.js`). It lists Tarmal Steel, Bazayan, Jafferji Developers, Swanya Pharma and Python Bull. Set each `platform` to `wordpress`, `shopify` or `wix` to show a platform badge. Each project's number and the horizontal-scroll length update automatically.
4. **Screenshots:** by default each card loads a live screenshot of the site through WordPress.com's free mShots service. The first visit can take a few seconds while it captures; the coloured cover shows until then. To use your own image instead, save it as, for example, `images/tarmalsteel.jpg` at about 1600×1050 and set `image: "images/tarmalsteel.jpg"`.
5. **Responsive section (Option 2):** `SHOWCASE` in `v2/js/main.js` picks which project appears on the desktop, tablet and phone mockups (0 = the first project).
6. **Accent colour:** change `--accent` in `css/style.css`.

## Run / deploy

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

To publish, use GitHub Pages (Settings → Pages → `main` branch, root folder), Netlify or Vercel, or upload the files to any host.

GSAP and all of its plugins (including SplitText) are free for commercial use since v3.13.
