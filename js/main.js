(() => {
  const TELEGRAM_URL = "";

  // Newest first. accent/soft/glow tint the whole site while the track is active.
  const TRACKS = [
    {
      slug: "ne-trogaj-moe-korolevstvo",
      title: "не трогай моё королевство",
      year: 2026,
      genre: "hip-hop",
      dur: "2:05",
      url: "https://soundcloud.com/irineimeow/ne-trogaj-moe-korolevstvo",
      accent: "#c42ab6",
      soft: "#ff7ae8",
      glow: "#6e0f66",
    },
    {
      slug: "ryczar-vampir",
      title: "рыцарь вампир",
      year: 2026,
      genre: "hip-hop",
      dur: "2:19",
      url: "https://soundcloud.com/irineimeow/ryczar-vampir",
      accent: "#b0467c",
      soft: "#f292c2",
      glow: "#652346",
    },
    {
      slug: "krov-v-gorlo",
      title: "кровь в горло",
      year: 2026,
      genre: "сингл",
      dur: "2:24",
      url: "https://band.link/krov_v_gorlo",
      linkText: "слушать на всех площадках ↗",
      accent: "#c8243f",
      soft: "#ff5a74",
      glow: "#8c1024",
    },
    {
      slug: "karie-glaza",
      title: "карие глаза",
      year: 2025,
      genre: "hip-hop",
      dur: "1:15",
      cover: "png",
      url: "https://soundcloud.com/irineimeow/karie-glaza",
      accent: "#9a6234",
      soft: "#e2a878",
      glow: "#5a3014",
    },
    {
      slug: "immortal-king",
      title: "immortal king",
      tag: "интро · prod. sher33",
      year: 2025,
      genre: "trap",
      dur: "1:20",
      url: "https://soundcloud.com/irineimeow/intro-immortal-king-prod",
      accent: "#6c7586",
      soft: "#c4cbd8",
      glow: "#343b4a",
    },
  ];
  TRACKS.forEach((t) => {
    t.src = `music/${t.slug}.mp3`;
    t.coverSrc = `music/covers/${t.slug}.${t.cover || "jpg"}`;
    t.thumbSrc = `music/covers/sm/${t.slug}.jpg`;
  });

  const body = document.body;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer =
    window.matchMedia("(pointer: fine)").matches && window.matchMedia("(hover: hover)").matches;
  const mobileMq = window.matchMedia("(max-width: 760px)");
  const hasGsap = !!window.gsap;
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  if (hasGsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
  }

  /* ---------- theme (per-track accent) ---------- */

  const hexRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const rgbStr = (c) => c.map(Math.round).join(", ");
  // Canvas-side colors; CSS vars transition on their own via @property.
  const theme = { accent: hexRgb("#c8243f"), soft: hexRgb("#ff5a74"), glow: hexRgb("#8c1024"), dot: [255, 70, 100], rev: 0 };
  let themeSlug = "";
  let themeTween = null;

  function setTheme(track) {
    if (track.slug === themeSlug) return;
    themeSlug = track.slug;
    const root = document.documentElement.style;
    root.setProperty("--accent", track.accent);
    root.setProperty("--accent-soft", track.soft);
    const keys = ["accent", "soft", "glow", "dot"];
    const from = keys.map((k) => theme[k].slice());
    const to = [hexRgb(track.accent), hexRgb(track.soft), hexRgb(track.glow), hexRgb(track.soft)];
    const apply = (p) => {
      keys.forEach((k, j) => {
        theme[k] = from[j].map((c, i) => c + (to[j][i] - c) * p);
      });
      theme.rev++;
    };
    themeTween?.kill();
    if (!hasGsap || reduceMotion) return apply(1);
    const s = { p: 0 };
    themeTween = gsap.to(s, { p: 1, duration: 1.4, ease: "sine.inOut", onUpdate: () => apply(s.p) });
  }

  /* ---------- smooth scroll ---------- */

  let lenis = null;
  if (!reduceMotion && window.Lenis && hasGsap) {
    lenis = new Lenis({ duration: 1.2, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const id = link.getAttribute("href");
      if (id === "#") return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { duration: 1.6 });
      else target.scrollIntoView({ behavior: "smooth" });
    });
  });

  const tgLink = document.getElementById("tgLink");
  if (TELEGRAM_URL && tgLink) {
    tgLink.href = TELEGRAM_URL;
    tgLink.hidden = false;
  }

  /* ---------- header ---------- */

  const header = document.querySelector(".header");
  let lastY = 0;
  window.addEventListener(
    "scroll",
    () => {
      const y = window.scrollY;
      header.classList.toggle("is-scrolled", y > 40);
      header.classList.toggle("is-hidden", y > window.innerHeight && y > lastY + 2);
      if (y < lastY - 2) header.classList.remove("is-hidden");
      lastY = y;
    },
    { passive: true }
  );

  /* ---------- dust particles ---------- */

  const dust = document.getElementById("dust");
  if (dust && !reduceMotion) {
    const ctx = dust.getContext("2d");
    let w = 0;
    let h = 0;
    let dpr = 1;
    const count = window.innerWidth < 760 ? 38 : 90;
    const parts = [];

    // Mirrors .bg__glow--1/--2 (size, position, glow-drift keyframes) so the glows
    // share the dust canvas' 30fps redraw instead of repainting the page at 60fps.
    const glows = [
      {
        size: (vw) => 56 * vw,
        left: (vw) => -17 * vw,
        top: (vw, vh) => 30 * vh - 5 * vw,
        dur: 22000,
        reverse: false,
        rgb: "140, 16, 36",
        stops: [[0, 0.5], [0.3, 0.36], [0.6, 0.14], [0.85, 0.03], [1, 0]],
      },
      {
        size: (vw) => 48 * vw,
        left: (vw, W) => W + 15 * vw - 48 * vw,
        top: (vw, vh) => -6 * vh - 5 * vw,
        dur: 28000,
        reverse: true,
        rgb: "110, 70, 140",
        stops: [[0, 0.26], [0.3, 0.18], [0.6, 0.07], [0.85, 0.015], [1, 0]],
      },
    ];
    const paintGlow = (g) => {
      const S = 768;
      if (!g.img) {
        g.img = document.createElement("canvas");
        g.img.width = g.img.height = S;
      }
      const gctx = g.img.getContext("2d");
      gctx.clearRect(0, 0, S, S);
      const grad = gctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
      g.stops.forEach(([o, a]) => grad.addColorStop(o, `rgba(${g.rgb}, ${a})`));
      gctx.fillStyle = grad;
      gctx.fillRect(0, 0, S, S);
    };
    glows.forEach(paintGlow);
    let themeRev = theme.rev;
    let dotRgb = rgbStr(theme.dot);
    const syncTheme = () => {
      if (themeRev === theme.rev) return;
      themeRev = theme.rev;
      glows[0].rgb = rgbStr(theme.glow);
      paintGlow(glows[0]);
      dotRgb = rgbStr(theme.dot);
    };
    document.documentElement.classList.add("glow-canvas");

    const bx = (t) => 3 * 0.42 * t * (1 - t) * (1 - t) + 3 * 0.58 * t * t * (1 - t) + t * t * t;
    const by = (t) => 3 * t * t * (1 - t) + t * t * t;
    const easeInOut = (x) => {
      let lo = 0;
      let hi = 1;
      let t = x;
      for (let i = 0; i < 18; i++) {
        t = (lo + hi) / 2;
        if (bx(t) < x) lo = t;
        else hi = t;
      }
      return by(t);
    };

    const drawGlows = (t) => {
      const vw = window.innerWidth / 100;
      const vh = window.innerHeight / 100;
      ctx.globalAlpha = 0.55;
      for (const g of glows) {
        const cycle = t / g.dur;
        let p = cycle % 1;
        const odd = Math.floor(cycle) % 2 === 1;
        if (odd !== g.reverse) p = 1 - p;
        const e = easeInOut(p);
        const s = g.size(vw);
        const r = (s / 2) * (1 + 0.15 * e);
        const cx = g.left(vw, w) + s / 2 + 8 * vw * e;
        const cy = g.top(vw, vh) + s / 2 - 10 * vh * e;
        ctx.drawImage(g.img, cx - r, cy - r, r * 2, r * 2);
      }
      ctx.globalAlpha = 1;
    };

    const spawn = (p, fromBottom) => {
      p.x = Math.random() * w;
      p.y = fromBottom ? h + 10 : Math.random() * h;
      p.r = Math.random() * 1.5 + 0.35;
      p.vy = -(Math.random() * 0.28 + 0.05);
      p.a = Math.random() * 0.5 + 0.1;
      p.ph = Math.random() * Math.PI * 2;
      p.red = Math.random() < 0.3;
      return p;
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 760 ? 1 : 1.5);
      w = dust.clientWidth || window.innerWidth;
      h = dust.clientHeight || window.innerHeight;
      dust.width = w * dpr;
      dust.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const FRAME_MS = 1000 / (window.innerWidth < 760 ? 24 : 30);
    let lastDraw = 0;

    const render = (t, steps) => {
      syncTheme();
      ctx.clearRect(0, 0, w, h);
      drawGlows(t);
      for (const p of parts) {
        p.y += p.vy * steps;
        p.x += Math.sin(t * 0.0004 + p.ph) * 0.18 * steps;
        if (p.y < -10) spawn(p, true);
        const alpha = p.a * (0.55 + 0.45 * Math.sin(t * 0.0018 + p.ph));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.red ? `rgba(${dotRgb}, ${alpha})` : `rgba(255, 240, 244, ${alpha * 0.8})`;
        ctx.fill();
      }
    };

    const onResize = () => {
      resize();
      if (lastDraw) render(performance.now(), 0);
    };

    resize();
    for (let i = 0; i < count; i++) parts.push(spawn({}, false));
    if ("ResizeObserver" in window) new ResizeObserver(onResize).observe(dust);
    else window.addEventListener("resize", onResize);

    const tick = (t) => {
      requestAnimationFrame(tick);
      if (document.hidden || body.classList.contains("is-loading") || t - lastDraw < FRAME_MS - 2) return;
      const steps = lastDraw ? Math.min(4, (t - lastDraw) / (1000 / 60)) : 1;
      lastDraw = t;
      render(t, steps);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- cursor ---------- */

  const dot = document.querySelector(".cursor__dot");
  const ring = document.querySelector(".cursor__ring");
  const label = document.querySelector(".cursor__label");
  if (finePointer && !reduceMotion && dot && ring) {
    body.classList.add("has-cursor");
    let x = innerWidth / 2;
    let y = innerHeight / 2;
    let rx = x;
    let ry = y;
    let followRaf = 0;
    const follow = () => {
      rx += (x - rx) * 0.15;
      ry += (y - ry) * 0.15;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      followRaf = Math.abs(x - rx) + Math.abs(y - ry) > 0.1 ? requestAnimationFrame(follow) : 0;
    };
    window.addEventListener(
      "pointermove",
      (e) => {
        x = e.clientX;
        y = e.clientY;
        if (!body.classList.contains("cursor-ready")) {
          rx = x;
          ry = y;
          body.classList.add("cursor-ready");
        }
        dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        if (!followRaf) followRaf = requestAnimationFrame(follow);
      },
      { passive: true }
    );

    document.addEventListener("pointerover", (e) => {
      const view = e.target.closest("[data-cursor]");
      const link = e.target.closest("a, button, .progress");
      body.classList.toggle("is-viewing", !!view);
      body.classList.toggle("is-hovering", !view && !!link);
      if (view) label.textContent = view.dataset.cursor;
    });
    document.documentElement.addEventListener("mouseleave", () => {
      body.classList.remove("is-viewing", "is-hovering");
    });

    document.querySelectorAll("[data-magnetic]").forEach((el) => {
      el.style.transition = "transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)";
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate3d(${dx * 0.25}px, ${dy * 0.3}px, 0)`;
      });
      el.addEventListener("pointerleave", () => {
        el.style.transform = "";
      });
    });
  }

  /* ---------- reveal on scroll ---------- */

  const revealEls = document.querySelectorAll("[data-reveal]");
  if (!reduceMotion && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-revealed");
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-revealed"));
  }

  if ("IntersectionObserver" in window) {
    const pauseIo = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.target.classList.toggle("is-offscreen", !entry.isIntersecting));
    });
    document.querySelectorAll(".hero, .marquee").forEach((el) => pauseIo.observe(el));

    // Decode photos ahead of time so they don't stall frames when they scroll into view.
    const decodeIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          decodeIo.unobserve(entry.target);
          entry.target.querySelectorAll("img").forEach((img) => {
            img.loading = "eager";
            img.decode?.().catch(() => {});
          });
        });
      },
      { rootMargin: "150% 0px" }
    );
    document.querySelectorAll(".music, .frames, .mirrors, .places, .memes, .finale").forEach((el) => decodeIo.observe(el));
  }

  /* ---------- hero ---------- */

  const hero = document.querySelector(".hero");
  const heroCenter = document.querySelector(".hero__center");
  const chars = document.querySelectorAll(".hero__title .char");
  const floats = [...document.querySelectorAll(".float")];
  const heroBits = document.querySelectorAll(".hero__eyebrow, .hero__phrase, .hero__actions, .scroll-hint");

  const animate = hasGsap && !reduceMotion;

  if (animate) {
    // Title chars animate via CSS (compositor thread) so main-thread work during the intro can't stutter them.
    chars.forEach((c, i) => c.style.setProperty("--i", i));
    body.classList.add("hero-anim");
    chars[chars.length - 1]?.addEventListener("animationend", () => body.classList.add("hero-done"), { once: true });
    gsap.set(floats, { opacity: 0, scale: 0.6 });
    gsap.set(heroBits, { opacity: 0, y: 24 });
  }

  const introTl = animate
    ? gsap
        .timeline({ paused: true, defaults: { ease: "expo.out" } })
        .to(floats, { opacity: 1, scale: 1, duration: 1.6, stagger: 0.09 }, 0.25)
        .to(heroBits, { opacity: 1, y: 0, duration: 1.2, stagger: 0.1 }, 0.6)
    : null;

  function heroIntro() {
    body.classList.add("hero-in");
    introTl?.play();
  }

  if (animate) {
    gsap.to(heroCenter, {
      yPercent: 22,
      opacity: 0,
      scale: 0.92,
      ease: "none",
      scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true },
    });

    floats.forEach((f) => {
      const depth = parseFloat(f.dataset.depth) || 1;
      const dir = f.offsetLeft + f.offsetWidth / 2 < window.innerWidth / 2 ? -1 : 1;
      gsap.to(f, {
        y: -depth * 420,
        x: dir * depth * 180,
        rotation: dir * depth * 14,
        ease: "none",
        scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true },
      });
    });

    if (finePointer) {
      const movers = floats.map((f) => {
        const inner = f.querySelector(".float__inner");
        const depth = parseFloat(f.dataset.depth) || 1;
        return {
          depth,
          x: gsap.quickTo(inner, "x", { duration: 1.1, ease: "power3.out" }),
          y: gsap.quickTo(inner, "y", { duration: 1.1, ease: "power3.out" }),
        };
      });
      const titleX = gsap.quickTo(".hero__title", "x", { duration: 1.4, ease: "power3.out" });
      window.addEventListener(
        "pointermove",
        (e) => {
          if (window.scrollY > window.innerHeight) return;
          const nx = e.clientX / window.innerWidth - 0.5;
          const ny = e.clientY / window.innerHeight - 0.5;
          movers.forEach((m) => {
            m.x(nx * m.depth * 70);
            m.y(ny * m.depth * 50);
          });
          titleX(nx * -18);
        },
        { passive: true }
      );
    }
  }

  const phraseEl = document.getElementById("phrase");
  const phrases = [
    "без музыки нет жизни",
    "мяу-мяу-мяу, хорошо?",
    "не трогай моё королевство",
    "рыцарь вампир ♡",
    "подписчики, признайтесь…",
    "me and my followers",
    "тьмок ♡",
  ];

  async function phraseLoop() {
    if (!phraseEl || reduceMotion) return;
    let i = 0;
    for (;;) {
      await wait(2800);
      let text = phraseEl.textContent;
      while (text.length) {
        text = text.slice(0, -1);
        phraseEl.textContent = text;
        await wait(22);
      }
      i = (i + 1) % phrases.length;
      await wait(250);
      for (const ch of phrases[i]) {
        phraseEl.textContent += ch;
        await wait(48 + Math.random() * 40);
      }
    }
  }

  /* ---------- loader ---------- */

  const loader = document.getElementById("loader");
  let introUntil = 0;
  let refreshQueued = false;

  // A ScrollTrigger refresh re-measures every pin (long task on phones): run it behind the loader,
  // or after the intro once the main thread is idle — never while the intro is animating.
  function safeRefresh() {
    if (!window.ScrollTrigger) return;
    if (body.classList.contains("is-loading")) {
      ScrollTrigger.refresh();
      return;
    }
    if (refreshQueued) return;
    refreshQueued = true;
    const idle = window.requestIdleCallback
      ? (fn) => requestIdleCallback(fn, { timeout: 2000 })
      : (fn) => setTimeout(fn, 200);
    setTimeout(
      () =>
        idle(() => {
          refreshQueued = false;
          ScrollTrigger.refresh();
        }),
      Math.max(0, introUntil - performance.now())
    );
  }

  function finishLoader() {
    body.classList.remove("is-loading");
    lenis?.start();
    if (!animate || !loader) {
      loader?.remove();
      heroIntro();
      return;
    }
    requestAnimationFrame(() => requestAnimationFrame(startExit));
  }

  function startExit() {
    const done = () => loader.isConnected && loader.remove();
    loader.addEventListener("transitionend", (e) => e.target === loader && done());
    setTimeout(done, 1600);
    loader.classList.add("is-leaving");
    introUntil = performance.now() + 3300;
    setTimeout(heroIntro, 550);
    setTimeout(phraseLoop, 1600);
  }

  // Only the first screen gates the loader; lower sections load lazily later.
  const heroReady = Promise.all(
    [...document.querySelectorAll(".hero img")].map((img) => (img.decode ? img.decode().catch(() => {}) : null))
  );
  const fontsReady = window.__fontsReady || Promise.resolve();
  fontsReady.then(safeRefresh);
  document.fonts?.ready.then(safeRefresh);
  window.addEventListener("load", safeRefresh);
  const minShow = fontsReady.then(() => wait(reduceMotion ? 0 : 1700));
  Promise.race([Promise.all([heroReady, minShow]), wait(4500)]).then(finishLoader);

  /* ---------- about: words light up ---------- */

  const aboutText = document.getElementById("aboutText");
  if (aboutText && animate) {
    const split = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              frag.appendChild(document.createTextNode(" "));
              return;
            }
            const span = document.createElement("span");
            span.className = "w";
            span.textContent = part;
            frag.appendChild(span);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE && !child.classList.contains("pill")) {
          split(child);
        }
      });
    };
    split(aboutText);

    const items = aboutText.querySelectorAll(".w, .pill");
    const tl = gsap.timeline({
      scrollTrigger: { trigger: aboutText, start: "top 78%", end: "bottom 42%", scrub: 0.6 },
    });
    items.forEach((item, i) => {
      const isPill = item.classList.contains("pill");
      tl.fromTo(
        item,
        isPill ? { opacity: 0.1, scale: 0.2, rotation: -24 } : { opacity: 0.12 },
        isPill
          ? { opacity: 1, scale: 1, rotation: 0, duration: 1.4, ease: "back.out(2)" }
          : { opacity: 1, duration: 1, ease: "none" },
        i * 0.32
      );
    });
  }

  /* ---------- music player ---------- */

  const audio = document.getElementById("audio");
  const playBtn = document.getElementById("playBtn");
  const miniPlayer = document.getElementById("miniPlayer");
  const note = document.getElementById("playerNote");
  const progress = document.getElementById("progress");
  const progressFill = document.getElementById("progressFill");
  const tCur = document.getElementById("tCur");
  const tDur = document.getElementById("tDur");
  const vinyl = document.getElementById("vinyl");
  const vinylDisc = document.getElementById("vinylDisc");
  const viz = document.getElementById("viz");
  const playerEl = document.querySelector(".player");
  const sleeveImg = document.getElementById("sleeveImg");
  const labelImg = document.getElementById("labelImg");
  const playerTag = document.getElementById("playerTag");
  const playerTitle = document.getElementById("playerTitle");
  const playerLink = document.getElementById("playerLink");
  const miniLabel = document.getElementById("miniLabel");
  const tracksEl = document.getElementById("tracks");

  let current = 0;
  let audioOK = true;
  let audioCtx = null;
  let analyser = null;
  let freq = null;

  const fmt = (s) => {
    if (!isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  const showNote = (text) => {
    if (note) note.textContent = text;
  };

  audio.addEventListener("error", () => {
    // Switching tracks aborts the previous load — that must not brick the player.
    if (audio.error?.code === MediaError.MEDIA_ERR_ABORTED) return;
    audioOK = false;
  });
  audio.addEventListener("loadedmetadata", () => {
    tDur.textContent = fmt(audio.duration);
  });
  audio.addEventListener("canplay", () => {
    audioOK = true;
  });
  // Nothing audio-related is fetched during the intro; metadata (for seeking before play) comes later.
  setTimeout(() => {
    if (audio.preload === "none") audio.preload = "metadata";
  }, 6000);

  function ensureAnalyser() {
    if (!location.protocol.startsWith("http")) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (!audioCtx) {
      try {
        audioCtx = new Ctx();
        const src = audioCtx.createMediaElementSource(audio);
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        src.connect(analyser);
        analyser.connect(audioCtx.destination);
        freq = new Uint8Array(analyser.frequencyBinCount);
      } catch (e) {
        analyser = null;
      }
    }
    if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
  }

  const spin =
    hasGsap && vinylDisc
      ? gsap.to(vinylDisc, { rotation: 360, duration: 3.6, ease: "none", repeat: -1, paused: true })
      : null;
  spin?.timeScale(0);

  const spinUp = () => {
    if (!spin) return;
    spin.play();
    gsap.to(spin, { timeScale: 1, duration: 1.4, ease: "power2.out", overwrite: true });
  };
  const spinDown = () => {
    if (!spin) return;
    gsap.to(spin, {
      timeScale: 0,
      duration: 1.8,
      ease: "power2.out",
      overwrite: true,
      onComplete: () => spin.pause(),
    });
  };

  const trackMissing = () => {
    showNote("не получилось включить трек здесь — открываю его на площадке ↗");
  };

  async function play() {
    ensureAnalyser();
    try {
      await audio.play();
    } catch (e) {
      if (e?.name === "NotAllowedError") return;
      if (audio.error?.code !== MediaError.MEDIA_ERR_ABORTED) {
        audioOK = false;
        trackMissing();
      }
    }
  }

  async function togglePlay() {
    if (!audioOK) {
      trackMissing();
      window.open(TRACKS[current].url, "_blank", "noopener");
      return;
    }
    if (audio.paused) await play();
    else audio.pause();
  }

  const pad2 = (n) => String(n).padStart(2, "0");
  const tagText = (_, i) => `трек ${pad2(i + 1)} / ${pad2(TRACKS.length)}`;

  const trackBtns = TRACKS.map((t, i) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "track";
    btn.style.setProperty("--c", t.accent);
    btn.style.setProperty("--cs", t.soft);
    btn.setAttribute("aria-label", `Включить «${t.title}»`);
    btn.innerHTML = `
      <span class="track__n">${pad2(i + 1)}</span>
      <img class="track__cover" src="${t.thumbSrc}" alt="" width="160" height="160" loading="lazy" decoding="async" />
      <span class="track__info">
        <span class="track__title">${t.title}</span>
      </span>
      <span class="eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
      <span class="track__dur">${t.dur}</span>`;
    btn.addEventListener("click", () => (i === current ? togglePlay() : selectTrack(i, true)));
    li.appendChild(btn);
    tracksEl?.appendChild(li);
    return btn;
  });

  let switchId = 0;
  function selectTrack(i, autoplay) {
    const t = TRACKS[i];
    current = i;
    trackBtns.forEach((b, j) => {
      b.classList.toggle("is-active", j === i);
      if (j === i) b.setAttribute("aria-current", "true");
      else b.removeAttribute("aria-current");
    });
    miniLabel.textContent = t.title;
    setTheme(t);

    audioOK = true;
    showNote("");
    if (!audio.paused) audio.pause();
    audio.src = t.src;
    audio.load();
    tCur.textContent = "0:00";
    tDur.textContent = t.dur;
    progressFill.style.transform = "scaleX(0)";
    progress.setAttribute("aria-valuenow", "0");
    if (autoplay) play();

    const id = ++switchId;
    playerEl?.classList.add("is-switching");
    const img = new Image();
    img.src = t.coverSrc;
    const ready = Promise.race([img.decode().catch(() => {}), wait(900)]);
    Promise.all([ready, wait(350)]).then(() => {
      if (id !== switchId) return;
      sleeveImg.src = labelImg.src = t.coverSrc;
      sleeveImg.alt = `Обложка трека «${t.title}»`;
      playerTag.textContent = tagText(t, i);
      playerTitle.textContent = t.title;
      playerLink.href = t.url;
      playerLink.textContent = t.linkText || "слушать на soundcloud ↗";
      playerEl?.classList.remove("is-switching");
    });
  }

  trackBtns[current]?.classList.add("is-active");

  playBtn.addEventListener("click", togglePlay);
  miniPlayer.addEventListener("click", togglePlay);

  audio.addEventListener("play", () => {
    body.classList.add("is-playing");
    miniPlayer.classList.add("is-visible");
    playBtn.setAttribute("aria-label", "Пауза");
    showNote("");
    setTheme(TRACKS[current]);
    spinUp();
  });
  audio.addEventListener("pause", () => {
    body.classList.remove("is-playing");
    playBtn.setAttribute("aria-label", "Играть");
    spinDown();
  });
  audio.addEventListener("ended", () => {
    selectTrack((current + 1) % TRACKS.length, true);
  });

  const seekTo = (clientX) => {
    if (!audioOK || !isFinite(audio.duration)) return;
    const r = progress.getBoundingClientRect();
    audio.currentTime = clamp((clientX - r.left) / r.width, 0, 1) * audio.duration;
  };
  let seeking = false;
  progress.addEventListener("pointerdown", (e) => {
    seeking = true;
    progress.setPointerCapture(e.pointerId);
    seekTo(e.clientX);
  });
  progress.addEventListener("pointermove", (e) => {
    if (seeking) seekTo(e.clientX);
  });
  progress.addEventListener("pointerup", () => {
    seeking = false;
  });
  progress.addEventListener("keydown", (e) => {
    if (!isFinite(audio.duration)) return;
    if (e.key === "ArrowRight") audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
    if (e.key === "ArrowLeft") audio.currentTime = Math.max(0, audio.currentTime - 5);
  });

  if (animate && vinyl) {
    const mm = gsap.matchMedia();
    mm.add("(min-width: 981px)", () => {
      gsap.fromTo(
        vinyl,
        { xPercent: 0, rotation: -30 },
        {
          xPercent: 32,
          rotation: 0,
          ease: "none",
          scrollTrigger: { trigger: ".player", start: "top 85%", end: "top 30%", scrub: 1 },
        }
      );
    });
    mm.add("(max-width: 980px)", () => {
      gsap.fromTo(
        vinyl,
        { yPercent: 0 },
        {
          yPercent: -22,
          ease: "none",
          scrollTrigger: { trigger: ".player", start: "top 90%", end: "top 40%", scrub: 1 },
        }
      );
    });
  }

  if (viz) {
    const vctx = viz.getContext("2d");
    const BARS = 56;
    const levels = new Array(BARS).fill(0.05);
    let vw = 0;
    let vh = 0;
    let visible = false;

    const resizeViz = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      vw = viz.clientWidth;
      vh = viz.clientHeight;
      viz.width = vw * dpr;
      viz.height = vh * dpr;
      vctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resizeViz();
    window.addEventListener("resize", resizeViz);
    new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
    }).observe(viz);

    const playing = () => !audio.paused;
    let grad = null;
    let gradKey = "";

    const draw = (t) => {
      requestAnimationFrame(draw);

      if (playing() && isFinite(audio.duration)) {
        const p = audio.currentTime / audio.duration;
        progressFill.style.transform = `scaleX(${p})`;
        progress.setAttribute("aria-valuenow", String(Math.round(p * 100)));
        tCur.textContent = fmt(audio.currentTime);
      }

      if (!visible) return;
      if (analyser && playing()) analyser.getByteFrequencyData(freq);

      vctx.clearRect(0, 0, vw, vh);
      const step = vw / BARS;
      const bw = Math.max(2, step * 0.42);
      if (gradKey !== theme.rev + ":" + vh) {
        gradKey = theme.rev + ":" + vh;
        grad = vctx.createLinearGradient(0, 0, 0, vh);
        grad.addColorStop(0, `rgba(${rgbStr(theme.soft)}, 0.9)`);
        grad.addColorStop(0.5, "rgba(243, 236, 238, 0.95)");
        grad.addColorStop(1, `rgba(${rgbStr(theme.accent)}, 0.9)`);
      }
      vctx.fillStyle = grad;

      for (let i = 0; i < BARS; i++) {
        let target;
        if (analyser && playing()) {
          const mirrored = i < BARS / 2 ? BARS / 2 - 1 - i : i - BARS / 2;
          const idx = Math.floor(Math.pow(mirrored / (BARS / 2), 1.4) * (freq.length * 0.7));
          target = 0.06 + (freq[idx] / 255) * 0.94;
        } else if (playing()) {
          target = 0.25 + 0.35 * Math.abs(Math.sin(t * 0.006 + i * 0.5)) * Math.abs(Math.sin(t * 0.0023 + i));
        } else {
          target = 0.07 + 0.05 * Math.sin(t * 0.0021 + i * 0.35) + 0.04 * Math.sin(t * 0.0013 + i * 0.9);
        }
        levels[i] += (target - levels[i]) * 0.18;
        const bh = Math.max(2, levels[i] * vh);
        const x = i * step + (step - bw) / 2;
        const y = (vh - bh) / 2;
        vctx.globalAlpha = 0.35 + levels[i] * 0.65;
        vctx.beginPath();
        if (vctx.roundRect) vctx.roundRect(x, y, bw, bh, bw / 2);
        else vctx.rect(x, y, bw, bh);
        vctx.fill();
      }
      vctx.globalAlpha = 1;
    };
    requestAnimationFrame(draw);
  }

  /* ---------- frames: horizontal scroll ---------- */

  const frames = document.querySelector(".frames");
  const framesTrack = document.getElementById("framesTrack");
  const framesBar = document.getElementById("framesBar");
  if (frames && framesTrack) {
    if (animate) {
      const dist = () => Math.max(0, framesTrack.scrollWidth - window.innerWidth);
      const slide = gsap.to(framesTrack, {
        x: () => -dist(),
        ease: "none",
        scrollTrigger: {
          trigger: frames,
          start: "top top",
          end: () => "+=" + dist(),
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            framesBar.style.transform = `scaleX(${self.progress})`;
          },
        },
      });

      framesTrack.querySelectorAll(".frame").forEach((frame) => {
        const img = frame.querySelector("img");
        gsap.fromTo(
          img,
          { xPercent: -6 },
          {
            xPercent: 6,
            ease: "none",
            scrollTrigger: {
              trigger: frame,
              containerAnimation: slide,
              start: "left right",
              end: "right left",
              scrub: true,
            },
          }
        );
        gsap.from(frame.querySelector(".frame__img"), {
          scale: 0.85,
          opacity: 0.2,
          ease: "none",
          scrollTrigger: {
            trigger: frame,
            containerAnimation: slide,
            start: "left right",
            end: "left 60%",
            scrub: true,
          },
        });
      });
    } else {
      frames.style.overflowX = "auto";
    }
  }

  /* ---------- mirrors: parallax columns ---------- */

  if (animate) {
    document.querySelectorAll(".mcol").forEach((col) => {
      const speed = parseFloat(col.dataset.speed) || 0;
      gsap.fromTo(
        col,
        { y: speed },
        {
          y: -speed,
          ease: "none",
          scrollTrigger: { trigger: ".mirrors__cols", start: "top bottom", end: "bottom top", scrub: true },
        }
      );
    });
  }

  /* ---------- places: wide reveal ---------- */

  const wide = document.getElementById("wideReveal");
  if (wide && animate) {
    const media = wide.querySelector(".wide-reveal__media");
    const img = media.querySelector("img");
    const text = wide.querySelector(".wide-reveal__text");
    gsap
      .timeline({
        scrollTrigger: { trigger: wide, start: "top top", end: "+=130%", pin: true, scrub: 1 },
      })
      .fromTo(
        media,
        { clipPath: "inset(16% 22% 16% 22% round 36px)" },
        { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "none", duration: 1 }
      )
      .fromTo(img, { scale: 1.3 }, { scale: 1, ease: "none", duration: 1 }, 0)
      .fromTo(text, { opacity: 0, y: 70 }, { opacity: 1, y: 0, ease: "power2.out", duration: 0.5 }, 0.55);
  }

  /* ---------- lightbox ---------- */

  const lb = document.getElementById("lightbox");
  const lbImg = document.getElementById("lbImg");
  const lbFigure = lb.querySelector(".lightbox__figure");
  const lbCount = document.getElementById("lbCount");
  // Page shows downscaled copies (images/sm, images/lg); the lightbox opens the originals.
  const fullSrc = (src) => src.replace(/images\/(sm|lg)\//, "images/");
  const lbItems = [
    ...new Set(
      [...document.querySelectorAll("[data-lb] img, .sticker img")].map((img) => fullSrc(img.getAttribute("src")))
    ),
  ];
  let lbIndex = 0;

  function lbShow(i, instant) {
    lbIndex = (i + lbItems.length) % lbItems.length;
    const apply = () => {
      lbImg.src = lbItems[lbIndex];
      lbCount.textContent = `${String(lbIndex + 1).padStart(2, "0")} / ${lbItems.length}`;
    };
    if (instant) {
      apply();
      return;
    }
    lbFigure.classList.add("is-swapping");
    setTimeout(() => {
      apply();
      const done = () => lbFigure.classList.remove("is-swapping");
      if (lbImg.complete) done();
      else lbImg.onload = done;
    }, 220);
  }

  function lbOpen(src) {
    const i = lbItems.indexOf(fullSrc(src));
    lbShow(i < 0 ? 0 : i, true);
    lb.classList.add("is-open");
    lb.setAttribute("aria-hidden", "false");
    lenis?.stop();
  }

  function lbClose() {
    lb.classList.remove("is-open");
    lb.setAttribute("aria-hidden", "true");
    lenis?.start();
  }

  document.querySelectorAll("[data-lb]").forEach((el) => {
    el.addEventListener("click", () => lbOpen(el.querySelector("img").getAttribute("src")));
  });
  lb.querySelector(".lightbox__close").addEventListener("click", lbClose);
  lb.querySelector(".lightbox__prev").addEventListener("click", () => lbShow(lbIndex - 1));
  lb.querySelector(".lightbox__next").addEventListener("click", () => lbShow(lbIndex + 1));
  let swiped = false;
  lb.addEventListener("click", (e) => {
    if (e.target === lb && !swiped) lbClose();
    swiped = false;
  });
  document.addEventListener("keydown", (e) => {
    if (!lb.classList.contains("is-open")) return;
    if (e.key === "Escape") lbClose();
    if (e.key === "ArrowRight") lbShow(lbIndex + 1);
    if (e.key === "ArrowLeft") lbShow(lbIndex - 1);
  });
  let swipeX = null;
  lb.addEventListener("pointerdown", (e) => {
    swipeX = e.clientX;
  });
  lb.addEventListener("pointerup", (e) => {
    if (swipeX === null) return;
    const dx = e.clientX - swipeX;
    swipeX = null;
    if (Math.abs(dx) > 60) {
      swiped = true;
      lbShow(lbIndex + (dx < 0 ? 1 : -1));
    }
  });

  /* ---------- memes: draggable stickers ---------- */

  const board = document.getElementById("board");
  const stickers = [...document.querySelectorAll(".sticker")];
  let zTop = 10;

  stickers.forEach((st) => {
    const baseR = parseFloat(st.dataset.r) || 0;
    const src = st.querySelector("img").getAttribute("src");

    if (!hasGsap) {
      st.addEventListener("click", () => lbOpen(src));
      return;
    }
    gsap.set(st, { rotation: baseR });

    const rotTo = gsap.quickTo(st, "rotation", { duration: 0.6, ease: "power3.out" });
    let dragging = false;
    let moved = false;
    let sx = 0;
    let sy = 0;
    let ox = 0;
    let oy = 0;
    let lastX = 0;
    const lim = { x0: 0, x1: 0, y0: 0, y1: 0 };

    const pickUp = (x, y) => {
      dragging = true;
      moved = false;
      sx = lastX = x;
      sy = y;
      ox = gsap.getProperty(st, "x");
      oy = gsap.getProperty(st, "y");
      const b = board.getBoundingClientRect();
      const r = st.getBoundingClientRect();
      const slack = 12;
      lim.x0 = b.left - r.left - slack;
      lim.x1 = b.right - r.right + slack;
      lim.y0 = b.top - r.top - slack;
      lim.y1 = b.bottom - r.bottom + slack;
      st.style.zIndex = String(++zTop);
      st.classList.add("is-dragging");
      gsap.to(st, { scale: 1.07, duration: 0.35, ease: "power3.out" });
    };

    const moveTo = (x, y) => {
      const dx = x - sx;
      const dy = y - sy;
      if (Math.hypot(dx, dy) > 5) moved = true;
      gsap.set(st, { x: ox + clamp(dx, lim.x0, lim.x1), y: oy + clamp(dy, lim.y0, lim.y1) });
      rotTo(baseR + clamp((x - lastX) * 1.4, -18, 18));
      lastX = x;
    };

    const drop = (openIfTap) => {
      if (!dragging) return;
      dragging = false;
      st.classList.remove("is-dragging");
      gsap.to(st, { scale: 1, duration: 0.7, ease: "elastic.out(1, 0.5)" });
      rotTo(baseR);
      if (openIfTap && !moved) lbOpen(src);
    };

    // Mouse/pen: drag right away, click opens the lightbox.
    st.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "touch") return;
      e.preventDefault();
      st.setPointerCapture(e.pointerId);
      pickUp(e.clientX, e.clientY);
    });
    st.addEventListener("pointermove", (e) => {
      if (dragging && e.pointerType !== "touch") moveTo(e.clientX, e.clientY);
    });
    st.addEventListener("pointerup", (e) => e.pointerType !== "touch" && drop(true));
    st.addEventListener("pointercancel", (e) => e.pointerType !== "touch" && drop(false));

    // Touch: a short hold picks the sticker up, so a plain swipe still scrolls the page and a tap opens it.
    let holdTimer = 0;
    let touchId = null;
    let tx = 0;
    let ty = 0;
    let tx0 = 0;
    let ty0 = 0;
    const findTouch = (e) => [...e.changedTouches].find((t) => t.identifier === touchId);
    st.addEventListener(
      "touchstart",
      (e) => {
        if (touchId !== null) return;
        const t = e.changedTouches[0];
        touchId = t.identifier;
        tx = tx0 = t.clientX;
        ty = ty0 = t.clientY;
        holdTimer = setTimeout(() => {
          pickUp(tx, ty);
          navigator.vibrate?.(12);
        }, 220);
      },
      { passive: true }
    );
    st.addEventListener(
      "touchmove",
      (e) => {
        const t = findTouch(e);
        if (!t) return;
        if (!dragging) {
          tx = t.clientX;
          ty = t.clientY;
          if (Math.hypot(tx - tx0, ty - ty0) > 10) clearTimeout(holdTimer);
          return;
        }
        e.preventDefault();
        moveTo(t.clientX, t.clientY);
      },
      { passive: false }
    );
    const touchEnd = (e) => {
      if (!findTouch(e)) return;
      touchId = null;
      clearTimeout(holdTimer);
      if (!dragging) return;
      if (e.cancelable) e.preventDefault();
      drop(false);
    };
    st.addEventListener("touchend", touchEnd);
    st.addEventListener("touchcancel", touchEnd);
    st.addEventListener("contextmenu", (e) => e.preventDefault());

    st.addEventListener("click", (e) => {
      if (e.pointerType === "touch" || (!e.pointerType && !finePointer)) lbOpen(src);
    });
  });

  if (animate && board) {
    gsap.from(stickers, {
      y: () => gsap.utils.random(160, 320),
      x: () => gsap.utils.random(-120, 120),
      rotation: () => gsap.utils.random(-50, 50),
      opacity: 0,
      scale: 0.5,
      duration: 1.3,
      ease: "back.out(1.3)",
      stagger: 0.09,
      scrollTrigger: { trigger: board, start: "top 75%", once: true },
    });
  }

  /* ---------- finale ---------- */

  if (animate) {
    gsap.from(".finale__title .line > span", {
      yPercent: 115,
      rotation: 4,
      duration: 1.5,
      ease: "expo.out",
      stagger: 0.14,
      scrollTrigger: { trigger: ".finale__title", start: "top 82%" },
    });
    gsap.fromTo(
      ".finale__bg img",
      { scale: 1.25, yPercent: -6 },
      {
        scale: 1,
        yPercent: 6,
        ease: "none",
        scrollTrigger: { trigger: ".finale", start: "top bottom", end: "bottom top", scrub: true },
      }
    );
  }

})();
