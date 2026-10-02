/* ==========================================================================
   PROJECTS — edit this list to add, remove or update portfolio items.
   - platform: "wordpress" | "shopify" | "wix"   (drives the filter + badge)
   - image:    optional path to a screenshot, e.g. "images/tarmalsteel.jpg".
               Leave it empty to show a coloured placeholder instead.
   - colors:   two gradient colours for the placeholder.
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
    colors: ["#334155", "#64748b"],
  },
  {
    title: "Bazayan",
    url: "https://bazayan.ch",
    platform: "wordpress",
    region: "Switzerland",
    description: "Business website for a Swiss client, with a responsive custom layout and multilingual-ready content.",
    stack: ["Custom theme", "Responsive", "Multilingual"],
    image: "",
    colors: ["#b91c1c", "#f43f5e"],
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
    colors: ["#166534", "#4ade80"],
  },
  {
    title: "Your Wix Website",
    url: "https://example.com",
    platform: "wix",
    region: "Small business",
    description: "Wix Studio website with dynamic pages, a booking system and custom Velo code.",
    stack: ["Wix Studio", "Velo", "Bookings"],
    image: "",
    colors: ["#1d4ed8", "#38bdf8"],
  },
  {
    title: "Your WooCommerce Store",
    url: "https://example.com",
    platform: "wordpress",
    region: "Online shop",
    description: "WooCommerce store with custom product templates, payment gateway setup and speed tuning.",
    stack: ["WooCommerce", "PHP", "Speed optimisation"],
    image: "",
    colors: ["#6d28d9", "#a78bfa"],
  },
  {
    title: "Your Shopify Brand",
    url: "https://example.com",
    platform: "shopify",
    region: "Fashion / DTC",
    description: "Brand store build with custom landing sections, upsell apps and a mobile-first design.",
    stack: ["Liquid", "Apps", "CRO"],
    image: "",
    colors: ["#c2410c", "#fb923c"],
  },
];

const PLATFORM_LABEL = { wordpress: "WordPress", shopify: "Shopify", wix: "Wix" };

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const domainOf = (url) => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; } };

function renderProjects() {
  const grid = document.getElementById("projects-grid");
  grid.innerHTML = PROJECTS.map((p) => {
    const domain = domainOf(p.url);
    const [c1, c2] = p.colors || ["#4f46e5", "#06b6d4"];
    const preview = p.image
      ? `<img src="${esc(p.image)}" alt="Screenshot of ${esc(p.title)}" loading="lazy">`
      : `<div class="preview-art" style="background:linear-gradient(135deg, ${esc(c1)}, ${esc(c2)})"><div><strong>${esc(p.title)}</strong><em>${esc(domain)}</em></div></div>`;
    return `
      <article class="project reveal" data-platform="${esc(p.platform)}">
        <a class="project-preview" href="${esc(p.url)}" target="_blank" rel="noopener" aria-label="Visit ${esc(p.title)} (opens in new tab)">
          <div class="browser-bar"><i></i><i></i><i></i><span>${esc(domain)}</span></div>
          ${preview}
          <span class="visit-pill">Visit site ↗</span>
        </a>
        <div class="project-body">
          <div class="project-meta">
            <span class="tag ${esc(p.platform)}">${esc(PLATFORM_LABEL[p.platform] || p.platform)}</span>
            <span class="project-region">${esc(p.region || "")}</span>
          </div>
          <h3>${esc(p.title)}</h3>
          <p>${esc(p.description)}</p>
          <ul class="project-stack">${(p.stack || []).map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
          <a class="project-link" href="${esc(p.url)}" target="_blank" rel="noopener">${esc(domain)} ↗</a>
        </div>
      </article>`;
  }).join("");
}

function setupFilters() {
  const buttons = document.querySelectorAll(".filter");
  buttons.forEach((btn) => btn.addEventListener("click", () => {
    buttons.forEach((b) => { b.classList.toggle("is-active", b === btn); b.setAttribute("aria-selected", b === btn); });
    const f = btn.dataset.filter;
    document.querySelectorAll(".project").forEach((card) => {
      card.classList.toggle("is-hidden", f !== "all" && card.dataset.platform !== f);
    });
  }));
}

function setupTheme() {
  const root = document.documentElement;
  try { const saved = localStorage.getItem("theme"); if (saved) root.dataset.theme = saved; } catch {}
  document.querySelector(".theme-toggle").addEventListener("click", () => {
    const isDark = root.dataset.theme
      ? root.dataset.theme === "dark"
      : matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = isDark ? "light" : "dark";
    try { localStorage.setItem("theme", root.dataset.theme); } catch {}
  });
}

function setupNav() {
  const toggle = document.querySelector(".nav-toggle");
  const links = document.getElementById("nav-links");
  toggle.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open);
  });
  links.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => {
    links.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  }));
  const header = document.querySelector(".site-header");
  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 10);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

function setupReveal() {
  document.querySelectorAll(".service-card, .process li, .skill-group, .stat, .section-head").forEach((el) => el.classList.add("reveal"));
  const els = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) { els.forEach((el) => el.classList.add("in")); return; }
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }), { threshold: 0.12 });
  els.forEach((el) => io.observe(el));
}

function setupCounters() {
  const nums = document.querySelectorAll("[data-count]");
  const run = (el) => {
    const target = +el.dataset.count, start = performance.now(), dur = 1200;
    const tick = (t) => {
      const k = Math.min((t - start) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - k, 3))) + (el.dataset.suffix || "");
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if (!("IntersectionObserver" in window)) { nums.forEach((n) => (n.textContent = n.dataset.count + (n.dataset.suffix || ""))); return; }
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) { run(e.target); io.unobserve(e.target); }
  }), { threshold: 0.5 });
  nums.forEach((n) => io.observe(n));
}

/* Contact form: opens the visitor's email app with the message pre-filled.
   Swap for Formspree / Netlify Forms / your backend if you prefer. */
const CONTACT_EMAIL = "hello@example.com";
function setupForm() {
  const form = document.getElementById("contact-form");
  const note = document.getElementById("form-note");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.checkValidity()) { note.textContent = "Please fill in your name, a valid email and project details."; form.reportValidity(); return; }
    const d = new FormData(form);
    const subject = `New ${d.get("platform")} project enquiry from ${d.get("name")}`;
    const body = `Name: ${d.get("name")}\nEmail: ${d.get("email")}\nPlatform: ${d.get("platform")}\n\n${d.get("message")}`;
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    note.textContent = "Opening your email app… Thanks for reaching out!";
  });
}

document.getElementById("year").textContent = new Date().getFullYear();
renderProjects();
setupFilters();
setupTheme();
setupNav();
setupReveal();
setupCounters();
setupForm();
