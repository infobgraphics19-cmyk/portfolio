/* ==========================================================================
   PROJECTS — edit this list to add, remove or update portfolio items.
   - platform: "wordpress" | "shopify" | "wix"
   - image:    optional screenshot path, e.g. "images/tarmalsteel.jpg" (1600×1050 works well).
               Leave empty to show a generated cover in the two `colors`.
   ========================================================================== */
const PROJECTS = [
  {
    title: "Tarmal Steel",
    url: "https://tarmalsteel.com",
    platform: "wordpress",
    region: "Corporate website",
    description: "Corporate website for a steel company, with a custom theme, product and service pages, and enquiry forms.",
    stack: ["Custom theme", "ACF", "Contact forms", "SEO"],
    image: "",
    colors: ["#2b3442", "#5d6b80"],
  },
  {
    title: "Bazayan",
    url: "https://bazayan.ch",
    platform: "wordpress",
    region: "Switzerland",
    description: "Business website for a Swiss client, with a responsive custom layout and multilingual-ready content.",
    stack: ["Custom theme", "Responsive", "Multilingual"],
    image: "",
    colors: ["#8f1d1d", "#e0475a"],
  },
  // ---- Add more of your projects below (examples to replace) ----
  {
    title: "Your Shopify Store",
    url: "https://example.com",
    platform: "shopify",
    region: "E-commerce",
    description: "Custom Shopify 2.0 theme with Liquid sections, product filtering and a faster checkout flow.",
    stack: ["Liquid", "Shopify 2.0", "Metafields"],
    image: "",
    colors: ["#1f4d2b", "#5fa86b"],
  },
  {
    title: "Your Wix Website",
    url: "https://example.com",
    platform: "wix",
    region: "Small business",
    description: "Wix Studio website with dynamic pages, a booking system and custom Velo code.",
    stack: ["Wix Studio", "Velo", "Bookings"],
    image: "",
    colors: ["#1c3a7a", "#4d8dff"],
  },
  {
    title: "Your WooCommerce Store",
    url: "https://example.com",
    platform: "wordpress",
    region: "Online shop",
    description: "WooCommerce store with custom product templates, payment gateway setup and speed tuning.",
    stack: ["WooCommerce", "PHP", "Speed optimisation"],
    image: "",
    colors: ["#43246e", "#9a6be0"],
  },
  {
    title: "Your Shopify Brand",
    url: "https://example.com",
    platform: "shopify",
    region: "Fashion / DTC",
    description: "Brand store build with custom landing sections, upsell apps and a mobile-first design.",
    stack: ["Liquid", "Apps", "CRO"],
    image: "",
    colors: ["#7a3312", "#e98a4c"],
  },
];

/* Contact form: opens the visitor's email app with the message pre-filled.
   Swap for Formspree / Netlify Forms / your backend if you prefer. */
const CONTACT_EMAIL = "hello@example.com";

/* ========================================================================== */

const PLATFORM_LABEL = { wordpress: "WordPress", shopify: "Shopify", wix: "Wix" };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const domainOf = (url) => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; } };
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const root = document.documentElement;
const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;

function renderProjects() {
  const outro = $(".work-outro");
  const html = PROJECTS.map((p, i) => {
    const domain = domainOf(p.url);
    const [c1, c2] = p.colors || ["#222", "#444"];
    const media = p.image
      ? `<img src="${esc(p.image)}" alt="Screenshot of ${esc(p.title)}" loading="lazy">`
      : `<div class="project-art" style="--c1:${esc(c1)};--c2:${esc(c2)}"><strong>${esc(p.title)}</strong><em>${esc(domain)}</em><div class="skel"><b></b><b></b><b></b></div></div>`;
    return `
      <article class="project" data-platform="${esc(p.platform)}">
        <a class="project-media" href="${esc(p.url)}" target="_blank" rel="noopener" data-cursor="view" aria-label="Visit ${esc(p.title)} (opens in a new tab)">
          <div class="browser"><i></i><i></i><i></i><span>${esc(domain)}</span></div>
          <div class="project-inner">${media}</div>
        </a>
        <div class="project-meta">
          <div>
            <span class="project-idx">${String(i + 1).padStart(2, "0")} / ${String(PROJECTS.length).padStart(2, "0")} — ${esc(p.region || "")}</span>
            <h3>${esc(p.title)}</h3>
            <p>${esc(p.description)}</p>
            <ul class="project-tags">
              <li class="platform ${esc(p.platform)}">${esc(PLATFORM_LABEL[p.platform] || p.platform)}</li>
              ${(p.stack || []).map((s) => `<li>${esc(s)}</li>`).join("")}
            </ul>
          </div>
          <a class="project-visit" href="${esc(p.url)}" target="_blank" rel="noopener" aria-label="Open ${esc(domain)}" data-magnetic>↗</a>
        </div>
      </article>`;
  }).join("");
  outro.insertAdjacentHTML("beforebegin", html);
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
  const form = $("#contact-form"), note = $("#form-note");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.checkValidity()) { note.textContent = "› Please add your name, a valid email and a few project details."; form.reportValidity(); return; }
    const d = new FormData(form);
    const subject = `New ${d.get("platform")} project enquiry from ${d.get("name")}`;
    const body = `Name: ${d.get("name")}\nEmail: ${d.get("email")}\nPlatform: ${d.get("platform")}\n\n${d.get("message")}`;
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    note.textContent = "› Opening your email app… thanks for reaching out!";
  });
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

  // --- Smooth scroll, kept in sync with ScrollTrigger
  const lenis = new Lenis({ lerp: 0.1, anchors: false });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop();

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
      const view = e.target.closest("[data-cursor='view']");
      const hover = e.target.closest("a, button, input, textarea, label");
      cursor.classList.toggle("is-view", !!view);
      cursor.classList.toggle("is-hover", !view && !!hover);
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
  gsap.set(heroSplit.chars, { yPercent: 115 });
  gsap.set([".hero-kicker", ".hero-sub", ".hero-cta", ".hero-scroll"], { autoAlpha: 0, y: 24 });
  gsap.set(".site-header", { autoAlpha: 0 }); // opacity only: a transform would trap the fixed mobile menu

  const intro = gsap.timeline({ paused: true, defaults: { ease: "expo.out" } })
    .to(heroSplit.chars, { yPercent: 0, duration: 1.4, stagger: 0.025 })
    .to(".hero-kicker", { autoAlpha: 1, y: 0, duration: 1 }, 0.3)
    .to([".hero-sub", ".hero-cta"], { autoAlpha: 1, y: 0, duration: 1, stagger: 0.1 }, 0.6)
    .to(".hero-scroll", { autoAlpha: 1, y: 0, duration: 1 }, 0.8)
    .to(".site-header", { autoAlpha: 1, duration: 1 }, 0.8)
    .from(".ht-tag", { scale: 0, rotate: -90, duration: 1, ease: "back.out(2)" }, 0.9);

  // Hero lines drift apart and fade as you scroll away
  gsap.timeline({ scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } })
    .to(".ht-1", { xPercent: -12 }, 0)
    .to(".ht-2", { xPercent: 10 }, 0)
    .to(".ht-3", { xPercent: -6 }, 0)
    .to(".hero-inner", { autoAlpha: 0.15, y: 80 }, 0);

  // --- Preloader → intro
  const counter = { v: 0 };
  gsap.timeline({ onComplete: () => { lenis.start(); $(".preloader").remove(); } })
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
    gsap.from(s.lines, { yPercent: 105, duration: 1.2, ease: "expo.out", stagger: 0.08, scrollTrigger: { trigger: h, start: "top 85%" } });
  });
  $$(".label").forEach((l) => gsap.from(l, { autoAlpha: 0, x: -20, duration: 0.8, scrollTrigger: { trigger: l, start: "top 90%" } }));

  // --- About: words light up as you scroll through them
  $$("[data-reveal-words]").forEach((el) => {
    const s = SplitText.create(el, { type: "words" });
    gsap.fromTo(s.words, { opacity: 0.12 }, { opacity: 1, stagger: 0.1, ease: "none", scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: true } });
  });

  // --- Counters
  $$("[data-count]").forEach((el) => {
    const n = { v: 0 }, target = +el.dataset.count, suffix = el.dataset.suffix || "";
    el.textContent = `0${suffix}`;
    gsap.to(n, { v: target, duration: 2, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 90%" },
      onUpdate: () => (el.textContent = Math.round(n.v) + suffix) });
  });

  // --- Services: each card shrinks and dims as the next one stacks on top
  const cards = $$(".stack-card");
  cards.forEach((card, i) => {
    const next = cards[i + 1];
    if (!next) return;
    gsap.to(card, { scale: 0.9 + i * 0.03, filter: "brightness(.5)", ease: "none",
      scrollTrigger: { trigger: next, start: "top 70%", end: "top 15%", scrub: true } });
  });
  cards.forEach((c) => gsap.from($$("h3, .sc-body > *", c), { y: 50, autoAlpha: 0, duration: 1, ease: "expo.out", stagger: 0.08, scrollTrigger: { trigger: c, start: "top 75%" } }));

  // --- Responsive pieces
  const mm = gsap.matchMedia();

  mm.add("(min-width: 900px)", () => {
    // Work: pin and scroll horizontally
    const track = $("#work-track");
    const dist = () => track.scrollWidth - window.innerWidth;
    const horiz = gsap.to(track, { x: () => -dist(), ease: "none",
      scrollTrigger: { trigger: ".work", pin: ".work-pin", start: "top top", end: () => `+=${dist()}`, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 } });

    // Parallax inside each project image, tied to the horizontal movement
    $$(".project").forEach((p) => {
      gsap.fromTo($(".project-inner", p), { xPercent: -6, scale: 1.12 }, { xPercent: 6, scale: 1.12, ease: "none",
        scrollTrigger: { trigger: p, containerAnimation: horiz, start: "left right", end: "right left", scrub: true } });
      gsap.from($(".project-meta", p), { y: 40, autoAlpha: 0, duration: 1, ease: "expo.out",
        scrollTrigger: { trigger: p, containerAnimation: horiz, start: "left 80%" } });
    });

    // Code: pin the editor and switch files as you scroll
    const st = ScrollTrigger.create({
      trigger: ".code", start: "top top", end: "+=180%", pin: ".code-pin", scrub: true,
      onUpdate: (self) => {
        const i = Math.min(2, Math.floor(self.progress * 3));
        if (i !== +($(".tab.is-active")?.dataset.tab)) { showPane(i); revealPane(i); }
      },
    });
    onTab = (i) => lenis.scrollTo(st.start + ((st.end - st.start) * (i + 0.5)) / 3, { duration: 1.2 });
    return () => { onTab = showPane; };
  });

  mm.add("(max-width: 899px)", () => {
    $$(".project").forEach((p) => gsap.from(p, { y: 60, autoAlpha: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: p, start: "top 85%" } }));
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
    gsap.from(step.children, { y: 40, autoAlpha: 0, duration: 1, stagger: 0.08, ease: "expo.out", scrollTrigger: { trigger: step, start: "top 75%" } });
    gsap.fromTo($(".tl-dot", step), { backgroundColor: "#0a0a0b", scale: 1 }, { backgroundColor: "#d4ff3f", scale: 1.3, ease: "none",
      scrollTrigger: { trigger: step, start: "top 62%", end: "top 58%", scrub: true } });
  });

  // --- Toolbox tiles
  gsap.from(".tools li", { autoAlpha: 0, y: 30, duration: 0.8, ease: "expo.out", stagger: { each: 0.04, grid: "auto", from: "start" }, scrollTrigger: { trigger: ".tools", start: "top 80%" } });

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

  window.addEventListener("load", () => ScrollTrigger.refresh());
}

/* ========================================================================== */
function boot() {
  $("#year").textContent = new Date().getFullYear();
  renderProjects();
  setupForm();
  setupToolGlow();

  const canAnimate = root.classList.contains("has-motion") && window.gsap && window.ScrollTrigger && window.SplitText && window.Lenis;
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
