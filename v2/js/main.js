/* ==========================================================================
   PROJECTS — edit this list to add, remove or update portfolio items.
   - platform: "wordpress" | "shopify" | "wix"
   - image:    optional local screenshot, e.g. "images/tarmalsteel.jpg" (1600×1050 works well).
               Leave empty to load a live screenshot of the site automatically.
   ========================================================================== */
const PROJECTS = [
  {
    title: "Bazayan & Co.",
    url: "https://bazayan.ch/",
    platform: "",
    region: "Pharma APIs · Switzerland",
    description: "Website for a Swiss supplier of CEP-certified veterinary and human APIs, with an API portfolio, excipients and quotation requests.",
    stack: ["API portfolio", "Quote requests", "Responsive"],
    image: "../images/bazayan.webp",
    colors: ["#0f3d34", "#2f6f5f"],
  },
  {
    title: "Jafferji Developers",
    url: "https://jafferjidevelopers.co.tz/",
    platform: "",
    region: "Real estate · Tanzania",
    description: "Website for a Dar es Salaam property developer, showcasing premium residences like Jafferji Arise and Regal Skyline with enquiry flows.",
    stack: ["Project showcase", "Enquiry forms", "WhatsApp chat"],
    image: "../images/jafferji.webp",
    colors: ["#8a6a2a", "#d8c49a"],
  },
  {
    title: "Swanya Pharmaceuticals",
    url: "https://swanyapharma.com/",
    platform: "",
    region: "Pharma manufacturing · India",
    description: "Website for a sterile liquid manufacturer in Baddi, presenting its Form-Fill-Seal facility, products and contract manufacturing.",
    stack: ["Product catalogue", "Quote requests", "WhatsApp chat"],
    image: "../images/swanya.webp",
    colors: ["#0b2a4a", "#1f7fc8"],
  },
  {
    title: "Python Bull Consultancy",
    url: "https://www.pythonbull.com/",
    platform: "",
    region: "Brand consultancy",
    description: "Cinematic website for a brand-growth consultancy covering branding, visual production, digital marketing and outdoor media.",
    stack: ["Video hero", "Service pages", "Editorial design"],
    image: "../images/pythonbull.webp",
    colors: ["#3d5a52", "#a8532f"],
  },
  {
    title: "Tarmal Steel",
    url: "http://tarmalsteel.com/",
    platform: "",
    region: "Steel industry",
    description: "Corporate website for a steel company, presenting its products and services with clear enquiry paths.",
    stack: ["Corporate site", "Responsive", "Enquiry forms"],
    image: "",
    colors: ["#2b3442", "#5d6b80"],
  },
];

/* MORE_SITES: extra websites that appear only in the "All websites" grid (same fields as PROJECTS).
   PROJECTS above are the featured slider; the grid shows PROJECTS followed by MORE_SITES. */
const MORE_SITES = [
  // { title: "Client name", url: "https://example.com/", region: "Industry", image: "../images/client.webp", colors: ["#222", "#555"] },
];

/* The "Responsive" section: which project to show, and an optional screenshot per device.
   A device with no screenshot shows the live website, rendered at that device's real width and scaled to fit. */
const SHOWCASE = {
  project: 2, // Swanya Pharmaceuticals
  screens: { desktop: "../images/swanya.webp", tablet: "", mobile: "" },
};

/* Contact form: submissions are emailed to CONTACT_EMAIL through FormSubmit (formsubmit.co).
   The very first submission sends an activation email to that inbox; click "Activate Form" once
   and every message after that is delivered. */
const CONTACT_EMAIL = "infobgraphics19@gmail.com";
const FORM_ENDPOINT = `https://formsubmit.co/ajax/${CONTACT_EMAIL}`;

/* ==========================================================================
   REDESIGNS — before/after comparisons.
   Add your real screenshots as `before` and `after` (e.g. "images/client-before.jpg")
   and they replace the illustrated mockups. Same size images work best (1600×940).
   ========================================================================== */
const REDESIGNS = [
  {
    title: "Example: Café website", url: "https://example.com", platform: "WordPress",
    before: "", after: "",
    brand: "Northbean", oldHeadline: "Welcome to Northbean Coffee!!!", headline: "Coffee worth waking up for.",
    kicker: "Roasted in small batches", colors: ["#9a5a32", "#e2b07a"], paper: "#f6efe6", ink: "#24160d",
    notes: ["Mobile-first layout", "Online ordering", "Faster page loads", "Clear call to action"],
  },
  {
    title: "Example: Fashion store", url: "https://example.com", platform: "Shopify",
    before: "", after: "",
    brand: "Maison Vale", oldHeadline: "WELCOME TO OUR ONLINE SHOP", headline: "Wear the season.",
    kicker: "Autumn collection", colors: ["#33415f", "#9aa9cc"], paper: "#eef1f7", ink: "#141a2a",
    notes: ["Shopify 2.0 theme", "Product filters", "One-page checkout", "Instagram feed"],
  },
  {
    title: "Example: Clinic website", url: "https://example.com", platform: "Wix",
    before: "", after: "",
    brand: "Clearwell", oldHeadline: "Welcome To Clearwell Clinic Home Page", headline: "Care that fits your schedule.",
    kicker: "Book online in 60 seconds", colors: ["#0f766e", "#7ee0d0"], paper: "#eefaf7", ink: "#0b2a27",
    notes: ["Online booking", "Doctor profiles", "Multilingual", "Accessible design"],
  },
];

/* ========================================================================== */

const PLATFORM_LABEL = { wordpress: "WordPress", shopify: "Shopify", wix: "Wix" };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const domainOf = (url) => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; } };
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const root = document.documentElement;
const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;

/* Live screenshots: when a project has no local `image`, the visitor's browser loads a screenshot of the
   live site from WordPress.com's free mShots service. A fresh capture can take a few seconds, so the
   generated cover shows until the real screenshot arrives. */
const shotUrl = (url, vpw, vph) => `https://s0.wp.com/mshots/v1/${encodeURIComponent(url)}?w=${vpw}&h=${vph}&vpw=${vpw}&vph=${vph}`;
function loadShot(img) {
  const src = img.dataset.shot, want = +img.dataset.w || 0;
  let tries = 0;
  const attempt = () => { img.src = tries ? `${src}&r=${tries}` : src; };
  const retry = () => { if (++tries <= 10) setTimeout(attempt, 3500); };
  img.addEventListener("load", () => {
    // mShots answers with a small "generating" placeholder until the capture is ready
    if (want && img.naturalWidth < want * 0.9) return retry();
    img.classList.add("is-loaded");
    window.ScrollTrigger?.refresh();
  });
  img.addEventListener("error", retry);
  attempt();
}

const coverHTML = (p, w = 1440, h = 945) => {
  const [c1, c2] = p.colors || ["#222", "#444"];
  const art = `<div class="project-art" style="--c1:${esc(c1)};--c2:${esc(c2)}"><strong>${esc(p.title)}</strong><em>${esc(domainOf(p.url))}</em></div>`;
  const img = p.image
    ? `<img class="shot is-loaded" src="${esc(p.image)}" alt="Screenshot of ${esc(p.title)}">`
    : `<img class="shot" data-shot="${esc(shotUrl(p.url, w, h))}" data-w="${w}" alt="Screenshot of ${esc(p.title)}">`;
  return art + img;
};

/* Featured slider: arrows, thumbnails, swipe/drag and autoplay, with a clip-and-blur transition */
function setupSlider() {
  const items = PROJECTS.filter((p) => p.featured !== false);
  const imgs = $("#sl-imgs"), thumbs = $("#sl-thumbs"), info = $(".sl-info"), G = window.gsap;
  if (!imgs || !items.length) return;
  const pad = (n) => String(n).padStart(2, "0");
  $("#sl-total").textContent = pad(items.length);
  imgs.innerHTML = items.map((p, i) => `<div class="sl-slide" data-i="${i}"><div class="sl-cover">${coverHTML(p)}</div></div>`).join("");
  thumbs.innerHTML = items.map((p, i) => `
    <button class="sl-thumb" type="button" role="tab" data-i="${i}" aria-label="Show ${esc(p.title)}">
      <span class="sl-thumb-img">${coverHTML(p, 640, 420)}</span>
      <span class="sl-thumb-t mono">${pad(i + 1)} ${esc(p.title)}</span>
      <i class="sl-bar"><b></b></i>
    </button>`).join("");
  $$("img[data-shot]", imgs).forEach(loadShot);
  $$("img[data-shot]", thumbs).forEach(loadShot);

  const slides = $$(".sl-slide", imgs), tbs = $$(".sl-thumb", thumbs);
  let cur = -1, bar = null, visible = false, hovering = false;
  const fill = (p, i) => {
    $("#sl-meta").textContent = `${pad(i + 1)} / ${pad(items.length)} — ${p.region || ""}`;
    $("#sl-title").textContent = p.title;
    $("#sl-desc").textContent = p.description || "";
    $("#sl-tags").innerHTML = (p.stack || []).map((t) => `<li>${esc(t)}</li>`).join("");
    $("#sl-url").textContent = domainOf(p.url);
    const v = $("#sl-visit"); v.href = p.url; $("span", v).textContent = `Visit ${domainOf(p.url)} ↗`;
  };
  const autoplay = () => {
    bar?.kill();
    if (!G) return;
    bar = G.fromTo($(".sl-bar b", tbs[cur]), { scaleX: 0 }, { scaleX: 1, duration: 6, ease: "none", onComplete: () => go(cur + 1, 1) });
    if (!visible || hovering) bar.pause();
  };
  function go(i, dir = 1) {
    i = (i + items.length) % items.length;
    if (i === cur) return;
    const inc = slides[i], out = cur >= 0 ? slides[cur] : null, first = cur < 0;
    cur = i;
    tbs.forEach((t, k) => { t.classList.toggle("is-active", k === i); t.setAttribute("aria-selected", k === i); if (G && k !== i) G.set($(".sl-bar b", t), { scaleX: 0 }); });
    $("#sl-cur").textContent = pad(i + 1);
    slides.forEach((sl) => { if (sl !== inc && sl !== out) { sl.style.zIndex = 0; sl.style.visibility = "hidden"; } });
    inc.style.zIndex = 2; inc.style.visibility = "visible";
    if (out) out.style.zIndex = 1;
    if (!G || first) { fill(items[i], i); if (out) out.style.visibility = "hidden"; autoplay(); return; }
    G.fromTo(inc, { clipPath: dir > 0 ? "inset(0 0 0 100%)" : "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0%)", duration: 1.1, ease: "expo.inOut", overwrite: true });
    G.fromTo($(".sl-cover", inc), { scale: 1.16, filter: "blur(10px)" }, { scale: 1, filter: "blur(0px)", duration: 1.4, ease: "expo.out", clearProps: "filter,transform", overwrite: true });
    G.to($(".sl-cover", out), { scale: 0.94, xPercent: -6 * dir, filter: "blur(8px)", duration: 1.1, ease: "expo.inOut", overwrite: true,
      onComplete: () => { out.style.visibility = "hidden"; G.set($(".sl-cover", out), { clearProps: "all" }); } });
    const parts = [...info.children];
    G.to(parts, { autoAlpha: 0, y: -14, filter: "blur(6px)", duration: 0.3, stagger: 0.03, ease: "power2.in", overwrite: true,
      onComplete: () => { fill(items[i], i);
        G.fromTo([...info.children], { autoAlpha: 0, y: 24, filter: "blur(8px)" }, { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.7, stagger: 0.06, ease: "expo.out", clearProps: "filter" }); } });
    autoplay();
  }
  $("#sl-prev").addEventListener("click", () => go(cur - 1, -1));
  $("#sl-next").addEventListener("click", () => go(cur + 1, 1));
  tbs.forEach((t) => t.addEventListener("click", () => { const i = +t.dataset.i; go(i, i > cur ? 1 : -1); }));
  $("#slider").addEventListener("keydown", (e) => { if (e.key === "ArrowRight") go(cur + 1, 1); if (e.key === "ArrowLeft") go(cur - 1, -1); });
  // swipe / drag
  const media = $(".sl-media"); let x0 = null;
  media.addEventListener("pointerdown", (e) => { x0 = e.clientX; });
  window.addEventListener("pointerup", (e) => { if (x0 === null) return; const dx = e.clientX - x0; x0 = null; if (Math.abs(dx) > 50) go(cur + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1); });
  // pause while hovered or off screen
  const sliderEl = $(".work");
  sliderEl.addEventListener("pointerenter", () => { hovering = true; bar?.pause(); });
  sliderEl.addEventListener("pointerleave", () => { hovering = false; if (visible) bar?.resume(); });
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible && !hovering ? bar?.resume() : bar?.pause(); }, { threshold: 0.35 }).observe(sliderEl);
  go(0);
}

/* All websites grid */
function renderSites() {
  const grid = $("#sites-grid");
  if (!grid) return;
  const all = [...PROJECTS, ...MORE_SITES];
  $("#sites-count").textContent = `(${String(all.length).padStart(2, "0")})`;
  grid.innerHTML = all.map((p) => `
    <a class="site-card" href="${esc(p.url)}" target="_blank" rel="noopener" data-cursor="view" aria-label="Open ${esc(p.title)} (new tab)">
      <span class="site-shot">${coverHTML(p, 1280, 840)}</span>
      <span class="site-meta">
        <span><b>${esc(p.title)}</b><em class="mono">${esc(p.region || domainOf(p.url))}</em></span>
        <i aria-hidden="true">↗</i>
      </span>
    </a>`).join("");
  $$("img[data-shot]", grid).forEach(loadShot);
}

function setupMenu(lenis) {
  const btn = $(".menu-btn"), links = $("#nav-links");
  btn.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    btn.setAttribute("aria-expanded", open);
    open ? lenis?.stop() : lenis?.start();
  });
  $$("a", links).forEach((a) => a.addEventListener("click", () => {
    links.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); lenis?.start();
  }));
}

function setupAnchors(lenis) {
  $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    const target = id === "#top" ? 0 : $(id);
    if (target === null) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { duration: 1.6 });
    else (target === 0 ? window.scrollTo({ top: 0 }) : target.scrollIntoView());
  }));
}

let onTab = showPane;
$$(".tab").forEach((t) => t.addEventListener("click", () => onTab(+t.dataset.tab)));
function showPane(i) {
  $$(".tab").forEach((t, k) => { t.classList.toggle("is-active", k === i); t.setAttribute("aria-selected", k === i); });
  $$(".pane").forEach((p, k) => p.classList.toggle("is-active", k === i));
  $$(".code-steps li").forEach((li, k) => li.classList.toggle("is-active", k === i));
}

function setupForm() {
  const form = $("#contact-form"), note = $("#form-note"), btn = $("button[type=submit]", form), label = $("span", btn);
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) { note.textContent = "› Please add your name, a valid email and a few project details."; form.reportValidity(); return; }
    const d = Object.fromEntries(new FormData(form));
    if (d._honey) return; // bot filled the hidden field
    btn.disabled = true; label.textContent = "Sending…"; note.textContent = "";
    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          name: d.name, email: d.email, platform: d.platform, message: d.message,
          _subject: `New ${d.platform} project enquiry from ${d.name}`,
          _replyto: d.email, _template: "table", _captcha: "false",
        }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || out.success === false || out.success === "false") {
        // FormSubmit's first reply asks the inbox owner to activate the form
        if (/activat/i.test(out.message || "")) { note.textContent = "› Thanks! Your message is waiting: this form is being activated and will be delivered shortly."; form.reset(); return; }
        throw new Error(out.message || res.status);
      }
      form.reset();
      note.textContent = "› Thanks! Your message has been sent. I'll reply within 24 hours.";
    } catch (err) {
      console.error(err);
      note.textContent = `› Sorry, your message couldn't be sent. Please try again, or email ${CONTACT_EMAIL} directly.`;
    } finally {
      btn.disabled = false; label.textContent = "Send message";
    }
  });
}

const oldMock = (d) => `
  <div class="old">
    <div class="old-top">${esc(d.brand)}<small>~ Your #1 choice since 1999 ~</small></div>
    <div class="old-nav"><a>Home</a> | <a>About Us</a> | <a>Products</a> | <a>Contact Us</a> | <a>Guestbook</a></div>
    <div class="old-body">
      <div class="old-side"><b>MENU</b><a>Home</a><a>Our Services</a><a>Photo Gallery</a><a>Links</a><a>Sign Guestbook</a></div>
      <div class="old-main">
        <h4>${esc(d.oldHeadline)}</h4>
        <div class="old-row"><div class="old-img">IMAGE</div><div><p>We are the best company for all your needs. Please browse our website using the menu on the left side.</p><p>Thank you for visiting!!</p><span class="old-btn">CLICK HERE!!</span></div></div>
      </div>
    </div>
    <div class="old-foot">Best viewed in Internet Explorer at 800x600 · Visitors: 004213</div>
  </div>`;
const newMock = (d) => `
  <div class="new" style="--c1:${esc(d.colors[0])};--c2:${esc(d.colors[1])};--paper:${esc(d.paper)};--ink:${esc(d.ink)}">
    <div class="new-nav"><b>${esc(d.brand)}<i>.</i></b><span><span>Shop</span><span>About</span><span>Contact</span></span><em>Book now</em></div>
    <div class="new-hero"><div><span class="new-kicker">${esc(d.kicker)}</span><span class="new-h">${esc(d.headline)}</span><span class="new-p">Built by Kishan on ${esc(d.platform)}.</span><span class="new-cta">Get started &rarr;</span></div><span class="new-img"></span></div>
    <div class="new-cards"><span><i></i>Feature one</span><span><i></i>Feature two</span><span><i></i>Feature three</span></div>
  </div>`;

/* Before/after slider: drag anywhere on the frame (mouse or touch), or use the arrow keys */
const BA = { setPos: () => {}, swap: null };
function setupBeforeAfter() {
  const frame = $(".ba-frame"), range = $("#ba-range"), tabs = $("#ba-tabs");
  if (!frame) return;
  const setPos = (v) => { v = Math.max(0, Math.min(100, v)); frame.style.setProperty("--pos", `${v}%`); range.value = v; };
  BA.setPos = setPos;
  const fromEvent = (e) => { const r = frame.getBoundingClientRect(); setPos(((e.clientX - r.left) / r.width) * 100); };
  let dragging = false;
  frame.addEventListener("pointerdown", (e) => { dragging = true; frame.setPointerCapture(e.pointerId); fromEvent(e); });
  frame.addEventListener("pointermove", (e) => { if (dragging) fromEvent(e); });
  ["pointerup", "pointercancel"].forEach((t) => frame.addEventListener(t, () => (dragging = false)));
  range.addEventListener("input", () => setPos(+range.value));

  const show = (i) => {
    const d = REDESIGNS[i];
    $("#ba-before").innerHTML = d.before ? `<img src="${esc(d.before)}" alt="${esc(d.title)} before the redesign">` : oldMock(d);
    $("#ba-after").innerHTML = d.after ? `<img src="${esc(d.after)}" alt="${esc(d.title)} after the redesign">` : newMock(d);
    $("#ba-title").textContent = d.title;
    const link = $("#ba-link"); link.href = d.url; link.textContent = `${domainOf(d.url)} ↗ · ${d.platform}`;
    $("#ba-notes").innerHTML = d.notes.map((n) => `<li>${esc(n)}</li>`).join("");
    $$(".ba-tab", tabs).forEach((t, k) => { t.classList.toggle("is-active", k === i); t.setAttribute("aria-selected", k === i); });
  };
  tabs.innerHTML = REDESIGNS.map((d, i) => `<button class="ba-tab" role="tab" data-i="${i}">${esc(d.title.replace(/^Example:\s*/, ""))}</button>`).join("");
  $$(".ba-tab", tabs).forEach((t) => t.addEventListener("click", () => (BA.swap ? BA.swap(+t.dataset.i, show) : show(+t.dataset.i))));
  show(0);
  setPos(50);
}

function setupDevices() {
  const p = PROJECTS[SHOWCASE.project];
  if (!p || !$(".devices")) return;
  $("#dv-name").textContent = p.title;
  $("#dv-link").href = p.url;
  $("#dv-link span").textContent = `Visit ${domainOf(p.url)} ↗`;
  const [c1, c2] = p.colors || [];
  const frames = [];
  [[".dv-desktop", "desktop", 1440], [".dv-tablet", "tablet", 820], [".dv-phone", "mobile", 390]].forEach(([sel, key, vw]) => {
    const screen = $(".dv-screen", $(sel)), art = $(".dv-art", screen), src = SHOWCASE.screens[key];
    art.style.setProperty("--c1", c1); art.style.setProperty("--c2", c2);
    art.textContent = domainOf(p.url);
    if (src) {
      screen.insertAdjacentHTML("beforeend", `<img class="dv-shot" src="${esc(src)}" alt="${esc(p.title)} on ${key}">`);
      return;
    }
    // live site at the device's real width, scaled down to fit the screen exactly
    const f = document.createElement("iframe");
    Object.assign(f, { className: "dv-frame", title: `${p.title} on ${key}`, loading: "lazy", tabIndex: -1, src: p.url });
    f.setAttribute("sandbox", "allow-scripts allow-same-origin");
    f.setAttribute("aria-hidden", "true");
    screen.appendChild(f);
    frames.push({ f, screen, vw });
  });
  const fit = () => frames.forEach(({ f, screen, vw }) => {
    const s = screen.clientWidth / vw;
    f.style.width = `${vw}px`;
    f.style.height = `${screen.clientHeight / s}px`;
    f.style.transform = `scale(${s})`;
  });
  fit();
  if ("ResizeObserver" in window) new ResizeObserver(fit).observe($(".devices-stage"));
}

function setupToolGlow() {
  $$(".tools li").forEach((li) => li.addEventListener("pointermove", (e) => {
    const r = li.getBoundingClientRect();
    li.style.setProperty("--x", `${e.clientX - r.left}px`);
    li.style.setProperty("--y", `${e.clientY - r.top}px`);
  }));
}

/* ==========================================================================
   Motion (GSAP + ScrollTrigger + SplitText + Lenis)
   ========================================================================== */
function initMotion() {
  const { gsap, ScrollTrigger, SplitText, Lenis } = window;
  gsap.registerPlugin(ScrollTrigger, SplitText);

  // --- Smooth scroll, kept in sync with ScrollTrigger (native scrolling when the OS asks for reduced motion)
  const reduced = root.classList.contains("reduce-motion");
  // Option 2 keeps smooth scrolling for everyone (the OS setting only skips the preloader)
  const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, smoothWheel: true, anchors: false });
  ScrollTrigger.config({ ignoreMobileResize: true });
  if (lenis) {
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }

  setupMenu(lenis);
  setupAnchors(lenis);

  // --- Scroll progress bar
  gsap.to(".scroll-progress span", { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } });

  // --- Cursor + magnetic elements (mouse only)
  if (finePointer) {
    const cursor = $(".cursor"), dot = $(".cursor-dot"), ring = $(".cursor-ring");
    const dx = gsap.quickTo(dot, "x", { duration: 0.1 }), dy = gsap.quickTo(dot, "y", { duration: 0.1 });
    const rx = gsap.quickTo(ring, "x", { duration: 0.45, ease: "power3" }), ry = gsap.quickTo(ring, "y", { duration: 0.45, ease: "power3" });
    window.addEventListener("pointermove", (e) => { dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); });
    document.addEventListener("pointerover", (e) => {
      const tagged = e.target.closest("[data-cursor]");
      const view = tagged?.dataset.cursor === "view", drag = tagged?.dataset.cursor === "drag";
      const hover = e.target.closest("a, button, input, textarea, label");
      $(".cursor-label").textContent = drag ? "Drag" : "View";
      cursor.classList.toggle("is-view", view);
      cursor.classList.toggle("is-drag", drag);
      cursor.classList.toggle("is-hover", !tagged && !!hover);
    });

    $$("[data-magnetic]").forEach((el) => {
      const mx = gsap.quickTo(el, "x", { duration: 0.6, ease: "elastic.out(1, .4)" });
      const my = gsap.quickTo(el, "y", { duration: 0.6, ease: "elastic.out(1, .4)" });
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        mx((e.clientX - r.left - r.width / 2) * 0.35);
        my((e.clientY - r.top - r.height / 2) * 0.35);
      });
      el.addEventListener("pointerleave", () => { mx(0); my(0); });
    });

    // Hero grid spotlight follows the mouse
    const hero = $(".hero");
    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      hero.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
      hero.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
    });
  }

  // --- Hero split text (built now, played after the preloader)
  const heroLines = $$(".ht-line");
  const heroSplit = SplitText.create(heroLines, { type: "chars", charsClass: "char" });
  heroLines.forEach((l) => l.classList.add("split-line"));
  gsap.set(heroSplit.chars, { yPercent: 115, filter: "blur(12px)" });
  gsap.set([".hero-kicker", ".hero-sub", ".hero-cta", ".hero-scroll"], { autoAlpha: 0, y: 24 });
  gsap.set(".site-header", { autoAlpha: 0 }); // opacity only: a transform would trap the fixed mobile menu

  const intro = gsap.timeline({ paused: true, defaults: { ease: "expo.out" } })
    .to(heroSplit.chars, { yPercent: 0, filter: "blur(0px)", duration: 1.4, stagger: 0.025, clearProps: "filter" })
    .to(".hero-kicker", { autoAlpha: 1, y: 0, duration: 1 }, 0.3)
    .to([".hero-sub", ".hero-cta"], { autoAlpha: 1, y: 0, duration: 1, stagger: 0.1 }, 0.6)
    .to(".hero-scroll", { autoAlpha: 1, y: 0, duration: 1 }, 0.8)
    .to(".site-header", { autoAlpha: 1, duration: 1 }, 0.8)
    .from(".ht-tag", { scale: 0, rotate: -90, duration: 1, ease: "back.out(2)" }, 0.9)
    .from(".hero .fb", { scale: 0.4, autoAlpha: 0, duration: 1.4, stagger: 0.12, ease: "expo.out" }, 0.7);

  // Hero lines drift apart and fade as you scroll away
  gsap.timeline({ scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } })
    .to(".ht-1", { xPercent: -12 }, 0)
    .to(".ht-2", { xPercent: 10 }, 0)
    .to(".ht-3", { xPercent: -6 }, 0)
    .to(".hero-inner", { autoAlpha: 0.15, y: 80 }, 0);

  // --- Preloader → intro
  const counter = { v: 0 };
  if (reduced) { $(".preloader").remove(); lenis.start(); intro.play(); }
  else gsap.timeline({ onComplete: () => { lenis.start(); $(".preloader").remove(); } })
    .from(".pl-line", { autoAlpha: 0, x: -10, stagger: 0.28, duration: 0.3 }, 0.2)
    .to(counter, { v: 100, duration: 1.6, ease: "power2.inOut", onUpdate: () => { $("#pl-num").textContent = Math.round(counter.v); } }, 0)
    .to(".preloader-bar span", { scaleX: 1, duration: 1.6, ease: "power2.inOut" }, 0)
    .to(".preloader", { clipPath: "inset(0 0 100% 0)", duration: 1, ease: "expo.inOut" }, "+=0.15")
    .add(() => intro.play(), "-=0.45");

  // --- Marquee: endless loop that speeds up with scroll velocity
  const loops = $$(".marquee-row").map((row) => {
    const track = $(".marquee-track", row);
    for (let i = 0; i < 3; i++) row.appendChild(track.cloneNode(true)).setAttribute("aria-hidden", "true");
    const [from, to] = +row.dataset.dir < 0 ? [0, -100] : [-100, 0];
    return gsap.fromTo(row.children, { xPercent: from }, { xPercent: to, ease: "none", duration: 24, repeat: -1 });
  });
  ScrollTrigger.create({
    onUpdate: (self) => {
      const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 250, 5);
      loops.forEach((l) => gsap.timeline({ overwrite: true }).to(l, { timeScale: boost, duration: 0.2 }).to(l, { timeScale: 1, duration: 1.2 }));
      gsap.to(".marquee-row:first-child", { skewX: gsap.utils.clamp(-8, 8, self.getVelocity() / -250), duration: 0.3, overwrite: true });
    },
  });
  ScrollTrigger.addEventListener("scrollEnd", () => gsap.to(".marquee-row:first-child", { skewX: 0, duration: 0.6 }));

  // --- Section headings: masked line reveal
  $$(".split-heading, .work-title, .contact-big").forEach((h) => {
    const s = SplitText.create(h, { type: "lines", mask: "lines", linesClass: "line" });
    gsap.from(s.lines, { yPercent: 105, filter: "blur(10px)", duration: 1.3, ease: "expo.out", stagger: 0.08, clearProps: "filter", scrollTrigger: { trigger: h, start: "top 85%" } });
  });
  $$(".label").forEach((l) => gsap.from(l, { autoAlpha: 0, x: -20, duration: 0.8, scrollTrigger: { trigger: l, start: "top 90%" } }));

  // --- About: words light up as you scroll through them
  $$("[data-reveal-words]").forEach((el) => {
    const s = SplitText.create(el, { type: "words" });
    gsap.fromTo(s.words, { opacity: 0.12 }, { opacity: 1, stagger: 0.1, ease: "none", scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: true } });
  });

  // --- Counters: count up (with a filling bar) every time the stats scroll into view
  const stats = $$(".stat").map((st) => ({ num: $(".stat-num", st), bar: $(".stat-bar", st) }));
  const resetStats = () => stats.forEach(({ num, bar }) => { num.textContent = `0${num.dataset.suffix || ""}`; gsap.set(bar, { scaleX: 0 }); });
  const runStats = () => stats.forEach(({ num, bar }, i) => {
    const n = { v: 0 }, target = +num.dataset.count, suffix = num.dataset.suffix || "";
    gsap.to(n, { v: target, duration: 2.4, delay: i * 0.15, ease: "power2.out", overwrite: true,
      onUpdate: () => (num.textContent = Math.round(n.v) + suffix) });
    gsap.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: 2.4, delay: i * 0.15, ease: "power2.out", overwrite: true });
  });
  resetStats();
  ScrollTrigger.create({ trigger: ".stats", start: "top 85%", end: "bottom top", onEnter: runStats, onEnterBack: runStats, onLeaveBack: resetStats });

  // --- Live build: pinned sequence, wireframe → design → code → launch
  const scores = $$(".score").map((el) => ({ target: +el.dataset.score, ring: $(".r-fg", el), num: $("b", el) }));
  const scoreProxy = { p: 0 };
  const drawScores = () => scores.forEach(({ target, ring, num }) => {
    const v = Math.round(target * scoreProxy.p);
    num.textContent = v;
    ring.style.strokeDashoffset = 100 - v;
  });
  const steps = $$(".build-steps li");
  const stageAt = [0, 1.2, 3.8, 6.8];
  const build = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: { trigger: ".build", pin: ".build-pin", start: "top top", end: "+=360%", scrub: 1, anticipatePin: 1 },
    // runs on every frame of the scrubbed timeline, so the label never lags behind the visuals
    onUpdate: () => {
      const t = build.time();
      const idx = stageAt.filter((s) => t >= s).length - 1;
      steps.forEach((li, k) => li.classList.toggle("is-active", k === idx));
    },
  });
  build
    .fromTo(".bs-browser", { scale: 0.86, rotateX: 16, y: 50, transformPerspective: 1400 }, { scale: 1, rotateX: 0, y: 0, duration: 1, ease: "power2.out" }, 0)
    .fromTo(".build-rail span", { scaleX: 0 }, { scaleX: 1, duration: 10.4 }, 0)
    // design paints over the wireframe behind a scanning line
    .fromTo(".bs-design", { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 2 }, 1.2)
    .fromTo(".bs-scan", { left: "0%", autoAlpha: 1 }, { left: "100%", duration: 2 }, 1.2)
    .to(".bs-scan", { autoAlpha: 0, duration: 0.2 }, 3.2)
    // the code slides in and types itself
    .fromTo(".bs-code", { xPercent: 105 }, { xPercent: 0, duration: 1, ease: "power2.out" }, 3.8)
    .fromTo(".bs-code .cl", { autoAlpha: 0, x: -12 }, { autoAlpha: 1, x: 0, duration: 0.3, stagger: 0.14 }, 4.2)
    .to(".bs-code", { xPercent: 105, duration: 0.9, ease: "power2.in" }, 6.1)
    // launch: scores rise and count up
    .fromTo(".bs-scores", { yPercent: 130, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.9, ease: "power2.out" }, 6.8)
    .fromTo(scoreProxy, { p: 0 }, { p: 1, duration: 2, ease: "power1.out", onUpdate: drawScores }, 7.2)
    .fromTo(".bs-badge", { y: -16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, ease: "back.out(2)" }, 9.1)
    .to({}, { duration: 0.8 }, 9.6);
  gsap.from(".build-head > *", { y: 40, autoAlpha: 0, duration: 1, stagger: 0.1, ease: "expo.out", scrollTrigger: { trigger: ".build", start: "top 70%" } });

  // --- Services: each card shrinks and dims as the next one stacks on top
  const cards = $$(".stack-card");
  cards.forEach((card, i) => {
    const next = cards[i + 1];
    if (!next) return;
    gsap.to(card, { scale: 0.9 + i * 0.03, "--shade": 0.55, ease: "none",
      scrollTrigger: { trigger: next, start: "top 70%", end: "top 15%", scrub: true } });
  });
  cards.forEach((c) => gsap.from($$("h3, .sc-body > *", c), { y: 50, autoAlpha: 0, filter: "blur(8px)", duration: 1.1, ease: "expo.out", stagger: 0.08, clearProps: "filter", scrollTrigger: { trigger: c, start: "top 75%" } }));

  // --- Responsive pieces
  const mm = gsap.matchMedia();

  mm.add("(min-width: 900px)", () => {
    // Code: pin the editor and switch files as you scroll
    const st = ScrollTrigger.create({
      trigger: ".code", start: "top top", end: "+=180%", pin: ".code-pin", scrub: true,
      onUpdate: (self) => {
        const i = Math.min(2, Math.floor(self.progress * 3));
        if (i !== +($(".tab.is-active")?.dataset.tab)) { showPane(i); revealPane(i); }
      },
    });
    onTab = (i) => {
      const y = st.start + ((st.end - st.start) * (i + 0.5)) / 3;
      lenis ? lenis.scrollTo(y, { duration: 1.2 }) : window.scrollTo({ top: y });
    };
    return () => { onTab = showPane; };
  });


  // Code lines type in when a pane appears
  function revealPane(i) {
    gsap.fromTo($$(`.pane[data-pane="${i}"] .ln`), { autoAlpha: 0, x: -12 }, { autoAlpha: 1, x: 0, duration: 0.4, stagger: 0.035, ease: "power2.out", overwrite: true });
  }
  ScrollTrigger.create({ trigger: ".editor", start: "top 75%", once: true, onEnter: () => revealPane(+($(".tab.is-active")?.dataset.tab || 0)) });
  gsap.from(".editor", { y: 80, rotateX: 12, autoAlpha: 0, duration: 1.4, ease: "expo.out", transformPerspective: 1200, scrollTrigger: { trigger: ".editor", start: "top 85%" } });

  // --- Process: draw the line, light up each step
  gsap.to(".tl-fill", { strokeDashoffset: 0, ease: "none", scrollTrigger: { trigger: ".timeline", start: "top 60%", end: "bottom 60%", scrub: true } });
  $$(".tl-step").forEach((step) => {
    gsap.from([...step.children].filter((c) => !c.classList.contains("tl-dot")), { y: 40, autoAlpha: 0, filter: "blur(8px)", clearProps: "filter", duration: 1, stagger: 0.08, ease: "expo.out", scrollTrigger: { trigger: step, start: "top 75%" } });
    gsap.fromTo($(".tl-dot", step), { backgroundColor: "#0a0a0b", scale: 1 }, { backgroundColor: "#d4ff3f", scale: 1.3, ease: "none",
      scrollTrigger: { trigger: step, start: "top 62%", end: "top 58%", scrub: true } });
  });

  // --- Toolbox tiles
  gsap.from(".tools li", { autoAlpha: 0, y: 30, filter: "blur(6px)", clearProps: "filter", duration: 0.8, ease: "expo.out", stagger: { each: 0.04, grid: "auto", from: "start" }, scrollTrigger: { trigger: ".tools", start: "top 80%" } });

  // --- Contact: big type slides in from the sides
  gsap.timeline({ scrollTrigger: { trigger: ".contact", start: "top bottom", end: "top 20%", scrub: true } })
    .from(".contact-big > span:nth-child(1)", { xPercent: -15 }, 0)
    .from(".contact-big > span:nth-child(2)", { xPercent: 20 }, 0)
    .from(".contact-big > span:nth-child(3)", { xPercent: -10 }, 0);

  // --- Active nav link
  $$(".nav-links a").forEach((a) => {
    const sec = $(a.getAttribute("href"));
    if (!sec) return;
    ScrollTrigger.create({ trigger: sec, start: "top 50%", end: "bottom 50%", onToggle: (s) => a.classList.toggle("is-current", s.isActive) });
  });

  // --- Responsive showcase: devices assemble, count up their widths, then drift apart in depth
  const dvs = [".dv-desktop", ".dv-tablet", ".dv-phone"].map((sel) => $(sel));
  const widths = $$(".dv-label b"), wProxy = { p: 0 };
  gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: { trigger: ".devices", pin: ".devices-pin", start: "top top", end: "+=320%", scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 },
  })
    .fromTo(dvs[0], { scale: 1.16, y: 30, rotateX: 12 }, { scale: 1, y: 0, rotateX: 0, duration: 1, ease: "power2.out" }, 0)
    .fromTo(dvs[1], { xPercent: 110, scale: 0.7, autoAlpha: 0, filter: "blur(14px)" }, { xPercent: 0, scale: 1, autoAlpha: 1, filter: "blur(0px)", duration: 1, ease: "power2.out" }, 0.5)
    .fromTo(dvs[2], { xPercent: -160, scale: 0.7, autoAlpha: 0, filter: "blur(14px)" }, { xPercent: 0, scale: 1, autoAlpha: 1, filter: "blur(0px)", duration: 1, ease: "power2.out" }, 0.7)
    .fromTo(".dv-label", { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.1 }, 1.4)
    .fromTo(wProxy, { p: 0 }, { p: 1, duration: 0.8, ease: "power2.out", onUpdate: () => widths.forEach((b) => (b.textContent = Math.round(+b.dataset.to * wProxy.p))) }, 1.4)
    .to(dvs, { y: (i) => [-10, -26, -38][i], duration: 2.4, ease: "sine.inOut" }, 1.9)
    .to(dvs[2], { rotate: -5, y: -16, duration: 0.8, ease: "power2.inOut" }, 3.6)
    .to(dvs[1], { rotate: 3, duration: 0.8, ease: "power2.inOut" }, 3.6)
    .to({}, { duration: 0.6 });

  // --- Slider and website grid reveal
  gsap.from(".slider", { y: 60, autoAlpha: 0, filter: "blur(14px)", duration: 1.3, ease: "expo.out", clearProps: "filter", scrollTrigger: { trigger: ".slider", start: "top 85%" } });
  gsap.from(".sl-thumb", { y: 30, autoAlpha: 0, duration: 0.9, stagger: 0.07, ease: "expo.out", scrollTrigger: { trigger: ".sl-thumbs", start: "top 92%" } });
  gsap.set(".site-card", { autoAlpha: 0 });
  ScrollTrigger.batch(".site-card", {
    start: "top 88%", once: true,
    onEnter: (els) => gsap.fromTo(els, { y: 50, autoAlpha: 0, filter: "blur(10px)" }, { y: 0, autoAlpha: 1, filter: "blur(0px)", duration: 1, stagger: 0.08, ease: "expo.out", clearProps: "filter" }),
  });

  // --- Glass header once the page is scrolled
  ScrollTrigger.create({ start: 80, end: "max", toggleClass: { targets: ".site-header", className: "scrolled" } });

  // --- Aurora blobs drift slowly and shift as you scroll
  [[".a1", 120, 80], [".a2", -100, 120], [".a3", 90, -90]].forEach(([sel, x, y], i) => {
    gsap.to(`.aurora ${sel}`, { x, y, scale: 1.15, duration: 14 + i * 3, ease: "sine.inOut", yoyo: true, repeat: -1 });
  });
  gsap.to(".aurora", { yPercent: -12, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 1.5 } });

  // --- Floating logos: parallax by depth
  $$(".fb").forEach((el) => {
    const speed = +el.dataset.speed || 0.5;
    gsap.fromTo(el, { y: 140 * speed }, { y: -140 * speed, ease: "none",
      scrollTrigger: { trigger: el.closest("section"), start: "top bottom", end: "bottom top", scrub: 1 } });
  });
  $$(".about .fb, .redesigns .fb, .contact .fb").forEach((el) =>
    gsap.from($(".fb-in", el), { autoAlpha: 0, filter: "blur(14px)", duration: 1.4, ease: "expo.out", clearProps: "filter", scrollTrigger: { trigger: el.closest("section"), start: "top 75%" } }));

  // --- Before/after: the handle sweeps across when the slider scrolls into view; tabs swap with a blur
  ScrollTrigger.create({
    trigger: ".ba-frame", start: "top 70%", once: true,
    onEnter: () => {
      const p = { v: 100 };
      gsap.timeline({ onUpdate: () => BA.setPos(p.v) })
        .to(p, { v: 12, duration: 1.1, ease: "power2.inOut" })
        .to(p, { v: 50, duration: 1, ease: "power3.out" });
    },
  });
  gsap.from(".ba-frame", { y: 80, scale: 0.94, autoAlpha: 0, filter: "blur(16px)", duration: 1.4, ease: "expo.out", clearProps: "filter", scrollTrigger: { trigger: ".ba-frame", start: "top 85%" } });
  BA.swap = (i, show) => {
    gsap.timeline()
      .to(".ba-layer", { filter: "blur(14px)", autoAlpha: 0, duration: 0.3, ease: "power2.in" })
      .add(() => { show(i); BA.setPos(85); })
      .to(".ba-layer", { filter: "blur(0px)", autoAlpha: 1, duration: 0.5, ease: "power2.out", clearProps: "filter" })
      .add(() => { const p = { v: 85 }; gsap.to(p, { v: 50, duration: 0.9, ease: "power3.out", onUpdate: () => BA.setPos(p.v) }); }, "-=0.3");
  };

  // pins were created out of page order; sort so each one accounts for the pins above it
  ScrollTrigger.sort();
  ScrollTrigger.refresh();
  window.addEventListener("load", () => ScrollTrigger.refresh());
}

/* ========================================================================== */
function boot() {
  $("#year").textContent = new Date().getFullYear();
  setupSlider();
  renderSites();
  setupBeforeAfter();
  setupDevices();
  setupForm();
  setupToolGlow();

  const canAnimate = root.classList.contains("has-motion") && window.gsap && window.ScrollTrigger && window.SplitText && (window.Lenis || root.classList.contains("reduce-motion"));
  if (!canAnimate) {
    // Static fallback: everything visible, native scrolling, clickable tabs.
    root.classList.remove("has-motion");
    setupMenu(null);
    return;
  }
  try {
    initMotion();
  } catch (err) {
    console.error(err);
    root.classList.remove("has-motion");
    $(".preloader")?.remove();
    window.gsap?.set([".site-header", ".hero-kicker", ".hero-sub", ".hero-cta", ".hero-scroll"], { clearProps: "all" });
  }
}

(document.fonts?.ready || Promise.resolve()).then(boot);
